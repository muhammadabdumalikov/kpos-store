import { DesktopFooter } from "./components/DesktopFooter";
import { DesktopHeader } from "./components/DesktopHeader";
import { MobileHeader } from "./components/MobileHeader";
import { MobileNav } from "./components/MobileNav";
import { AuthDrawerProvider } from "./components/AuthDrawerContext";
import { HomeContent, type HomeCategory, type HomeProduct } from "./components/HomeContent";
import { getStoreProducts, getStoreCategories, getStoreInfo } from "../lib/store-api";
import { getStoreSlugServer } from "../lib/store-slug-server";

export default async function Home() {
  const slug = await getStoreSlugServer();
  let categories: HomeCategory[] = [];
  let popularProducts: HomeProduct[] = [];
  let totalProducts = 0;
  let storeName: string | null = null;

  try {
    const [info, categoriesRes, productsRes] = await Promise.all([
      getStoreInfo(slug),
      getStoreCategories(slug),
      getStoreProducts({ limit: 8, slug }),
    ]);
    storeName = info.name;
    categories = categoriesRes;
    totalProducts = productsRes.total;
    popularProducts = productsRes.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Math.round(parseFloat(String(p.priceOut)) || 0),
      image: p.image ?? undefined,
      quantity: p.quantity,
    }));
  } catch {
    // use empty arrays if backend unavailable
  }

  return (
    <AuthDrawerProvider>
      <DesktopHeader />
      <MobileHeader />

      <main className="mx-auto max-w-7xl pb-[calc(var(--nav-total)_+_24px)] pt-[56px] lg:px-4 lg:pb-8 lg:pt-6">
        <HomeContent
          categories={categories}
          products={popularProducts}
          total={totalProducts}
          storeName={storeName}
        />
      </main>

      <MobileNav />
      <DesktopFooter />
    </AuthDrawerProvider>
  );
}
