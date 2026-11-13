/** At or below this many units left, the shop says so (once, quietly). */
export const LOW_STOCK = 3;

/**
 * What a product's stock means to a shopper. The cart counts whole units
 * (1 = 1 kg for weighed goods), so the cap is the stock rounded down; less than
 * one whole unit left cannot be sold. Unknown stock means "no cap".
 *
 * A product the shop takes on order ("Buyurtmaga") is never sold out and has
 * no cap: what the shelf cannot cover waits for the goods to arrive. `onOrder`
 * says the shelf is empty, so the card shows the label instead of "sold out".
 */
export function stockOf(quantity?: number | null, preorder: boolean = false) {
  const available = quantity == null ? Infinity : Math.floor(quantity);
  if (preorder) {
    return { max: Infinity, soldOut: false, lowStock: false, onOrder: available <= 0 };
  }
  const soldOut = available <= 0;
  const lowStock = !soldOut && quantity != null && quantity <= LOW_STOCK;
  return { max: available, soldOut, lowStock, onOrder: false };
}

/** "Buyurtmaga · 15–20 kun": the label, with the lead time when the shop gave one. */
export function onOrderLabel(label: string, leadTime?: string | null): string {
  const lead = leadTime?.trim();
  return lead ? `${label} · ${lead}` : label;
}
