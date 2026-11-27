"use client";
/* eslint-disable @next/next/no-img-element -- shop pictures come from whatever host the shop's storage uses */

import Link from "next/link";
import { useState, type ComponentType } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { formatPhone } from "@/lib/format";
import type { StoreInfo } from "@/lib/store-api";
import { storeContacts, type StoreContact } from "@/lib/store-contacts";
import { onOrderLabel, stockOf } from "@/lib/stock";
import type { HomeCategory, HomeProduct, HomeSection } from "../HomeContent";
import type { CardModel } from "../ProductCard";
import { useDeliveryLine, useFulfilmentLines, useShopImage, type FulfilmentLine } from "../shop-facts";
import { ClockIcon, PhoneIcon, StoreIcon, TruckIcon } from "../icons/DeliveryIcons";
import { GridIcon, InstagramIcon, TelegramIcon } from "../icons/ShopIcons";

// What every trade theme's parts are made from (lib/soha-looks): the contract
// between a theme and the pages, the shop's facts in one place, and the few
// blocks that are the same in every theme apart from their paint.

/** The top of the home page: above the phone's search bar, or right under it. */
export type IntroProps = {
  info: StoreInfo;
  /** Set when everything on sale comes on order with this one lead time. */
  orderLead: string | null;
};

/** The home page body: categories, product sections, the shop's facts. */
export type HomeProps = {
  info: StoreInfo | null;
  categories: HomeCategory[];
  /** The newest products; the grid under "Yangi kelganlar". */
  products: HomeProduct[];
  /** A shelf per category; empty for a small shop, whose range fits the grid. */
  sections: HomeSection[];
  total: number;
  sharedLead: string | null;
  /** Products per category, where known (themes with `counts`). */
  counts: Record<string, number>;
};

/**
 * A trade theme's parts (app/components/soha/looks/<key>.tsx).
 * - Intro: above the phone's sticky search bar. It names the shop (the page's
 *   h1) and carries whatever the theme opens with. Full width: it sets its
 *   own side padding.
 * - AfterBar: the first block inside <main>, under the search bar: the cover,
 *   a tagline block, the delivery line. Optional.
 * - Home: categories and product sections, ending with <SohaAbout>.
 * - Card: the product card, on every page that lists products.
 */
export type SohaParts = {
  Intro: ComponentType<IntroProps>;
  AfterBar?: ComponentType<IntroProps>;
  Home: ComponentType<HomeProps>;
  Card: ComponentType<{ card: CardModel }>;
};

// The shop's facts live in ../shop-facts; a theme's file takes them from here.
export { DeliveryLine, useDeliveryLine, useShopImage } from "../shop-facts";

export const focus =
  "outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-page";

export const categoryHref = (id: string) => `/catalog?category=${encodeURIComponent(id)}`;

/** Everything a theme's top may show, from the shop's own data only. */
export function useShopFace(info: StoreInfo | null, orderLead: string | null = null) {
  const { t } = useTranslations();
  const handover = useFulfilmentLines(info);
  const delivery = useDeliveryLine(info);
  const cover = useShopImage(info?.cover);
  const logo = useShopImage(info?.logo);
  const facts: FulfilmentLine[] =
    orderLead === null
      ? handover
      : [
          ...handover,
          { key: "on-order", icon: <ClockIcon className="h-[18px] w-[18px]" />, label: onOrderLabel(t("preorder.label"), orderLead), detail: null },
        ];
  return {
    name: info?.name ?? "",
    tagline: info?.tagline?.trim() || null,
    cover,
    logo,
    contacts: storeContacts(info),
    /** Pickup, delivery and a shared lead time, as label + detail. */
    facts,
    /** The delivery terms in one line; null when there are none. */
    delivery,
  };
}

/** A category's picture; a broken or missing one shows the grid mark. */
export function CategoryPhoto({ src, className, fit = "cover" }: { src: string | null; className: string; fit?: "cover" | "contain" }) {
  const [broken, setBroken] = useState(false);
  return src && !broken ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className={`${className} ${fit === "contain" ? "object-contain" : "object-cover"}`}
    />
  ) : (
    <span className={`${className} flex items-center justify-center bg-panel text-muted`}>
      <GridIcon className="h-5 w-5" strokeWidth={1.5} />
    </span>
  );
}

/** The shop's cover as a plain picture: never any text on it. */
export function CoverPhoto({ cover, className, priority = true }: { cover: ReturnType<typeof useShopImage>; className: string; priority?: boolean }) {
  if (!cover.url) return null;
  return (
    <img
      src={cover.url}
      alt=""
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      onError={cover.onError}
      className={`bg-panel object-cover ${className}`}
    />
  );
}

const inStock = (p: HomeProduct) => !stockOf(p.quantity, p.preorder).soldOut;

/** The marked-down products the home page already holds, each once. */
export function dealsOf(products: HomeProduct[], sections: HomeSection[], limit = 8): HomeProduct[] {
  const seen = new Set<string>();
  const out: HomeProduct[] = [];
  for (const p of [...products, ...sections.flatMap((s) => s.products)]) {
    if (!p.oldPrice || p.oldPrice <= p.price || !inStock(p) || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Which cards of the "new arrivals" grid stay when category shelves follow
 * it: `phoneRows` rows on a phone, at most two full rows on a wide screen.
 * Returns the classes that hide card `i`.
 */
export function gridLimits(count: number, shelved: boolean, phoneCols: number, cols: number, phoneRows = 3) {
  const lgMax = Math.min(cols * 2, count >= cols ? Math.floor(count / cols) * cols : count);
  const phoneMax = phoneCols * phoneRows;
  return (i: number) => (!shelved ? "" : `${i >= phoneMax ? "max-lg:hidden" : ""} ${i >= lgMax ? "lg:hidden" : ""}`);
}

/** "Hammasi" beside a section title; the theme gives it its paint. */
export function SeeAll({ href, label, aria, className, children }: { href: string; label: string; aria: string; className: string; children?: React.ReactNode }) {
  return (
    <Link href={href} aria-label={aria} className={`inline-flex min-h-11 shrink-0 items-center gap-0.5 ${className} ${focus}`}>
      {label}
      {children}
    </Link>
  );
}

const CONTACT_NAME: Record<StoreContact["key"], string> = { instagram: "Instagram", telegram: "Telegram", phone: "" };

/**
 * "Do'kon haqida", the end of every theme's home page: how the shop hands
 * orders over and where to reach it. The phone number is printed; Telegram
 * and Instagram are buttons. Nothing when the shop set none of it.
 *
 * The markup is the same everywhere; a theme paints `.soha-about` and its
 * parts (`-title`, `-row`, `-link`) in its own CSS file.
 */
export function SohaAbout({ info, orderLead = null, className = "" }: { info: StoreInfo | null; orderLead?: string | null; className?: string }) {
  const { t } = useTranslations();
  const face = useShopFace(info, orderLead);
  if (!info) return null;
  const phone = info.contacts?.phone?.trim() ? formatPhone(info.contacts.phone) : null;
  const links = face.contacts.filter((c) => c.key !== "phone");
  const call = face.contacts.find((c) => c.key === "phone") ?? null;
  if (face.facts.length === 0 && links.length === 0 && !call) return null;

  const rowIcon = (key: string, icon: React.ReactNode) =>
    key === "pickup" ? <StoreIcon className="h-5 w-5" /> : key === "delivery" ? <TruckIcon className="h-5 w-5" /> : icon;

  return (
    <section aria-labelledby="home-about" className={`soha-about mt-10 border-t border-line pt-6 lg:mt-16 lg:pt-10 ${className}`}>
      <h2 id="home-about" className="soha-about-title font-head text-[20px] font-bold leading-7 text-ink lg:text-[26px] lg:leading-8">
        {t("home.about")}
      </h2>
      <ul className="mt-2 lg:mt-4 lg:grid lg:grid-cols-3 lg:gap-x-8">
        {face.facts.map((l) => (
          <li key={l.key} className="soha-about-row flex gap-3 border-b border-line py-3 lg:border-b-0">
            <span className="mt-0.5 shrink-0 text-muted">{rowIcon(l.key, l.icon)}</span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold leading-5 text-ink">{l.label}</span>
              {l.detail && <span className="block break-words text-[13px] leading-[18px] text-muted">{l.detail}</span>}
            </span>
          </li>
        ))}
        {call && phone && (
          <li className="soha-about-row flex gap-3 border-b border-line py-3 lg:border-b-0">
            <span className="mt-0.5 shrink-0 text-muted">
              <PhoneIcon className="h-5 w-5" />
            </span>
            <a href={call.href} className={`min-w-0 text-[14px] font-semibold leading-5 text-ink tabular-nums ${focus}`}>
              {phone}
              <span className="block text-[13px] font-normal leading-[18px] text-muted">{t("home.call")}</span>
            </a>
          </li>
        )}
      </ul>
      {links.length > 0 && (
        <ul aria-label={t("home.contactsAria")} className="mt-4 grid grid-cols-2 gap-2 lg:flex lg:gap-3">
          {links.map((c) => (
            <li key={c.key} className="min-w-0">
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`soha-about-link r-ctl flex h-11 items-center justify-center gap-2 border border-line bg-card px-5 text-[14px] font-semibold text-ink transition-colors hover:border-ink ${focus}`}
              >
                {c.key === "instagram" ? <InstagramIcon className="h-5 w-5" /> : <TelegramIcon className="h-5 w-5" />}
                {CONTACT_NAME[c.key]}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
