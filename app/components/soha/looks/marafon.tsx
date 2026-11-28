"use client";

import Link from "@/app/components/ShopLink";
import type { CSSProperties } from "react";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { formatAmount } from "@/lib/format";
import { CartCount } from "../../AddControl";
import { HomeCard } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { BoxIcon } from "../../icons/ShopIcons";
import { sohaCols } from "../classes";
import { CoverPhoto, SeeAll, SohaAbout, categoryHref, focus, gridLimits, useShopFace, type HomeProps, type IntroProps, type SohaParts } from "../parts";

// Marafon: sport, after the brand shops of the trade (Nike, Gymshark). The
// photo does the talking: the cover from edge to edge with the shop's own
// line on it in slanted condensed caps, black and white pills, photo tiles
// 2px apart with no button on them, each category opened by its name as one
// huge word. The shop's name stands in the phone's bar (`bar: "wordmark"`).
// Paint: app/soha/marafon.css.

const display = "font-head font-black uppercase italic";
// The tiles reach the screen's edges, where a ring drawn outside them would be cut.
const tileFocus = "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/60";

/**
 * Roughly how wide a line of the display caps is, in ems: Sofia Sans Extra
 * Condensed 900 averages 0.43 for a Latin capital and 0.48 for a Cyrillic
 * one. The CSS divides the room by it to fit the type.
 */
function ems(text: string): number {
  let sum = 0;
  for (const ch of text.trim()) sum += ch === " " ? 0.13 : /[Ѐ-ӿ]/.test(ch) ? 0.5 : 0.45;
  return Math.max(sum, 1);
}

/** Above the bar: the delivery terms on a black strip, behind the theme's one lime dot. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  if (!face.delivery) return null;
  return (
    <p className="flex min-h-8 items-center justify-center gap-2 bg-band px-4 py-1.5 text-[12px] font-semibold uppercase leading-4 tracking-[0.07em] text-on-band">
      <span aria-hidden className="keep-round h-[7px] w-[7px] shrink-0 rounded-full bg-spot" />
      <span className="min-w-0 truncate">{face.delivery}</span>
    </p>
  );
}

/**
 * Under the bar: the cover from edge to edge with the tagline on its lower
 * left, over a plain dark scrim. Without a cover the tagline stands on black;
 * without a tagline the photo stands alone.
 */
function AfterBar({ info }: IntroProps) {
  const face = useShopFace(info);
  const covered = face.cover.url !== null;
  if (!covered && !face.tagline) return null;
  const fit = face.tagline
    ? ({ "--ems": ems(face.tagline), "--word": Math.max(...face.tagline.split(/\s+/).map(ems)) } as CSSProperties)
    : undefined;
  return (
    <div className={`marafon-hero relative -mx-4 overflow-hidden bg-band lg:mx-0 ${covered ? "h-[430px] lg:h-[520px]" : ""}`}>
      <CoverPhoto cover={face.cover} className="absolute inset-0 h-full w-full" />
      {covered && face.tagline && <div aria-hidden className="marafon-scrim absolute inset-0" />}
      {face.tagline && (
        <p
          style={fit}
          className={`marafon-tagline ${display} break-words text-white ${covered ? "absolute inset-x-4 bottom-5 lg:bottom-10 lg:left-10 lg:right-auto lg:w-[60%]" : "px-4 py-7 lg:w-[60%] lg:px-10 lg:py-12"}`}
        >
          {face.tagline}
        </p>
      )}
    </div>
  );
}

/** The one label, at the photo's lower left: the markdown in red on white, else "few left" or "sold out". */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  const tone = kind === "sale" ? "text-error-600" : kind === "low" ? "text-ink" : "text-muted";
  return { ...card, pill: { ...card.pill, className: `absolute bottom-2 left-2 bg-card px-[7px] py-[5px] text-[12px] font-bold leading-none ${tone}` } };
}

/**
 * The card: a 3:4 photo tile, the name and the price, all one link. There is
 * no button on it: a product is added on its own page, and the tile shows
 * the count in its corner once some are in the cart.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  return (
    <article className="relative min-w-0">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group block ${tileFocus}`}>
        <CardPhoto card={card} tile="marafon-photo bg-panel" />
        <div className="pl-4 pr-3 pt-2.5 lg:pl-0 lg:pr-4">
          <h3 className="line-clamp-2 break-words text-[14px] font-medium leading-[1.3] text-ink lg:text-[15px]">{card.name}</h3>
          {card.orderLabel && <p className="mt-0.5 truncate text-[12.5px] leading-4 text-muted">{card.orderLabel}</p>}
          {/* The sum never breaks; a long one sends "so'm" and the old price to the next line. */}
          <p className="mt-1 flex flex-wrap items-baseline gap-x-1 text-[14px] font-bold leading-5 lg:text-[15px]">
            <span className={`whitespace-nowrap ${card.soldOut ? "text-muted" : card.was ? "text-error-600" : "text-ink"}`}>{card.amount}</span>
            <span className={`whitespace-nowrap ${card.soldOut ? "text-muted" : card.was ? "text-error-600" : "text-ink"}`}>{card.suffix}</span>
            {card.was && <s className="ml-0.5 whitespace-nowrap text-[12.5px] font-normal text-muted">{formatAmount(card.was)}</s>}
          </p>
        </div>
      </Link>
      <div className="pointer-events-none absolute right-2 top-2">
        <CartCount id={card.id} unit={card.unit} />
      </div>
    </article>
  );
}

function Home({ info, categories, products, sections, total, sharedLead }: HomeProps) {
  const { t } = useTranslations();
  const look = useSohaLook();
  if (!look) return null;
  const shelved = sections.length > 0;
  const hide = gridLimits(products.length, shelved, look.phoneCols, look.cols, 2);
  const more = "text-[13.5px] font-semibold text-ink underline underline-offset-[3px]";
  const pill = `keep-round flex h-10 shrink-0 items-center whitespace-nowrap rounded-full border-[1.5px] border-ink px-[18px] text-[14px] font-semibold ${focus}`;
  const grid = `-mx-4 ${sohaCols(look)} gap-x-0.5 gap-y-6 lg:mx-0 lg:gap-y-10`;

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label={t("home.sections")} className="no-scrollbar -mx-4 mt-[18px] flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:mt-8 lg:flex-wrap lg:px-0">
          <Link href="/catalog" className={`${pill} bg-ink text-page`}>
            {t("home.seeAll")}
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={categoryHref(c.id)} className={`${pill} bg-page text-ink`}>
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      <section aria-labelledby="home-products" className="mt-4 lg:mt-12">
        <div className="mb-1 flex items-center justify-between gap-3 lg:mb-4">
          <h2 id="home-products" className={`${display} min-w-0 truncate pr-1 text-[30px] leading-none tracking-[0.01em] text-ink lg:text-[48px]`}>
            {shelved ? t("home.newArrivals") : t("home.popular")}
          </h2>
          {total > products.length && <SeeAll href="/catalog" label={t("home.seeAll")} aria={t("home.allProducts")} className={more} />}
        </div>
        {products.length > 0 ? (
          <ul className={grid}>
            {products.map((p, i) => (
              <li key={p.id} className={`min-w-0 ${hide(i)}`}>
                <HomeCard product={p} sharedLead={sharedLead} />
              </li>
            ))}
          </ul>
        ) : (
          <StatePanel className="mt-3" icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />
        )}
      </section>

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`} className="mt-[46px] lg:mt-20">
            <h2 id={`home-shelf-${s.id}`} style={{ "--ems": ems(s.name) } as CSSProperties} className={`marafon-word ${display} break-words text-ink`}>
              {s.name}
            </h2>
            <SeeAll href={categoryHref(s.id)} label={t("home.seeAll")} aria={`${t("home.seeAll")}: ${s.name}`} className={`${more} mb-1 lg:mb-3`} />
            {/* Two rows of two on a phone, one row of the grid on a wide screen. */}
            <ul className={grid}>
              {s.products.map((p, i) => (
                <li key={p.id} className={`min-w-0 ${i >= 4 ? "max-lg:hidden" : ""} ${i >= look.cols ? "lg:hidden" : ""}`}>
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

export const marafon: SohaParts = { Intro, AfterBar, Home, Card };
