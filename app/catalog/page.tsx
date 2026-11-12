import { DesktopFooter } from "../components/DesktopFooter";
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
  const products: CatalogProduct[] =
    productsRes.status === "fulfilled" ? productsRes.value.products.map(toCatalogProduct) : [];
  const total =
    productsRes.status === "fulfilled" && typeof productsRes.value.total === "number"
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
        <CartBar />
      </main>

      <MobileNav />
      <DesktopFooter store={info} />
    </AuthDrawerProvider>
  );
}
