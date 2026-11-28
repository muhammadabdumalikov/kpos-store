"use client";

import type { StoreInfo } from "@/lib/store-api";
import { useShopImage } from "./shop-facts";

/** Whether the shop said its logo already spells its name (and has one). */
export function isLogoOnly(info: StoreInfo | null | undefined): boolean {
  return Boolean(info?.logoOnly && info.logo);
}

/**
 * The shop's mark where a header names the shop: its name, or — when the
 * owner said the logo already spells the name — the logo alone, with the name
 * as its alt text. A logo that fails to load falls back to the name.
 */
export function ShopMark({
  info,
  logoClassName,
  className = "truncate",
}: {
  info: StoreInfo | null | undefined;
  /** Height and limits of the logo; it keeps its own proportions. */
  logoClassName: string;
  /** Classes of the name when it is shown as text. */
  className?: string;
}) {
  const logo = useShopImage(isLogoOnly(info) ? info?.logo : null);
  if (logo.url) {
    return (
      // Plain <img>: shop pictures come from whatever host the shop's storage uses.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.url}
        alt={info?.name ?? ""}
        decoding="async"
        onError={logo.onError}
        className={`block w-auto shrink-0 object-contain ${logoClassName}`}
      />
    );
  }
  return <span className={className}>{info?.name}</span>;
}
