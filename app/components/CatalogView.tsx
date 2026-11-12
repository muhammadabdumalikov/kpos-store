"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { useCatalogPages } from "@/hooks/useCatalogPages";
import { useTranslations } from "@/hooks/useTranslations";
import { CATALOG_PAGE_SIZE, type CatalogProduct } from "@/lib/catalog-pages";
import { DEFAULT_SORT, type SortValue } from "@/lib/catalog-sort";
import { CategoryChips, SortMenu } from "./CatalogToolbar";
import { ProductCard } from "./ProductCard";
import { StatePanel, pillSecondary } from "./StatePanel";
import { BoxIcon, CloudOffIcon, SearchIcon } from "./icons/ShopIcons";

export type { CatalogProduct };

/** Skeleton cards shown while the next page loads: enough for a couple of rows
 *  at any column count, never more than are actually left to load. */
const SKELETON_CARDS = 10;

/**
 * The catalogue body. URL parameters stay the source of truth (category, sort,
 * q); this only rewrites them, inside a transition so the grid can show it is
 * updating instead of freezing.
 *
 * The server renders the first page already sorted and filtered; further pages
 * are appended as the shopper nears the end of the list (useCatalogPages).
 */
export function CatalogView({
  categories,
  products: initialProducts,
  total: initialTotal,
  category,
  requestCategory,
  sort,
  query,
  failed,
}: {
  categories: { id: string; name: string }[];
  /** The first page, as the server rendered it. */
  products: CatalogProduct[];
  /** How many products match in all, across every page. */
  total: number;
  /** The selected chip ("" when none or not a listed category). */
  category: string;
  /** The category the product request was filtered by. */
  requestCategory: string;
  sort: SortValue;
  query: string;
  failed: boolean;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go: Go = (next) => {
    const c = next.category ?? category;
    const s = next.sort ?? sort;
    const q = next.q ?? query;
    const p = new URLSearchParams();
    if (c) p.set("category", c);
    if (s && s !== DEFAULT_SORT) p.set("sort", s);
    if (q) p.set("q", q);
    const qs = p.toString();
    startTransition(() => router.push(qs ? `/catalog?${qs}` : "/catalog", { scroll: false }));
  };

  const categoryName = category ? categories.find((c) => c.id === category)?.name : undefined;
  const heading = query
    ? t("catalog.searchTitle").replace("{q}", query)
    : categoryName ?? t("catalog.title");

  if (failed) {
    return (
      <div className="pt-4 lg:pt-8">
        <h1 className="text-[26px] font-extrabold leading-8 tracking-[-0.02em] text-gray-900 dark:text-white">
          {t("catalog.title")}
        </h1>
        <StatePanel
          className="mt-4"
          icon={<CloudOffIcon className="h-7 w-7" />}
          title={t("home.errorTitle")}
          body={t("home.errorBody")}
          action={
            <button
              type="button"
              onClick={() => startTransition(() => router.refresh())}
              disabled={pending}
              className={`${pillSecondary} disabled:opacity-60`}
            >
              {pending ? t("common.loading") : t("common.retry")}
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="pt-2 lg:pt-8">
      {/* Phone: the active chip (or the search field) already says what is
          listed, so the title is for assistive tech only. */}
      <h1 className="sr-only line-clamp-2 min-w-0 break-words font-extrabold tracking-[-0.02em] text-gray-900 dark:text-white lg:not-sr-only lg:text-[32px] lg:leading-10">
        {heading}
      </h1>

      {categories.length > 0 && (
        <div className="lg:mt-3">
          <CategoryChips categories={categories} current={category} onSelect={(id) => go({ category: id })} />
        </div>
      )}

      <CatalogResults
        // A new query (chip, sort, search, Back to another one) is a new list.
        key={`${requestCategory}|${sort}|${query}`}
        initialProducts={initialProducts}
        initialTotal={initialTotal}
        category={category}
        requestCategory={requestCategory}
        sort={sort}
        query={query}
        pending={pending}
        go={go}
      />
    </div>
  );
}

type Go = (next: { category?: string; sort?: SortValue; q?: string }) => void;

/** Count, sort and the product grid for one query, paging included. */
function CatalogResults({
  initialProducts,
  initialTotal,
  category,
  requestCategory,
  sort,
  query,
  pending,
  go,
}: {
  initialProducts: CatalogProduct[];
  initialTotal: number;
  category: string;
  requestCategory: string;
  sort: SortValue;
  query: string;
  pending: boolean;
  go: Go;
}) {
  const { t } = useTranslations();
  const { products, total, done, status, loadMore } = useCatalogPages({
    initialProducts,
    initialTotal,
    category: requestCategory,
    sort,
    query,
  });

  let empty: React.ReactNode = null;
  if (products.length === 0) {
    if (query) {
      empty = (
        <StatePanel
          icon={<SearchIcon className="h-7 w-7" />}
          title={t("catalog.emptySearchTitle")}
          body={category ? t("catalog.emptySearchBody") : t("catalog.emptySearchBodyPlain")}
          action={
            <button type="button" onClick={() => go({ q: "", category: "" })} className={pillSecondary}>
              {category ? t("catalog.clearFilters") : t("catalog.clearSearch")}
            </button>
          }
        />
      );
    } else if (category) {
      empty = (
        <StatePanel
          icon={<BoxIcon className="h-7 w-7" />}
          title={t("catalog.emptyCategoryTitle")}
          action={
            <button type="button" onClick={() => go({ category: "" })} className={pillSecondary}>
              {t("home.allProducts")}
            </button>
          }
        />
      );
    } else {
      empty = (
        <StatePanel
          icon={<BoxIcon className="h-7 w-7" />}
          title={t("home.emptyTitle")}
          body={t("home.emptyBody")}
        />
      );
    }
  }

  return (
    <>
      {products.length > 0 && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[14px] font-medium tabular-nums text-gray-500 dark:text-gray-400" aria-live="polite">
            {t("catalog.count").replace("{count}", String(total))}
          </p>
          <div className="-mr-2.5">
            <SortMenu current={sort} onSelect={(s) => go({ sort: s })} />
          </div>
        </div>
      )}

      <section
        aria-label={t("catalog.productsAria")}
        aria-busy={pending || undefined}
        className={`mt-2 transition-opacity duration-150 ${pending ? "opacity-50" : ""}`}
      >
        {empty ?? (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-8">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image}
                  quantity={p.quantity}
                  quantityType={p.quantityType}
                />
              ))}
              {status === "loading" &&
                Array.from(
                  { length: Math.max(1, Math.min(SKELETON_CARDS, CATALOG_PAGE_SIZE, total - products.length)) },
                  (_, i) => <ProductCardSkeleton key={`sk-${i}`} />
                )}
            </div>
            {status === "loading" && (
              <p className="sr-only" role="status">
                {t("catalog.loadingMore")}
              </p>
            )}
            {status === "error" && (
              <div role="alert" className="mt-8 flex flex-col items-center gap-3 text-center">
                <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400">{t("catalog.moreError")}</p>
                <button type="button" onClick={loadMore} className={pillSecondary}>
                  {t("common.retry")}
                </button>
              </div>
            )}
            {!done && status === "idle" && <LoadMoreSentinel onVisible={loadMore} />}
          </>
        )}
      </section>
    </>
  );
}

/**
 * Asks for the next page once the shopper is within roughly a screen of the end
 * of the list. Rendered only while there is more to load and nothing is in
 * flight, so every mount (after each page) checks again: a short page that
 * leaves the sentinel already in view keeps loading without a scroll.
 */
function LoadMoreSentinel({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onVisible);
  useEffect(() => {
    callback.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) callback.current();
      },
      { rootMargin: "0px 0px 900px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} aria-hidden className="h-px w-full" />;
}

/** A product tile's shape while its data is on the way (same grid cell). */
function ProductCardSkeleton() {
  return (
    <div aria-hidden className="flex h-full min-w-0 flex-col motion-safe:animate-pulse">
      <div className="aspect-square w-full rounded-[20px] bg-gray-900/[0.05] dark:bg-white/[0.06]" />
      <div className="mt-2.5 px-0.5">
        <div className="mt-1 h-[18px] w-2/5 rounded-md bg-gray-900/[0.05] dark:bg-white/[0.06]" />
        <div className="mt-2.5 h-3.5 w-4/5 rounded-md bg-gray-900/[0.05] dark:bg-white/[0.06]" />
        <div className="mt-1.5 h-3.5 w-3/5 rounded-md bg-gray-900/[0.05] dark:bg-white/[0.06]" />
      </div>
      <div className="mt-auto pt-2.5">
        <div className="h-11 w-full rounded-full bg-gray-900/[0.04] dark:bg-white/[0.05]" />
      </div>
    </div>
  );
}
