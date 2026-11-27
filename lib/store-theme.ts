// The shop's storefront theme (Settings → Online store → "Do'kon ko'rinishi").
//
// A theme is a ready-made look: fonts, page colours, corners and the shape of
// a few blocks (home top, categories, product card, cart bar). The owner's
// accent colour and card photo shape are separate settings and work inside
// every theme. "default" is the storefront as it always was.
//
// Two kinds of theme:
// - Jurnal, Afisha and Tungi (clothes shops) are drawn by hand: each has its
//   own Tailwind variant (`jurnal:` …) and its own branches in the components.
//   `StoreTheme` names them, and it is what `useStoreTheme()` returns.
// - The trade themes (lib/soha-looks: Bozor, Usta, Mayin …) are put together
//   from shared parts: a token block in app/globals.css plus a choice of intro,
//   category row, card and section title. To the hand-drawn branches such a
//   shop is "default"; the parts that differ read `useSohaLook()`.
//
// The root layout reads the key on the server and puts it on <html> as
// `data-theme`, so the first paint is already themed.

import { SOHA_LOOKS, isSohaKey, type SohaKey } from "./soha-looks";

export const STORE_THEMES = ["default", "jurnal", "afisha", "tungi"] as const;
export type StoreTheme = (typeof STORE_THEMES)[number];

/** Missing (an older backend), unknown and trade-theme keys are the default look. */
export function normalizeStoreTheme(value: unknown): StoreTheme {
  return typeof value === "string" && (STORE_THEMES as readonly string[]).includes(value)
    ? (value as StoreTheme)
    : "default";
}

/** The shop's trade theme, when its key is one. */
export function normalizeSohaKey(value: unknown): SohaKey | null {
  return isSohaKey(value) ? value : null;
}

/**
 * A themed shop has one colour scheme, chosen with the theme: Tungi and Garaj
 * are night themes, the rest are paper. Only the default look keeps the
 * shopper's light/dark toggle.
 */
export function themeScheme(theme: StoreTheme, soha: SohaKey | null = null): "light" | "dark" | null {
  if (soha) return SOHA_LOOKS[soha].scheme;
  if (theme === "tungi") return "dark";
  if (theme === "default") return null;
  return "light";
}
