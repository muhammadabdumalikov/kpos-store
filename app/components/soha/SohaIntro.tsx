"use client";

import { useSohaLook } from "@/context/StoreThemeContext";
import type { StoreInfo } from "@/lib/store-api";
import { SOHA_PARTS } from "./looks";

// The top of the home page in a trade theme (lib/soha-looks). Each theme draws
// its own (app/components/soha/looks); these two only pick it.

type Props = {
  info: StoreInfo | null;
  /** Set when everything on sale comes on order with this one lead time. */
  orderLead?: string | null;
};

/** Above the phone's search bar: the shop's name and what the theme opens with. */
export function SohaIntro({ info, orderLead = null }: Props) {
  const look = useSohaLook();
  if (!look || !info?.name) return null;
  const { Intro } = SOHA_PARTS[look.key];
  return <Intro info={info} orderLead={orderLead} />;
}

/** Under the search bar, the first block of <main>: the cover, the tagline, the delivery line. */
export function SohaAfterBar({ info, orderLead = null }: Props) {
  const look = useSohaLook();
  if (!look || !info?.name) return null;
  const { AfterBar } = SOHA_PARTS[look.key];
  return AfterBar ? <AfterBar info={info} orderLead={orderLead} /> : null;
}
