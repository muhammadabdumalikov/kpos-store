// "Is there a storefront page behind this one?" answered per history entry.
//
// `history.length` counts entries from other sites and the new-tab page, and
// `document.referrer` is not updated by client-side navigation, so neither can
// tell a product opened from the catalogue apart from one opened from a shared
// link. Instead every history entry this document writes carries its depth:
// the entry the storefront was opened on is 0, each in-app push is one deeper
// than the entry it was pushed from, a replace keeps the depth of the entry it
// replaces. The browser keeps `history.state` per entry (also across a reload
// and on Back/Forward), so the depth of the current entry is always at hand:
// above 0 means a real history Back stays inside the storefront.
//
// Next's router writes every entry through `history.pushState/replaceState`.
// This module wraps both once, at load, before the router mounts and patches
// them in turn (its patch calls whatever it found there, i.e. this wrapper),
// so router navigations and any direct calls are all counted.

const DEPTH = "__kposDepth";

type HistoryState = Record<string, unknown> | null | undefined;

function depthOf(state: unknown): number | null {
  const d = (state as HistoryState)?.[DEPTH];
  return typeof d === "number" && Number.isFinite(d) && d >= 0 ? d : null;
}

function withDepth(data: unknown, depth: number): unknown {
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    return { ...(data as Record<string, unknown>), [DEPTH]: depth };
  }
  // Nothing (or a primitive) was passed: an object is still a valid state.
  return data == null ? { [DEPTH]: depth } : data;
}

if (typeof window !== "undefined") {
  const w = window as Window & { __kposHistoryDepth?: true };
  // Hot reload evaluates the module again; wrapping twice would count twice.
  if (!w.__kposHistoryDepth) {
    w.__kposHistoryDepth = true;
    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);
    history.pushState = function pushState(data, unused, url) {
      return push(withDepth(data, (depthOf(history.state) ?? 0) + 1), unused, url);
    };
    history.replaceState = function replaceState(data, unused, url) {
      return replace(withDepth(data, depthOf(data) ?? depthOf(history.state) ?? 0), unused, url);
    };
    // The entry the document was opened on, before anything else writes it.
    // A reloaded entry already has its depth and keeps it.
    if (depthOf(history.state) === null) history.replaceState(history.state, "");
  }
}

/** True when stepping back in history lands on another storefront page. */
export function canGoBackInApp(): boolean {
  if (typeof window === "undefined") return false;
  return (depthOf(history.state) ?? 0) > 0;
}

// Where Back goes when there is nothing to go back to. The product page sets
// its category here so the Telegram back button and the page's own agree.
let fallbackHref: string | null = null;

export function setBackFallback(href: string | null): void {
  fallbackHref = href;
}

type BackRouter = { back: () => void; replace: (href: string) => void };

/**
 * One rule for every back control: a real history Back when the previous
 * entry is ours (so the catalogue gets its paged list and scroll position
 * back), otherwise up to `fallback` in place of this entry. Replace, not push:
 * pushing would put this page behind the fallback and the next Back would
 * cycle between the two.
 */
export function navigateBack(router: BackRouter, fallback?: string | null): void {
  if (canGoBackInApp()) router.back();
  else router.replace(fallback ?? fallbackHref ?? "/");
}
