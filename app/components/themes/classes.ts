import type { StoreTheme } from "@/lib/store-theme";

// Class strings the themes share across pages. The default look keeps its own
// strings in each component, untouched; these are only used when a theme is set.

/**
 * Added to a page's h1: Jurnal sets it in its serif, Afisha in poster caps;
 * Tungi and the default keep the body face. Sizes stay the page's own.
 */
export const themedTitle =
  "jurnal:font-head jurnal:font-medium jurnal:tracking-normal afisha:font-head afisha:font-extrabold afisha:uppercase afisha:tracking-[-0.02em]";

/** Letter-spaced small caps: Jurnal's labels and links. */
export const jurnalCaps = "text-[11px] font-medium uppercase leading-4 tracking-[0.18em]";

/** Mono bold caps: Afisha's labels, strips and cells. */
export const afishaCaps = "text-[11px] font-bold uppercase leading-4 tracking-[0.1em]";

/** The product grid for a themed shop (home, catalogue, related products). */
export function themedGrid(theme: StoreTheme): string {
  switch (theme) {
    case "jurnal":
      return "grid grid-cols-2 gap-x-3 gap-y-[22px] sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12";
    case "afisha":
      // Ruled: each card draws its right and bottom rule, the grid the left on
      // a wide screen (boxed there; edge to edge on a phone). The rule above
      // is the title strip's, or the page adds `border-t`.
      return "-mx-4 grid grid-cols-2 border-gray-900 sm:grid-cols-3 md:grid-cols-4 lg:mx-0 lg:border-l";
    case "tungi":
      return "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4";
    default:
      return "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-8";
  }
}

/** How many cards one desktop row of the theme's grid holds. */
export function themedRow(theme: StoreTheme): number {
  return theme === "jurnal" || theme === "afisha" ? 4 : 5;
}
