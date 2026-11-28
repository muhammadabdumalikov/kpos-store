import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthDrawerProvider } from "../../components/AuthDrawerContext";
import { DesktopFooter } from "../../components/DesktopFooter";
import { DesktopHeader } from "../../components/DesktopHeader";
import { MobileNav } from "../../components/MobileNav";
import { ProductView, type RelatedProducts } from "../../components/ProductView";
import { toCatalogProduct } from "../../../lib/catalog-pages";
import { formatPrice, toAmount } from "../../../lib/format";
import { toOldPrice } from "../../../lib/product-badges";
import { optionGroups } from "../../../lib/product-options";
import {
  getStoreCategories,
  getStoreInfo,
  getStoreProduct,
  getStoreProducts,
  type StoreProduct,
} from "../../../lib/store-api";
import { getStoreSlugServer } from "../../../lib/store-slug-server";
import { getSiteOrigin, jsonLd } from "../../../lib/site-url";
import { sampleProduct, sampleProducts, withDemoPictures } from "../../../lib/theme-preview";
import { getThemePreview } from "../../../lib/theme-preview-server";
import uz from "../../../i18n/messages/uz.json";

/** Cards under the product: two rows on desktop, five on a phone. */
const RELATED = 10;

type Params = { params: Promise<{ id: string }> };

/**
 * Tab and share title: the product and the shop; the photo as the preview.
 * The same fetches as the page (identical requests are deduplicated within a
 * render), so this costs nothing extra.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const slug = await getStoreSlugServer();
  const preview = await getThemePreview();
  const sample = preview ? sampleProduct(preview, id) : null;
  const [productRes, infoRes] = await Promise.allSettled([sample ?? getStoreProduct(id, slug), getStoreInfo(slug)]);
  const product = productRes.status === "fulfilled" ? productRes.value : null;
  const shop = infoRes.status === "fulfilled" ? infoRes.value.name : null;
  if (!product) return {};

  // The layout's template puts the shop's name after it in the tab; a share
  // card shows no template, so it spells the shop out itself.
  const shareTitle = shop ? `${product.name} · ${shop}` : product.name;
  // Server-side there is no shopper locale yet; the shop's default language.
  const price = formatPrice(
    toAmount(product.priceOut),
    uz.common.currency,
    product.quantityType === "kg" ? uz.common.unitKg : null
  );
  // Search results show about 155 characters: the price first, then the
  // shop's own words about the product when it has any.
  const about = product.description?.replace(/\s+/g, " ").trim();
  const description = about ? clip(`${price}. ${about}`, 155) : price;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${encodeURIComponent(product.id)}` },
    openGraph: {
      type: "website",
      title: shareTitle,
      description,
      ...(shop ? { siteName: shop } : {}),
      ...(product.image ? { images: [{ url: product.image, alt: product.name }] } : {}),
    },
  };
}

/** Cut to `max` characters on a word boundary, with an ellipsis. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:–-]+$/, "")}…`;
}

/**
 * schema.org Product for search engines: name, photos, price in so'm and
 * whether it can be bought now, sold out or taken to order. Only what the
 * shop really has — no ratings or reviews.
 */
function productJsonLd(product: StoreProduct, origin: string | null, shop: string | null, category: string | null) {
  const url = origin ? `${origin}/products/${encodeURIComponent(product.id)}` : undefined;
  const images = (product.images?.length ? product.images : product.image ? [product.image] : []).slice(0, 8);
  const availability = product.quantity >= 1
    ? "https://schema.org/InStock"
    : product.preorder
      ? "https://schema.org/PreOrder"
      : "https://schema.org/OutOfStock";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.id,
    ...(images.length ? { image: images } : {}),
    ...(product.description?.trim() ? { description: product.description.trim().slice(0, 1000) } : {}),
    ...(category ? { category } : {}),
    offers: {
      "@type": "Offer",
      price: String(toAmount(product.priceOut)),
      priceCurrency: "UZS",
      availability,
      itemCondition: "https://schema.org/NewCondition",
      ...(url ? { url } : {}),
      ...(shop ? { seller: { "@type": "Organization", name: shop } } : {}),
    },
  };
}

/**
 * More from the same shelf: the product's own category (in stock first, as
 * the backend orders it), without the product itself. When the category has
 * nothing else that can be bought, other products of the shop instead, under
 * their own honest title. A failed request leaves the section out.
 */
async function loadRelated(
  product: StoreProduct,
  slug: string | null,
  dress: (list: StoreProduct[]) => StoreProduct[],
): Promise<RelatedProducts | null> {
  const others = (list: StoreProduct[]) =>
    dress(list.filter((p) => p.id !== product.id).slice(0, RELATED)).map(toCatalogProduct);
  try {
    if (product.categoryId) {
      const res = await getStoreProducts({ category: product.categoryId, limit: RELATED + 1, slug });
      const same = others(res.products);
      if (same.some((p) => p.quantity >= 1 || p.preorder)) return { kind: "category", products: same };
    }
    const res = await getStoreProducts({ limit: RELATED + 1, slug });
    const shop = others(res.products);
    return shop.length > 0 ? { kind: "shop", products: shop } : null;
  } catch {
    return null;
  }
}

export default async function ProductPage({ params }: Params) {
  const { id } = await params;
  const slug = await getStoreSlugServer();
  // The owner trying a theme on (lib/theme-preview): a product without a photo
  // shows the theme's sample picture, and a shop with nothing on sale yet has
  // the home page's sample cards, which open here too.
  const preview = await getThemePreview();
  const dress = (list: StoreProduct[]) => (preview ? withDemoPictures(list, preview) : list);
  const sample = preview ? sampleProduct(preview, id) : null;

  const [found, infoRes, categoriesRes] = await Promise.all([
    sample ?? getStoreProduct(id, slug),
    getStoreInfo(slug).then(
      (v) => ({ ok: true as const, v }),
      () => ({ ok: false as const })
    ),
    getStoreCategories(slug).then(
      (v) => ({ ok: true as const, v }),
      () => ({ ok: false as const })
    ),
  ]);
  if (!found) notFound();
  const [product] = dress([found]);

  const info = infoRes.ok ? infoRes.v : null;
  const categoryName =
    product.categoryId && categoriesRes.ok
      ? categoriesRes.v.find((c) => c.id === product.categoryId)?.name ?? null
      : null;
  const related: RelatedProducts | null =
    sample && preview
      ? { kind: "shop", products: sampleProducts(preview).filter((p) => p.id !== id).map(toCatalogProduct) }
      : await loadRelated(product, slug, dress);
  const origin = await getSiteOrigin();

  return (
    <AuthDrawerProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product, origin, info?.name ?? null, categoryName)) }}
      />
      <DesktopHeader store={info} />

      <main className="mx-auto max-w-7xl px-4 pb-[calc(var(--nav-total)_+_24px)] lg:pb-16">
        <ProductView
          // The picked choices are this product's own: start clean on another.
          key={product.id}
          product={{
            id: product.id,
            name: product.name,
            price: toAmount(product.priceOut),
            image: product.image ?? null,
            images: product.images ?? undefined,
            quantity: product.quantity,
            quantityType: product.quantityType,
            preorder: product.preorder === true,
            leadTime: product.leadTime?.trim() || null,
            options: optionGroups(product.options),
            description: product.description ?? null,
            oldPrice: toOldPrice(product.oldPrice, toAmount(product.priceOut)),
            isNew: product.isNew === true,
            popular: product.popular === true,
          }}
          category={categoryName && product.categoryId ? { id: product.categoryId, name: categoryName } : null}
          categoryId={product.categoryId ?? null}
          related={related}
          info={info}
        />
      </main>

      <MobileNav />
      <DesktopFooter store={info} />
    </AuthDrawerProvider>
  );
}
