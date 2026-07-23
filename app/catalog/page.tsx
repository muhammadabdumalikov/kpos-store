import Link from "next/link";
import { DesktopFooter } from "../components/DesktopFooter";
import { DesktopHeader } from "../components/DesktopHeader";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNav } from "../components/MobileNav";
import { ProductCard } from "../components/ProductCard";
import { CategoryCard } from "../components/CategoryCard";
import { AuthDrawerProvider } from "../components/AuthDrawerContext";
import { getStoreProducts, getStoreCategories } from "../../lib/store-api";
import { getStoreSlugServer } from "../../lib/store-slug-server";

const sortOptions = [
  { value: "popular", label: "Mashhur" },
  { value: "price_asc", label: "Narx: pastdan yuqoriga" },
  { value: "price_desc", label: "Narx: yuqoridan pastga" },
  { value: "new", label: "Yangi" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

type CatalogProduct = { id: string; name: string; price: number; categoryId: string | null; image?: string; quantity: number };

function sortProducts(products: CatalogProduct[], sort: SortValue): CatalogProduct[] {
  const arr = [...products];
  if (sort === "price_asc") arr.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") arr.sort((a, b) => b.price - a.price);
  else if (sort === "new") arr.reverse();
  // Whatever the chosen sort, sellable products come before sold-out ones.
  return [
    ...arr.filter((p) => p.quantity > 0),
    ...arr.filter((p) => p.quantity <= 0),
  ];
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}) {
  const { category, sort, q } = await searchParams;
  const sortValue = (sort as SortValue) || "popular";
  const query = (q ?? "").trim();
  const slug = await getStoreSlugServer();

  let categories: { id: string; name: string; image?: string | null }[] = [];
  try {
    categories = await getStoreCategories(slug);
  } catch {
    categories = [];
  }

  const hasCategory =
    category && categories.some((c) => c.id === category);

  let catalogProducts: CatalogProduct[] = [];
  try {
    const res = await getStoreProducts({
      category: category || undefined,
      search: query || undefined,
      limit: 500,
      slug,
    });
    catalogProducts = res.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Math.round(parseFloat(String(p.priceOut)) || 0),
      categoryId: p.categoryId ?? null,
      image: p.image ?? undefined,
      quantity: p.quantity,
    }));
  } catch {
    catalogProducts = [];
  }

  const filtered = hasCategory
    ? catalogProducts.filter((p) => p.categoryId === category)
    : catalogProducts;
  const products = sortProducts(filtered, sortValue);
  const categoryName = category
    ? categories.find((c) => c.id === category)?.name
    : null;
  // A search shows its result grid even without a category selected.
  const showProducts = Boolean(hasCategory || query);
  const heading = query
    ? `«${query}» bo‘yicha natijalar`
    : categoryName;

  return (
    <AuthDrawerProvider>
      <DesktopHeader />
      <MobileHeader />

      <main className="mx-auto max-w-7xl pb-24 pt-[56px] lg:pb-8 lg:pt-4">
        <div className="rounded-b-[18px] bg-white dark:bg-gray-900 px-4 py-4 lg:rounded-2xl lg:px-6 lg:py-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <Link href="/" className="hover:text-brand-500">
                  Bosh sahifa
                </Link>
              </li>
              <li aria-hidden className="text-gray-400">
                /
              </li>
              <li>
                {heading ? (
                  <>
                    <Link href="/catalog" className="hover:text-brand-500">
                      Katalog
                    </Link>
                    <span aria-hidden className="ml-1.5 text-gray-400">/</span>
                    <span className="ml-1.5 font-medium text-gray-900 dark:text-white/90">
                      {query ? "Qidiruv" : categoryName}
                    </span>
                  </>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white/90">Katalog</span>
                )}
              </li>
            </ol>
          </nav>

          {/* Categories block — the main content when nothing is searched/selected */}
          {!query && (
            <section
              aria-label="Katalog"
              className="mb-6 rounded-2xl border-0 bg-transparent p-4 shadow-none sm:p-5"
            >
              <ul className="grid grid-cols-4 gap-3 sm:gap-4">
                {categories.map((cat) => (
                  <li key={cat.id} className="flex w-full justify-center">
                    <CategoryCard
                      id={cat.id}
                      name={cat.name}
                      image={cat.image}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Category opened or search performed: title + product grid */}
          {showProducts && (
            <>
              <h1 className="mb-3 text-title-sm font-semibold text-gray-900 dark:text-white/90 lg:text-title-md">
                {heading}
              </h1>

              <section aria-label="Mahsulotlar ro'yxati">
                {products.length > 0 ? (
                  <>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                      {products.length} ta mahsulot
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {products.map((p) => (
                        <ProductCard
                          key={p.id}
                          id={p.id}
                          name={p.name}
                          price={p.price}
                          image={p.image}
                          quantity={p.quantity}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 py-16 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {query
                        ? "Hech narsa topilmadi. Boshqa so‘z bilan qidirib ko‘ring."
                        : "Bu bo‘limda mahsulot topilmadi."}
                    </p>
                    <Link
                      href="/catalog"
                      className="mt-3 text-sm font-medium text-brand-500 hover:underline"
                    >
                      Katalogga qaytish
                    </Link>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <MobileNav />
      <DesktopFooter />
    </AuthDrawerProvider>
  );
}
