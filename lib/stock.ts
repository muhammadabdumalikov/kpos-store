/** At or below this many units left, the shop says so (once, quietly). */
export const LOW_STOCK = 3;

/**
 * What a product's stock means to a shopper. The cart counts whole units
 * (1 = 1 kg for weighed goods), so the cap is the stock rounded down; less than
 * one whole unit left cannot be sold. Unknown stock means "no cap".
 */
export function stockOf(quantity?: number | null) {
  const max = quantity == null ? Infinity : Math.floor(quantity);
  const soldOut = max <= 0;
  const lowStock = !soldOut && quantity != null && quantity <= LOW_STOCK;
  return { max, soldOut, lowStock };
}
