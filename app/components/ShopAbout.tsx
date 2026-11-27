"use client";
/* eslint-disable @next/next/no-img-element -- shop pictures come from whatever host the shop's storage uses */

import { useStoreTheme } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { formatPhone } from "@/lib/format";
import type { StoreInfo } from "@/lib/store-api";
import type { StoreTheme } from "@/lib/store-theme";
import { PhoneIcon, StoreIcon, TruckIcon } from "./icons/DeliveryIcons";
import { InstagramIcon, TelegramIcon } from "./icons/ShopIcons";
import { useShopFace } from "./soha/parts";
import { afishaCaps, jurnalCaps } from "./themes/classes";

// "Do'kon haqida": how the shop hands orders over and where to reach it. It
// closes the home page of the default look and of Jurnal, Afisha and Tungi,
// so the top of the page is the shop's name and its goods and not a list of
// terms. (A trade theme has its own: soha/parts SohaAbout.)

const LOOK: Record<StoreTheme, { wrap: string; title: string; row: string; label: string; detail: string; icon: string; links: string; link: string }> = {
  default: {
    wrap: "mt-10 border-t border-gray-900/[0.08] pt-6 dark:border-white/[0.08] lg:mt-14 lg:pt-9",
    title: "text-[20px] font-bold leading-7 tracking-[-0.01em] text-gray-900 dark:text-white lg:text-[22px]",
    row: "flex gap-3 border-b border-gray-900/[0.06] py-3 dark:border-white/[0.06] lg:border-b-0",
    label: "block text-[14px] font-semibold leading-5 text-gray-900 dark:text-white",
    detail: "block break-words text-[13px] leading-[18px] text-gray-500 dark:text-gray-400",
    icon: "mt-0.5 shrink-0 text-gray-400 dark:text-gray-500",
    links: "mt-4 grid grid-cols-2 gap-2 lg:flex lg:gap-3",
    link: "flex h-11 items-center justify-center gap-2 rounded-full bg-gray-900/[0.05] px-5 text-[14px] font-semibold text-gray-900 transition-colors hover:bg-gray-900/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.11]",
  },
  jurnal: {
    wrap: "mt-12 border-t border-gray-200 pt-8 lg:mt-20 lg:pt-12",
    title: "font-head text-[30px] font-normal leading-none text-gray-900 lg:text-[40px]",
    row: "border-b border-gray-200 py-4 lg:border-b-0",
    label: `block ${jurnalCaps} text-gray-500`,
    detail: "mt-1 block break-words text-[14px] leading-5 text-gray-900",
    icon: "hidden",
    links: "mt-2 flex flex-wrap gap-x-6",
    link: `inline-flex h-11 items-center border-b border-transparent ${jurnalCaps} text-gray-900 underline decoration-gray-900 underline-offset-[6px] outline-none focus-visible:ring-2 focus-visible:ring-gray-900 [&>svg]:hidden`,
  },
  afisha: {
    wrap: "-mx-4 mt-6 border-t border-gray-900 lg:mx-0 lg:mt-10 lg:border-x",
    title: `${afishaCaps} border-b border-gray-900 px-4 py-3 text-gray-900`,
    row: "border-b border-gray-900 px-4 py-3",
    label: `block ${afishaCaps} text-gray-500`,
    detail: "mt-1 block break-words text-[13px] font-medium leading-5 text-gray-900",
    icon: "hidden",
    links: "flex border-b border-gray-900",
    link: `flex h-11 min-w-0 flex-1 items-center justify-center gap-2 px-2 ${afishaCaps} text-gray-900 outline-none transition-colors hover:bg-gray-900 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900`,
  },
  tungi: {
    wrap: "mt-10 rounded-[24px] bg-gray-800 p-4 lg:mt-14 lg:p-8",
    title: "text-[22px] font-extrabold leading-7 tracking-[-0.01em] text-white",
    row: "flex gap-3 border-b border-white/[0.06] py-3 lg:border-b-0",
    label: "block text-[14px] font-bold leading-5 text-white",
    detail: "block break-words text-[13px] leading-[18px] text-gray-400",
    icon: "mt-0.5 shrink-0 text-gray-400",
    links: "mt-4 grid grid-cols-2 gap-2 lg:flex lg:gap-3",
    link: "flex h-11 items-center justify-center gap-2 rounded-full bg-gray-700 px-5 text-[14px] font-bold text-white transition-colors hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
  },
};

export function ShopAbout({ info, orderLead = null }: { info: StoreInfo | null; orderLead?: string | null }) {
  const { t } = useTranslations();
  const theme = useStoreTheme();
  const face = useShopFace(info, orderLead);
  if (!info) return null;
  const phone = info.contacts?.phone?.trim() ? formatPhone(info.contacts.phone) : null;
  const call = face.contacts.find((c) => c.key === "phone") ?? null;
  const links = face.contacts.filter((c) => c.key !== "phone");
  if (face.facts.length === 0 && links.length === 0 && !call) return null;
  const look = LOOK[theme];
  // Tungi keeps the cover for this block: its top is a product, not a photo of the shop.
  const cover = theme === "tungi" ? face.cover : null;

  return (
    <section aria-labelledby="home-about" className={look.wrap}>
      {cover?.url && (
        <img src={cover.url} alt="" loading="lazy" decoding="async" onError={cover.onError} className="mb-4 aspect-[5/2] w-full rounded-[18px] object-cover lg:aspect-[5/1]" />
      )}
      <h2 id="home-about" className={look.title}>
        {t("home.about")}
      </h2>
      <ul className={theme === "afisha" ? "lg:grid lg:grid-cols-3" : "mt-2 lg:mt-4 lg:grid lg:grid-cols-3 lg:gap-x-8"}>
        {face.facts.map((l) => (
          <li key={l.key} className={look.row}>
            <span className={look.icon}>{l.key === "pickup" ? <StoreIcon className="h-5 w-5" /> : l.key === "delivery" ? <TruckIcon className="h-5 w-5" /> : l.icon}</span>
            <span className="min-w-0">
              <span className={look.label}>{l.label}</span>
              {l.detail && <span className={`${look.detail} tabular-nums`}>{l.detail}</span>}
            </span>
          </li>
        ))}
        {call && phone && (
          <li className={look.row}>
            <span className={look.icon}>
              <PhoneIcon className="h-5 w-5" />
            </span>
            <a href={call.href} className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
              <span className={look.label}>{t("home.call")}</span>
              <span className={`${look.detail} tabular-nums`}>{phone}</span>
            </a>
          </li>
        )}
      </ul>
      {links.length > 0 && (
        <ul aria-label={t("home.contactsAria")} className={look.links}>
          {links.map((c) => (
            <li key={c.key} className={theme === "afisha" ? "flex min-w-0 flex-1 border-r border-gray-900 last:border-r-0" : "min-w-0"}>
              <a href={c.href} target="_blank" rel="noopener noreferrer" className={look.link}>
                {c.key === "instagram" ? <InstagramIcon className="h-5 w-5 shrink-0" /> : <TelegramIcon className="h-5 w-5 shrink-0" />}
                {c.key === "instagram" ? "Instagram" : "Telegram"}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
