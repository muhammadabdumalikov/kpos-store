import { useSyncExternalStore } from "react";
import { cleanChoices, type OptionChoice } from "./product-options";

const CART_KEY = "KPOS_cart";
/** Fired on this tab after every write; other tabs hear the `storage` event. */
const CART_EVENT = "kpos:cart";

export type CartLine = {
  /** The product id. Several lines may share it: one per set of choices. */
  id: string;
  qty: number;
  selected: boolean;
  /**
   * Unit price seen when the line was added or last shown on a card. Optional:
   * carts written before it existed, and lines rewritten by the cart page, may
   * lack it. Only used for the running total in the cart bar and the header;
   * the cart page and the order always use the live price.
   */
  price?: number;
  /**
   * What the shopper chose from the product's options ("Oʼlcham: 41"), in the
   * product's own group order. Absent for a product without options, and on
   * carts written before options existed.
   */
  options?: OptionChoice[];
};

/**
 * A line's identity: the product plus the choices made on it, so size 40 and
 * size 41 of one product are two lines. Without choices it is the bare product
 * id, which is what every cart written before options existed already used.
 */
export function lineKey(productId: string, options?: OptionChoice[]): string {
  if (!options || options.length === 0) return productId;
  return `${productId}|${JSON.stringify(options.map((o) => [o.name, o.value]))}`;
}

export const cartLineKey = (line: Pick<CartLine, "id" | "options">) =>
  lineKey(line.id, line.options);

function parse(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is CartLine =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as CartLine).id === "string" &&
          typeof (x as CartLine).qty === "number" &&
          typeof (x as CartLine).selected === "boolean"
      )
      .map((l) => {
        const line: CartLine = { id: l.id, qty: l.qty, selected: l.selected };
        if (typeof l.price === "number" && Number.isFinite(l.price)) line.price = l.price;
        const options = cleanChoices(l.options);
        if (options) line.options = options;
        return line;
      });
  } catch {
    return [];
  }
}

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CART_KEY);
  } catch {
    return null;
  }
}

export function getCart(): CartLine[] {
  return parse(readRaw());
}

export function setCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  // Callers that do not know about price snapshots (the cart page rewrites
  // lines without them) must not wipe them. The price belongs to the product,
  // so every line of one product shares the snapshot.
  const previous = new Map(getCart().map((l) => [l.id, l.price]));
  const next = lines.map((l) => {
    if (typeof l.price === "number") return l;
    const kept = previous.get(l.id);
    return typeof kept === "number" ? { ...l, price: kept } : l;
  });
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  } catch {
    // ignore (private mode, quota)
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(
  productId: string,
  qty: number = 1,
  price?: number,
  options?: OptionChoice[]
): void {
  const cart = getCart();
  const key = lineKey(productId, options);
  const existing = cart.find((l) => cartLineKey(l) === key);
  const next: CartLine[] = existing
    ? cart.map((l) =>
        cartLineKey(l) === key
          ? { ...l, qty: l.qty + qty, ...(price !== undefined ? { price } : {}) }
          : l
      )
    : [
        ...cart,
        {
          id: productId,
          qty,
          selected: true,
          ...(price !== undefined ? { price } : {}),
          ...(options && options.length > 0 ? { options } : {}),
        },
      ];
  setCart(next);
}

export function removeFromCart(productId: string, options?: OptionChoice[]): void {
  const key = lineKey(productId, options);
  setCart(getCart().filter((l) => cartLineKey(l) !== key));
}

export function updateCartLine(
  productId: string,
  update: Partial<Pick<CartLine, "qty" | "selected" | "price">>,
  options?: OptionChoice[]
): void {
  const key = lineKey(productId, options);
  const cart = getCart();
  const next = cart.map((l) => (cartLineKey(l) === key ? { ...l, ...update } : l));
  setCart(next);
}

/** Set a line to an absolute quantity; 0 or less removes it. */
export function setLineQty(
  productId: string,
  qty: number,
  price?: number,
  options?: OptionChoice[]
): void {
  if (qty <= 0) {
    removeFromCart(productId, options);
    return;
  }
  const key = lineKey(productId, options);
  if (getCart().some((l) => cartLineKey(l) === key)) {
    updateCartLine(productId, price !== undefined ? { qty, price } : { qty }, options);
  } else {
    addToCart(productId, qty, price, options);
  }
}

/** Keep a product's price snapshot current when its card shows a newer price
 *  (on every line of the product, whatever was chosen on it). */
export function refreshPriceSnapshot(productId: string, price: number): void {
  const cart = getCart();
  if (!cart.some((l) => l.id === productId && l.price !== price)) return;
  setCart(cart.map((l) => (l.id === productId ? { ...l, price } : l)));
}

// ── Subscription ───────────────────────────────────────────────────────────
// useSyncExternalStore needs a stable snapshot, so the parsed cart is cached
// against the raw string it came from.

const EMPTY: CartLine[] = [];
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function snapshot(): CartLine[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = raw ? parse(raw) : EMPTY;
  }
  return cachedLines;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === CART_KEY) onChange();
  };
  window.addEventListener(CART_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CART_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The cart, live: re-renders on every write from this tab or another. */
export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export type CartSummary = {
  /** Lines in the cart. */
  lines: number;
  /** Units across all lines (what "N ta mahsulot" counts on the cart page). */
  units: number;
  /** Sum of snapshot prices; null when any line has no snapshot yet. */
  total: number | null;
};

export function summarizeCart(lines: CartLine[]): CartSummary {
  let units = 0;
  let total: number | null = 0;
  for (const l of lines) {
    units += l.qty;
    if (total !== null) total = typeof l.price === "number" ? total + l.price * l.qty : null;
  }
  return { lines: lines.length, units, total: lines.length ? total : null };
}

/**
 * One line's quantity, live. A number snapshot lets React skip every card
 * whose own line did not change, which matters on a 500-product catalogue.
 * With `options` it is the line for exactly those choices.
 */
export function useCartQty(productId: string, options?: OptionChoice[]): number {
  const key = lineKey(productId, options);
  return useSyncExternalStore(
    subscribe,
    () => snapshot().find((l) => cartLineKey(l) === key)?.qty ?? 0,
    () => 0
  );
}

/** Units of one product across all its lines (every set of choices), live. */
export function useProductCartQty(productId: string): number {
  return useSyncExternalStore(
    subscribe,
    () => snapshot().reduce((sum, l) => (l.id === productId ? sum + l.qty : sum), 0),
    () => 0
  );
}
