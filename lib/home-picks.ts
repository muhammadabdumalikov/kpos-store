import { stockOf } from "./stock";

// Which product a theme lifts above the home page grid: Tungi's hero card.
// Only from the shop's own flags, never invented: with no product to lift
// there is no such block.

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

/** Tungi: a new arrival with a photo. */
export function pickNewArrival<T extends Pickable>(products: T[]): T | null {
  return products.find((p) => showable(p) && p.isNew) ?? null;
}

/** Tungi without a new arrival: the popular product, else the first with a photo. */
export function pickAnyHero<T extends Pickable>(products: T[]): T | null {
  return products.find((p) => showable(p) && p.popular) ?? products.find(showable) ?? null;
}
