// The shop's accent colour (Settings → Online store → "Do'kon ko'rinishi").
//
// Each key is a full brand scale, so every `brand-*` utility keeps working:
// Tailwind compiles `bg-brand-500` to `var(--color-brand-500)`, and the root
// layout overrides those variables for the shop being served. No accent (null)
// emits nothing: the KPOS blue from `@theme` in app/globals.css stays.
//
// This file is the source of truth for the palette. The dashboard keeps a copy
// of each key's main shade for its swatches (pimpo-nextjs
// `src/lib/storeAccent.ts`); change them together.
//
// Contrast rule: white text sits on 500 (buttons, the cart pill, the "+" on a
// card) and on 600 (their hover), so both must reach 4.5:1 against #ffffff.
// The ratios in the comments are WCAG 2.x contrast, computed, not estimated;
// `text-brand-500` on a white page has the same ratio. 300 and 400 are only
// ever text on the dark theme (`dark:text-brand-400`), so they stay light.

export const STORE_ACCENTS = ["blue", "violet", "rose", "red", "orange", "green", "teal", "graphite"] as const;
export type StoreAccent = (typeof STORE_ACCENTS)[number];

const STEPS = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
type Step = (typeof STEPS)[number];
type Scale = Record<Step, string>;

const SCALES: Record<StoreAccent, Scale> = {
  // Azure, clearly apart from the default KPOS indigo-blue.
  blue: {
    25: "#f5faff",
    50: "#eff8ff",
    100: "#d1e9ff",
    200: "#b2ddff",
    300: "#84caff",
    400: "#53b1fd",
    500: "#0b6fd9", // white on it: 4.90:1
    600: "#0a5cb8", // 6.49:1
    700: "#0b4a93",
    800: "#0d3f7a",
    900: "#0f3563",
    950: "#0a2140",
  },
  violet: {
    25: "#fbfaff",
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#7c3aed", // white on it: 5.70:1
    600: "#6d28d9", // 7.10:1
    700: "#5b21b6",
    800: "#4c1d95",
    900: "#3b1a78",
    950: "#2e1065",
  },
  rose: {
    25: "#fff7f8",
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#e11d48", // white on it: 4.70:1
    600: "#be123c", // 6.29:1
    700: "#9f1239",
    800: "#881337",
    900: "#6b0f2b",
    950: "#4c0519",
  },
  red: {
    25: "#fffafa",
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#dc2626", // white on it: 4.83:1
    600: "#b91c1c", // 6.47:1
    700: "#991b1b",
    800: "#7f1d1d",
    900: "#651818",
    950: "#450a0a",
  },
  // A deep burnt orange: a bright one cannot carry white text.
  orange: {
    25: "#fffbf7",
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#c2410c", // white on it: 5.18:1
    600: "#9a3412", // 7.31:1
    700: "#7c2d12",
    800: "#65260f",
    900: "#521f0d",
    950: "#431407",
  },
  green: {
    25: "#f6fef9",
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#15803d", // white on it: 5.02:1
    600: "#166534", // 7.13:1
    700: "#14532d",
    800: "#114426",
    900: "#0d381f",
    950: "#052e16",
  },
  teal: {
    25: "#f6fefc",
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#0f766e", // white on it: 5.47:1
    600: "#115e59", // 7.58:1
    700: "#134e4a",
    800: "#113f3c",
    900: "#0e3331",
    950: "#042f2e",
  },
  // A near-black neutral.
  graphite: {
    25: "#fcfcfd",
    50: "#f2f4f7",
    100: "#e4e7ec",
    200: "#d0d5dd",
    300: "#98a2b3",
    400: "#667085",
    500: "#1d2939", // white on it: 14.70:1
    600: "#101828", // 17.75:1
    700: "#0c111d",
    800: "#0a0e18",
    900: "#080b12",
    950: "#05070c",
  },
};

// On the dark theme the page itself is #101828, so a near-black button would
// vanish into it. Graphite alone swaps to a slate there; the other accents
// read the same on both themes, as the default blue does.
const DARK_OVERRIDES: Partial<Record<StoreAccent, Partial<Scale>>> = {
  graphite: {
    300: "#e4e7ec",
    400: "#d0d5dd", // text on the dark page
    500: "#667085", // white on it: 4.97:1; 3.57:1 against the dark page
    600: "#5a6478", // 5.95:1
    700: "#475467",
  },
};

export function isStoreAccent(value: unknown): value is StoreAccent {
  return typeof value === "string" && (STORE_ACCENTS as readonly string[]).includes(value);
}

const declarations = (scale: Partial<Scale>) =>
  STEPS.filter((step) => scale[step])
    .map((step) => `--color-brand-${step}:${scale[step]}`)
    .join(";");

/**
 * The CSS that repaints the brand scale for one shop, or null to keep the
 * default. Meant for a `<style>` in the server-rendered `<head>`, so the first
 * paint already has the shop's colour. The text is built only from the table
 * above: an unknown key from the API yields null, never markup.
 */
export function storeAccentCss(accent: unknown): string | null {
  if (!isStoreAccent(accent)) return null;
  const dark = DARK_OVERRIDES[accent];
  return `:root{${declarations(SCALES[accent])}}` + (dark ? `:root.dark{${declarations(dark)}}` : "");
}
