import type { MetadataRoute } from "next";
import { getStoreCategories, getStoreInfo, getStoreProducts, type StoreProduct } from "../lib/store-api";
import { getSiteOrigin } from "../lib/site-url";
import { getStoreSlugServer } from "../lib/store-slug-server";

/** The backend's page size cap for /store/products. */
const PAGE = 100;
/**
 * At most this many pages (10 000 products): a sitemap file holds 50 000
 * addresses, and a shop bigger than this still gets its first 10 000.
 */
const MAX_PAGES = 100;
/** Pages fetched at once, so a big catalogue does not hit the API all together. */
const BATCH = 5;

/**
 * sitemap.xml per shop: the home page, the catalogue, each category and every
 * product, so a search engine finds products a shopper never opened. A shop
 * that is switched off, unknown or out of plan answers with an empty sitemap
 * (its pages are not found either).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slug = await getStoreSlugServer();
  const origin = await getSiteOrigin();
  if (!slug || !origin) return [];
  try {
    await getStoreInfo(slug);
  } catch {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/catalog`, changeFrequency: "daily", priority: 0.8 },
  ];

  const categories = await getStoreCategories(slug).catch(() => []);
  for (const c of categories) {
    entries.push({
      url: `${origin}/catalog?category=${encodeURIComponent(c.id)}`,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const p of await allProducts(slug)) {
    entries.push({
      url: `${origin}/products/${encodeURIComponent(p.id)}`,
      changeFrequency: "weekly",
      priority: 0.7,
      ...(p.image ? { images: [p.image] } : {}),
    });
  }
  return entries;
}

/** Every product of the shop, page by page; a page that fails is skipped. */
async function allProducts(slug: string): Promise<StoreProduct[]> {
  const first = await getStoreProducts({ slug, limit: PAGE, page: 1 }).catch(() => null);
  if (!first) return [];
  const pages = Math.min(Math.ceil(first.total / PAGE), MAX_PAGES);
  const out = [...first.products];
  for (let start = 2; start <= pages; start += BATCH) {
    const batch = Array.from({ length: Math.min(BATCH, pages - start + 1) }, (_, i) =>
      getStoreProducts({ slug, limit: PAGE, page: start + i })
        .then((r) => r.products)
        .catch(() => [] as StoreProduct[]),
    );
    for (const list of await Promise.all(batch)) out.push(...list);
  }
  // A product can move between pages while they are read; list it once.
  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}
