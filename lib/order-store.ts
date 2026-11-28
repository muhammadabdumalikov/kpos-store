import { storageKey } from "./theme-preview";

// The theme preview keeps lists of its own (lib/theme-preview): it shows none
// of the orders placed from this browser.
const ordersKey = () => storageKey("KPOS_orders");
const MAX_SAVED = 30;

/** Order ids this browser has placed, newest first (the id is the customer's
 *  access token for status lookups, so it never leaves localStorage). */
export function getSavedOrderIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ordersKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function saveOrderId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = [id, ...getSavedOrderIds().filter((x) => x !== id)].slice(
      0,
      MAX_SAVED
    );
    localStorage.setItem(ordersKey(), JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function removeOrderId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ordersKey(),
      JSON.stringify(getSavedOrderIds().filter((x) => x !== id))
    );
  } catch {
    // ignore
  }
}

const payingKey = () => storageKey("KPOS_paying_order");

/**
 * The card-transfer order whose money is still due. The buyer leaves for
 * their bank app to pay; if the page was reloaded meanwhile, the cart opens
 * on that order's cards again instead of an empty basket.
 */
export function getPayingOrderId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(payingKey()) || null;
  } catch {
    return null;
  }
}

export function setPayingOrderId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(payingKey(), id);
    else localStorage.removeItem(payingKey());
  } catch {
    // ignore
  }
}
