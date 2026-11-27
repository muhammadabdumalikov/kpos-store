"use client";
/* eslint-disable @next/next/no-img-element -- shop pictures come from whatever host the shop's storage uses */

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import type { SohaLook } from "@/lib/soha-looks";
import { HomeCard, type HomeCategory, type HomeProduct, type HomeSection } from "../HomeContent";
import { StatePanel } from "../StatePanel";
import { BoxIcon, ChevronRightIcon, GridIcon } from "../icons/ShopIcons";
import { sohaGrid, sohaShelf } from "./classes";

const focus = "outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-page";
const categoryHref = (id: string) => `/catalog?category=${encodeURIComponent(id)}`;

/** Tiles show this many categories on a phone; the rest are a tap away. */
const PHONE_TILES = 6;

/**
 * The home page body of a trade theme (lib/soha-looks): the same data and
 * rules as the default HomeContent (categories, the newest products, a shelf
 * per category, the way to the whole catalogue), built from the parts the
 * theme names: its category row, section titles, grid and card.
 */
export function SohaHome({
  look,
  categories,
  products,
  sections,
  total,
  sharedLead,
}: {
  look: SohaLook;
  categories: HomeCategory[];
  products: HomeProduct[];
  sections: HomeSection[];
  total: number;
  sharedLead: string | null;
}) {
  const { t } = useTranslations();
  const shelved = sections.length > 0;
  const row = look.cols;
  // With shelves below, the grid is a short "new arrivals" block: three rows
  // on a phone, at most two full rows on a wide screen.
  const lgMax = Math.min(row * 2, products.length >= row ? Math.floor(products.length / row) * row : products.length);
  const gridHide = (i: number) => (!shelved ? "" : `${i >= 6 ? "max-lg:hidden" : ""} ${i >= lgMax ? "lg:hidden" : ""}`);
  const shelf = sohaShelf(look);
  // Bozor: every section is a card-coloured shelf panel on the grey page.
  const panel = look.panels ? "r-card bg-card p-3 lg:p-5" : "";
  const gap = look.panels ? "mt-3 lg:mt-4" : "mt-9 lg:mt-14";

  return (
    <>
      {categories.length > 0 && <SohaNav look={look} categories={categories} />}

      <section aria-labelledby="home-products" className={`${look.panels ? "mt-4 lg:mt-6" : "mt-8 lg:mt-12"} ${panel}`}>
        <SohaHead
          look={look}
          id="home-products"
          title={shelved ? t("home.newArrivals") : t("home.popular")}
          link={total > products.length ? { href: "/catalog", label: t("home.seeAll"), aria: t("home.allProducts") } : null}
        />
        {products.length > 0 ? (
          <div className={sohaGrid(look)}>
            {products.map((p, i) => (
              <div key={p.id} className={`min-w-0 ${gridHide(i)}`}>
                <HomeCard product={p} sharedLead={sharedLead} />
              </div>
            ))}
          </div>
        ) : (
          <StatePanel icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />
        )}
      </section>

      {products.length > 0 &&
        sections.map((section) => (
          <section key={section.id} aria-labelledby={`home-shelf-${section.id}`} className={`${gap} ${panel}`}>
            <SohaHead
              look={look}
              id={`home-shelf-${section.id}`}
              title={section.name}
              link={{ href: categoryHref(section.id), label: t("home.seeAll"), aria: `${t("home.seeAll")}: ${section.name}` }}
            />
            <ul className={shelf.list}>
              {section.products.map((p, i) => (
                <li key={p.id} className={`${shelf.item} ${i >= row ? "lg:hidden" : ""}`}>
                  <HomeCard product={p} sharedLead={sharedLead} />
                </li>
              ))}
            </ul>
          </section>
        ))}

      {products.length > 0 && total > products.length && (
        <Link
          href="/catalog"
          className={`soha-all r-ctl mt-8 flex h-12 w-full items-center justify-center gap-2 border border-line bg-card text-[15px] font-bold text-ink transition-colors hover:border-ink lg:mx-auto lg:mt-12 lg:max-w-[360px] ${focus}`}
        >
          {t("home.allProducts")}
          <span className="font-semibold tabular-nums text-muted">{total}</span>
          <ChevronRightIcon className="-mr-1 h-[18px] w-[18px] text-muted" />
        </Link>
      )}
    </>
  );
}

/** A category's picture; a broken or missing one shows the grid mark. */
function CategoryPhoto({ src, className }: { src: string | null; className: string }) {
  const [broken, setBroken] = useState(false);
  return src && !broken ? (
    <img src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} className={`${className} object-cover`} />
  ) : (
    <span className={`${className} flex items-center justify-center bg-panel text-muted`}>
      <GridIcon className="h-5 w-5" strokeWidth={1.5} />
    </span>
  );
}

/**
 * The categories in the theme's shape: photo circles, chips, tiles with a
 * small photo, or a row of text tabs. Each leads to that category's catalogue.
 */
function SohaNav({ look, categories }: { look: SohaLook; categories: HomeCategory[] }) {
  const { t } = useTranslations();
  const heading = (
    <h2 id="home-categories" className="sr-only">
      {t("home.categories")}
    </h2>
  );

  if (look.nav === "circles") {
    return (
      <section aria-labelledby="home-categories" className="mt-6 lg:mt-10">
        {heading}
        <ul className={`no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:gap-7 lg:px-0 ${look.centered ? "lg:justify-center" : ""}`}>
          {categories.map((c) => (
            <li key={c.id} className="w-[76px] shrink-0 snap-start lg:w-[104px]">
              <Link href={categoryHref(c.id)} className={`group flex flex-col items-center rounded-[20px] ${focus}`}>
                <span className="soha-ring keep-round block aspect-square w-full rounded-full bg-panel p-[3px]">
                  <CategoryPhoto src={c.image} className="keep-round h-full w-full rounded-full" />
                </span>
                <span className="mt-2 line-clamp-2 w-full break-words text-center text-[13px] font-semibold leading-4 text-ink">
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (look.nav === "tiles") {
    const more = categories.length > PHONE_TILES;
    return (
      <section aria-labelledby="home-categories" className="mt-4 lg:mt-8">
        {heading}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
          {categories.map((c, i) => (
            <li key={c.id} className={`min-w-0 ${more && i >= PHONE_TILES - 1 ? "max-sm:hidden" : ""}`}>
              <Link
                href={categoryHref(c.id)}
                className={`soha-tile r-tile flex h-full min-h-[60px] items-center gap-2.5 border border-line bg-card p-1.5 pr-3 transition-colors hover:border-ink ${focus}`}
              >
                <CategoryPhoto src={c.image} className="r-tile h-12 w-12 shrink-0" />
                <span className="soha-tile-name line-clamp-2 min-w-0 break-words text-[13px] font-semibold leading-[1.25] text-ink">
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
          {more && (
            <li className="min-w-0 sm:hidden">
              <Link
                href="/catalog"
                className={`soha-tile r-tile flex h-full min-h-[60px] items-center justify-between gap-2 border border-line bg-card py-1.5 pl-4 pr-3 ${focus}`}
              >
                <span className="soha-tile-name text-[13px] font-semibold text-ink">{t("home.seeAll")}</span>
                <ChevronRightIcon className="h-[18px] w-[18px] shrink-0 text-muted" />
              </Link>
            </li>
          )}
        </ul>
      </section>
    );
  }

  if (look.nav === "tabs") {
    return (
      <nav aria-labelledby="home-categories" className="mt-5 lg:mt-9">
        {heading}
        <div className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 lg:mx-0 lg:flex-wrap lg:gap-x-9 lg:px-0">
          <Link
            href="/catalog"
            className={`soha-tab -mb-px flex h-11 shrink-0 items-center border-b-2 border-ink font-head text-[16px] font-semibold text-ink ${focus}`}
          >
            {t("home.seeAll")}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={categoryHref(c.id)}
              className={`soha-tab -mb-px flex h-11 max-w-[240px] shrink-0 items-center border-b-2 border-transparent font-head text-[16px] text-muted transition-colors hover:text-ink ${focus}`}
            >
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  // chips
  const chip = `soha-chip r-ctl flex h-10 max-w-[240px] shrink-0 items-center border px-4 text-[14px] font-semibold leading-none ${focus}`;
  return (
    <nav aria-labelledby="home-categories" className="mt-4 lg:mt-7">
      {heading}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 lg:mx-0 lg:flex-wrap lg:px-0">
        <Link href="/catalog" aria-current="page" className={`${chip} border-ink bg-ink text-page`}>
          <span className="truncate">{t("home.seeAll")}</span>
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={categoryHref(c.id)} className={`${chip} border-line bg-card text-ink transition-colors hover:border-ink`}>
            <span className="truncate">{c.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** A section's title row in the theme's voice, with a link to all of it. */
function SohaHead({
  look,
  id,
  title,
  link,
}: {
  look: SohaLook;
  id: string;
  title: string;
  link: { href: string; label: string; aria: string } | null;
}) {
  const more = (className: string) =>
    link && (
      <Link href={link.href} aria-label={link.aria} className={`inline-flex h-11 shrink-0 items-center gap-0.5 ${className} ${focus}`}>
        {link.label}
        <ChevronRightIcon className="h-[18px] w-[18px]" />
      </Link>
    );

  if (look.head === "rule") {
    return (
      <div className="soha-head soha-head--rule mb-3 flex min-h-11 items-end justify-between gap-3 border-b-2 border-ink lg:mb-5">
        <h2 id={id} className="min-w-0 truncate pb-2 font-head text-[21px] font-bold leading-7 text-ink lg:text-[28px] lg:leading-9">
          {title}
        </h2>
        {more("text-[13px] font-bold uppercase tracking-[0.06em] text-ink")}
      </div>
    );
  }

  if (look.head === "serif") {
    return look.centered ? (
      <div className="soha-head mb-4 flex flex-col items-center text-center lg:mb-7">
        <h2 id={id} className="max-w-full break-words font-head text-[28px] font-medium leading-tight text-ink lg:text-[40px]">
          {title}
        </h2>
        {more("mt-1 text-[13px] font-semibold text-brand-600 dark:text-brand-400")}
      </div>
    ) : (
      <div className="soha-head mb-3 flex items-baseline justify-between gap-3 lg:mb-6">
        <h2 id={id} className="min-w-0 truncate font-head text-[27px] font-medium leading-tight text-ink lg:text-[38px]">
          {title}
        </h2>
        {more("text-[13px] font-semibold text-brand-600 dark:text-brand-400")}
      </div>
    );
  }

  if (look.head === "marker") {
    return (
      <div className={`soha-head mb-3 flex items-center gap-3 lg:mb-5 ${look.centered ? "flex-col text-center" : "justify-between"}`}>
        <h2 id={id} className="min-w-0 max-w-full">
          <span className="soha-mark inline-block max-w-full truncate align-bottom font-head text-[20px] font-bold leading-7 text-ink lg:text-[24px] lg:leading-8">
            {title}
          </span>
        </h2>
        {more(`text-[14px] font-bold text-brand-600 dark:text-brand-400 ${look.centered ? "-mt-2" : ""}`)}
      </div>
    );
  }

  return (
    <div className="soha-head mb-3 flex items-center justify-between gap-3 lg:mb-4">
      <h2 id={id} className="min-w-0 truncate font-head text-[21px] font-extrabold leading-7 tracking-[-0.01em] text-ink lg:text-[26px] lg:leading-8">
        {title}
      </h2>
      {more("-mr-1 text-[14px] font-bold text-brand-600 dark:text-brand-400")}
    </div>
  );
}
