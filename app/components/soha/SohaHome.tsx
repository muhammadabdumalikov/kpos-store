"use client";

import type { SohaKey } from "@/lib/soha-looks";
import { SOHA_PARTS } from "./looks";
import type { HomeProps } from "./parts";

/**
 * The home page body of a trade theme (lib/soha-looks): the same data and
 * rules as the default HomeContent, laid out by the theme's own Home part.
 */
export function SohaHome({ theme, ...props }: HomeProps & { theme: SohaKey }) {
  const { Home } = SOHA_PARTS[theme];
  return <Home {...props} />;
}
