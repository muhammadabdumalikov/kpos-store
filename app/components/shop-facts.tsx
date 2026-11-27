"use client";

import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { usePrice } from "@/hooks/usePrice";
import { normalizeFulfillment } from "@/lib/fulfillment";
import type { StoreInfo } from "@/lib/store-api";
import { StoreIcon, TruckIcon } from "./icons/DeliveryIcons";

// The shop's own facts, as every look of the storefront states them: how
// orders are handed over, the delivery terms in one line, and its pictures.

export type FulfilmentLine = { key: string; icon: React.ReactNode; label: string; detail: string | null };

/**
 * How this shop hands orders over: only what the shop has switched on, as
 * short factual lines. Shared by the home page intro and the product page.
 */
export function useFulfilmentLines(info: StoreInfo | null): FulfilmentLine[] {
  const { t } = useTranslations();
  const { format } = usePrice();
  if (!info) return [];

  const f = normalizeFulfillment(info);
  const lines: FulfilmentLine[] = [];

  if (f.pickupEnabled) {
    const where = [f.pickupBranchName, f.pickupAddress].filter(Boolean).join(", ");
    lines.push({
      key: "pickup",
      icon: <StoreIcon className="h-[18px] w-[18px]" />,
      label: t("home.pickup"),
      detail: where || null,
    });
  }
  if (f.deliveryEnabled) {
    const parts: string[] = [];
    if (f.deliveryFee === 0) {
      parts.push(t("home.deliveryFree"));
    } else {
      parts.push(format(f.deliveryFee));
      if (f.freeDeliveryFrom !== null)
        parts.push(t("home.freeFrom").replace("{amount}", format(f.freeDeliveryFrom)));
    }
    if (f.minDeliveryAmount !== null)
      parts.push(t("home.minOrder").replace("{min}", format(f.minDeliveryAmount)));
    lines.push({
      key: "delivery",
      icon: <TruckIcon className="h-[18px] w-[18px]" />,
      label: t("home.delivery"),
      detail: parts.join(", "),
    });
  }
  return lines;
}

/** A shop picture that may fail to load; a broken one renders nothing. */
export function useShopImage(src: string | null | undefined) {
  const [broken, setBroken] = useState(false);
  return { url: src && !broken ? src : null, onError: () => setBroken(true) };
}

/**
 * The delivery terms as one short line for a strip or a row: "500 000 so'mdan
 * bepul yetkazamiz", else the fee, else where to pick an order up. Null when
 * the shop switched both ways off.
 */
export function useDeliveryLine(info: StoreInfo | null): string | null {
  const { t } = useTranslations();
  const { format } = usePrice();
  if (!info) return null;
  const f = normalizeFulfillment(info);
  if (f.deliveryEnabled) {
    if (f.deliveryFee === 0) return t("home.shipFree");
    if (f.freeDeliveryFrom !== null) return t("home.shipFreeFrom").replace("{amount}", format(f.freeDeliveryFrom));
    return t("home.shipFee").replace("{amount}", format(f.deliveryFee));
  }
  if (f.pickupEnabled) {
    const where = [f.pickupBranchName, f.pickupAddress].filter(Boolean).join(", ");
    return where ? t("home.pickupAt").replace("{where}", where) : t("home.pickup");
  }
  return null;
}

/** The delivery terms as one line with the truck; nothing when there are none. */
export function DeliveryLine({ info, className = "", iconClass = "h-[18px] w-[18px]" }: { info: StoreInfo | null; className?: string; iconClass?: string }) {
  const line = useDeliveryLine(info);
  if (!line) return null;
  return (
    <p className={`flex min-w-0 items-center gap-2 ${className}`}>
      <TruckIcon className={`shrink-0 ${iconClass}`} />
      <span className="min-w-0 truncate">{line}</span>
    </p>
  );
}
