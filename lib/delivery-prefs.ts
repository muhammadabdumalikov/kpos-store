import type { DeliveryType } from "./store-api";

const KEY = "KPOS_delivery";

/** What the customer chose last time, so a repeat order is two taps. */
export interface DeliveryPrefs {
  type?: DeliveryType;
  address?: string;
  lat?: number;
  lng?: number;
}

/** Stable empty value: the server snapshot and the "no prefs" client case
 *  must be the same object so useSyncExternalStore does not loop. */
export const EMPTY_DELIVERY_PREFS: DeliveryPrefs = Object.freeze({});

function readDeliveryPrefs(): DeliveryPrefs {
  if (typeof window === "undefined") return EMPTY_DELIVERY_PREFS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_DELIVERY_PREFS;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return EMPTY_DELIVERY_PREFS;
    const p = parsed as Record<string, unknown>;
    const prefs: DeliveryPrefs = {};
    if (p.type === "pickup" || p.type === "delivery") prefs.type = p.type;
    if (typeof p.address === "string" && p.address.trim()) {
      prefs.address = p.address.slice(0, 500);
    }
    if (
      typeof p.lat === "number" &&
      typeof p.lng === "number" &&
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng)
    ) {
      prefs.lat = p.lat;
      prefs.lng = p.lng;
    }
    return prefs;
  } catch {
    return EMPTY_DELIVERY_PREFS;
  }
}

// ── Tiny external store ─────────────────────────────────────────────────────
// localStorage is browser-only, so components read it through
// useSyncExternalStore: the server and the hydrating client agree on EMPTY,
// then the real value lands in one follow-up render with no effect involved.

let cached: DeliveryPrefs | null = null;
const listeners = new Set<() => void>();

export function getDeliveryPrefs(): DeliveryPrefs {
  if (cached === null) cached = readDeliveryPrefs();
  return cached;
}

export function getServerDeliveryPrefs(): DeliveryPrefs {
  return EMPTY_DELIVERY_PREFS;
}

export function subscribeDeliveryPrefs(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function saveDeliveryPrefs(prefs: DeliveryPrefs): void {
  if (typeof window === "undefined") return;
  const next = { ...getDeliveryPrefs(), ...prefs };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode or a full quota only loses the convenience
  }
  cached = next;
  for (const l of listeners) l();
}
