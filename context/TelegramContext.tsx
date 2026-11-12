"use client";

import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import {
  getStartParam,
  getWebApp,
  isTelegramWebApp,
  type TelegramUser,
  type TelegramWebApp,
} from "@/lib/telegram";
import { slugFromHost } from "@/lib/store-slug";
import { navigateBack } from "@/lib/nav-history";
import { useTheme } from "./ThemeContext";

type TelegramContextValue = {
  /** True once the SDK has been probed on the client (false during SSR). */
  probed: boolean;
  /** True only inside a real Telegram client. */
  isTelegram: boolean;
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  /** Raw signed launch payload; send to the backend, never trust it locally. */
  initData: string | null;
  /** Store slug from `?startapp=<slug>`, when the app was opened that way. */
  startParam: string | null;
};

// ── Snapshot store ──────────────────────────────────────────────────────────
// The launch payload is fixed for the lifetime of the mini app: Telegram hands
// it over once, before hydration (the SDK script is beforeInteractive). So this
// is read as an external store rather than kept in state — that way the server
// and the hydrating client agree on the neutral value, and the real one lands
// in a single follow-up render with no effect writing state.

const NEUTRAL: TelegramContextValue = {
  probed: false,
  isTelegram: false,
  webApp: null,
  user: null,
  initData: null,
  startParam: null,
};

// Same as NEUTRAL, but the SDK has had its chance to load and did not (a plain
// browser with the script blocked). Distinct object so `probed` can flip.
const NEUTRAL_SETTLED: TelegramContextValue = {...NEUTRAL, probed: true};

/** How long to keep looking for the SDK before deciding this is a browser. */
const SDK_WAIT_MS = 3000;

let cached: TelegramContextValue | null = null;
let sdkSettled = false;
let waiting = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Next injects the SDK before hydration, so the first read is normally
  // final. Poll briefly anyway: on a slow connection the script can land after
  // first paint, and a mini app that had already concluded "not Telegram"
  // would keep showing browser chrome for the rest of the session.
  if (!cached && !sdkSettled && !waiting && typeof window !== "undefined") {
    waiting = true;
    const startedAt = Date.now();
    const tick = () => {
      if (getWebApp() || Date.now() - startedAt > SDK_WAIT_MS) {
        sdkSettled = true;
        waiting = false;
        notify();
        return;
      }
      setTimeout(tick, 150);
    };
    setTimeout(tick, 0);
  }
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): TelegramContextValue {
  if (cached) return cached;
  const webApp = getWebApp();
  if (!webApp) return sdkSettled ? NEUTRAL_SETTLED : NEUTRAL;
  cached = {
    probed: true,
    isTelegram: isTelegramWebApp(),
    webApp,
    user: webApp.initDataUnsafe?.user ?? null,
    initData: webApp.initData || null,
    startParam: getStartParam(),
  };
  return cached;
}

function getServerSnapshot(): TelegramContextValue {
  return NEUTRAL;
}

const TelegramContext = createContext<TelegramContextValue>(NEUTRAL);

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "kpos.uz";

/**
 * Telegram Mini App shell.
 *
 * The storefront is one build serving two surfaces: a normal browser site and
 * the mini app opened from a shop's bot. Everything Telegram-specific lives
 * here — viewport sizing, the native back button, and the
 * tenant redirect — so pages stay identical on both surfaces.
 */
export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const {webApp, isTelegram, startParam} = value;
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  // ── Boot: tenant handover, ready/expand, viewport vars ────────────────────
  useEffect(() => {
    if (!webApp || !isTelegram) return;

    // A bot opens one fixed URL. When that URL is not already the shop's own
    // subdomain, the store arrives as start_param (t.me/<bot>?startapp=salom):
    // hand the session over to that subdomain and every existing host-based
    // lookup keeps working unchanged. The hash carries initData, so it must
    // survive the hop.
    const currentSlug = slugFromHost(window.location.host);
    const underRootDomain =
      window.location.hostname === ROOT_DOMAIN ||
      window.location.hostname.endsWith("." + ROOT_DOMAIN);
    if (startParam && startParam !== currentSlug && underRootDomain) {
      window.location.replace(
        `${window.location.protocol}//${startParam}.${ROOT_DOMAIN}/${window.location.search}${window.location.hash}`
      );
      return;
    }

    webApp.ready();
    webApp.expand();
    try {
      // Stops a downward scroll from collapsing the mini app (Bot API 7.7+).
      webApp.disableVerticalSwipes?.();
    } catch {
      // Older clients throw on unsupported methods.
    }
    document.documentElement.classList.add("tg");

    const applyViewport = () => {
      const root = document.documentElement;
      root.style.setProperty(
        "--tg-viewport-height",
        `${webApp.viewportHeight}px`
      );
      root.style.setProperty(
        "--tg-viewport-stable-height",
        `${webApp.viewportStableHeight}px`
      );
    };

    // What the bottom nav has to clear: the device's own inset (home indicator)
    // plus whatever Telegram draws over the page at the bottom. `env()` reports
    // 0 in this webview, so the client's numbers are the only real source.
    const applySafeArea = () => {
      const device = webApp.safeAreaInset?.bottom ?? 0;
      const content = webApp.contentSafeAreaInset?.bottom ?? 0;
      document.documentElement.style.setProperty(
        "--tg-safe-bottom",
        `${Math.max(0, device + content)}px`
      );
    };

    applyViewport();
    applySafeArea();
    webApp.onEvent("viewportChanged", applyViewport);
    // Both are Bot API 8.0+; on older clients they simply never fire.
    webApp.onEvent("safeAreaChanged", applySafeArea);
    webApp.onEvent("contentSafeAreaChanged", applySafeArea);
    return () => {
      webApp.offEvent("viewportChanged", applyViewport);
      webApp.offEvent("safeAreaChanged", applySafeArea);
      webApp.offEvent("contentSafeAreaChanged", applySafeArea);
    };
  }, [webApp, isTelegram, startParam]);

  // Paint the Telegram header/background to match the app surface, so the
  // native chrome does not sit on a mismatched colour.
  useEffect(() => {
    if (!webApp || !isTelegram) return;
    const surface = theme === "dark" ? "#101828" : "#ffffff";
    try {
      webApp.setHeaderColor?.(surface);
      webApp.setBackgroundColor?.(surface);
    } catch {
      // Colour setters are version-gated; ignore on old clients.
    }
  }, [webApp, isTelegram, theme]);

  // ── Native back button mirrors in-app navigation ──────────────────────────
  // Same rule as the pages' own back controls (lib/nav-history): history Back
  // while the previous entry is a storefront page; on a page the mini app was
  // opened on (a deep link) there is nothing behind it, so go up instead, to
  // the fallback the page registered (a product's category) or home.
  useEffect(() => {
    if (!webApp || !isTelegram) return;
    const onBack = () => navigateBack(router);
    webApp.BackButton.onClick(onBack);
    if (pathname === "/") {
      webApp.BackButton.hide();
    } else {
      webApp.BackButton.show();
    }
    return () => webApp.BackButton.offClick(onBack);
  }, [webApp, isTelegram, pathname, router]);

  return (
    <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
