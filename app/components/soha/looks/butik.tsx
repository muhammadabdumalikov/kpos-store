"use client";

import Link from "@/app/components/ShopLink";
import { useTranslations } from "@/hooks/useTranslations";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard, type HomeCategory, type HomeProduct } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { ArrowRightIcon, BoxIcon } from "../../icons/ShopIcons";
import { CategoryPhoto, CoverPhoto, SeeAll, SohaAbout, categoryHref, focus, gridLimits, useShopFace, type HomeProps, type IntroProps, type SohaParts } from "../parts";

// Butik: clothes, after the shop apps a clothes seller's customers already
// use. White and one ink, Manrope throughout. The shop's name centred over the
// search field; the categories open the page as big photos under a dark label
// band (the cover only stands in when there are none); then grey packshot
// tiles with a small white label, the name and a heavy price under them. The
// product page stands its thumbnails beside the photo (lib/soha-looks
// `gallery`), and its buttons and size boxes are black and square-ish.
// Paint: app/soha/butik.css.

/** Above the search bar: the shop's name in the middle, the tagline under it. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="bg-page px-4 pb-1 pt-3.5 text-center lg:sr-only">
      <h1 id="store-title" className="truncate font-head text-[22px] font-extrabold leading-7 tracking-[-0.01em] text-ink">
        {face.name}
      </h1>
      {face.tagline && <p className="mt-0.5 truncate text-[13px] leading-[18px] text-muted">{face.tagline}</p>}
    </section>
  );
}

/** The one label, a small white chip in the photo's corner: the markdown in red. */
function tagged(card: CardModel): CardModel {
  if (!card.pill) return card;
  const tone = card.pill.kind === "sale" ? "text-spot tabular-nums" : card.pill.kind === "soldOut" ? "text-muted" : "text-ink";
  return {
    ...card,
    pill: { ...card.pill, className: `keep-round absolute left-2 top-2 rounded-[5px] bg-white px-1.5 py-[5px] text-[11px] font-bold leading-none ${tone}` },
  };
}

/**
 * The card: the photo on a grey tile, the name under it and the price under
 * that, heavier than anything else on the card. The "+" is a black disc on
 * the photo's corner; in the cart it becomes a stepper along the photo's
 * lower edge, and a product with choices shows only its count there.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  return (
    <article className="relative flex h-full min-w-0 flex-col">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group flex min-w-0 flex-col ${focus}`}>
        <CardPhoto card={card} tile="r-tile bg-panel" />
        <h3 className="mt-2.5 line-clamp-2 break-words text-[13.5px] font-medium leading-[18px] text-gray-700">{card.name}</h3>
        <p className={`mt-1 flex flex-wrap items-baseline gap-x-1.5 tabular-nums ${card.soldOut ? "text-muted" : "text-ink"}`}>
          <span className="whitespace-nowrap text-[15.5px] font-extrabold leading-5">
            {card.amount} <span className="text-[12px] font-bold">{card.suffix}</span>
          </span>
          {card.was && <s className="whitespace-nowrap text-[12.5px] font-medium text-muted">{formatAmount(card.was)}</s>}
        </p>
        {card.orderLabel && <p className="mt-0.5 truncate text-[12.5px] leading-[18px] text-muted">{card.orderLabel}</p>}
      </Link>
      {/* Laid over the photo; only the control takes taps. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-card">
        <div className="absolute inset-x-2 bottom-2 flex justify-end">
          {card.hasOptions ? (
            <CartCount id={card.id} unit={card.unit} />
          ) : (
            <AddControl id={card.id} name={card.name} price={card.price} max={card.max} soldOut={card.soldOut} unit={card.unit} shape="corner" />
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * The categories as big photos, the name on a dark band across the foot of
 * each. One fills the width, two share it; from three on they scroll
 * sideways, two to a phone screen with the next one showing at the edge. A
 * wide screen sets up to four in a row; beyond that it scrolls too, the
 * fifth showing at the edge.
 */
function Rooms({ categories }: { categories: HomeCategory[] }) {
  const { t } = useTranslations();
  const n = categories.length;
  const scroll = n > 2;
  const tile =
    n === 1
      ? "w-full"
      : !scroll
        ? "min-w-0 flex-1"
        : `w-[calc(50%-22px)] shrink-0 snap-start ${n > 4 ? "lg:w-[calc(23%-12px)]" : "lg:w-auto lg:min-w-0 lg:flex-1"}`;
  return (
    <nav aria-label={t("home.categories")} className="mt-3 lg:mt-8">
      <ul className={`flex gap-3 lg:gap-4 ${scroll ? "no-scrollbar -mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 lg:mx-0 lg:scroll-px-0 lg:px-0" : ""}`}>
        {categories.map((c) => (
          <li key={c.id} className={tile}>
            <Link href={categoryHref(c.id)} className={`r-card relative block overflow-hidden bg-panel ${focus}`}>
              <CategoryPhoto src={c.image} className={`w-full ${n === 1 ? "aspect-[2/1] lg:aspect-[4/1]" : "aspect-[6/5] lg:aspect-[4/3]"}`} />
              <span className="butik-band absolute inset-x-0 bottom-0 flex h-8 items-center justify-center px-2 text-[13px] font-bold text-on-band lg:h-10 lg:text-[15px]">
                <span className="truncate">{c.name}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Home({ info, categories, products, sections, total, sharedLead }: HomeProps) {
  const { t } = useTranslations();
  const { cover } = useShopFace(info);
  const shelved = sections.length > 0;
  const hide = gridLimits(products.length, shelved, 2, 4);
  const grid = "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-9";

  /** A heavy title with a bare arrow on its right for "Hammasi". */
  const head = (id: string, name: string, all: { href: string; aria: string } | null) => (
    <div className="mb-3.5 flex items-center justify-between gap-3 lg:mb-5">
      <h2 id={id} className="min-w-0 truncate font-head text-[21px] font-extrabold leading-7 tracking-[-0.01em] text-ink lg:text-[28px] lg:leading-9">
        {name}
      </h2>
      {all && (
        <SeeAll href={all.href} label="" aria={all.aria} className="-mr-2 min-w-11 justify-center text-ink">
          <ArrowRightIcon className="h-6 w-6" strokeWidth={1.8} />
        </SeeAll>
      )}
    </div>
  );

  return (
    <>
      {categories.length > 0 ? <Rooms categories={categories} /> : <CoverPhoto cover={cover} className="r-card mt-3 aspect-[2/1] w-full lg:mt-8 lg:aspect-[4/1]" />}

      <section aria-labelledby="home-products" className="mt-8 lg:mt-12">
        {head("home-products", shelved ? t("home.newArrivals") : t("home.popular"), total > products.length ? { href: "/catalog", aria: t("home.allProducts") } : null)}
        {products.length > 0 ? (
          <div className={grid}>
            {products.map((p, i) => (
              <div key={p.id} className={`min-w-0 ${hide(i)}`}>
                <HomeCard product={p} sharedLead={sharedLead} />
              </div>
            ))}
          </div>
        ) : (
          <StatePanel icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />
        )}
      </section>

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`} className="mt-10 lg:mt-14">
            {head(`home-shelf-${s.id}`, s.name, { href: categoryHref(s.id), aria: `${t("home.seeAll")}: ${s.name}` })}
            <ul className={grid}>
              {s.products.map((p: HomeProduct, i) => (
                <li key={p.id} className={`min-w-0 ${i >= 4 ? "max-sm:hidden" : ""} ${i >= 6 ? "max-lg:hidden" : ""} ${i >= 4 ? "lg:hidden" : ""}`}>
                  <HomeCard product={p} sharedLead={sharedLead} />
                </li>
              ))}
            </ul>
          </section>
        ))}

      <SohaAbout info={info} orderLead={sharedLead} />
    </>
  );
}

export const butik: SohaParts = { Intro, Home, Card };
