"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CATALOG_PAGE_SIZE,
  catalogQueryKey,
  isHistoryRestore,
  readCatalogPages,
  saveCatalogScroll,
  toCatalogProduct,
  writeCatalogPages,
  type CatalogPages,
  type CatalogProduct,
} from "@/lib/catalog-pages";
import { getStoreProducts } from "@/lib/store-api";
import { getStoreSlugClient } from "@/lib/store-slug";

export type CatalogPagesStatus = "idle" | "loading" | "error";

/**
 * The catalogue list past the server-rendered first page.
 *
 * Pages are appended as the shopper nears the end (the caller wires `loadMore`
 * to a sentinel). Everything loaded is mirrored into a module-level cache
 * keyed by tenant + category + sort + search, so Back from a product restores
 * the same list and scroll offset. Mount this under a `key` of the query: a
 * new filter, sort or search remounts it and starts from the server page.
 */
export function useCatalogPages({
  initialProducts,
  initialTotal,
  category,
  sort,
  query,
}: {
  initialProducts: CatalogProduct[];
  initialTotal: number;
  /** The category the server request used (may be one the chips do not list). */
  category: string;
  sort: string;
  query: string;
}) {
  // The slug only exists in the browser; on the server render the cache is
  // never consulted, so a null slug there changes nothing.
  const [key] = useState(() =>
    catalogQueryKey({ slug: getStoreSlugClient(), category, sort, query })
  );

  const [state, setState] = useState<{ list: CatalogPages; restoredScroll: number | null }>(() => {
    const cached = typeof window !== "undefined" && isHistoryRestore() ? readCatalogPages(key) : null;
    if (cached) return { list: cached, restoredScroll: cached.scrollY };
    return {
      list: {
        products: initialProducts,
        total: initialTotal,
        page: 1,
        done: initialProducts.length >= initialTotal || initialProducts.length < CATALOG_PAGE_SIZE,
        scrollY: 0,
        createdAt: Date.now(),
      },
      restoredScroll: null,
    };
  });
  const { list } = state;
  const [status, setStatus] = useState<CatalogPagesStatus>("idle");

  // The list as of the last render, for the async loader to append to, and
  // mirrored into the cache for Back navigation.
  const listRef = useRef(list);
  useEffect(() => {
    listRef.current = list;
    writeCatalogPages(key, list);
  }, [key, list]);

  // Back navigation: put the window back where the shopper left it. Layout
  // effect, so the restored list is never painted at the top first.
  useLayoutEffect(() => {
    if (state.restoredScroll != null) window.scrollTo(0, state.restoredScroll);
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the scroll offset with the cached list. Registered as a layout effect
  // so it is removed before the next page scrolls itself to the top; otherwise
  // that scroll would overwrite the offset we want to come back to.
  useLayoutEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        saveCatalogScroll(key, window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [key]);

  // One request at a time; aborted (and ignored) once this query is gone.
  const inflight = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      inflight.current?.abort();
      inflight.current = null;
    },
    []
  );

  const loadMore = useCallback(async () => {
    const current = listRef.current;
    if (inflight.current || current.done) return;
    const controller = new AbortController();
    inflight.current = controller;
    const page = current.page + 1;
    setStatus("loading");
    try {
      const res = await getStoreProducts({
        category: category || undefined,
        search: query || undefined,
        sort,
        page,
        limit: CATALOG_PAGE_SIZE,
        slug: getStoreSlugClient(),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const latest = listRef.current;
      // Offset paging over a live catalogue: a product added meanwhile can
      // shift one onto the next page twice. Show it once.
      const seen = new Set(latest.products.map((p) => p.id));
      const fresh = res.products.map(toCatalogProduct).filter((p) => !seen.has(p.id));
      const products = [...latest.products, ...fresh];
      const total = typeof res.total === "number" ? res.total : latest.total;
      const next: CatalogPages = {
        ...latest,
        products,
        total,
        page,
        done: res.products.length < CATALOG_PAGE_SIZE || page * CATALOG_PAGE_SIZE >= total,
      };
      listRef.current = next;
      setState((s) => ({ ...s, list: next }));
      setStatus("idle");
    } catch {
      if (controller.signal.aborted) return;
      setStatus("error");
    } finally {
      if (inflight.current === controller) inflight.current = null;
    }
  }, [category, query, sort]);

  return {
    products: list.products,
    total: list.total,
    done: list.done,
    status,
    loadMore,
  };
}
