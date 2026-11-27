// Theme preview: the dashboard's "Mavzu" picker shows the owner their own
// home page in a theme before they save it, in an iframe on
// `/?preview_theme=<key>`. Nothing is written anywhere: proxy.ts copies the
// key into a request header, the root layout and the home page read it in
// place of the shop's saved theme, and every other page ignores it.
//
// A preview is the home page only and is not a working shop: links and buttons
// are switched off (globals.css, `html[data-preview]`), trackers are not
// loaded and the page asks not to be indexed.

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

// The sample packshot on each theme's ground (the pictures the dashboard's AI
// image dialog shows; public/theme-demo). Afisha and the default look keep
// pure white, as their AI pictures do.
const DEMO_GROUNDS = new Set([
  "bozor", "daftar", "garaj", "guldasta", "jurnal", "kitob", "marafon", "mayin",
  "oynoqi", "rozgor", "shifo", "texno", "tuhfa", "tungi", "usta", "uy",
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

/**
 * Cards for a shop that has no products yet, so a new seller choosing a theme
 * sees a filled page and not an empty one. One is marked down and one is new,
 * to show the labels a theme draws.
 */
export function sampleProducts(theme: string): StoreProduct[] {
  const image = demoPicture(theme);
  return SAMPLE_PRICES.map((price, i) => ({
    id: `sample-${i + 1}`,
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
