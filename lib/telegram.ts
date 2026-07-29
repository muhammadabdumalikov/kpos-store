// Minimal typings + accessors for the Telegram Mini App SDK
// (telegram-web-app.js, loaded in app/layout.tsx). Only the surface the
// storefront actually uses is declared — the SDK is untyped otherwise.
//
// The same build serves the plain web storefront and the mini app, so every
// helper here is null-safe: outside Telegram `window.Telegram` is undefined.

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TelegramButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

export interface TelegramWebApp {
  /** Signed launch payload — verified server-side against the bot token. */
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  /** "android" | "ios" | "tdesktop" | "weba" | … "unknown" outside Telegram. */
  platform: string;
  colorScheme: "light" | "dark";
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  /** Device insets (home indicator, notch). Bot API 8.0+; absent on older clients. */
  safeAreaInset?: TelegramInsets;
  /** Insets of the Telegram chrome drawn over the mini app. Bot API 8.0+. */
  contentSafeAreaInset?: TelegramInsets;
  BackButton: TelegramButton;
  HapticFeedback?: {
    impactOccurred(style: "light" | "medium" | "heavy"): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  onEvent(type: string, cb: () => void): void;
  offEvent(type: string, cb: () => void): void;
  isVersionAtLeast(version: string): boolean;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  disableVerticalSwipes?(): void;
  /** Bot API 6.9+. The contact is also delivered to the bot as a message. */
  requestContact?(
    cb: (ok: boolean, event?: TelegramContactEvent) => void
  ): void;
  showAlert(message: string): void;
}

/** Shape of the (loosely documented) requestContact callback payload. */
export interface TelegramContactEvent {
  status?: string;
  response?: string;
  responseUnsafe?: {
    contact?: { phone_number?: string; first_name?: string; last_name?: string };
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

/** The SDK object, or null when the script has not loaded / we are on the server. */
export function getWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/**
 * True only inside a real Telegram client. The SDK script also runs in a plain
 * browser (where it reports platform "unknown" and an empty initData), so both
 * signals are checked before the app switches to mini-app behaviour.
 */
export function isTelegramWebApp(): boolean {
  const wa = getWebApp();
  if (!wa) return false;
  return wa.platform !== "unknown" && wa.initData.length > 0;
}

/**
 * Deep-link payload from `t.me/<bot>?startapp=<slug>` — how the shared bot
 * knows which store it was opened for. Telegram delivers it in the URL hash,
 * so it is client-only (never visible to the Next.js server).
 */
export function getStartParam(): string | null {
  const raw = getWebApp()?.initDataUnsafe?.start_param;
  if (!raw) return null;
  // Same shape as a store subdomain label (DNS label), so a hostile start_param
  // can never be turned into an arbitrary redirect target.
  return /^[a-z0-9][a-z0-9-]{1,62}$/.test(raw) ? raw : null;
}

/** Raw signed launch payload, forwarded to the backend for HMAC verification. */
export function getInitData(): string | null {
  const wa = getWebApp();
  if (!wa || !wa.initData) return null;
  return wa.initData;
}

/**
 * Ask Telegram for the user's phone number (native confirm sheet), so checkout
 * does not need a keyboard. Resolves to the number, or null when the client is
 * too old, the user declines, or the payload carries no readable number — the
 * manual phone field stays the fallback in every one of those cases.
 */
export function requestTelegramContact(): Promise<string | null> {
  const wa = getWebApp();
  if (!wa?.requestContact) return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;
    const done = (phone: string | null) => {
      if (settled) return;
      settled = true;
      resolve(phone);
    };
    // The sheet can be dismissed in ways that never fire the callback.
    const timer = setTimeout(() => done(null), 90_000);

    try {
      wa.requestContact!((ok, event) => {
        clearTimeout(timer);
        if (!ok) return done(null);
        const phone = event?.responseUnsafe?.contact?.phone_number ?? null;
        done(phone ? (phone.startsWith("+") ? phone : `+${phone}`) : null);
      });
    } catch {
      clearTimeout(timer);
      done(null);
    }
  });
}

/** Light haptic tap (no-op outside Telegram or on old clients). */
export function haptic(style: "light" | "medium" | "heavy" = "light"): void {
  try {
    getWebApp()?.HapticFeedback?.impactOccurred(style);
  } catch {
    // Older clients throw on unsupported methods — never break the UI for it.
  }
}
