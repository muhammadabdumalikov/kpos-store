"use client";

import type { SohaKey } from "@/lib/soha-looks";
import type { CardModel } from "../ProductCard";
import { SOHA_PARTS } from "./looks";

/**
 * The product card of a trade theme (lib/soha-looks): the same facts, label
 * rules and controls as the default card, in the shape the theme draws.
 */
export function SohaCard({ theme, card }: { theme: SohaKey; card: CardModel }) {
  const { Card } = SOHA_PARTS[theme];
  return <Card card={card} />;
}
