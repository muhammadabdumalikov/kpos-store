const STORE_API_URL =
  process.env.NEXT_PUBLIC_STORE_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/** Runtime base URL (client reads the public var; server uses the same). */
function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_STORE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000"
  );
}

/** Append the tenant slug so the backend scopes to the right store. */
function withStore(params: URLSearchParams, slug?: string | null): URLSearchParams {
  if (slug) params.set("store", slug);
  return params;
}

// Mirrors the backend's public store product shape — internal fields
// (cost price, barcode, businessId) are never exposed here.
export interface StoreProduct {
  id: string;
  name: string;
  priceOut: string;
  image: string | null;
  categoryId: string | null;
  quantity: number;
  quantityType: string | null;
}

export interface StoreProductsResponse {
  products: StoreProduct[];
  total: number;
  page: number;
  limit: number;
}

export async function getStoreProducts(options?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  slug?: string | null;
}): Promise<StoreProductsResponse> {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.search) params.set("search", options.search);
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  withStore(params, options?.slug);

  const res = await fetch(`${STORE_API_URL}/store/products?${params.toString()}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  return res.json();
}

export async function getStoreProduct(
  id: string,
  slug?: string | null
): Promise<StoreProduct | null> {
  const params = withStore(new URLSearchParams(), slug);
  const res = await fetch(
    `${STORE_API_URL}/store/products/${id}?${params.toString()}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch product");
  }
  return res.json();
}

/** Client-side only: fetch product without Next cache (for cart page). */
export async function fetchStoreProduct(
  id: string,
  slug?: string | null
): Promise<StoreProduct | null> {
  const params = withStore(new URLSearchParams(), slug);
  const res = await fetch(`${apiBase()}/store/products/${id}?${params.toString()}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch product");
  }
  return res.json();
}

export interface StoreCategory {
  id: string;
  name: string;
  image: string | null;
}

export async function getStoreCategories(
  slug?: string | null
): Promise<StoreCategory[]> {
  const params = withStore(new URLSearchParams(), slug);
  const res = await fetch(
    `${STORE_API_URL}/store/categories?${params.toString()}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

export interface StoreInfo {
  name: string | null;
  slug: string | null;
}

export async function getStoreInfo(slug?: string | null): Promise<StoreInfo> {
  const params = withStore(new URLSearchParams(), slug);
  const res = await fetch(`${STORE_API_URL}/store/info?${params.toString()}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    return { name: null, slug: slug ?? null };
  }
  return res.json();
}

export interface StoreOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateStoreOrderInput {
  items: StoreOrderItem[];
  customerName?: string;
  phone: string;
  note?: string;
}

export interface StoreOrderResult {
  id: string;
  status: string;
  totalAmount: string;
  itemCount: number;
  createdAt: string;
}

export interface StoreOrderStatus {
  id: string;
  status: string; // 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
  totalAmount: string;
  itemCount: number;
  createdAt: string;
  items: { productName: string; quantity: number; lineTotal: string }[];
}

/** Client-side: fetch a placed order's status (public; the id is the token). */
export async function fetchStoreOrderStatus(
  id: string,
  slug?: string | null
): Promise<StoreOrderStatus | null> {
  const params = withStore(new URLSearchParams(), slug);
  const res = await fetch(`${apiBase()}/store/orders/${id}?${params.toString()}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch order");
  }
  return res.json();
}

/** API error carrying the backend's stable error code for localization. */
export class StoreApiError extends Error {
  code: string | null;
  params: Record<string, unknown> | null;

  constructor(
    message: string,
    code: string | null = null,
    params: Record<string, unknown> | null = null
  ) {
    super(message);
    this.code = code;
    this.params = params;
  }
}

/** Client-side: place a store order (public, no auth). */
export async function createStoreOrder(
  input: CreateStoreOrderInput,
  slug?: string | null
): Promise<StoreOrderResult> {
  const params = withStore(new URLSearchParams(), slug);
  const res = await fetch(`${apiBase()}/store/orders?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as {
      message?: string;
      code?: string;
      params?: Record<string, unknown>;
    } | null;
    throw new StoreApiError(
      err?.message || "Order failed",
      err?.code ?? null,
      err?.params ?? null
    );
  }
  return res.json();
}
