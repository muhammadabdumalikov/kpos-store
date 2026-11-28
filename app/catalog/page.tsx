import { DesktopFooter } from "../components/DesktopFooter";
import { PlatformCredit } from "../components/PlatformCredit";
import { DesktopHeader } from "../components/DesktopHeader";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNav } from "../components/MobileNav";
import { AuthDrawerProvider } from "../components/AuthDrawerContext";
import { CartBar } from "../components/CartBar";
import { CatalogView } from "../components/CatalogView";
import { CATALOG_PAGE_SIZE, toCatalogProduct, type CatalogProduct } from "../../lib/catalog-pages";
import { DEFAULT_SORT, SORT_VALUES, type SortValue } from "../../lib/catalog-sort";
import {
  getStoreProducts,
  getStoreCategories,
  getStoreInfo,
  type StoreInfo,
} from "../../lib/store-api";
import { getStoreSlugServer } from "../../lib/store-slug-server";
import { sampleProducts, withDemoPictures } from "../../lib/theme-preview";
import { getThemePreview } from "../../lib/theme-preview-server";
import type { Metadata } from "next";
import uz from "../../i18n/messages/uz.json";

type CatalogParams = { searchParams: Promise<{ category?: string; sort?: string; q?: string }> };

/**
 * The category's name (or "Katalog") in front of the shop's name. One
 * address per category for search engines: the sort order is dropped from
 * the canonical, and search results are not indexed at all.
 */
export async function generateMetadata({ searchParams }: CatalogParams): Promise<Metadata> {
  const { category, q } = await searchParams;
  if ((q ?? "").trim()) return { title: uz.nav.catalog, robots: { index: false, follow: true } };
  if (!category) return { title: uz.nav.catalog, alternates: { canonical: "/catalog" } };
  const slug = await getStoreSlugServer();
  const name = (await getStoreCategories(slug).catch(() => [])).find((c) => c.id === category)?.name;
  return {
    title: name ?? uz.nav.catalog,
    alternates: { canonical: name ? `/catalog?category=${encodeURIComponent(category)}` : "/catalog" },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}) {
  const { category, sort, q } = await searchParams;
  const sortValue: SortValue = SORT_VALUES.includes(sort as SortValue) ? (sort as SortValue) : DEFAULT_SORT;
  const query = (q ?? "").trim();
  const slug = await getStoreSlugServer();
  const requestCategory = category || "";

  const [infoRes, categoriesRes, productsRes] = await Promise.allSettled([
    getStoreInfo(slug),
    getStoreCategories(slug),
    // First page only, already filtered and ordered by the backend (in stock
    // first, then the chosen sort); the client appends the rest as the
    // shopper scrolls.
    getStoreProducts({
      category: requestCategory || undefined,
      search: query || undefined,
      sort: sortValue,
      page: 1,
      limit: CATALOG_PAGE_SIZE,
      slug,
    }),
  ]);

  const info: StoreInfo | null = infoRes.status === "fulfilled" ? infoRes.value : null;
  const categories =
    categoriesRes.status === "fulfilled"
      ? categoriesRes.value.map((c) => ({ id: c.id, name: c.name }))
      : [];
  const failed = productsRes.status === "rejected";
  // The owner trying a theme on (lib/theme-preview): a product without a photo
  // shows the theme's sample picture, and a shop with nothing on sale yet the
  // home page's sample cards.
  const preview = await getThemePreview();
  const sampled =
    preview !== null && productsRes.status === "fulfilled" && productsRes.value.total === 0 && !requestCategory && !query;
  const found =
    productsRes.status === "fulfilled" ? (preview ? withDemoPictures(productsRes.value.products, preview) : productsRes.value.products) : [];
  const products: CatalogProduct[] = (sampled ? sampleProducts(preview) : found).map(toCatalogProduct);
  const total = sampled
    ? products.length
    : productsRes.status === "fulfilled" && typeof productsRes.value.total === "number"
      ? productsRes.value.total
      : products.length;

  const hasCategory = Boolean(category) && categories.some((c) => c.id === category);

  return (
    <AuthDrawerProvider>
      <DesktopHeader store={info} />
      <MobileHeader />

      <main className="mx-auto max-w-7xl px-4 pb-[calc(var(--nav-total)_+_24px)] lg:pb-16">
        <CatalogView
          categories={categories}
          products={products}
          total={total}
          category={hasCategory ? category! : ""}
          requestCategory={requestCategory}
          sort={sortValue}
          query={query}
          failed={failed}
        />
        <PlatformCredit store={info} phone />
        <CartBar />
      </main>

      <MobileNav />
      <DesktopFooter store={info} />
    </AuthDrawerProvider>
  );
}
