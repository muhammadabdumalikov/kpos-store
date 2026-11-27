import type { SohaLook } from "@/lib/soha-looks";

// Class strings a trade theme's pages share (home, catalogue, related products).

const PHONE = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" } as const;
const WIDE = {
  3: "md:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-3 lg:grid-cols-4",
  5: "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  6: "sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
} as const;

/** The columns of a trade theme's product grid; the theme adds its own gaps. */
export function sohaCols(look: SohaLook): string {
  return `grid ${PHONE[look.phoneCols]} ${WIDE[look.cols]}`;
}

/**
 * The product grid of a trade theme on the pages that are not its own
 * (catalogue, related products). `.soha-grid` lets the theme's CSS set the
 * gaps and rules its cards need (ruled cells, edge-to-edge tiles, list rows).
 */
export function sohaGrid(look: SohaLook): string {
  return `soha-grid ${sohaCols(look)} gap-x-3 gap-y-5 lg:gap-x-5 lg:gap-y-8`;
}
