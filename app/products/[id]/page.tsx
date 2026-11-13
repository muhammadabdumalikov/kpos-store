import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthDrawerProvider } from "../../components/AuthDrawerContext";
import { CartBar } from "../../components/CartBar";
import { DesktopFooter } from "../../components/DesktopFooter";
import { DesktopHeader } from "../../components/DesktopHeader";
import { MobileNav } from "../../components/MobileNav";
import { ProductView, type RelatedProducts } from "../../components/ProductView";
import { toCatalogProduct } from "../../../lib/catalog-pages";
import { formatPrice, toAmount } from "../../../lib/format";
import { optionGroups } from "../../../lib/product-options";
import {
  getStoreCategories,
  getStoreInfo,
  getStoreProduct,
  getStoreProducts,
  type StoreProduct,
} from "../../../lib/store-api";
import { getStoreSlugServer } from "../../../lib/store-slug-server";
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
  const [productRes, infoRes] = await Promise.allSettled([getStoreProduct(id, slug), getStoreInfo(slug)]);
  const product = productRes.status === "fulfilled" ? productRes.value : null;
  const shop = infoRes.status === "fulfilled" ? infoRes.value.name : null;
  if (!product) return shop ? { title: shop } : {};

  const title = shop ? `${product.name} · ${shop}` : product.name;
  // Server-side there is no shopper locale yet; the shop's default language.
  const description = formatPrice(
    toAmount(product.priceOut),
    uz.common.currency,
    product.quantityType === "kg" ? uz.common.unitKg : null
  );
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(shop ? { siteName: shop } : {}),
      ...(product.image ? { images: [{ url: product.image, alt: product.name }] } : {}),
    },
  };
}

/**
 * More from the same shelf: the product's own category (in stock first, as
 * the backend orders it), without the product itself. When the category has
 * nothing else that can be bought, other products of the shop instead, under
 * their own honest title. A failed request leaves the section out.
 */
async function loadRelated(product: StoreProduct, slug: string | null): Promise<RelatedProducts | null> {
  const others = (list: StoreProduct[]) =>
    list.filter((p) => p.id !== product.id).slice(0, RELATED).map(toCatalogProduct);
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

  const [product, infoRes, categoriesRes] = await Promise.all([
    getStoreProduct(id, slug),
    getStoreInfo(slug).then(
      (v) => ({ ok: true as const, v }),
      () => ({ ok: false as const })
    ),
    getStoreCategories(slug).then(
      (v) => ({ ok: true as const, v }),
      () => ({ ok: false as const })
    ),
  ]);
  if (!product) notFound();

  const info = infoRes.ok ? infoRes.v : null;
  const categoryName =
    product.categoryId && categoriesRes.ok
      ? categoriesRes.v.find((c) => c.id === product.categoryId)?.name ?? null
      : null;
  const related = await loadRelated(product, slug);

  return (
    <AuthDrawerProvider>
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
            quantity: product.quantity,
            quantityType: product.quantityType,
            preorder: product.preorder === true,
            leadTime: product.leadTime?.trim() || null,
            options: optionGroups(product.options),
            description: product.description ?? null,
          }}
          category={categoryName && product.categoryId ? { id: product.categoryId, name: categoryName } : null}
          categoryId={product.categoryId ?? null}
          related={related}
          info={info}
        />
        <CartBar />
      </main>

      <MobileNav />
      <DesktopFooter store={info} />
    </AuthDrawerProvider>
  );
}
