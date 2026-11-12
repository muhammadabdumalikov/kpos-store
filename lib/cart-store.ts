import { useSyncExternalStore } from "react";

const CART_KEY = "KPOS_cart";
/** Fired on this tab after every write; other tabs hear the `storage` event. */
const CART_EVENT = "kpos:cart";

export type CartLine = {
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
};

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
      .map((l) =>
        typeof l.price === "number" && Number.isFinite(l.price)
          ? l
          : { id: l.id, qty: l.qty, selected: l.selected }
      );
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
  // lines as {id, qty, selected}) must not wipe them.
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

export function addToCart(productId: string, qty: number = 1, price?: number): void {
  const cart = getCart();
  const existing = cart.find((l) => l.id === productId);
  const next: CartLine[] = existing
    ? cart.map((l) =>
        l.id === productId
          ? { ...l, qty: l.qty + qty, ...(price !== undefined ? { price } : {}) }
          : l
      )
    : [...cart, { id: productId, qty, selected: true, ...(price !== undefined ? { price } : {}) }];
  setCart(next);
}

export function removeFromCart(productId: string): void {
  setCart(getCart().filter((l) => l.id !== productId));
}

export function updateCartLine(
  productId: string,
  update: Partial<Pick<CartLine, "qty" | "selected" | "price">>
): void {
  const cart = getCart();
  const next = cart.map((l) =>
    l.id === productId ? { ...l, ...update } : l
  );
  setCart(next);
}

/** Set a line to an absolute quantity; 0 or less removes it. */
export function setLineQty(productId: string, qty: number, price?: number): void {
  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }
  const cart = getCart();
  if (cart.some((l) => l.id === productId)) {
    updateCartLine(productId, price !== undefined ? { qty, price } : { qty });
  } else {
    addToCart(productId, qty, price);
  }
}

/** Keep a line's price snapshot current when its card shows a newer price. */
export function refreshPriceSnapshot(productId: string, price: number): void {
  const line = getCart().find((l) => l.id === productId);
  if (line && line.price !== price) updateCartLine(productId, { price });
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
 */
export function useCartQty(productId: string): number {
  return useSyncExternalStore(
    subscribe,
    () => snapshot().find((l) => l.id === productId)?.qty ?? 0,
    () => 0
  );
}
