"use client";

import Link from "@/app/components/ShopLink";
import { useTranslations } from "@/hooks/useTranslations";
import type { StoreInfo } from "@/lib/store-api";
import type { StoreTheme } from "@/lib/store-theme";
import { ChipLink } from "../Chip";
import { themedCategoryCell, themedCategoryRow } from "../CatalogToolbar";
import { HomeCard, type HomeCategory, type HomeProduct, type HomeSection } from "../HomeContent";
import { ShopAbout } from "../ShopAbout";
import { StatePanel } from "../StatePanel";
import { ArrowRightIcon, BoxIcon, ChevronRightIcon } from "../icons/ShopIcons";
import { afishaCaps, jurnalCaps, themedGrid, themedRow } from "./classes";

type Theme = Exclude<StoreTheme, "default">;

/** Jurnal's home lists this many categories; the rest are a link away. */
const JURNAL_CATEGORIES = 6;

/**
 * The home page body in a storefront theme: the same data and rules as the
 * default HomeContent (category row, the newest products, a shelf per
 * category, the way to the whole catalogue), in the theme's shapes:
 * - Jurnal: categories as a large serif list with product counts, serif
 *   section titles with a small accent link, an airy four-column grid.
 * - Afisha: a ruled strip of categories, ruled title strips and a ruled grid.
 * - Tungi: pill chips, bold titles with an accent link, photos straight on
 *   the dark page.
 * Each ends with the shop's facts (ShopAbout).
 */
export function ThemedHome({
  theme,
  categories,
  products,
  sections,
  total,
  sharedLead,
  counts,
  hero,
  info,
}: {
  theme: Theme;
  categories: HomeCategory[];
  products: HomeProduct[];
  sections: HomeSection[];
  total: number;
  sharedLead: string | null;
  /** Products per category, where known (Jurnal shows them). */
  counts: Record<string, number>;
  /** The product Tungi lifts above the grid; left out of the grid when the
   *  grid has others. */
  hero: HomeProduct | null;
  /** The shop, for the facts that close the page. */
  info: StoreInfo | null;
}) {
  const { t } = useTranslations();
  const shelved = sections.length > 0;
  const grid = hero && products.length > 1 ? products.filter((p) => p.id !== hero.id) : products;
  const row = themedRow(theme);
  // With shelves below, the grid is a short "new arrivals" block: three rows
  // on a phone, at most two full rows on a wide screen.
  const lgMax = Math.min(row * 2, grid.length >= row ? Math.floor(grid.length / row) * row : grid.length);
  const gridHide = (i: number) =>
    !shelved ? "" : `${i >= 6 ? "max-lg:hidden" : ""} ${i >= lgMax ? "lg:hidden" : ""}`;

  return (
    <>
      {categories.length > 0 && <HomeCategoryNav theme={theme} categories={categories} counts={counts} />}

      <section aria-labelledby="home-products" className={theme === "afisha" ? "mt-6 lg:mt-10" : "mt-9 lg:mt-14"}>
        <SectionHead
          theme={theme}
          id="home-products"
          title={shelved ? t("home.newArrivals") : t("home.popular")}
          link={total > products.length ? { href: "/catalog", label: t("home.seeAll"), aria: t("home.allProducts") } : null}
        />
        {grid.length > 0 ? (
          <>
            <div className={themedGrid(theme)}>
              {grid.map((p, i) => (
                <div key={p.id} className={`min-w-0 ${gridHide(i)}`}>
                  <HomeCard product={p} sharedLead={sharedLead} />
                </div>
              ))}
            </div>

            {sections.map((section) => (
              <section
                key={section.id}
                aria-labelledby={`home-shelf-${section.id}`}
                className={theme === "afisha" ? "mt-6 lg:mt-10" : "mt-10 lg:mt-16"}
              >
                <SectionHead
                  theme={theme}
                  id={`home-shelf-${section.id}`}
                  title={section.name}
                  link={{
                    href: `/catalog?category=${encodeURIComponent(section.id)}`,
                    label: t("home.seeAll"),
                    aria: `${t("home.seeAll")}: ${section.name}`,
                  }}
                />
                <ShelfRow theme={theme} products={section.products} sharedLead={sharedLead} />
              </section>
            ))}

            {total > products.length && <AllProducts theme={theme} total={total} />}
          </>
        ) : (
          <StatePanel
            className="mt-3"
            icon={<BoxIcon className="h-7 w-7" />}
            title={t("home.emptyTitle")}
            body={t("home.emptyBody")}
          />
        )}
      </section>

      <ShopAbout info={info} orderLead={sharedLead} />
    </>
  );
}

function HomeCategoryNav({
  theme,
  categories,
  counts,
}: {
  theme: Theme;
  categories: HomeCategory[];
  counts: Record<string, number>;
}) {
  const { t } = useTranslations();
  const href = (id: string) => `/catalog?category=${encodeURIComponent(id)}`;

  if (theme === "jurnal") {
    const shown = categories.slice(0, JURNAL_CATEGORIES);
    return (
      <section aria-labelledby="home-categories" className="mt-8 lg:mt-14">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 id="home-categories" className={`${jurnalCaps} text-gray-500`}>
            {t("home.categories")}
          </h2>
          {categories.length > shown.length && (
            <Link
              href="/catalog"
              aria-label={`${t("home.seeAll")}: ${t("home.categories")}`}
              className="inline-flex h-11 items-center outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              <span className={`${jurnalCaps} border-b border-brand-600 pb-0.5 text-brand-600`}>{t("home.seeAll")}</span>
            </Link>
          )}
        </div>
        <ul className="lg:grid lg:grid-cols-2 lg:gap-x-16">
          {shown.map((c) => {
            const count = counts[c.id];
            return (
              <li key={c.id} className="border-b border-gray-200">
                <Link
                  href={href(c.id)}
                  className="group flex min-h-11 items-center justify-between gap-4 py-[13px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900 lg:py-4"
                >
                  <span className="min-w-0 break-words font-head text-[34px] font-normal leading-[1.05] text-gray-900 lg:text-[44px]">
                    {c.name}
                    {count ? (
                      <sup className="ml-1.5 font-outfit text-[11px] font-medium tabular-nums tracking-normal text-gray-500">
                        {count}
                      </sup>
                    ) : null}
                  </span>
                  <ArrowRightIcon className="h-5 w-5 shrink-0 text-gray-900 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  if (theme === "afisha") {
    return (
      <nav aria-labelledby="home-categories" className="mt-4 lg:mt-8">
        <h2 id="home-categories" className="sr-only">
          {t("home.categories")}
        </h2>
        <div className={themedCategoryRow.afisha}>
          <Link href="/catalog" className={themedCategoryCell("afisha", true)}>
            <span className="truncate">{t("home.seeAll")}</span>
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={href(c.id)} title={c.name} className={themedCategoryCell("afisha", false)}>
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  // Tungi: pill chips, the whole catalogue first.
  return (
    <section aria-labelledby="home-categories" className="mt-5 lg:mt-8">
      <h2 id="home-categories" className="sr-only">
        {t("home.categories")}
      </h2>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        <ChipLink href="/catalog" active>
          {t("home.seeAll")}
        </ChipLink>
        {categories.map((c) => (
          <ChipLink key={c.id} href={href(c.id)}>
            {c.name}
          </ChipLink>
        ))}
      </div>
    </section>
  );
}

/** A section's title row in the theme's voice, with a link to all of it. */
function SectionHead({
  theme,
  id,
  title,
  link,
}: {
  theme: Theme;
  id: string;
  title: string;
  link: { href: string; label: string; aria: string } | null;
}) {
  if (theme === "afisha") {
    return (
      <div className="-mx-4 flex min-h-11 items-center justify-between gap-3 border-y border-gray-900 pl-4 lg:mx-0 lg:border-x">
        <h2 id={id} className={`${afishaCaps} min-w-0 truncate py-3`}>
          {title}
        </h2>
        {link && (
          <Link
            href={link.href}
            aria-label={link.aria}
            className={`${afishaCaps} flex h-11 shrink-0 items-center gap-1 border-l border-gray-900 px-4 outline-none transition-colors hover:bg-brand-300 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900`}
          >
            {link.label}
            <ArrowRightIcon className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        )}
      </div>
    );
  }

  if (theme === "jurnal") {
    return (
      <div className="mb-3 flex items-baseline justify-between gap-3 lg:mb-6">
        <h2 id={id} className="min-w-0 truncate font-head text-[28px] font-normal leading-tight text-gray-900 lg:text-[40px]">
          {title}
        </h2>
        {link && (
          <Link
            href={link.href}
            aria-label={link.aria}
            className="inline-flex h-11 shrink-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          >
            <span className={`${jurnalCaps} border-b border-brand-600 pb-0.5 text-brand-600`}>{link.label}</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-center justify-between gap-3 lg:mb-4">
      <h2 id={id} className="min-w-0 truncate text-[22px] font-extrabold leading-7 tracking-[-0.01em] text-white lg:text-[26px]">
        {title}
      </h2>
      {link && (
        <Link
          href={link.href}
          aria-label={link.aria}
          className="-mr-2 inline-flex h-11 shrink-0 items-center rounded-full px-2 text-[14px] font-bold text-brand-400 transition-colors hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}

/** A category's shelf: swiped on a phone, one row of the grid on a wide screen. */
function ShelfRow({ theme, products, sharedLead }: { theme: Theme; products: HomeProduct[]; sharedLead: string | null }) {
  const row = themedRow(theme);
  const list =
    theme === "afisha"
      ? "no-scrollbar -mx-4 flex snap-x overflow-x-auto lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:border-l lg:border-gray-900"
      : `no-scrollbar -mx-4 flex snap-x scroll-px-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0 ${
          theme === "jurnal" ? "gap-3 lg:grid-cols-4 lg:gap-x-6" : "gap-2.5 lg:grid-cols-5 lg:gap-4"
        }`;
  const item = theme === "afisha" ? "w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[24%] lg:w-auto" : "w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[23%] lg:w-auto";
  return (
    <ul className={list}>
      {products.map((p, i) => (
        <li key={p.id} className={`${item} ${i >= row ? "lg:hidden" : ""}`}>
          <HomeCard product={p} sharedLead={sharedLead} />
        </li>
      ))}
    </ul>
  );
}

/** The way to the whole catalogue, with its size. */
function AllProducts({ theme, total }: { theme: Theme; total: number }) {
  const { t } = useTranslations();
  const look =
    theme === "jurnal"
      ? `mt-10 flex h-[52px] w-full items-center justify-center gap-3 border border-gray-900 text-gray-900 ${jurnalCaps} transition-colors hover:bg-gray-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 lg:mx-auto lg:mt-14 lg:max-w-[360px]`
      : theme === "afisha"
        ? `-mx-4 mt-6 flex h-14 items-center justify-between gap-3 border-y border-gray-900 bg-gray-900 px-4 text-white ${afishaCaps} transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300 lg:mx-0 lg:mt-10`
        : "mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gray-800 text-[15px] font-bold text-white transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 lg:mx-auto lg:mt-12 lg:max-w-[360px]";
  return (
    <Link href="/catalog" className={look}>
      <span>
        {t("home.allProducts")} <span className="tabular-nums opacity-70">{total}</span>
      </span>
      {theme === "jurnal" ? null : theme === "afisha" ? (
        <ArrowRightIcon className="h-5 w-5" strokeWidth={2.2} />
      ) : (
        <ChevronRightIcon className="-mr-1 h-[18px] w-[18px] text-gray-400" />
      )}
    </Link>
  );
}
