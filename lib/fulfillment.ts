import type { DeliveryType, StoreFulfillment, StoreInfo } from "./store-api";

/**
 * What a backend without the delivery module implies: every store order used
 * to be collected at the shop, and the migration backfills those as pickup.
 * No address is known, so the checkout states pickup without one.
 */
export const LEGACY_PICKUP_ONLY: StoreFulfillment = {
  pickupEnabled: true,
  deliveryEnabled: false,
  deliveryFee: 0,
  freeDeliveryFrom: null,
  minDeliveryAmount: null,
  pickupBranchName: null,
  pickupAddress: null,
};

const money = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const moneyOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Coerce the wire shape defensively; a store with neither method enabled is
 *  impossible by contract (STORE_NO_FULFILLMENT_METHOD), so pickup wins. */
export function normalizeFulfillment(info: StoreInfo): StoreFulfillment {
  const raw = info.fulfillment;
  if (!raw) return LEGACY_PICKUP_ONLY;
  const pickupEnabled = raw.pickupEnabled !== false;
  const deliveryEnabled = raw.deliveryEnabled === true;
  return {
    pickupEnabled: pickupEnabled || !deliveryEnabled,
    deliveryEnabled,
    deliveryFee: money(raw.deliveryFee),
    freeDeliveryFrom: moneyOrNull(raw.freeDeliveryFrom),
    minDeliveryAmount: moneyOrNull(raw.minDeliveryAmount),
    pickupBranchName: raw.pickupBranchName?.trim() || null,
    pickupAddress: raw.pickupAddress?.trim() || null,
  };
}

/** Mirrors the server rule: fee = subtotal >= freeDeliveryFrom ? 0 : deliveryFee. */
export function deliveryFeeFor(f: StoreFulfillment, subtotal: number): number {
  if (f.freeDeliveryFrom !== null && subtotal >= f.freeDeliveryFrom) return 0;
  return f.deliveryFee;
}

/** How much more the basket needs before delivery becomes free; 0 when it
 *  already is or the shop has no threshold. */
export function freeDeliveryShortfall(f: StoreFulfillment, subtotal: number): number {
  if (f.freeDeliveryFrom === null || f.deliveryFee === 0) return 0;
  return Math.max(0, f.freeDeliveryFrom - subtotal);
}

/** How much more the basket needs before delivery is allowed at all. */
export function minDeliveryShortfall(f: StoreFulfillment, subtotal: number): number {
  if (f.minDeliveryAmount === null) return 0;
  return Math.max(0, f.minDeliveryAmount - subtotal);
}

export function deliveryAllowed(f: StoreFulfillment, subtotal: number): boolean {
  return f.deliveryEnabled && minDeliveryShortfall(f, subtotal) === 0;
}

/** The method the checkout should start on (or fall back to when the current
 *  one stops being available): the customer's previous choice when it is still
 *  offered, otherwise pickup, otherwise delivery. */
export function pickDefaultType(
  f: StoreFulfillment,
  subtotal: number,
  preferred: DeliveryType | null
): DeliveryType {
  if (preferred === "delivery" && deliveryAllowed(f, subtotal)) return "delivery";
  if (preferred === "pickup" && f.pickupEnabled) return "pickup";
  if (f.pickupEnabled) return "pickup";
  return "delivery";
}
