import { stockOf } from "./stock";

// Which product a theme lifts above the home page grid: Tungi's hero card,
// Afisha's featured block. Only from the shop's own flags, never invented:
// a theme that finds no product to lift shows no such block.

type Pickable = {
  id: string;
  image?: string;
  quantity: number;
  preorder?: boolean;
  oldPrice?: number | null;
  isNew?: boolean;
  popular?: boolean;
};

const showable = (p: Pickable) => Boolean(p.image) && !stockOf(p.quantity, p.preorder).soldOut;

/** Tungi: a new arrival with a photo; null sends the hero to the shop's cover. */
export function pickNewArrival<T extends Pickable>(products: T[]): T | null {
  return products.find((p) => showable(p) && p.isNew) ?? null;
}

/** Tungi without a new arrival or a cover: the popular product, else the first with a photo. */
export function pickAnyHero<T extends Pickable>(products: T[]): T | null {
  return products.find((p) => showable(p) && p.popular) ?? products.find(showable) ?? null;
}

/** Afisha: the popular product, else one marked down, else a new arrival. */
export function pickFeatured<T extends Pickable>(products: T[]): T | null {
  return (
    products.find((p) => showable(p) && p.popular) ??
    products.find((p) => showable(p) && p.oldPrice) ??
    products.find((p) => showable(p) && p.isNew) ??
    null
  );
}
