"use client";
/* eslint-disable @next/next/no-img-element -- shop pictures come from whatever host the shop's storage uses */

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { usePrice } from "@/hooks/usePrice";
import type { StoreInfo } from "@/lib/store-api";
import { storeContacts, type StoreContact } from "@/lib/store-contacts";
import { onOrderLabel } from "@/lib/stock";
import type { HomeProduct } from "../HomeContent";
import { STORE_HERO_ID } from "../MobileHeader";
import { useFulfilmentLines, type FulfilmentLine } from "../StoreIntro";
import { ClockIcon, PhoneIcon } from "../icons/DeliveryIcons";
import { InstagramIcon, TelegramIcon } from "../icons/ShopIcons";
import { afishaCaps, jurnalCaps } from "./classes";

// The top of the home page in each storefront theme: the shop's face, from
// the shop's own data only. Every block hides when its data is missing.

/** How the shop hands orders over, plus the one lead time everything on sale shares. */
function useStoreFacts(info: StoreInfo | null, orderLead: string | null): FulfilmentLine[] {
  const { t } = useTranslations();
  const handover = useFulfilmentLines(info);
  if (orderLead === null) return handover;
  return [
    ...handover,
    {
      key: "on-order",
      icon: <ClockIcon className="h-[18px] w-[18px]" />,
      label: onOrderLabel(t("preorder.label"), orderLead),
      detail: null,
    },
  ];
}

/** A shop picture that may fail to load; a broken one renders nothing. */
function useShopImage(src: string | null | undefined) {
  const [broken, setBroken] = useState(false);
  return { url: src && !broken ? src : null, onError: () => setBroken(true) };
}

function contactName(contact: StoreContact, call: string) {
  return contact.key === "instagram" ? "Instagram" : contact.key === "telegram" ? "Telegram" : call;
}

function ContactIcon({ contact, className }: { contact: StoreContact; className: string }) {
  if (contact.key === "instagram") return <InstagramIcon className={className} />;
  if (contact.key === "telegram") return <TelegramIcon className={className} />;
  return <PhoneIcon className={className} />;
}

const external = (contact: StoreContact) =>
  contact.key !== "phone" ? { target: "_blank", rel: "noopener noreferrer" } : {};

/** Jurnal's tagline is the headline: the shorter it is, the larger it is set. */
function headlineSize(text: string) {
  if (text.length <= 32) return "text-[44px] leading-[1.02] lg:text-[84px]";
  if (text.length <= 70) return "text-[34px] leading-[1.06] lg:text-[60px]";
  return "text-[26px] leading-[1.12] lg:text-[42px]";
}

/**
 * Jurnal: the cover runs edge to edge under the header (which lies over it
 * in white, the shop's name as its wordmark), the shop's tagline set large in
 * the serif at its foot with the way to the catalogue. Without a cover the
 * same words stand on white. Under it, one ruled line of how orders reach
 * the shopper and where to write to the shop.
 */
export function JurnalIntro({ info, orderLead = null }: { info: StoreInfo | null; orderLead?: string | null }) {
  const { t } = useTranslations();
  const facts = useStoreFacts(info, orderLead);
  const cover = useShopImage(info?.cover);
  if (!info?.name) return null;

  const tagline = info.tagline?.trim() || null;
  const contacts = storeContacts(info);
  const cta = (light: boolean) => (
    <Link
      href="/catalog"
      className={`mt-4 inline-flex h-11 items-center outline-none focus-visible:ring-2 lg:mt-6 ${
        light ? "focus-visible:ring-white" : "focus-visible:ring-gray-900"
      }`}
    >
      <span className={`border-b pb-[3px] text-[12px] font-medium uppercase tracking-[0.18em] ${light ? "border-white" : "border-gray-900"}`}>
        {t("home.heroCta")}
      </span>
    </Link>
  );

  return (
    <section aria-labelledby="store-title">
      {/* The name is the header's wordmark; the page title says it for assistive tech. */}
      <h1 id="store-title" className="sr-only">
        {info.name}
      </h1>
      {info.cover ? (
        // The box keeps the white header readable even if the photo fails.
        <div id={STORE_HERO_ID} className="relative h-[min(82svh,560px)] min-h-[420px] w-full overflow-hidden bg-gray-900 lg:h-[min(76vh,720px)]">
          {cover.url && (
            <img
              src={cover.url}
              alt=""
              decoding="async"
              fetchPriority="high"
              onError={cover.onError}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.42), rgba(0,0,0,0) 26%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.68))",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-7 text-white lg:pb-14">
            {tagline && (
              <p className={`max-w-[22ch] break-words font-head font-normal ${headlineSize(tagline)}`}>{tagline}</p>
            )}
            {cta(true)}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-7 text-center lg:pb-12 lg:pt-14">
          <p
            aria-hidden={!tagline || undefined}
            className={`mx-auto max-w-[22ch] break-words font-head font-normal text-gray-900 ${headlineSize(tagline ?? info.name)}`}
          >
            {tagline ?? info.name}
          </p>
          {cta(false)}
        </div>
      )}

      {(facts.length > 0 || contacts.length > 0) && (
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-4 border-b border-gray-200 py-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10 lg:py-6">
            {facts.length > 0 && (
              <ul aria-label={t("home.fulfilmentAria")} className="flex flex-col gap-3 lg:flex-row lg:gap-12">
                {facts.map((l) => (
                  <li key={l.key} className="min-w-0">
                    <p className={`${jurnalCaps} text-gray-500`}>{l.label}</p>
                    {l.detail && <p className="mt-1 break-words text-[14px] leading-5 text-gray-900 tabular-nums">{l.detail}</p>}
                  </li>
                ))}
              </ul>
            )}
            {contacts.length > 0 && (
              <ul aria-label={t("home.contactsAria")} className="-my-2 flex flex-wrap gap-x-6">
                {contacts.map((c) => (
                  <li key={c.key}>
                    <a
                      href={c.href}
                      {...external(c)}
                      className="inline-flex h-11 items-center outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                    >
                      <span className={`${jurnalCaps} border-b border-gray-900 pb-0.5 text-gray-900`}>
                        {contactName(c, t("home.call"))}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Afisha's poster name: as large as the longest word allows across the block
 * (container units), smaller for a long name, never wider than the block.
 * Unbounded Black caps run about one em per letter.
 */
function posterSize(name: string) {
  const words = name.trim().split(/\s+/);
  const longest = Math.max(...words.map((w) => w.length), 1);
  const cap = name.length <= 12 ? 200 : name.length <= 24 ? 140 : name.length <= 48 ? 96 : 64;
  return `clamp(22px, min(calc((100cqw - 64px) / ${(longest * 1.02).toFixed(2)}), ${cap}px), 200px)`;
}

/**
 * Afisha: a black strip with how orders reach the shopper, then the shop's
 * name huge on a block of its accent (the light 300 step, ink on it), its
 * tagline in mono caps, a ruled row of contacts and the cover edge to edge.
 */
export function AfishaIntro({ info, orderLead = null }: { info: StoreInfo | null; orderLead?: string | null }) {
  const { t } = useTranslations();
  const facts = useStoreFacts(info, orderLead);
  const cover = useShopImage(info?.cover);
  if (!info?.name) return null;
  const tagline = info.tagline?.trim() || null;
  const contacts = storeContacts(info);

  return (
    <section aria-labelledby="store-title">
      {facts.length > 0 && (
        <ul
          aria-label={t("home.fulfilmentAria")}
          className="flex min-h-[30px] flex-wrap items-center justify-center gap-x-4 gap-y-0.5 bg-gray-900 px-4 py-1.5 text-center text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-white"
        >
          {facts.map((l) => (
            <li key={l.key}>
              {l.label}
              {l.detail && <span className="tabular-nums"> · {l.detail}</span>}
            </li>
          ))}
        </ul>
      )}
      <div className="border-b border-gray-900 bg-brand-300 text-gray-900">
        <div className="mx-auto max-w-7xl px-4 pb-5 pt-6 [container-type:inline-size] lg:px-8 lg:pb-10 lg:pt-12">
          <h1
            id="store-title"
            className="break-words font-head font-black uppercase leading-[0.9] tracking-[-0.04em] [overflow-wrap:anywhere]"
            style={{ fontSize: posterSize(info.name) }}
          >
            {info.name}
          </h1>
          {tagline && (
            <p className="mt-4 max-w-[64ch] break-words text-[11px] font-bold uppercase leading-4 tracking-[0.12em] lg:mt-6 lg:text-[13px] lg:leading-5">
              {tagline}
            </p>
          )}
        </div>
      </div>
      {contacts.length > 0 && (
        <ul aria-label={t("home.contactsAria")} className="flex border-b border-gray-900">
          {contacts.map((c) => (
            <li key={c.key} className="min-w-0 flex-1 border-r border-gray-900 last:border-r-0">
              <a
                href={c.href}
                {...external(c)}
                className={`flex h-11 items-center justify-center gap-2 px-2 ${afishaCaps} outline-none transition-colors hover:bg-gray-900 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900`}
              >
                <ContactIcon contact={c} className="h-4 w-4 shrink-0" />
                <span className="truncate">{contactName(c, t("home.call"))}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {cover.url && (
        <img
          src={cover.url}
          alt=""
          decoding="async"
          fetchPriority="high"
          onError={cover.onError}
          className="block aspect-[2/1] w-full border-b border-gray-900 object-cover lg:aspect-[7/2]"
        />
      )}
    </section>
  );
}

/**
 * Tungi's strip of new arrivals: the real names, sliding slowly; it stops
 * under the pointer and stands still (a scrollable row) for anyone who asked
 * for less motion. Hidden when the shop has no new arrivals.
 */
export function TungiTicker({ names }: { names: string[] }) {
  const { t } = useTranslations();
  if (names.length === 0) return null;
  // Each half must outrun a wide screen for the loop to close.
  const run: string[] = [];
  while (run.length < 10) run.push(...names);

  return (
    <section
      aria-label={t("home.newArrivals")}
      className="overflow-hidden bg-gray-800 text-gray-400 motion-reduce:overflow-x-auto motion-reduce:no-scrollbar [&:hover>div]:[animation-play-state:paused]"
    >
      <div className="flex w-max motion-safe:animate-ticker">
        {[0, 1].map((copy) => (
          // Two identical halves, so sliding by one half closes the loop.
          // Only the first round of the first half is read out, and it is all
          // that stays when the strip stands still.
          <ul
            key={copy}
            aria-hidden={copy === 1 || undefined}
            className={`flex h-[34px] shrink-0 items-center gap-[18px] whitespace-nowrap pr-[18px] text-[11px] font-semibold uppercase leading-none tracking-[0.1em] ${
              copy === 1 ? "motion-reduce:hidden" : "motion-reduce:pl-4"
            }`}
          >
            <li className="text-white">{t("home.newArrivals")}</li>
            {run.map((name, i) => (
              <li
                key={i}
                aria-hidden={i >= names.length || undefined}
                className={`flex items-center gap-[18px] ${i >= names.length ? "motion-reduce:hidden" : ""}`}
              >
                <span aria-hidden className="text-brand-400">
                  ●
                </span>
                {name}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}

/**
 * Tungi's hero: a big rounded card for a new arrival ("Yangi" in the accent),
 * or, when nothing is new, the shop's cover with its name; the popular product
 * when there is neither. On a wide screen the card splits into words and
 * photo. Then how orders reach the shopper and the shop's contacts as dark
 * pills.
 */
export function TungiIntro({
  info,
  product,
  orderLead = null,
}: {
  info: StoreInfo | null;
  /** The product the card is about; null shows the cover instead. */
  product: HomeProduct | null;
  orderLead?: string | null;
}) {
  const { t } = useTranslations();
  const { parts } = usePrice();
  const facts = useStoreFacts(info, orderLead);
  const [broken, setBroken] = useState(false);
  const contacts = info ? storeContacts(info) : [];

  const image = product?.image ?? info?.cover ?? null;
  const card =
    image && !broken
      ? product
        ? {
            href: `/products/${product.id}`,
            badge: product.isNew ? t("product.badgeNew") : product.popular ? t("product.badgePopular") : null,
            title: product.name,
            line: (() => {
              const p = parts(product.price, product.quantityType);
              return `${p.amount} ${p.suffix}`;
            })(),
            action: t("home.viewProduct"),
          }
        : info?.name
          ? { href: "/catalog", badge: null, title: info.name, line: info.tagline?.trim() || null, action: t("home.heroCta") }
          : null
      : null;

  if (!info?.name) return null;

  return (
    <section aria-labelledby="store-title" className="mt-1 lg:mt-6">
      {/* On a phone the sticky bar carries the name as the h1; it is hidden
          on a wide screen, where the header shows the name as a link. */}
      <h1 id="store-title" className="sr-only max-lg:hidden">
        {info.name}
      </h1>
      {card && (
        <Link
          href={card.href}
          className="group relative block h-[400px] overflow-hidden rounded-[28px] bg-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 lg:grid lg:h-[460px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-1 lg:rounded-[32px]"
        >
          <img
            src={image!}
            alt=""
            decoding="async"
            fetchPriority="high"
            onError={() => setBroken(true)}
            className="absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.02] lg:relative lg:order-2"
          />
          <div
            aria-hidden
            className="absolute inset-0 lg:hidden"
            style={{ background: "linear-gradient(to top, rgba(10,11,13,0.92), rgba(10,11,13,0) 58%)" }}
          />
          {card.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-brand-300 px-3 py-1.5 text-[12px] font-extrabold leading-4 text-gray-950 lg:left-12 lg:top-12">
              {card.badge}
            </span>
          )}
          <div className="absolute inset-x-[18px] bottom-[18px] flex items-end justify-between gap-3 lg:relative lg:inset-auto lg:order-1 lg:flex-col lg:items-start lg:justify-end lg:gap-7 lg:p-12">
            <div className="min-w-0">
              <h2 className="line-clamp-3 break-words text-[30px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white lg:text-[52px]">
                {card.title}
              </h2>
              {card.line && (
                <p className="mt-1.5 line-clamp-2 break-words text-[15px] font-semibold tabular-nums text-gray-300 lg:mt-3 lg:text-[19px]">
                  {card.line}
                </p>
              )}
            </div>
            <span className="flex h-12 shrink-0 items-center rounded-full bg-white px-[22px] text-[15px] font-extrabold text-gray-950 transition-colors group-hover:bg-gray-200">
              {card.action}
            </span>
          </div>
        </Link>
      )}

      {(facts.length > 0 || contacts.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {facts.map((l) => (
            <p
              key={l.key}
              className="flex min-h-9 min-w-0 items-center gap-2 rounded-full bg-gray-800 px-3.5 py-1.5 text-[13px] font-medium leading-5 text-gray-300"
            >
              <span className="shrink-0 text-gray-400">{l.icon}</span>
              <span className="min-w-0">
                <span className="font-bold text-white">{l.label}</span>
                {l.detail && <span className="tabular-nums"> · {l.detail}</span>}
              </span>
            </p>
          ))}
          {contacts.length > 0 && (
            <ul aria-label={t("home.contactsAria")} className="flex gap-2">
              {contacts.map((c) => (
                <li key={c.key}>
                  <a
                    href={c.href}
                    {...external(c)}
                    aria-label={contactName(c, t("home.call"))}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    <ContactIcon contact={c} className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
