"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";
import { normalizeFulfillment } from "@/lib/fulfillment";
import type { StoreInfo } from "@/lib/store-api";
import { useStoreInfo } from "@/lib/use-store-info";
import { StoreIcon } from "./icons/DeliveryIcons";

/**
 * Desktop footer: only what is real. The shop's name, where to collect an
 * order when the shop offers pickup, and a small platform credit. No contact
 * or social links: the store API does not expose any.
 */
export function DesktopFooter({ store }: { store?: StoreInfo | null }) {
  const { t } = useTranslations();
  const info = useStoreInfo(store);
  const f = info ? normalizeFulfillment(info) : null;
  const pickup =
    f?.pickupEnabled && (f.pickupBranchName || f.pickupAddress)
      ? [f.pickupBranchName, f.pickupAddress].filter(Boolean).join(", ")
      : null;

  return (
    <footer className="hidden border-t border-gray-900/[0.06] bg-white dark:border-white/[0.06] dark:bg-gray-900 lg:block">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-8 px-4 py-8">
        <div className="min-w-0">
          {info?.name && (
            <Link
              href="/"
              className="block max-w-[420px] truncate text-[18px] font-bold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-white/80"
            >
              {info.name}
            </Link>
          )}
          {pickup && (
            <p className="mt-2 flex max-w-[520px] items-start gap-2 text-[14px] font-medium text-gray-500 dark:text-gray-400">
              <StoreIcon className="mt-px h-[18px] w-[18px] shrink-0" />
              <span>
                <span className="text-gray-700 dark:text-gray-300">{t("cart.pickupAddressTitle")}:</span>{" "}
                {pickup}
              </span>
            </p>
          )}
        </div>
        <p className="shrink-0 pt-1 text-[13px] font-medium text-gray-400 dark:text-gray-500">
          {t("footer.poweredBy")}
        </p>
      </div>
    </footer>
  );
}
