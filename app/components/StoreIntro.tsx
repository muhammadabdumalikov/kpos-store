"use client";

import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { usePrice } from "@/hooks/usePrice";
import { normalizeFulfillment } from "@/lib/fulfillment";
import type { StoreInfo } from "@/lib/store-api";
import { storeContacts, type StoreContact } from "@/lib/store-contacts";
import { onOrderLabel } from "@/lib/stock";
import { ClockIcon, PhoneIcon, StoreIcon, TruckIcon } from "./icons/DeliveryIcons";
import { InstagramIcon, TelegramIcon } from "./icons/ShopIcons";

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
 * A shop picture that may fail to load: the cover or the logo. A broken one
 * renders nothing, so the intro falls back to the plain layout.
 */
function useShopImage(src: string | null | undefined) {
  const [broken, setBroken] = useState(false);
  const url = src && !broken ? src : null;
  return { url, onError: () => setBroken(true) };
}

/**
 * The top of the home page, the shop's face: its cover across the top, the
 * logo, the name as the page title with the shop's own line under it, how it
 * hands orders over, and where to reach it. Everything but the name is
 * optional; a shop that set nothing gets the name and the handover lines.
 */
export function StoreIntro({
  info,
  orderLead = null,
}: {
  info: StoreInfo | null;
  /** Set when everything on sale comes on order with this one lead time
   *  ("" when the shop gave none): said here once instead of on every card. */
  orderLead?: string | null;
}) {
  const { t } = useTranslations();
  const handover = useFulfilmentLines(info);
  const lines: FulfilmentLine[] =
    orderLead === null
      ? handover
      : [
          ...handover,
          {
            key: "on-order",
            icon: <ClockIcon className="h-[18px] w-[18px]" />,
            label: onOrderLabel(t("preorder.label"), orderLead),
            detail: null,
          },
        ];
  const cover = useShopImage(info?.cover);
  const logo = useShopImage(info?.logo);
  if (!info?.name) return null;

  const tagline = info.tagline?.trim() || null;
  const contacts = storeContacts(info);
  // Desktop: the header already carries the shop name, so a shop with no face
  // does not repeat it; one with a logo, cover or tagline shows it as a title.
  const branded = Boolean(cover.url || logo.url || tagline);

  const logoImg = logo.url && (
    // Plain <img>: shop pictures come from whatever host the shop's storage
    // uses, and next/image throws on hosts missing from config.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.url}
      alt=""
      decoding="async"
      onError={logo.onError}
      className={`shrink-0 rounded-full bg-white object-cover ${
        cover.url
          ? "relative -mt-10 h-20 w-20 ring-4 ring-white dark:ring-gray-900 lg:-mt-12 lg:h-24 lg:w-24"
          : "h-16 w-16 ring-1 ring-gray-900/[0.06] lg:h-[72px] lg:w-[72px]"
      }`}
    />
  );

  const title = (
    <div className="min-w-0">
      <h1
        id="store-title"
        className={`line-clamp-2 break-words text-[26px] font-extrabold leading-[32px] tracking-[-0.02em] text-gray-900 dark:text-white ${
          branded ? "lg:text-[30px] lg:leading-9" : "lg:sr-only"
        }`}
      >
        {info.name}
      </h1>
      {tagline && (
        <p className="mt-1 break-words text-[15px] font-medium leading-[22px] text-gray-600 dark:text-gray-300">
          {tagline}
        </p>
      )}
    </div>
  );

  // Phone: round icon buttons, so three contacts take one short row (beside
  // the logo when there is a cover). Wide screens have room for the names.
  const contactList = (className: string) =>
    contacts.length > 0 && (
      <ul aria-label={t("home.contactsAria")} className={`flex flex-wrap gap-2 ${className}`}>
        {contacts.map((c) => (
          <li key={c.key}>
            <ContactPill contact={c} />
          </li>
        ))}
      </ul>
    );
  const contactsBesideLogo = Boolean(cover.url && logo.url);

  return (
    <section aria-labelledby="store-title" className="mx-auto max-w-7xl lg:px-4 lg:pt-6">
      {cover.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.url}
          alt=""
          decoding="async"
          fetchPriority="high"
          onError={cover.onError}
          className="aspect-[3/1] w-full bg-gray-900/[0.035] object-cover lg:aspect-[4/1] lg:rounded-[28px]"
        />
      )}

      <div className={`px-4 pb-2 lg:px-0 lg:pb-0 ${cover.url ? "" : "pt-5 lg:pt-0"} ${cover.url && !logo.url ? "pt-4" : ""}`}>
        {/* With a cover the logo hangs over its lower edge and the name sits
            under it; without one the logo stands beside the name. */}
        {cover.url ? (
          <div className={logo.url ? "lg:flex lg:items-end lg:gap-5 lg:px-6" : "lg:px-1"}>
            {logo.url ? (
              <div className="flex items-end justify-between gap-3 lg:block">
                {logoImg}
                {contactList("mt-2 justify-end lg:hidden")}
              </div>
            ) : null}
            <div className={logo.url ? "mt-2.5 min-w-0 lg:mt-0 lg:pb-1" : ""}>{title}</div>
          </div>
        ) : (
          <div className="flex items-center gap-3.5 lg:gap-5">
            {logoImg}
            {title}
          </div>
        )}

        {lines.length > 0 && (
          <ul
            aria-label={t("home.fulfilmentAria")}
            className={`flex flex-wrap gap-x-3.5 gap-y-1.5 lg:gap-x-10 lg:gap-y-2 lg:rounded-[20px] lg:bg-gray-900/[0.035] lg:px-6 lg:py-4 dark:lg:bg-white/[0.04] ${
              branded ? "mt-3 lg:mt-5" : "mt-2.5 lg:mt-0"
            }`}
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

        {contactList(`mt-3.5 lg:mt-4 ${contactsBesideLogo ? "max-lg:hidden" : ""}`)}
      </div>
    </section>
  );
}

/** One way to reach the shop: its Instagram, its Telegram, or a call. */
function ContactPill({ contact }: { contact: StoreContact }) {
  const { t } = useTranslations();
  const icon = "h-5 w-5 shrink-0 lg:h-[18px] lg:w-[18px]";
  const external = contact.key !== "phone";
  const name = contact.key === "instagram" ? "Instagram" : contact.key === "telegram" ? "Telegram" : t("home.call");
  return (
    <a
      href={contact.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={name}
      className="flex h-11 w-11 items-center justify-center gap-2 rounded-full bg-gray-900/[0.05] text-[14px] font-semibold text-gray-900 transition-[background-color,transform] duration-100 hover:bg-gray-900/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 motion-safe:active:scale-[0.97] dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.11] lg:w-auto lg:justify-start lg:pl-3.5 lg:pr-4"
    >
      {contact.key === "instagram" ? (
        <InstagramIcon className={icon} />
      ) : contact.key === "telegram" ? (
        <TelegramIcon className={icon} />
      ) : (
        <PhoneIcon className={icon} />
      )}
      <span className="max-lg:hidden">{name}</span>
    </a>
  );
}
