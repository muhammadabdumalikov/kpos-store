const CART_KEY = "KPOS_cart";

export type CartLine = {
  id: string;
  qty: number;
  selected: boolean;
};

export function getCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartLine =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as CartLine).id === "string" &&
        typeof (x as CartLine).qty === "number" &&
        typeof (x as CartLine).selected === "boolean"
    );
  } catch {
    return [];
  }
}

export function setCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    // ignore
  }
}

export function addToCart(productId: string, qty: number = 1): void {
  const cart = getCart();
  const existing = cart.find((l) => l.id === productId);
  const next: CartLine[] = existing
    ? cart.map((l) =>
        l.id === productId ? { ...l, qty: l.qty + qty } : l
      )
    : [...cart, { id: productId, qty, selected: true }];
  setCart(next);
}

export function removeFromCart(productId: string): void {
  setCart(getCart().filter((l) => l.id !== productId));
}

export function updateCartLine(
  productId: string,
  update: Partial<Pick<CartLine, "qty" | "selected">>
): void {
  const cart = getCart();
  const next = cart.map((l) =>
    l.id === productId ? { ...l, ...update } : l
  );
  setCart(next);
}
