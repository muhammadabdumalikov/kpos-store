// The shop's storefront theme (Settings → Online store → "Do'kon ko'rinishi").
//
// A theme is a ready-made look: fonts, page colours, corners and the shape of
// a few blocks (home top, categories, product card, cart bar). The owner's
// accent colour and card photo shape are separate settings and work inside
// every theme. "default" is the storefront as it always was.
//
// The root layout reads the key on the server and puts it on <html> as
// `data-theme`, so the first paint is already themed; app/globals.css holds
// each theme's tokens, and client components read it with `useStoreTheme()`.

export const STORE_THEMES = ["default", "jurnal", "afisha", "tungi"] as const;
export type StoreTheme = (typeof STORE_THEMES)[number];

/** Missing (an older backend) or unknown keys are the default look. */
export function normalizeStoreTheme(value: unknown): StoreTheme {
  return typeof value === "string" && (STORE_THEMES as readonly string[]).includes(value)
    ? (value as StoreTheme)
    : "default";
}

/**
 * A themed shop has one colour scheme, chosen with the theme: Tungi is a night
 * theme, Jurnal and Afisha are paper. Only the default look keeps the
 * shopper's light/dark toggle.
 */
export function themeScheme(theme: StoreTheme): "light" | "dark" | null {
  if (theme === "tungi") return "dark";
  if (theme === "default") return null;
  return "light";
}
