// Plain module (not "use client"): the server page reads PAGE_SIZE and the
// mapper, the client keeps its page cache here.

import type { StoreProduct } from "./store-api";

/** Products per catalogue request, first page and every page after it. */
export const CATALOG_PAGE_SIZE = 40;

/** How long a list kept for Back navigation may be restored before it is
 *  thrown away and the catalogue starts again from the server's first page. */
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

/** Distinct queries kept at once; the oldest is dropped past this. */
const CACHE_MAX_ENTRIES = 8;

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  categoryId: string | null;
  image?: string;
  quantity: number;
  quantityType: string | null;
};

export function toCatalogProduct(p: StoreProduct): CatalogProduct {
  return {
    id: p.id,
    name: p.name,
    price: Math.round(parseFloat(String(p.priceOut)) || 0),
    categoryId: p.categoryId ?? null,
    image: p.image ?? undefined,
    quantity: p.quantity,
    quantityType: p.quantityType,
  };
}

/** What a shopper had loaded for one query (tenant, category, sort, search). */
export type CatalogPages = {
  products: CatalogProduct[];
  total: number;
  /** Last page loaded (1-based). */
  page: number;
  done: boolean;
  /** Window scroll offset, kept so Back lands where the shopper was. */
  scrollY: number;
  /** When page 1 of this list was fetched; the max age counts from here. */
  createdAt: number;
};

export function catalogQueryKey(q: {
  slug: string | null;
  category: string;
  sort: string;
  query: string;
}): string {
  return JSON.stringify([q.slug ?? "", q.category, q.sort, q.query]);
}

// Module scope survives App Router navigations (the page component does not),
// and is empty again on a full reload, which is what we want.
const cache = new Map<string, CatalogPages>();

export function readCatalogPages(key: string): CatalogPages | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_MAX_AGE_MS) {
    cache.delete(key);
    return null;
  }
  return entry;
}

/** Store a list. The scroll offset already recorded for the same list (same
 *  createdAt) is kept; a new list starts from its own (0 for a fresh one). */
export function writeCatalogPages(key: string, entry: CatalogPages): void {
  const prev = cache.get(key);
  const scrollY = prev && prev.createdAt === entry.createdAt ? prev.scrollY : entry.scrollY;
  cache.delete(key);
  cache.set(key, { ...entry, scrollY });
  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export function saveCatalogScroll(key: string, scrollY: number): void {
  const entry = cache.get(key);
  if (entry) entry.scrollY = scrollY;
}

// Back/Forward is the only navigation that should put the shopper back where
// they were; a fresh visit (link, chip, sort) starts at the top with fresh data.
// Next's router handles popstate before the page remounts, so a recent
// popstate with no user input since means this mount is a history restore.
// Any tap or key press clears it: the navigation that follows (a chip, the
// sort menu, a search) is the shopper's own, not a step back. The browser's
// Back key or mouse button fires before popstate, so it does not clear it.
let lastPopAt = 0;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastPopAt = Date.now();
  });
  const clear = () => {
    lastPopAt = 0;
  };
  window.addEventListener("pointerdown", clear, true);
  window.addEventListener("keydown", clear, true);
}

export function isHistoryRestore(): boolean {
  return lastPopAt > 0 && Date.now() - lastPopAt < 10_000;
}
