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
  // ONLAYN-SOTUVCHI.md §9.3. Optional: a backend that predates them omits them.
  /** "Buyurtmaga olinadi": may be ordered with no stock; the line waits for the goods. */
  preorder?: boolean;
  /** Choice groups on the card ("Oʼlcham": 39, 40, 41); stock stays per card. */
  options?: { name: string; values: string[] }[] | null;
  /** Free text, e.g. "15–20 kun"; shown next to the "Buyurtmaga" label. */
  leadTime?: string | null;
  /** Plain text with line breaks, up to 2000 characters. */
  description?: string | null;
}

export interface StoreProductsResponse {
  products: StoreProduct[];
  total: number;
  page: number;
  limit: number;
}

/**
 * One page of the shop's catalogue. Works on both sides:
 * - Server Components get Next's data cache (`revalidate: 60`).
 * - In the browser (catalogue paging) the caller passes the tenant slug from
 *   `getStoreSlugClient()` and may pass an AbortSignal; no Next-only options.
 *
 * `sort` is sent only when it is not the default, so a default request is the
 * same URL as before. A backend that predates `sort` ignores it and returns
 * its default order (in stock first, then newest).
 */
export async function getStoreProducts(options?: {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  slug?: string | null;
  signal?: AbortSignal;
}): Promise<StoreProductsResponse> {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.search) params.set("search", options.search);
  if (options?.sort && options.sort !== "new") params.set("sort", options.sort);
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  withStore(params, options?.slug);

  const onServer = typeof window === "undefined";
  const res = await fetch(`${apiBase()}/store/products?${params.toString()}`, {
    signal: options?.signal,
    ...(onServer ? { next: { revalidate: 60 } } : {}),
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

export type DeliveryType = "pickup" | "delivery";

/**
 * How the shop hands orders over (YETKAZISH.md 4.3). Money fields are numbers
 * in the contract; `normalizeFulfillment` coerces them in case the numeric
 * columns ever leak through as strings.
 */
export interface StoreFulfillment {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFee: number;
  freeDeliveryFrom: number | null;
  minDeliveryAmount: number | null;
  pickupBranchName: string | null;
  pickupAddress: string | null;
}

export interface StoreInfo {
  name: string | null;
  slug: string | null;
  /** Absent on a backend that predates delivery; callers treat that as pickup only. */
  // Wire name as the backend sends it (YETKAZISH.md §4.3): one "l".
  fulfilment?: StoreFulfillment | null;
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

/** A banner at the top of the home page (Settings → Online store → Banners). */
export interface StoreBanner {
  id: string;
  image: string;
  title: string | null;
  subtitle: string | null;
  buttonLabel: string | null;
  link: { type: "none" | "product" | "category" | "url"; value: string | null };
}

/**
 * The banners showing today, in the owner's order. A failure is an empty
 * list: banners are decoration, the shop must open without them.
 */
export async function getStoreBanners(slug?: string | null): Promise<StoreBanner[]> {
  const params = withStore(new URLSearchParams(), slug);
  try {
    const res = await fetch(`${STORE_API_URL}/store/banners?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as StoreBanner[]) : [];
  } catch {
    return [];
  }
}

/** Client-side only: store info without the Next cache (checkout needs the
 *  current fee and thresholds, not a minute-old snapshot). */
export async function fetchStoreInfo(slug?: string | null): Promise<StoreInfo> {
  const params = withStore(new URLSearchParams(), slug);
  const res = await fetch(`${apiBase()}/store/info?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch store info");
  return res.json();
}

export interface StoreOrderItem {
  productId: string;
  quantity: number;
  /** The buyer's choices from the product's options: at most 3, each side at most 40 chars. */
  options?: { name: string; value: string }[];
}

export interface CreateStoreOrderInput {
  items: StoreOrderItem[];
  customerName?: string;
  phone: string;
  note?: string;
  /** Optional only when the shop has a single method enabled. */
  deliveryType?: DeliveryType;
  /** Required for delivery, max 500 chars. */
  address?: string;
  lat?: number;
  lng?: number;
  /** Storefront locale; the shop's Telegram notifications follow it. */
  locale?: "uz" | "uzc" | "ru" | "en";
  /** Telegram mini-app launch payload; binds the order to that Telegram user. */
  initData?: string;
}

export interface StoreOrderResult {
  id: string;
  status: string;
  totalAmount: string;
  /** Fixed at checkout; the shop lowering its fee later does not change it. */
  deliveryFee: string;
  /** totalAmount + deliveryFee: what the customer actually pays. */
  payable: string;
  deliveryType: DeliveryType;
  itemCount: number;
  createdAt: string;
}

export type StoreOrderStatusCode =
  | "Pending"
  /** Accepted; the shop is waiting for the goods to arrive (ONLAYN-SOTUVCHI.md §2). */
  | "Awaiting"
  | "Assembling"
  | "Delivering"
  | "ReadyForPickup"
  | "Completed"
  | "Cancelled";

export type StoreCancelReason =
  | "customer_refused"
  | "no_answer"
  | "out_of_stock"
  | "customer_cancelled"
  | "other";

export interface StoreOrderStatus {
  id: string;
  /** One of StoreOrderStatusCode; typed loosely so an unknown code degrades, not crashes. */
  status: string;
  deliveryType: DeliveryType;
  /** Goods only. */
  totalAmount: string;
  deliveryFee: string;
  /** totalAmount + deliveryFee. */
  payable: string;
  itemCount: number;
  /** When the customer placed it (placedAt). */
  createdAt: string;
  deliveryAddress: string | null;
  /** Only while Delivering. */
  courier: { name: string; phone: string | null } | null;
  /** Pickup orders only. */
  pickup: { branchName: string | null; address: string | null } | null;
  cancelReason: StoreCancelReason | string | null;
  /** The shop's own words, only for an 'other' cancel. */
  cancelNote?: string | null;
  /** The customer may cancel only while Pending. */
  canCancel: boolean;
  /** Status transitions, oldest first (from order_status_events). */
  timeline: { status: string; at: string }[];
  items: {
    productName: string;
    quantity: number;
    lineTotal: string;
    /** The buyer's choices; absent from servers older than the online-seller release. */
    options?: { name: string; value: string }[] | null;
  }[];
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

/**
 * Client-side: every order this Telegram user has placed at this store.
 *
 * The signed launch payload is the credential — there is no session of ours.
 * Returns null when the backend rejects it (stale or forged), which the caller
 * treats as "fall back to the ids kept in localStorage".
 */
export async function fetchMyTelegramOrders(
  initData: string,
  slug?: string | null
): Promise<StoreOrderStatus[] | null> {
  const params = withStore(new URLSearchParams(), slug);
  const res = await fetch(`${apiBase()}/store/my-orders?${params.toString()}`, {
    headers: { "X-Telegram-Init-Data": initData },
  });
  if (!res.ok) return null;
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

/** Turn a failed response into a StoreApiError carrying the backend's code. */
async function toStoreApiError(res: Response, fallback: string): Promise<StoreApiError> {
  const err = (await res.json().catch(() => null)) as {
    message?: string;
    code?: string;
    params?: Record<string, unknown>;
  } | null;
  return new StoreApiError(
    err?.message || fallback,
    err?.code ?? null,
    err?.params ?? null
  );
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
  if (!res.ok) throw await toStoreApiError(res, "Order failed");
  return res.json();
}

/**
 * Client-side: the customer cancels their own order. Only Pending orders can
 * be cancelled; anything else fails with STORE_ORDER_NOT_CANCELLABLE. The id
 * is the credential (as for status lookups); the Telegram launch payload is
 * forwarded when present so the backend can attribute the action.
 */
export async function cancelStoreOrder(
  id: string,
  slug?: string | null,
  initData?: string | null
): Promise<void> {
  const params = withStore(new URLSearchParams(), slug);
  const headers: Record<string, string> = {};
  if (initData) headers["X-Telegram-Init-Data"] = initData;
  const res = await fetch(
    `${apiBase()}/store/orders/${id}/cancel?${params.toString()}`,
    { method: "POST", headers }
  );
  if (!res.ok) throw await toStoreApiError(res, "Cancel failed");
}
