"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { platformCreditUrl } from "@/lib/platform-credit";
import type { StoreInfo } from "@/lib/store-api";
import { useStoreInfo } from "@/lib/use-store-info";

/**
 * The small platform credit, as a link: on the desktop it sits in the footer,
 * on the phone — where nearly every shopper is — at the end of the page, above
 * the bottom bar. Quiet on purpose: this is the shop's page, not ours. It
 * opens in a new tab so the shopper's basket stays where it is.
 */
export function PlatformCredit({
  store,
  phone = false,
}: {
  store?: StoreInfo | null;
  /** The phone's end-of-page line (hidden on the desktop, which has the footer). */
  phone?: boolean;
}) {
  const { t } = useTranslations();
  const info = useStoreInfo(store);
  const link = (
    <a
      href={platformCreditUrl(info?.slug)}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-full font-medium text-gray-400 underline-offset-4 hover:text-gray-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:text-gray-500 dark:hover:text-gray-300 ${
        // A finger needs a taller target than the words themselves.
        phone ? "inline-flex min-h-11 items-center px-3 text-[13px]" : "text-[13px]"
      }`}
    >
      {t("footer.poweredBy")}
    </a>
  );
  if (!phone) return link;
  return <div className="mt-8 flex justify-center lg:hidden">{link}</div>;
}
