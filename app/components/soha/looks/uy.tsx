"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard, type HomeProduct } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { BoxIcon } from "../../icons/ShopIcons";
import { CategoryPhoto, CoverPhoto, SeeAll, SohaAbout, categoryHref, focus, useShopFace, type HomeProps, type IntroProps, type SohaParts } from "../parts";

// Uy: furniture, after Article and IKEA. A quiet showroom: greige paper, one
// ink, square corners, Raleway set light. The room photo fills the screen's
// width with the shop's own line on it in light caps (one of the two trade
// themes whose cover carries text), the departments are photos under a dark
// label bar, and each section opens with one wide product before the rest in
// two columns. Paint: app/soha/uy.css.

/** Above the search bar: the shop's name in spaced caps. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="bg-page px-4 pb-0.5 pt-[18px] lg:sr-only">
      <h1 id="store-title" className="truncate font-head text-[17px] font-normal uppercase leading-[1.2] tracking-[0.3em] text-ink">
        {face.name}
      </h1>
    </section>
  );
}

/**
 * Under the search bar: the cover from edge to edge with the tagline on its
 * lower left, over a plain dark scrim. Without a cover the tagline is set on
 * the page; without a tagline the photo stands bare. A long tagline is set
 * smaller and gets a taller scrim.
 */
function AfterBar({ info }: IntroProps) {
  const { tagline, cover } = useShopFace(info);
  const caps = "break-words font-head font-light uppercase leading-[1.18] tracking-[0.06em]";
  if (!cover.url) {
    return tagline ? <p className={`mt-4 text-[24px] text-ink lg:mt-10 lg:text-[40px] ${caps}`}>{tagline}</p> : null;
  }
  const long = tagline !== null && tagline.length > 70;
  return (
    <div className="relative -mx-4 mt-2 h-[400px] overflow-hidden bg-panel lg:mx-0 lg:mt-6 lg:h-[520px]">
      <CoverPhoto cover={cover} className="absolute inset-0 h-full w-full" />
      {tagline && (
        <>
          <div aria-hidden className={`uy-scrim absolute inset-0 ${long ? "uy-scrim--tall" : ""}`} />
          <p className={`absolute inset-x-4 bottom-[22px] text-on-band lg:inset-x-10 lg:bottom-10 lg:max-w-[760px] lg:text-[44px] ${long ? "text-[21px]" : "text-[28px]"} ${caps}`}>
            {tagline}
          </p>
        </>
      )}
    </div>
  );
}

/** The one label, flush in the photo's corner: the markdown in red, else "few left" or "sold out". */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  const tone = kind === "sale" ? "text-spot tabular-nums" : "text-ink";
  return { ...card, pill: { ...card.pill, className: `absolute left-0 top-0 bg-page px-2 py-1.5 text-[12px] font-semibold leading-none ${tone}` } };
}

/**
 * The card: a square photo on beige with a small round "+" on its corner, the
 * name and the price under it. As "wide" (the product a section opens with)
 * the photo is a landscape and the name and the price share one line. In the
 * cart the "+" becomes a stepper along the photo's lower edge; a product with
 * choices shows only its count there.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  const wide = card.variant === "wide";
  const tone = card.soldOut ? "text-muted" : card.was ? "text-spot" : "text-ink";
  const was = card.was && <s className="whitespace-nowrap text-[12.5px] font-normal text-muted">{formatAmount(card.was)}</s>;
  const price = (
    <span className={`whitespace-nowrap font-semibold ${tone}`}>
      {card.amount} {card.suffix}
    </span>
  );
  const order = card.orderLabel && <p className="mt-0.5 truncate text-[12.5px] leading-[18px] text-muted">{card.orderLabel}</p>;

  return (
    <article className={`relative flex h-full min-w-0 flex-col ${wide ? "uy-wide" : ""}`}>
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group flex min-w-0 flex-col ${focus}`}>
        <CardPhoto card={card} tile="bg-panel" />
        {wide ? (
          <div className="mt-2.5 flex items-baseline justify-between gap-3.5 text-[15px] leading-[1.4] tabular-nums">
            <h3 className="line-clamp-2 min-w-0 break-words font-normal text-ink">{card.name}</h3>
            <span className="flex shrink-0 items-baseline gap-[7px]">
              {was}
              {price}
            </span>
          </div>
        ) : (
          <>
            <h3 className="mt-[9px] line-clamp-2 break-words text-[13.5px] font-normal leading-[1.35] text-ink">{card.name}</h3>
            <p className="mt-[3px] flex flex-wrap items-baseline gap-x-[7px] text-[14px] leading-5 tabular-nums">
              {price}
              {was}
            </p>
          </>
        )}
        {order}
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

/** Columns of the departments on a wide screen: one row where they fit, else rows of three or four. */
const ROOM_COLS = ["", "lg:grid-cols-3", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5", "lg:grid-cols-3"];

function Home({ info, categories, products, sections, total, sharedLead }: HomeProps) {
  const { t } = useTranslations();
  const shelved = sections.length > 0;
  const title = "min-w-0 font-head font-light leading-[1.1] text-ink";

  /** A light title with "Hammasi" on its right. */
  const head = (id: string, name: string, all: { href: string; aria: string } | null) => (
    <div className="flex min-h-11 items-center justify-between gap-3 pb-2.5 pt-8 lg:pb-5 lg:pt-14">
      <h2 id={id} className={`truncate text-[28px] lg:text-[36px] ${title}`}>
        {name}
      </h2>
      {all && <SeeAll href={all.href} label={t("home.seeAll")} aria={all.aria} className="text-[13.5px] font-medium text-ink underline underline-offset-[3px]" />}
    </div>
  );

  /**
   * A section's products: the first one wide, the rest in two columns. A wide
   * screen sets the wide one beside two of the rest. `some` keeps a section
   * short when others follow it: five on a phone, one row on a wide screen.
   */
  const shelf = (list: HomeProduct[], some: boolean) => (
    <ul className="grid grid-cols-2 gap-x-2.5 gap-y-[22px] lg:grid-cols-4 lg:gap-x-5 lg:gap-y-8">
      {list.map((p, i) => (
        <li key={p.id} className={`min-w-0 ${i === 0 ? "col-span-2" : ""} ${some && i > 4 ? "max-lg:hidden" : ""} ${some && i > 2 ? "lg:hidden" : ""}`}>
          <HomeCard product={p} sharedLead={sharedLead} variant={i === 0 ? "wide" : undefined} />
        </li>
      ))}
    </ul>
  );

  // An odd one out closes the departments across both columns of a phone.
  const lastWide = categories.length % 2 === 1 ? categories.length - 1 : -1;

  return (
    <>
      {categories.length > 0 && (
        <section aria-labelledby="home-sections">
          <h2 id="home-sections" className={`pb-4 pt-[34px] text-[30px] lg:pb-6 lg:pt-14 lg:text-[40px] ${title}`}>
            {t("home.sections")}
          </h2>
          <ul className={`grid grid-cols-2 gap-2.5 lg:gap-5 ${ROOM_COLS[categories.length] ?? "lg:grid-cols-4"}`}>
            {categories.map((c, i) => (
              <li key={c.id} className={`min-w-0 ${i === lastWide ? "max-lg:col-span-2" : ""}`}>
                <Link href={categoryHref(c.id)} className={`block bg-panel ${focus}`}>
                  <span className="flex h-[30px] items-center bg-band px-2.5 text-[13px] font-medium text-on-band">
                    <span className="truncate">{c.name}</span>
                  </span>
                  <CategoryPhoto src={c.image} className={`w-full ${i === lastWide ? "max-lg:h-[190px] lg:aspect-[4/3]" : "aspect-[4/3]"}`} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="home-products">
        {head("home-products", shelved ? t("home.newArrivals") : t("home.popular"), total > products.length ? { href: "/catalog", aria: t("home.allProducts") } : null)}
        {products.length > 0 ? shelf(products, shelved) : <StatePanel icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />}
      </section>

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`}>
            {head(`home-shelf-${s.id}`, s.name, { href: categoryHref(s.id), aria: `${t("home.seeAll")}: ${s.name}` })}
            {shelf(s.products, true)}
          </section>
        ))}

      <SohaAbout info={info} orderLead={sharedLead} />
    </>
  );
}

export const uy: SohaParts = { Intro, AfterBar, Home, Card };
