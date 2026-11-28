// Theme preview: the dashboard's "Mavzu" picker shows the owner their own
// shop in a theme before they save it, in an iframe on `?preview_theme=<key>`.
// Nothing is written anywhere: proxy.ts copies the key into a request header,
// and the root layout and the pages read it in place of the shop's saved theme.
//
// The preview is the whole shop: every link inside it keeps the parameter
// (app/components/ShopLink, `usePreviewHref`), so the owner can open the
// catalogue, a product, the cart. It keeps its own cart and order list
// (`storageKey`), sends no order (the cart page stops at the last step),
// loads no trackers and asks not to be indexed.

import { isSohaKey } from "./soha-looks";
import { STORE_THEMES } from "./store-theme";
import type { StoreProduct } from "./store-api";

export const PREVIEW_PARAM = "preview_theme";
/** Set by proxy.ts only, from PREVIEW_PARAM; a value sent by a browser is dropped. */
export const PREVIEW_HEADER = "x-kpos-preview-theme";
/** What the previewed page tells the dashboard once it has drawn itself. */
export const PREVIEW_MESSAGE = "kpos-theme-preview";

/** A theme key the storefront can draw ("default" included), or null. */
export function previewThemeKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return (STORE_THEMES as readonly string[]).includes(value) || isSohaKey(value) ? value : null;
}

/** `href` with the previewed theme kept on it; an address outside the shop is left as it is. */
export function previewHref(href: string, theme: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "https://shop.invalid");
  url.searchParams.set(PREVIEW_PARAM, theme);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** On the client: the theme this page previews (the root layout marks <html>), or null. */
export function pagePreview(): string | null {
  if (typeof document === "undefined") return null;
  return previewThemeKey(document.documentElement.getAttribute("data-preview"));
}

/**
 * A browser-storage key for this page. A preview keeps its own: the owner
 * trying their shop on neither fills nor sees the cart and the orders of their
 * own visits to it.
 */
export function storageKey(key: string): string {
  return pagePreview() ? `${key}:preview` : key;
}

// The sample packshot on each theme's ground (the pictures the dashboard's AI
// image dialog shows; public/theme-demo). Afisha and the default look keep
// pure white, as their AI pictures do.
const DEMO_GROUNDS = new Set([
  "bozor", "daftar", "garaj", "guldasta", "jurnal", "kitob", "marafon", "mayin",
  "oynoqi", "rozgor", "texno", "tuhfa", "tungi", "usta", "uy",
]);

/** The stand-in photo for a card that has none, in the previewed theme. */
export function demoPicture(theme: string): string {
  return `/theme-demo/${DEMO_GROUNDS.has(theme) ? theme : "white"}.webp`;
}

/** A card without a photo borrows the theme's sample picture: preview only. */
export function withDemoPictures<T extends { image: string | null }>(list: T[], theme: string): T[] {
  const picture = demoPicture(theme);
  return list.map((p) => (p.image ? p : { ...p, image: picture }));
}

const SAMPLE_PRICES = [45_000, 89_000, 120_000, 65_000, 150_000, 38_000, 210_000, 99_000];

const SAMPLE_ID = "sample-";

/**
 * Cards for a shop that has no products yet, so a new seller choosing a theme
 * sees a filled page and not an empty one. One is marked down and one is new,
 * to show the labels a theme draws.
 */
export function sampleProducts(theme: string): StoreProduct[] {
  const image = demoPicture(theme);
  return SAMPLE_PRICES.map((price, i) => ({
    id: `${SAMPLE_ID}${i + 1}`,
    name: `Namuna mahsulot ${i + 1}`,
    priceOut: String(price),
    image,
    categoryId: null,
    quantity: 5,
    quantityType: null,
    oldPrice: i === 1 ? String(Math.round(price * 1.25)) : null,
    isNew: i === 0,
  }));
}

/** One of `sampleProducts`, for its product page and the cart; null for any other id. */
export function sampleProduct(theme: string, id: string): StoreProduct | null {
  return id.startsWith(SAMPLE_ID) ? (sampleProducts(theme).find((p) => p.id === id) ?? null) : null;
}
