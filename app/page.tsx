import { DesktopFooter } from "./components/DesktopFooter";
import { DesktopHeader } from "./components/DesktopHeader";
import { MobileHeader } from "./components/MobileHeader";
import { MobileNav } from "./components/MobileNav";
import { AuthDrawerProvider } from "./components/AuthDrawerContext";
import { BannerCarousel } from "./components/BannerCarousel";
import { CartBar } from "./components/CartBar";
import {
  HomeContent,
  type HomeCategory,
  type HomeProduct,
  type HomeSection,
} from "./components/HomeContent";
import { StoreIntro } from "./components/StoreIntro";
import {
  getStoreProducts,
  getStoreCategories,
  getStoreBanners,
  getStoreInfo,
  type StoreInfo,
  type StoreProduct,
} from "../lib/store-api";
import { getStoreSlugServer } from "../lib/store-slug-server";
import { optionGroups } from "../lib/product-options";
import { toOldPrice } from "../lib/product-badges";
import { sharedOrderLead } from "../lib/stock";

const HOME_PRODUCTS = 10;
// Most categories that may each cost one extra request for a borrowed photo.
const CATEGORY_PHOTO_LOOKUPS = 6;
// Category shelves under the newest products: how many, and how long each is.
const HOME_SHELVES = 4;
const SHELF_PRODUCTS = 8;

function toHomeProduct(p: StoreProduct): HomeProduct {
  const price = Math.round(parseFloat(String(p.priceOut)) || 0);
  return {
    id: p.id,
    name: p.name,
    price,
    image: p.image ?? undefined,
    quantity: p.quantity,
    quantityType: p.quantityType,
    // Online seller (ONLAYN-SOTUVCHI.md): sold before it is in stock, and a
    // card with choices opens the product page instead of adding.
    preorder: p.preorder === true,
    leadTime: p.leadTime?.trim() || null,
    hasOptions: optionGroups(p.options).length > 0,
    // A markdown and the shop's flags, for the label on the card's photo.
    oldPrice: toOldPrice(p.oldPrice, price),
    isNew: p.isNew === true,
    popular: p.popular === true,
  };
}

export default async function Home() {
  const slug = await getStoreSlugServer();

  // Settled separately: a failed category list should not hide the products,
  // and only a failed product list means "the shop could not be opened".
  const [infoRes, categoriesRes, productsRes, banners] = await Promise.all([
    settle(getStoreInfo(slug)),
    settle(getStoreCategories(slug)),
    settle(getStoreProducts({ limit: HOME_PRODUCTS, slug })),
    // Never rejects: a failed banner request is just "no banners".
    getStoreBanners(slug),
  ]);

  const info: StoreInfo | null = infoRes.status === "fulfilled" ? infoRes.value : null;
  let categories: HomeCategory[] =
    categoriesRes.status === "fulfilled"
      ? categoriesRes.value.map((c) => ({ id: c.id, name: c.name, image: c.image }))
      : [];
  const failed = productsRes.status === "rejected";
  const products: HomeProduct[] =
    productsRes.status === "fulfilled" ? productsRes.value.products.map(toHomeProduct) : [];
  const total = productsRes.status === "fulfilled" ? productsRes.value.total : 0;

  // A shop with more than one page of products gets a shelf per category, so
  // the home page shows its range instead of only the newest ten. A small
  // shop already shows everything in the grid; shelves would repeat it.
  let sections: HomeSection[] = [];
  const shelves = total > products.length && categories.length > 1 ? categories.slice(0, HOME_SHELVES) : [];

  // Owners rarely give a category its own picture, and a row of bare names
  // sells nothing: a category without one borrows the photo of its first
  // product. Taken from products already on this page where possible; the
  // few categories still uncovered get one small (cached) request each.
  const photoOf = new Map<string, string>();
  const notePhotos = (list: StoreProduct[]) => {
    for (const p of list) {
      if (p.categoryId && p.image && !photoOf.has(p.categoryId)) photoOf.set(p.categoryId, p.image);
    }
  };
  if (productsRes.status === "fulfilled") notePhotos(productsRes.value.products);
  const uncovered = categories
    .filter((c) => !c.image && !photoOf.has(c.id) && !shelves.some((s) => s.id === c.id))
    .slice(0, CATEGORY_PHOTO_LOOKUPS);

  const [results, lookups] = await Promise.all([
    Promise.all(shelves.map((c) => settle(getStoreProducts({ category: c.id, limit: SHELF_PRODUCTS, slug })))),
    Promise.all(uncovered.map((c) => settle(getStoreProducts({ category: c.id, limit: 1, slug })))),
  ]);
  for (const res of [...results, ...lookups]) {
    if (res.status === "fulfilled") notePhotos(res.value.products);
  }
  categories = categories.map((c) => (c.image ? c : { ...c, image: photoOf.get(c.id) ?? null }));

  if (shelves.length > 0) {
    sections = shelves
      .map((c, i) => {
        const res = results[i];
        return {
          id: c.id,
          name: c.name,
          products: res.status === "fulfilled" ? res.value.products.map(toHomeProduct) : [],
        };
      })
      // One product is not a shelf.
      .filter((section) => section.products.length > 1);
  }

  // Everything on sale comes on order with one lead time: the header says so
  // once and the cards stay quiet.
  const sharedLead = sharedOrderLead(products);

  return (
    <AuthDrawerProvider>
      <DesktopHeader store={info} />
      {/* On the phone the shop's name opens the page and scrolls away; the
          search under it then sticks to the top. */}
      <StoreIntro info={info} orderLead={sharedLead} />
      <MobileHeader />

      <main className="mx-auto max-w-7xl px-4 pb-[calc(var(--nav-total)_+_24px)] lg:pb-16">
        {/* Not when the shop could not be opened: the error panel stands alone. */}
        {!failed && <BannerCarousel banners={banners} />}
        <HomeContent
          categories={categories}
          products={products}
          sections={sections}
          total={total}
          failed={failed}
          sharedLead={sharedLead}
        />
        <CartBar />
      </main>

      <MobileNav />
      <DesktopFooter store={info} />
    </AuthDrawerProvider>
  );
}

/** Promise.allSettled for one promise, so the tuple above keeps its types. */
function settle<T>(promise: Promise<T>): Promise<PromiseSettledResult<T>> {
  return promise.then(
    (value) => ({ status: "fulfilled" as const, value }),
    (reason: unknown) => ({ status: "rejected" as const, reason }),
  );
}
