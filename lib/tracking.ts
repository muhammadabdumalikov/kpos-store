// Ad trackers on the storefront (REKLAMA-KUZATUV.md): Google Analytics 4,
// Google Tag Manager, Meta Pixel and Yandex Metrika, each switched on by an id
// the shop's staff typed in its settings.
//
// Rules this module keeps for every caller:
// - Only an id that matches its strict pattern is ever used, and only as data
//   or inside a fixed script URL; no other text from the API reaches a script.
// - No buyer data is ever sent (R8): no name, phone, address or Telegram id,
//   no Meta advanced matching. Only product id, name, price and quantity, the
//   order's reference, totals and the currency.
// - Every call is fire-and-forget: it never throws and never blocks, and it
//   does nothing for a service that is not configured.
//
// Works on both sides: the server layout imports the validators, the client
// calls the rest (which do nothing on the server).

import { getStartParam } from "./telegram";
import { slugFromHost } from "./store-slug";

export interface TrackingIds {
  ga: string | null;
  gtm: string | null;
  metaPixel: string | null;
  yandexMetrika: string | null;
}

export const NO_TRACKING: TrackingIds = { ga: null, gtm: null, metaPixel: null, yandexMetrika: null };

const PATTERNS: Record<keyof TrackingIds, RegExp> = {
  ga: /^G-[A-Z0-9]{4,12}$/,
  gtm: /^GTM-[A-Z0-9]{4,10}$/,
  metaPixel: /^\d{10,20}$/,
  yandexMetrika: /^\d{5,12}$/,
};

/** The id itself when it matches its pattern exactly, otherwise null. */
function cleanId(key: keyof TrackingIds, value: unknown): string | null {
  return typeof value === "string" && PATTERNS[key].test(value) ? value : null;
}

/**
 * The shop's ids, each kept only when it matches its strict pattern; a wrong
 * value (or a missing `tracking` on an older backend) is simply off. The
 * server checks too: this is the storefront's own check before anything runs.
 */
export function cleanTrackingIds(input: unknown): TrackingIds {
  if (!input || typeof input !== "object") return NO_TRACKING;
  const raw = input as Record<string, unknown>;
  return {
    ga: cleanId("ga", raw.ga),
    gtm: cleanId("gtm", raw.gtm),
    metaPixel: cleanId("metaPixel", raw.metaPixel),
    yandexMetrika: cleanId("yandexMetrika", raw.yandexMetrika),
  };
}

export function hasTracking(ids: TrackingIds): boolean {
  return Boolean(ids.ga || ids.gtm || ids.metaPixel || ids.yandexMetrika);
}

/** The libraries to load for these ids, fixed URLs with only a checked id in them. */
export function trackerScriptSrcs(ids: TrackingIds): string[] {
  const clean = cleanTrackingIds(ids);
  const srcs: string[] = [];
  if (clean.ga) srcs.push(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(clean.ga)}`);
  if (clean.gtm) srcs.push(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(clean.gtm)}`);
  if (clean.metaPixel) srcs.push("https://connect.facebook.net/en_US/fbevents.js");
  if (clean.yandexMetrika) srcs.push("https://mc.yandex.ru/metrika/tag.js");
  return srcs;
}

// ── Runtime state (client only) ────────────────────────────────────────────

type Fn = (...args: unknown[]) => void;
type QueueFn = Fn & { queue?: unknown[]; a?: unknown[]; [key: string]: unknown };
type TrackerWindow = Window & {
  dataLayer?: unknown[];
  gtag?: Fn;
  fbq?: QueueFn;
  _fbq?: QueueFn;
  ym?: QueueFn;
};

/** The services switched on for this page load; null until set up (calls are then no-ops). */
let active: TrackingIds | null = null;
/** Each service is initialised once per page load, whatever re-renders. */
const initialised = new Set<keyof TrackingIds>();
/** The last page view's URL: the referrer of the next one in a client-side navigation. */
let lastUrl: string | null = null;
/** Purchases already sent in this page load (backs up the localStorage mark). */
const sentPurchases = new Set<string>();

let ready = false;
const listeners = new Set<() => void>();

/** For useSyncExternalStore: whether setup has switched at least one service on. */
export function subscribeTracking(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function isTrackingReady(): boolean {
  return ready;
}

/** The ids switched on, for loading their libraries. */
export function activeTrackingIds(): TrackingIds {
  return active ?? NO_TRACKING;
}

function tw(): TrackerWindow | null {
  return typeof window === "undefined" ? null : (window as TrackerWindow);
}

/** Runs one tracker call; a broken or blocked tracker never reaches the page. */
function safely(fn: () => void): void {
  try {
    fn();
  } catch {
    // Ad blockers, a half-loaded library, a quota: never the shopper's problem.
  }
}

/**
 * Telegram opens the mini app with its launch payload (the buyer's Telegram
 * id and name) in the URL fragment, and the trackers report the page URL, so
 * the fragment goes before any of them loads (R8). The Telegram SDK has read
 * it already and keeps it in sessionStorage, as it must after any in-app
 * navigation anyway. Deferred a tick so the router has hooked history and
 * takes the new URL as its own. Not while TelegramProvider is about to hand
 * the session to another shop's subdomain: the payload must survive that hop.
 */
function dropTelegramFragment(): boolean {
  const w = tw();
  if (!w || !w.location.hash.includes("tgWebApp")) return true;
  const start = getStartParam();
  if (start && start !== slugFromHost(w.location.host)) return false;
  setTimeout(() => {
    safely(() => {
      if (w.location.hash.includes("tgWebApp")) {
        w.history.replaceState(null, "", w.location.pathname + w.location.search);
      }
    });
  }, 0);
  return true;
}

/**
 * Switch the configured services on: the standard queue stubs of each
 * library (so calls made before it loads are kept), and its init call. Runs
 * before any page event; the libraries themselves load after this (see
 * app/components/Tracking.tsx). Idempotent.
 */
export function setupTracking(input: unknown): void {
  safely(() => {
    const w = tw();
    if (!w) return;
    const ids = cleanTrackingIds(input);
    if (!hasTracking(ids)) {
      active = null;
      return;
    }
    if (!dropTelegramFragment()) return;
    active = ids;

    if (ids.ga && !initialised.has("ga")) {
      initialised.add("ga");
      w.dataLayer = w.dataLayer || [];
      if (!w.gtag) {
        w.gtag = function gtag() {
          // gtag.js reads only Arguments objects from the dataLayer, not arrays.
          // eslint-disable-next-line prefer-rest-params
          w.dataLayer!.push(arguments);
        };
      }
      w.gtag("js", new Date());
      // The landing page view is sent by hand (trackPageView), so it never
      // carries the Telegram fragment; later ones come from GA4's history
      // listener (Enhanced measurement).
      w.gtag("config", ids.ga, { send_page_view: false });
    }

    if (ids.gtm && !initialised.has("gtm")) {
      initialised.add("gtm");
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    }

    if (ids.metaPixel && !initialised.has("metaPixel")) {
      initialised.add("metaPixel");
      if (!w.fbq) {
        // Meta's base code, minus its script tag (loaded by next/script).
        const n = function fbq() {
          /* eslint-disable prefer-rest-params */
          if (typeof n.callMethod === "function") (n.callMethod as Fn).apply(n, arguments as unknown as unknown[]);
          else n.queue!.push(arguments);
          /* eslint-enable prefer-rest-params */
        } as QueueFn;
        if (!w._fbq) w._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        w.fbq = n;
      }
      // We send PageView ourselves on every route change; the pixel's own
      // history listener would count each navigation twice.
      w.fbq.disablePushState = true;
      // No automatic button-click and page-metadata collection: only the
      // fields this module sends.
      w.fbq("set", "autoConfig", false, ids.metaPixel);
      // No third argument: no advanced matching, ever (R8).
      w.fbq("init", ids.metaPixel);
    }

    if (ids.yandexMetrika && !initialised.has("yandexMetrika")) {
      initialised.add("yandexMetrika");
      if (!w.ym) {
        const m = function ym() {
          // eslint-disable-next-line prefer-rest-params
          (m.a = m.a || []).push(arguments);
        } as QueueFn;
        m.l = Date.now();
        w.ym = m;
      }
      // `defer`: no automatic hit; trackPageView sends each one. Webvisor
      // stays off: it records what is typed into the checkout form.
      w.ym(Number(ids.yandexMetrika), "init", {
        defer: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
      });
    }

    if (!ready) {
      ready = true;
      for (const l of listeners) l();
    }
  });
}

// ── Events (REKLAMA-KUZATUV.md §2) ─────────────────────────────────────────

/** A product as the trackers see it: nothing about the buyer. */
export interface TrackItem {
  id: string;
  name: string;
  /** Unit price in so'm. */
  price: number;
  /** Units; 1 when absent. */
  qty?: number;
}

const CURRENCY = "UZS";

const num = (x: unknown): number => (typeof x === "number" && Number.isFinite(x) ? x : 0);
const unitsOf = (item: TrackItem): number => (num(item.qty) > 0 ? num(item.qty) : 1);
const sumOf = (items: TrackItem[]): number => items.reduce((s, i) => s + num(i.price) * unitsOf(i), 0);

type GaEvent = "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
type MetaEvent = "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";

/** One commerce event to every configured service, in each one's own shape. */
function commerce(
  gaName: GaEvent,
  metaName: MetaEvent,
  items: TrackItem[],
  value: number,
  transactionId?: string
): void {
  const ids = active;
  const w = tw();
  if (!ids || !w) return;
  // The page's own view goes first, whichever effect ran first on landing;
  // the router's page view for the same URL is then a repeat and skipped.
  if (lastUrl === null) trackPageView(w.location.pathname + w.location.search);
  const total = num(value);
  // A fresh object per service: neither library gets to change another's.
  const ecommerce = () => ({
    currency: CURRENCY,
    value: total,
    ...(transactionId ? { transaction_id: transactionId } : {}),
    items: items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: num(i.price),
      quantity: unitsOf(i),
    })),
  });

  if (ids.ga) safely(() => w.gtag?.("event", gaName, ecommerce()));
  if (ids.gtm) {
    safely(() => {
      w.dataLayer = w.dataLayer || [];
      // Clear the previous event's ecommerce object first (Google's advice).
      w.dataLayer.push({ ecommerce: null });
      w.dataLayer.push({ event: gaName, ecommerce: ecommerce() });
    });
  }
  if (ids.metaPixel) {
    safely(() =>
      w.fbq?.("track", metaName, {
        content_ids: [...new Set(items.map((i) => i.id))],
        content_type: "product",
        contents: items.map((i) => ({ id: i.id, quantity: unitsOf(i) })),
        value: total,
        currency: CURRENCY,
      })
    );
  }
  if (ids.yandexMetrika) {
    const counter = Number(ids.yandexMetrika);
    safely(() => w.ym?.(counter, "reachGoal", gaName, { order_price: total, currency: CURRENCY }));
  }
}

/** A page opened, the first one or a client-side navigation. `path` is the
 *  pathname plus query; the fragment is never sent. */
export function trackPageView(path: string): void {
  safely(() => {
    const ids = active;
    const w = tw();
    if (!ids || !w) return;
    const url = w.location.origin + path;
    const referrer = lastUrl;
    if (url === referrer) return;
    lastUrl = url;

    if (ids.ga) {
      safely(() => {
        // Later events on this page carry it too.
        w.gtag?.("set", { page_location: url });
        // Only the landing page by hand (its URL without the Telegram
        // fragment). Later navigations are GA4's own: "Enhanced measurement →
        // page changes based on browser history events" is on for every new
        // stream, and a second page_view from us would count each one twice.
        if (referrer === null) w.gtag?.("event", "page_view", { page_location: url });
      });
    }
    if (ids.gtm) {
      safely(() => {
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({ event: "page_view", page_path: path, page_location: url });
      });
    }
    if (ids.metaPixel) safely(() => w.fbq?.("track", "PageView"));
    if (ids.yandexMetrika) {
      const counter = Number(ids.yandexMetrika);
      safely(() => (referrer ? w.ym?.(counter, "hit", url, { referer: referrer }) : w.ym?.(counter, "hit", url)));
    }
  });
}

/** The product page was opened. */
export function trackViewItem(item: TrackItem): void {
  safely(() => commerce("view_item", "ViewContent", [{ ...item, qty: 1 }], num(item.price)));
}

/** `qty` units of a product went into the cart. */
export function trackAddToCart(item: TrackItem, qty: number = 1): void {
  safely(() => {
    const line = { ...item, qty: num(qty) > 0 ? qty : 1 };
    commerce("add_to_cart", "AddToCart", [line], sumOf([line]));
  });
}

/** The checkout was opened with these lines; `value` is the goods only, no delivery fee. */
export function trackBeginCheckout(items: TrackItem[], value?: number): void {
  safely(() => {
    if (items.length === 0) return;
    commerce("begin_checkout", "InitiateCheckout", items, num(value) > 0 ? num(value) : sumOf(items));
  });
}

const PURCHASE_KEY = "kpos.tracked.purchase.";

/**
 * The order the trackers see. The full id is the buyer's key to the order's
 * status page and to cancelling it, so it never leaves this browser; the
 * short number the buyer and the shop both see stands in for it.
 */
function orderRef(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

/**
 * An order was placed. `value` is the goods total without the delivery fee
 * (R7). Sent once per order: a re-render or a revisit sends nothing.
 */
export function trackPurchase(orderId: string, items: TrackItem[], value?: number): void {
  safely(() => {
    if (!active || !orderId || sentPurchases.has(orderId)) return;
    sentPurchases.add(orderId);
    try {
      if (localStorage.getItem(PURCHASE_KEY + orderId)) return;
      localStorage.setItem(PURCHASE_KEY + orderId, "1");
    } catch {
      // No storage (private mode): the in-memory mark above still holds.
    }
    commerce("purchase", "Purchase", items, num(value) > 0 ? num(value) : sumOf(items), orderRef(orderId));
  });
}
