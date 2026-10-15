import { getWebApp, isTelegramWebApp } from "./telegram";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type LocationFailure = "denied" | "unsupported" | "failed";

export type LocationResult =
  | ({ ok: true } & GeoPoint)
  | { ok: false; reason: LocationFailure };

const round = (n: number) => Math.round(n * 1e6) / 1e6;

/**
 * Inside the mini app the Telegram client owns location (Bot API 8.0+): its
 * sheet is native and the browser prompt never appears. Resolves false when
 * the client is too old, in which case the caller falls back to the browser.
 */
function viaTelegram(): Promise<LocationResult | false> {
  const wa = getWebApp();
  const lm = wa?.LocationManager;
  if (!wa || !lm || !isTelegramWebApp()) return Promise.resolve(false);
  try {
    if (!wa.isVersionAtLeast("8.0")) return Promise.resolve(false);
  } catch {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let settled = false;
    const done = (r: LocationResult | false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(r);
    };
    // The client can drop the callback (e.g. the sheet is dismissed by a
    // system dialog); never leave the button spinning forever.
    const timer = setTimeout(() => done({ ok: false, reason: "failed" }), 30_000);

    const ask = () => {
      try {
        lm.getLocation((data) => {
          if (data && Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) {
            done({ ok: true, lat: round(data.latitude), lng: round(data.longitude) });
            return;
          }
          if (!lm.isLocationAvailable) done({ ok: false, reason: "unsupported" });
          else done({ ok: false, reason: "denied" });
        });
      } catch {
        done(false);
      }
    };

    try {
      if (lm.isInited) ask();
      else lm.init(ask);
    } catch {
      done(false);
    }
  });
}

function viaBrowser(): Promise<LocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          lat: round(pos.coords.latitude),
          lng: round(pos.coords.longitude),
        }),
      (err) =>
        resolve({
          ok: false,
          reason: err.code === err.PERMISSION_DENIED ? "denied" : "failed",
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 }
    );
  });
}

/** One call for both surfaces: Telegram's LocationManager when it exists,
 *  otherwise the browser's Geolocation API. */
export async function captureLocation(): Promise<LocationResult> {
  const tg = await viaTelegram();
  if (tg !== false) return tg;
  return viaBrowser();
}

/** Whether a denied request can be fixed from inside the mini app. */
export function canOpenLocationSettings(): boolean {
  const lm = getWebApp()?.LocationManager;
  return Boolean(lm && isTelegramWebApp() && typeof lm.openSettings === "function");
}

export function openLocationSettings(): void {
  try {
    getWebApp()?.LocationManager?.openSettings();
  } catch {
    // version-gated; nothing to do on an old client
  }
}
