import type { SohaLook } from "@/lib/soha-looks";

// Class strings a trade theme's pages share (home, catalogue, related products).

/** Cards with a surface of their own sit closer together than bare photos. */
const boxed = (look: SohaLook) => look.card !== "plain";

/** The product grid of a trade theme. */
export function sohaGrid(look: SohaLook): string {
  if (look.cols === 6) return "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-3";
  if (look.cols === 4)
    return boxed(look)
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5"
      : "grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-12";
  return boxed(look)
    ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4"
    : "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-9";
}

/** A category's shelf: swiped on a phone, one row of the grid on a wide screen. */
export function sohaShelf(look: SohaLook): { list: string; item: string } {
  const cols = look.cols === 6 ? "lg:grid-cols-6 lg:gap-3" : look.cols === 4 ? "lg:grid-cols-4 lg:gap-5" : "lg:grid-cols-5 lg:gap-4";
  return {
    list: `no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0 ${cols}`,
    item: "w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[23%] lg:w-auto",
  };
}
