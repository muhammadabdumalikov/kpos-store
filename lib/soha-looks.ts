// Trade themes ("soha mavzulari"): one ready-made look per kind of shop the
// landing page lists (food, building goods, flowers, books …), and Butik, a
// clothes theme built the same way (the dashboard lists it with the
// hand-drawn clothes trio).
//
// Each is drawn after the real shops of its trade and has a structure of its
// own, not a recolouring of one skeleton:
// - tokens and its own rules in app/soha/<key>.css under
//   `:root[data-theme="<key>"]`: fonts, the page and card colours, the tinted
//   grey scale, corner sizes;
// - its parts in app/components/soha/looks/<key>.tsx: the top of the home
//   page, the block under the phone's search bar, the home page body
//   (categories and product sections) and the product card;
// - the few facts below that code outside those parts needs.
//
// The other pages (product, cart, checkout, orders) keep the default layout,
// repainted by the tokens, and show the theme's card wherever products are
// listed.
//
// Rules every theme keeps (the owner's, 2026-11): only what the shop really
// has (no ratings, brands, instalments); no button that repeats the tab bar's
// "Katalog"; no invented copy, only the shop's own words and plain labels; the
// cover carries text in Marafon and Uy alone.
//
// Never rename a key: shops point at it. The backend keeps the same list
// (pimpo-backend src/common/store-theme.ts), the dashboard too
// (pimpo-nextjs src/lib/storeTheme.ts).

import type { StoreAccent } from "./store-accent";

export const SOHA_KEYS = [
  "bozor",
  "usta",
  "guldasta",
  "mayin",
  "oynoqi",
  "texno",
  "rozgor",
  "kitob",
  "marafon",
  "tuhfa",
  "uy",
  "garaj",
  "daftar",
  "butik",
] as const;
export type SohaKey = (typeof SOHA_KEYS)[number];

export function isSohaKey(value: unknown): value is SohaKey {
  return typeof value === "string" && (SOHA_KEYS as readonly string[]).includes(value);
}

export type SohaLook = {
  scheme: "light" | "dark";
  /** The page colour, for the browser and Telegram chrome around the page. */
  page: string;
  /** The accent a shop gets when its owner chose none; null keeps KPOS blue. */
  accent: StoreAccent | null;
  /**
   * Corners of the shared chrome (search, buttons, sheets): "round" leaves the
   * default pills, "soft" turns them into small rounded rectangles, "square"
   * removes them. The theme's own blocks use --r-card / --r-tile / --r-ctl.
   */
  corner: "round" | "soft" | "square";
  /**
   * The phone's sticky bar: "field" is the search field with the language
   * switch; "wordmark" carries the shop's name between a search button and
   * the language switch (the field opens in the bar itself).
   */
  bar: "field" | "wordmark";
  /** Cards in one row of a product grid on a phone and on a wide screen. */
  phoneCols: 1 | 2 | 3;
  cols: 3 | 4 | 5 | 6;
  /** The home page lists each category's size (Garaj's catalogue). */
  counts?: boolean;
  /** The search field's own prompt (a message key); the plain "Qidirish..." otherwise. */
  searchHint?: string;
  /**
   * The product page's photos: "side" stands the thumbnails in a column on
   * the photo's right, on a phone too, in place of the dots and the row of
   * thumbnails under it.
   */
  gallery?: "side";
};

export const SOHA_LOOKS: Record<SohaKey, SohaLook> = {
  // Oziq-ovqat: a delivery app. No hero; category tiles, three goods a row, price first.
  bozor: { scheme: "light", page: "#ffffff", accent: "green", corner: "soft", bar: "field", phoneCols: 3, cols: 6 },
  // Qurilish mollari: a builders' merchant. Black band, yellow fields, square, ruled cells.
  usta: { scheme: "light", page: "#ffffff", accent: "orange", corner: "square", bar: "field", phoneCols: 2, cols: 5 },
  // Gul do'koni: the photo, a berry block under it, large pictures to swipe.
  guldasta: { scheme: "light", page: "#fbf7f1", accent: "rose", corner: "square", bar: "wordmark", phoneCols: 2, cols: 4 },
  // Kosmetika: white and nude, a flared sans, small shelves with an outlined button.
  mayin: { scheme: "light", page: "#ffffff", accent: "rose", corner: "round", bar: "field", phoneCols: 2, cols: 5 },
  // Bolalar mahsulotlari: a violet band, pastel category squares, white cards in grey panels.
  oynoqi: { scheme: "light", page: "#ffffff", accent: "violet", corner: "round", bar: "field", phoneCols: 2, cols: 5 },
  // Telefon va elektronika: a local electronics shop. Banner, framed deals, dense bordered cards.
  texno: { scheme: "light", page: "#ffffff", accent: "blue", corner: "soft", bar: "field", phoneCols: 2, cols: 5 },
  // Xo'jalik mollari: a price-led household shop. Quick links, a deals panel, price tags.
  rozgor: { scheme: "light", page: "#fffaf3", accent: "orange", corner: "soft", bar: "field", phoneCols: 2, cols: 5 },
  // Kitob do'koni: a book page. The tagline as an epigraph, covers on shelf lines, a serif throughout.
  kitob: { scheme: "light", page: "#f7f1e5", accent: "red", corner: "soft", bar: "field", phoneCols: 3, cols: 6, searchHint: "home.bookSearch" },
  // Sport: a full photo with slanted condensed caps, edge-to-edge tiles.
  marafon: { scheme: "light", page: "#ffffff", accent: "graphite", corner: "square", bar: "wordmark", phoneCols: 2, cols: 4 },
  // Sovg'alar: a ribbon-red lid, tall occasion cards hanging over its edge.
  tuhfa: { scheme: "light", page: "#fbf4ea", accent: "red", corner: "round", bar: "field", phoneCols: 2, cols: 4 },
  // Mebel: a quiet showroom. A room photo with light caps, photo tiles under label bars.
  uy: { scheme: "light", page: "#f6f3ee", accent: "graphite", corner: "square", bar: "field", phoneCols: 2, cols: 4 },
  // Avto ehtiyot qismlar: a parts counter. The search as the tool, a grouped catalogue, list rows.
  garaj: { scheme: "light", page: "#ffffff", accent: "orange", corner: "soft", bar: "field", phoneCols: 1, cols: 3, counts: true, searchHint: "home.partSearchHint" },
  // Kanselyariya: bright category tiles first, marker titles, ink-outlined cards.
  daftar: { scheme: "light", page: "#ffffff", accent: "blue", corner: "soft", bar: "field", phoneCols: 2, cols: 5 },
  // Kiyim: a shop app. The name centred, big category photos first, grey packshot tiles, black buttons.
  butik: { scheme: "light", page: "#ffffff", accent: "graphite", corner: "soft", bar: "field", phoneCols: 2, cols: 4, gallery: "side" },
};
