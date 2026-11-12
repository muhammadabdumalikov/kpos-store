"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { usePrice } from "@/hooks/usePrice";
import { normalizeFulfillment } from "@/lib/fulfillment";
import type { StoreInfo } from "@/lib/store-api";
import { StoreIcon, TruckIcon } from "./icons/DeliveryIcons";

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

/**
 * The top of the home page: the shop's name as the page title and, under it,
 * how this shop hands orders over. This is what a shopper needs before the
 * first tap.
 */
export function StoreIntro({ info }: { info: StoreInfo | null }) {
  const { t } = useTranslations();
  const lines = useFulfilmentLines(info);
  if (!info?.name) return null;

  return (
    <section
      aria-labelledby="store-title"
      className="mx-auto max-w-7xl px-4 pb-2 pt-5 lg:pb-0 lg:pt-6"
    >
      <div>
        {/* Desktop: the header already carries the shop name, so it is not
            repeated; the title stays for assistive tech. */}
        <h1
          id="store-title"
          className="line-clamp-2 break-words text-[26px] font-extrabold leading-[32px] tracking-[-0.02em] text-gray-900 dark:text-white lg:sr-only"
        >
          {info.name}
        </h1>
        {lines.length > 0 && (
          <ul
            aria-label={t("home.fulfilmentAria")}
            className="mt-2.5 flex flex-col gap-1.5 lg:mt-0 lg:flex-row lg:flex-wrap lg:gap-x-10 lg:gap-y-2 lg:rounded-[20px] lg:bg-gray-900/[0.035] lg:px-6 lg:py-4 dark:lg:bg-white/[0.04]"
          >
            {lines.map((l) => (
              <li
                key={l.key}
                className="flex min-w-0 items-start gap-2 text-[14px] font-medium leading-5 text-gray-500 dark:text-gray-400"
              >
                <span className="mt-px shrink-0 text-gray-400 dark:text-gray-500">{l.icon}</span>
                <span className="min-w-0">
                  <span className="font-semibold text-gray-900 dark:text-white">{l.label}</span>
                  {l.detail && (
                    <>
                      <span aria-hidden> · </span>
                      <span className="tabular-nums">{l.detail}</span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
