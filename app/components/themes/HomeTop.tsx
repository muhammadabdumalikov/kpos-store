"use client";
/* eslint-disable @next/next/no-img-element -- shop pictures come from whatever host the shop's storage uses */

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { usePrice } from "@/hooks/usePrice";
import { normalizeFulfillment } from "@/lib/fulfillment";
import type { StoreInfo } from "@/lib/store-api";
import { onOrderLabel } from "@/lib/stock";
import type { HomeProduct } from "../HomeContent";
import { STORE_HERO_ID } from "../MobileHeader";
import { useDeliveryLine, useFulfilmentLines, useShopImage } from "../shop-facts";

// The top of the home page in each storefront theme: the shop's face, from
// the shop's own data only. Every block hides when its data is missing. How
// orders are handed over and where to reach the shop close the page
// (ShopAbout); up here they are one line in a strip.

/**
 * What a theme's strip says: the delivery terms in one line, where to pick an
 * order up, and the one lead time everything on sale shares.
 */
function useStripLines(info: StoreInfo | null, orderLead: string | null): string[] {
  const { t } = useTranslations();
  const delivery = useDeliveryLine(info);
  const pickup = useFulfilmentLines(info).find((l) => l.key === "pickup");
  const lines: string[] = [];
  if (delivery) lines.push(delivery);
  // A shop that does not deliver: the first line already is the pickup address.
  if (pickup?.detail && info && normalizeFulfillment(info).deliveryEnabled)
    lines.push(t("home.pickupAt").replace("{where}", pickup.detail));
  if (orderLead !== null) lines.push(onOrderLabel(t("preorder.label"), orderLead));
  return [...new Set(lines)];
}

/** Jurnal: a thin black strip above the header with the delivery terms in spaced caps. */
export function JurnalStrip({ info }: { info: StoreInfo | null }) {
  const line = useDeliveryLine(info);
  if (!line) return null;
  return (
    <p className="flex min-h-[30px] items-center justify-center bg-gray-900 px-4 py-1.5 text-center text-[11px] font-medium uppercase leading-4 tracking-[0.18em] text-white">
      <span className="truncate">{line}</span>
    </p>
  );
}

/** Jurnal's tagline is the headline: the shorter it is, the larger it is set. */
function headlineSize(text: string) {
  if (text.length <= 32) return "text-[44px] leading-[1.02] lg:text-[84px]";
  if (text.length <= 70) return "text-[34px] leading-[1.06] lg:text-[60px]";
  return "text-[26px] leading-[1.12] lg:text-[42px]";
}

/**
 * Jurnal: the cover runs edge to edge under the header (which lies over it
 * in white, the shop's name as its wordmark), the shop's tagline set large in
 * the serif at its foot with one small underlined link to the catalogue.
 * Without a cover the same words stand on white.
 */
export function JurnalIntro({ info }: { info: StoreInfo | null }) {
  const { t } = useTranslations();
  const cover = useShopImage(info?.cover);
  if (!info?.name) return null;

  const tagline = info.tagline?.trim() || null;
  const cta = (light: boolean) => (
    <Link
      href="/catalog"
      className={`mt-4 inline-flex h-11 items-center outline-none focus-visible:ring-2 lg:mt-6 ${
        light ? "focus-visible:ring-white" : "focus-visible:ring-gray-900"
      }`}
    >
      <span className={`border-b pb-[3px] text-[12px] font-medium uppercase tracking-[0.18em] ${light ? "border-white" : "border-gray-900"}`}>
        {t("home.catalog")}
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
 * Afisha's ticker: one black line of mono caps above the header with the
 * delivery terms and the pickup address. It never wraps: a long line scrolls
 * sideways.
 */
export function AfishaTicker({ info, orderLead = null }: { info: StoreInfo | null; orderLead?: string | null }) {
  const { t } = useTranslations();
  const lines = useStripLines(info, orderLead);
  if (lines.length === 0) return null;
  return (
    <ul
      aria-label={t("home.fulfilmentAria")}
      className="no-scrollbar flex h-[30px] items-center gap-3 overflow-x-auto whitespace-nowrap bg-gray-900 px-4 text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-white lg:justify-center"
    >
      {lines.map((line, i) => (
        <li key={line} className="flex shrink-0 items-center gap-3">
          {i > 0 && <span aria-hidden>/</span>}
          {line}
        </li>
      ))}
    </ul>
  );
}

/**
 * Afisha's poster, under the header: the shop's name huge on a block of its
 * accent (the light 300 step, ink on it), its tagline in mono caps, then the
 * cover edge to edge between rules. No photo text, no button.
 */
export function AfishaIntro({ info }: { info: StoreInfo | null }) {
  const cover = useShopImage(info?.cover);
  if (!info?.name) return null;
  const tagline = info.tagline?.trim() || null;

  return (
    <section aria-labelledby="store-title">
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
      {cover.url && (
        <img
          src={cover.url}
          alt=""
          decoding="async"
          fetchPriority="high"
          onError={cover.onError}
          className="block aspect-[3/2] w-full border-b border-gray-900 object-cover lg:aspect-[7/2]"
        />
      )}
    </section>
  );
}

/**
 * Tungi's strip: the delivery terms and the pickup address, sliding slowly;
 * it stops under the pointer and stands still (a scrollable row) for anyone
 * who asked for less motion. Hidden when the shop states neither.
 */
export function TungiTicker({ info, orderLead = null }: { info: StoreInfo | null; orderLead?: string | null }) {
  const { t } = useTranslations();
  const lines = useStripLines(info, orderLead);
  if (lines.length === 0) return null;
  // Each half must outrun a wide screen for the loop to close.
  const run: string[] = [];
  while (run.length < 8) run.push(...lines);

  return (
    <section
      aria-label={t("home.fulfilmentAria")}
      className="overflow-hidden border-b border-white/[0.06] bg-gray-900 text-gray-300 motion-reduce:overflow-x-auto motion-reduce:no-scrollbar [&:hover>div]:[animation-play-state:paused]"
    >
      <div className="flex w-max motion-safe:animate-ticker">
        {[0, 1].map((copy) => (
          // Two identical halves, so sliding by one half closes the loop.
          // Only the first round of the first half is read out, and it is all
          // that stays when the strip stands still.
          <ul
            key={copy}
            aria-hidden={copy === 1 || undefined}
            className={`flex h-[34px] shrink-0 items-center gap-[18px] whitespace-nowrap pr-[18px] text-[12px] font-medium leading-none ${
              copy === 1 ? "motion-reduce:hidden" : "pl-4"
            }`}
          >
            {run.map((line, i) => (
              <li
                key={i}
                aria-hidden={i >= lines.length || undefined}
                className={`flex items-center gap-[18px] ${i >= lines.length ? "motion-reduce:hidden" : ""}`}
              >
                {line}
                <span aria-hidden className="text-brand-400">
                  ●
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}

/**
 * Tungi opens with one product on a big rounded card: its photo with the
 * reason it is lifted ("Yangi" or "Ommabop": the shop's own flags), then its
 * name, its price and the way to its page. On a wide screen the card splits
 * into words and photo. A shop with no product to lift has no such card.
 */
export function TungiIntro({ info, product }: { info: StoreInfo | null; product: HomeProduct | null }) {
  const { t } = useTranslations();
  const { parts } = usePrice();
  const [broken, setBroken] = useState(false);
  if (!info?.name) return null;

  const price = product ? parts(product.price, product.quantityType) : null;
  const badge = product?.isNew ? t("product.badgeNew") : product?.popular ? t("product.badgePopular") : null;

  return (
    <section aria-labelledby="store-title" className="mt-1 lg:mt-6">
      {/* On a phone the sticky bar carries the name as the h1; it is hidden
          on a wide screen, where the header shows the name as a link. */}
      <h1 id="store-title" className="sr-only max-lg:hidden">
        {info.name}
      </h1>
      {product?.image && price && !broken && (
        <Link
          href={`/products/${product.id}`}
          className="group block overflow-hidden rounded-[24px] bg-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 lg:grid lg:h-[460px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:rounded-[32px]"
        >
          <div className="relative aspect-[358/380] overflow-hidden lg:order-2 lg:aspect-auto">
            <img
              src={product.image}
              alt=""
              decoding="async"
              fetchPriority="high"
              onError={() => setBroken(true)}
              className="absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.02]"
            />
            {badge && (
              <span className="absolute left-4 top-4 rounded-full bg-brand-300 px-3 py-1.5 text-[12px] font-extrabold leading-4 text-gray-950">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 p-4 lg:order-1 lg:flex-col lg:items-start lg:justify-end lg:gap-7 lg:p-12">
            <div className="min-w-0">
              <h2 className="line-clamp-2 break-words text-[18px] font-semibold leading-6 text-white lg:text-[44px] lg:font-extrabold lg:leading-[1.05] lg:tracking-[-0.02em]">
                {product.name}
              </h2>
              <p className="mt-0.5 whitespace-nowrap text-[18px] font-bold leading-6 tabular-nums text-white lg:mt-3 lg:text-[22px]">
                {price.amount} {price.suffix}
              </p>
            </div>
            <span className="flex h-11 shrink-0 items-center rounded-full bg-white px-5 text-[14px] font-bold text-gray-950 transition-colors group-hover:bg-gray-200">
              {t("home.viewProduct")}
            </span>
          </div>
        </Link>
      )}
    </section>
  );
}
