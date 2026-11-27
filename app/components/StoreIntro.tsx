"use client";

import type { StoreInfo } from "@/lib/store-api";
import { DeliveryLine, useDeliveryLine, useShopImage } from "./shop-facts";

/**
 * The top of the home page in the default look: a thin strip in the shop's
 * accent with its delivery terms, then the logo, the name as the page title
 * and the shop's own line under it. How orders are handed over and where to
 * reach the shop close the page (ShopAbout); the cover follows the search bar
 * (StoreCover).
 */
export function StoreIntro({ info }: { info: StoreInfo | null }) {
  const logo = useShopImage(info?.logo);
  const delivery = useDeliveryLine(info);
  if (!info?.name) return null;

  const tagline = info.tagline?.trim() || null;
  // Desktop: the header already carries the shop name, so a shop with no face
  // does not repeat it; one with a logo or a tagline shows it as a title.
  const branded = Boolean(logo.url || tagline);

  return (
    <section aria-labelledby="store-title">
      {delivery && (
        <DeliveryLine
          info={info}
          className="min-h-8 justify-center bg-primary px-4 py-1.5 text-[13px] font-semibold leading-5 text-on-primary"
          iconClass="h-[17px] w-[17px]"
        />
      )}
      <div className={`mx-auto flex max-w-7xl items-center gap-3.5 px-4 pt-4 lg:gap-5 lg:pt-7 ${branded ? "" : "lg:hidden"}`}>
        {logo.url && (
          // Plain <img>: shop pictures come from whatever host the shop's
          // storage uses, and next/image throws on hosts missing from config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo.url}
            alt=""
            decoding="async"
            onError={logo.onError}
            className="h-14 w-14 shrink-0 rounded-full bg-white object-cover ring-1 ring-gray-900/[0.06] lg:h-[72px] lg:w-[72px]"
          />
        )}
        <div className="min-w-0">
          <h1
            id="store-title"
            className="line-clamp-2 break-words text-[24px] font-extrabold leading-[30px] tracking-[-0.02em] text-gray-900 dark:text-white lg:text-[30px] lg:leading-9"
          >
            {info.name}
          </h1>
          {tagline && (
            <p className="mt-0.5 break-words text-[14px] font-medium leading-5 text-gray-500 dark:text-gray-400 lg:text-[15px] lg:leading-[22px]">
              {tagline}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** The shop's cover as a plain rounded picture under the search bar; no words on it. */
export function StoreCover({ info }: { info: StoreInfo | null }) {
  const cover = useShopImage(info?.cover);
  if (!cover.url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cover.url}
      alt=""
      decoding="async"
      fetchPriority="high"
      onError={cover.onError}
      className="mt-1 aspect-[358/190] w-full rounded-[16px] bg-gray-900/[0.035] object-cover lg:mt-6 lg:aspect-[4/1] lg:rounded-[28px]"
    />
  );
}
