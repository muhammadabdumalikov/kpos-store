import { DesktopFooter } from "./components/DesktopFooter";
import { DesktopHeader } from "./components/DesktopHeader";
import { MobileHeader } from "./components/MobileHeader";
import { MobileNav } from "./components/MobileNav";
import { AuthDrawerProvider } from "./components/AuthDrawerContext";
import { CartBar } from "./components/CartBar";
import { HomeContent, type HomeCategory, type HomeProduct } from "./components/HomeContent";
import { StoreIntro } from "./components/StoreIntro";
import {
  getStoreProducts,
  getStoreCategories,
  getStoreInfo,
  type StoreInfo,
} from "../lib/store-api";
import { getStoreSlugServer } from "../lib/store-slug-server";
import { optionGroups } from "../lib/product-options";

const HOME_PRODUCTS = 10;

export default async function Home() {
  const slug = await getStoreSlugServer();

  // Settled separately: a failed category list should not hide the products,
  // and only a failed product list means "the shop could not be opened".
  const [infoRes, categoriesRes, productsRes] = await Promise.allSettled([
    getStoreInfo(slug),
    getStoreCategories(slug),
    getStoreProducts({ limit: HOME_PRODUCTS, slug }),
  ]);

  const info: StoreInfo | null = infoRes.status === "fulfilled" ? infoRes.value : null;
  const categories: HomeCategory[] =
    categoriesRes.status === "fulfilled"
      ? categoriesRes.value.map((c) => ({ id: c.id, name: c.name, image: c.image }))
      : [];
  const failed = productsRes.status === "rejected";
  const products: HomeProduct[] =
    productsRes.status === "fulfilled"
      ? productsRes.value.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: Math.round(parseFloat(String(p.priceOut)) || 0),
          image: p.image ?? undefined,
          quantity: p.quantity,
          quantityType: p.quantityType,
          // Online seller (ONLAYN-SOTUVCHI.md): sold before it is in stock,
          // and a card with choices opens the product page instead of adding.
          preorder: p.preorder === true,
          leadTime: p.leadTime?.trim() || null,
          hasOptions: optionGroups(p.options).length > 0,
        }))
      : [];
  const total = productsRes.status === "fulfilled" ? productsRes.value.total : 0;

  return (
    <AuthDrawerProvider>
      <DesktopHeader store={info} />
      {/* On the phone the shop's name opens the page and scrolls away; the
          search under it then sticks to the top. */}
      <StoreIntro info={info} />
      <MobileHeader />

      <main className="mx-auto max-w-7xl px-4 pb-[calc(var(--nav-total)_+_24px)] lg:pb-16">
        <HomeContent categories={categories} products={products} total={total} failed={failed} />
        <CartBar />
      </main>

      <MobileNav />
      <DesktopFooter store={info} />
    </AuthDrawerProvider>
  );
}
