"use client";

import { useTranslations } from "@/hooks/useTranslations";

const block = "bg-gray-900/[0.05] dark:bg-white/[0.06]";

/**
 * The product page's own shape while it loads: the photo (edge to edge on the
 * phone), category, name, price and the add pill, in the same places and sizes, so
 * nothing jumps when the page arrives. Pulses only when motion is welcome.
 */
export function ProductSkeleton() {
  const { t } = useTranslations();
  return (
    <div className="motion-safe:animate-pulse">
      <p className="sr-only" role="status">
        {t("common.loading")}
      </p>
      <div aria-hidden>
        <div className="hidden pt-5 lg:block">
          <div className={`h-11 w-24 rounded-full ${block} opacity-60`} />
        </div>
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 md:items-start md:pt-4 lg:mt-3 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] lg:gap-x-14 lg:pt-0">
          <div className={`-mx-4 aspect-square md:mx-0 md:rounded-[28px] ${block}`} />
          <div className="min-w-0 pt-4 md:pt-0 lg:pt-2">
            <div className="flex h-11 items-center -my-1.5">
              <div className={`h-8 w-32 rounded-full ${block}`} />
            </div>
            <div className={`mt-3 h-6 w-11/12 rounded-lg ${block} lg:h-8`} />
            <div className={`mt-2 h-6 w-3/5 rounded-lg ${block} lg:h-8`} />
            <div className={`mt-4 h-8 w-40 rounded-lg ${block} lg:mt-5 lg:h-10 lg:w-52`} />
            <div className={`mt-5 h-[52px] w-full rounded-full ${block} lg:mt-7 lg:max-w-[440px]`} />
          </div>
        </div>
      </div>
    </div>
  );
}
