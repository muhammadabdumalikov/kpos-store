import { DesktopFooter } from "./components/DesktopFooter";
import { PlatformCredit } from "./components/PlatformCredit";
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
import { StoreCover, StoreIntro } from "./components/StoreIntro";
import { SohaAfterBar, SohaIntro } from "./components/soha/SohaIntro";
import { AfishaIntro, AfishaTicker, JurnalIntro, JurnalStrip, TungiIntro, TungiTicker } from "./components/themes/HomeTop";
import {
  getStoreProducts,
  getStoreCategories,
  getStoreBanners,
  getStoreInfo,
  type StoreInfo,
  type StoreProduct,
} from "../lib/store-api";
import { getStoreSlugServer } from "../lib/store-slug-server";
import { pickAnyHero, pickNewArrival } from "../lib/home-picks";
import { optionGroups } from "../lib/product-options";
import { toOldPrice } from "../lib/product-badges";
import { sharedOrderLead, stockOf } from "../lib/stock";
import { SOHA_LOOKS } from "../lib/soha-looks";
import { normalizeSohaKey, normalizeStoreTheme } from "../lib/store-theme";
import { sampleProducts, withDemoPictures } from "../lib/theme-preview";
import { getThemePreview } from "../lib/theme-preview-server";

const HOME_PRODUCTS = 10;
// Most categories that may each cost one extra request for a borrowed photo.
const CATEGORY_PHOTO_LOOKUPS = 6;
// Category shelves under the newest products: how many, and how long each is.
const HOME_SHELVES = 4;
const SHELF_PRODUCTS = 8;
// Jurnal and Garaj list this many categories with their product counts.
const JURNAL_CATEGORIES = 6;

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
    categoryId: p.categoryId,
    optionValues: optionGroups(p.options)[0]?.values ?? [],
  };
}

/**
 * The home page is the shop window: what is sold out stays in the catalogue
 * and off this page. A shop with nothing left keeps its cards, greyed, so the
 * page is not empty.
 */
function onSale(list: StoreProduct[]): StoreProduct[] {
  const left = list.filter((p) => !stockOf(p.quantity, p.preorder).soldOut);
  return left.length > 0 ? left : list;
}

export default async function Home() {
  const slug = await getStoreSlugServer();
  // The owner trying a theme on (lib/theme-preview): this page in that theme,
  // with a sample picture on every card that has no photo of its own.
  const preview = await getThemePreview();
  const dress = (list: StoreProduct[]) => (preview ? withDemoPictures(list, preview) : list);

  // Settled separately: a failed category list should not hide the products,
  // and only a failed product list means "the shop could not be opened".
  const [infoRes, categoriesRes, productsRes, banners] = await Promise.all([
    settle(getStoreInfo(slug)),
    settle(getStoreCategories(slug)),
    settle(getStoreProducts({ limit: HOME_PRODUCTS, slug })),
    // Never rejects: a failed banner request is just "no banners".
    getStoreBanners(slug),
  ]);

  const savedInfo: StoreInfo | null = infoRes.status === "fulfilled" ? infoRes.value : null;
  const info: StoreInfo | null = savedInfo && preview ? { ...savedInfo, theme: preview } : savedInfo;
  const theme = normalizeStoreTheme(info?.theme);
  // A trade theme (lib/soha-looks) draws its own top; `theme` is then "default".
  const soha = normalizeSohaKey(info?.theme);
  let categories: HomeCategory[] =
    categoriesRes.status === "fulfilled"
      ? categoriesRes.value.map((c) => ({ id: c.id, name: c.name, image: c.image }))
      : [];
  const failed = productsRes.status === "rejected";
  // A shop with nothing on sale yet previews with sample cards: an empty page
  // shows nothing of a theme.
  const sampled = preview !== null && productsRes.status === "fulfilled" && productsRes.value.total === 0;
  const newest: StoreProduct[] = sampled
    ? sampleProducts(preview)
    : productsRes.status === "fulfilled"
      ? onSale(dress(productsRes.value.products))
      : [];
  const products: HomeProduct[] = newest.map(toHomeProduct);
  const total = sampled ? newest.length : productsRes.status === "fulfilled" ? productsRes.value.total : 0;

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
  notePhotos(newest);
  const uncovered = categories
    .filter((c) => !c.image && !photoOf.has(c.id) && !shelves.some((s) => s.id === c.id))
    .slice(0, CATEGORY_PHOTO_LOOKUPS);

  // Jurnal states each listed category's size; the shelf and photo requests
  // already carry most of those totals, the rest cost one small request each.
  const sizes = theme === "jurnal" || (soha !== null && SOHA_LOOKS[soha].counts === true);
  const countable = sizes ? categories.slice(0, JURNAL_CATEGORIES) : [];
  const counted = new Set([...shelves, ...uncovered].map((c) => c.id));
  const toCount = countable.filter((c) => !counted.has(c.id));

  const [results, lookups, countLookups] = await Promise.all([
    Promise.all(shelves.map((c) => settle(getStoreProducts({ category: c.id, limit: SHELF_PRODUCTS, slug })))),
    Promise.all(uncovered.map((c) => settle(getStoreProducts({ category: c.id, limit: 1, slug })))),
    Promise.all(toCount.map((c) => settle(getStoreProducts({ category: c.id, limit: 1, slug })))),
  ]);
  for (const res of [...results, ...lookups]) {
    if (res.status === "fulfilled") notePhotos(dress(res.value.products));
  }
  const counts: Record<string, number> = {};
  const noteCount = (id: string, res: PromiseSettledResult<{ total: number }>) => {
    if (res.status === "fulfilled" && typeof res.value.total === "number") counts[id] = res.value.total;
  };
  if (sizes) {
    shelves.forEach((c, i) => noteCount(c.id, results[i]));
    uncovered.forEach((c, i) => noteCount(c.id, lookups[i]));
    toCount.forEach((c, i) => noteCount(c.id, countLookups[i]));
  }
  categories = categories.map((c) => (c.image ? c : { ...c, image: photoOf.get(c.id) ?? null }));

  if (shelves.length > 0) {
    sections = shelves
      .map((c, i) => {
        const res = results[i];
        return {
          id: c.id,
          name: c.name,
          products: res.status === "fulfilled" ? onSale(dress(res.value.products)).map(toHomeProduct) : [],
        };
      })
      // One product is not a shelf.
      .filter((section) => section.products.length > 1);
  }

  // Everything on sale comes on order with one lead time: the header says so
  // once and the cards stay quiet.
  const sharedLead = sharedOrderLead(products);

  // Tungi opens with one product on a big card: a new arrival, else the
  // popular one, else the first with a photo. Only from the shop's own flags.
  const tungiHero = theme === "tungi" ? (pickNewArrival(products) ?? pickAnyHero(products)) : null;

  return (
    <AuthDrawerProvider>
      <DesktopHeader store={info} />
      {/* On the phone the shop's name opens the page and scrolls away; the
          search under it then sticks to the top. A storefront theme orders
          its own top: Jurnal's header lies over its cover, Afisha's stands
          between the ticker and the poster, Tungi's sits under the strip of
          delivery terms and carries the shop's name. */}
      {soha && (
        <>
          <SohaIntro info={info} orderLead={sharedLead} />
          <MobileHeader store={info} home />
        </>
      )}
      {theme === "default" && !soha && (
        <>
          <StoreIntro info={info} />
          <MobileHeader />
        </>
      )}
      {theme === "jurnal" && (
        <>
          <JurnalStrip info={info} />
          <MobileHeader store={info} overlay={Boolean(info?.cover)} />
          <JurnalIntro info={info} />
        </>
      )}
      {theme === "afisha" && (
        <>
          <AfishaTicker info={info} orderLead={sharedLead} />
          <MobileHeader store={info} />
          <AfishaIntro info={info} />
        </>
      )}
      {theme === "tungi" && (
        <>
          <TungiTicker info={info} orderLead={sharedLead} />
          <MobileHeader store={info} home />
        </>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-[calc(var(--nav-total)_+_24px)] lg:pb-16">
        {soha && !failed && <SohaAfterBar info={info} orderLead={sharedLead} />}
        {theme === "default" && !soha && !failed && <StoreCover info={info} />}
        {theme === "tungi" && !failed && <TungiIntro info={info} product={tungiHero} />}
        {/* Not when the shop could not be opened: the error panel stands alone. */}
        {!failed && <BannerCarousel banners={banners} />}
        <HomeContent
          categories={categories}
          products={products}
          sections={sections}
          total={total}
          failed={failed}
          sharedLead={sharedLead}
          counts={counts}
          hero={tungiHero}
          info={info}
        />
        <PlatformCredit store={info} phone />
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
