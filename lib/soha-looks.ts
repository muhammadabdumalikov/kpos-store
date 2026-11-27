// Trade themes ("soha mavzulari"): one ready-made look per kind of shop the
// landing page lists (food, building goods, pharmacy, flowers …).
//
// Each is put together from shared parts instead of being drawn by hand:
// - tokens in app/globals.css under `:root[data-theme="<key>"]`: fonts, the
//   page and card colours, the tinted grey scale, corner sizes, the "spot"
//   colour and any small decoration of its own;
// - the choices below: which intro, category row, product card and section
//   title the home page is built from (app/components/soha).
//
// The other pages (product, cart, checkout, orders) keep the default layout
// and are repainted by the tokens alone.
//
// Never rename a key: shops point at it. The backend keeps the same list
// (pimpo-backend src/common/store-theme.ts), the dashboard too
// (pimpo-nextjs src/lib/storeTheme.ts).

import type { StoreAccent } from "./store-accent";

export const SOHA_KEYS = [
  "bozor",
  "usta",
  "shifo",
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
   * The top of the home page.
   * - band: a full-width block in the theme's band colour with the shop's
   *   name; the phone's search bar continues it.
   * - center: logo, name and tagline centred, the cover as a card under them.
   * - cover: the cover first, the logo hanging over its lower edge.
   * - split: the tagline as a large headline beside the cover.
   */
  intro: "band" | "center" | "cover" | "split";
  /** Categories: photo circles, chips, tiles with a small photo, or text tabs. */
  nav: "circles" | "chips" | "tiles" | "tabs";
  /**
   * The product card.
   * - soft: a tinted block with the add button under the text.
   * - market: a white bordered card, price first, the add button under it.
   * - plain: no surface; a "+" on the photo's corner.
   * - spec: a dense bordered cell, the "+" beside the price.
   */
  card: "soft" | "market" | "plain" | "spec";
  /** Section titles: bold, the heading face large, small caps on a rule, or a marked tag. */
  head: "bold" | "serif" | "rule" | "marker";
  /** Card text and section titles are centred (Guldasta). */
  centered?: boolean;
  /** The name stands above the price on a plain card. */
  nameFirst?: boolean;
  /** Each home section sits in a card-coloured panel (Bozor). */
  panels?: boolean;
  /** Cards in one desktop row. */
  cols: 4 | 5 | 6;
};

export const SOHA_LOOKS: Record<SohaKey, SohaLook> = {
  // Oziq-ovqat do'koni: a dense market. Grey-green page, white shelf panels,
  // a dark green band with the search in it, price first.
  bozor: {
    scheme: "light",
    page: "#f2f4ef",
    accent: "green",
    corner: "soft",
    intro: "band",
    nav: "chips",
    card: "market",
    head: "bold",
    panels: true,
    cols: 6,
  },
  // Qurilish mollari: a site board. Black band over a hazard stripe, yellow
  // buttons with ink text, square corners, ruled cells.
  usta: {
    scheme: "light",
    page: "#ffffff",
    accent: "orange",
    corner: "square",
    intro: "band",
    nav: "tiles",
    card: "spec",
    head: "rule",
    cols: 5,
  },
  // Dorixona: clinical and calm. Cool mint page, white cards, teal.
  shifo: {
    scheme: "light",
    page: "#f3f8f7",
    accent: "teal",
    corner: "soft",
    intro: "center",
    nav: "chips",
    card: "market",
    head: "bold",
    cols: 5,
  },
  // Gul do'koni: a florist's card. Cream page, an arched cover, serif italics,
  // everything centred.
  guldasta: {
    scheme: "light",
    page: "#fbf7f1",
    accent: "green",
    corner: "round",
    intro: "cover",
    nav: "circles",
    card: "plain",
    head: "serif",
    centered: true,
    nameFirst: true,
    cols: 4,
  },
  // Kosmetika: soft. Blush page, pastel blocks in turn, round everything.
  mayin: {
    scheme: "light",
    page: "#fff5f0",
    accent: "rose",
    corner: "round",
    intro: "center",
    nav: "circles",
    card: "soft",
    head: "bold",
    cols: 5,
  },
  // Bolalar mahsulotlari: a toy box. Pale yellow dotted page, thick coloured
  // frames in turn, titles on tilted tags.
  oynoqi: {
    scheme: "light",
    page: "#fffbea",
    accent: "violet",
    corner: "round",
    intro: "center",
    nav: "tiles",
    card: "market",
    head: "marker",
    cols: 5,
  },
  // Telefon va elektronika: a showroom. White, pale grey tiles, a large tight
  // headline beside the cover.
  texno: {
    scheme: "light",
    page: "#ffffff",
    accent: "blue",
    corner: "round",
    intro: "split",
    nav: "chips",
    card: "plain",
    head: "bold",
    nameFirst: true,
    cols: 5,
  },
  // Xo'jalik mollari: a warm household shop. Cream page, a sand band, tiles.
  rozgor: {
    scheme: "light",
    page: "#fffaf2",
    accent: "orange",
    corner: "soft",
    intro: "band",
    nav: "tiles",
    card: "market",
    head: "marker",
    cols: 5,
  },
  // Kitob do'koni: a book page. Paper ground, a serif throughout, text tabs.
  kitob: {
    scheme: "light",
    page: "#f8f2e6",
    accent: "red",
    corner: "soft",
    intro: "split",
    nav: "tabs",
    card: "plain",
    head: "serif",
    nameFirst: true,
    cols: 5,
  },
  // Sport mahsulotlari: speed. Slanted italic caps, black band, a lime spot.
  marafon: {
    scheme: "light",
    page: "#ffffff",
    accent: "red",
    corner: "square",
    intro: "band",
    nav: "chips",
    card: "plain",
    head: "rule",
    cols: 5,
  },
  // Sovg'alar: wrapped by hand. Cream page, handwritten titles, stitched
  // (dashed) frames, price tags.
  tuhfa: {
    scheme: "light",
    page: "#fdf6ec",
    accent: "red",
    corner: "round",
    intro: "center",
    nav: "circles",
    card: "soft",
    head: "marker",
    centered: true,
    cols: 4,
  },
  // Mebel: a quiet showroom. Greige page, light large type, square photos with
  // room around them, ink buttons.
  uy: {
    scheme: "light",
    page: "#f6f3ee",
    accent: "graphite",
    corner: "square",
    intro: "split",
    nav: "tabs",
    card: "plain",
    head: "serif",
    nameFirst: true,
    cols: 4,
  },
  // Avto ehtiyot qismlar: a workshop at night. Carbon page, condensed caps,
  // dense cells, orange.
  garaj: {
    scheme: "dark",
    page: "#111315",
    accent: "orange",
    corner: "soft",
    intro: "band",
    nav: "tiles",
    card: "spec",
    head: "rule",
    cols: 6,
  },
  // Kanselyariya: a school notebook. Squared paper, ink frames, titles under a
  // yellow highlighter.
  daftar: {
    scheme: "light",
    page: "#fbfbf6",
    accent: "blue",
    corner: "soft",
    intro: "center",
    nav: "chips",
    card: "market",
    head: "marker",
    cols: 5,
  },
};
