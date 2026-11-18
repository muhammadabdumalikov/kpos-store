// What a product card may say beyond its price: the price it was marked down
// from, and whether the shop flags it as new or popular. Plain module: the
// server mappers and the client components both use it.

import { toAmount } from "./format";

/**
 * The price before a markdown, in whole so'm. The backend sends `oldPrice`
 * only when it is above the selling price; the check here is a second lock, so
 * a stale or odd value can never show a "discount" that is not one.
 */
export function toOldPrice(raw: string | number | null | undefined, price: number): number | null {
  const old = toAmount(raw);
  return old > price ? old : null;
}

/** Whole percent off, rounded down; null when it would be under 1%. */
export function discountPercent(price: number, oldPrice: number | null | undefined): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  // Whole so'm in, so this stays in integers until the one division.
  const percent = Math.floor(((oldPrice - price) * 100) / oldPrice);
  return percent >= 1 ? percent : null;
}

/** "−17%", with a real minus sign. */
export const discountLabel = (percent: number) => `−${percent}%`;
