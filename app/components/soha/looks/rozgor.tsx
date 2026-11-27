"use client";

import Link from "next/link";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { useCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { ArrowRightIcon, BoxIcon } from "../../icons/ShopIcons";
import { sohaCols } from "../classes";
import {
  CategoryPhoto,
  CoverPhoto,
  SeeAll,
  SohaAbout,
  categoryHref,
  dealsOf,
  focus,
  gridLimits,
  useShopFace,
  type HomeProps,
  type IntroProps,
  type SohaParts,
} from "../parts";

// Rozg'or: household goods, after the price-led shops of the trade (Fix
// Price, Target, Galamart). No hero: the delivery terms on a strip in the
// shop's colour, departments as quick links, the marked-down goods in a solid
// panel to swipe, the cover as a strip after it, and cards whose price is a
// yellow tag stuck over the photo's corner. Paint: app/soha/rozgor.css.

/** Above the search bar: the delivery strip, the shop's name and its own line. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="bg-page">
      {face.delivery && (
        <p className="flex min-h-8 items-center justify-center bg-primary px-4 py-1.5 text-center text-[13px] font-medium leading-[18px] text-on-primary lg:text-[14px]">
          {face.delivery}
        </p>
      )}
      <div className={`px-4 pt-3.5 lg:mx-auto lg:max-w-7xl ${face.tagline ? "lg:pt-6" : "lg:pt-0"}`}>
        <h1 id="store-title" className="break-words font-head text-[22px] font-extrabold leading-7 text-ink lg:sr-only">
          {face.name}
        </h1>
        {face.tagline && <p className="mt-[3px] break-words text-[13.5px] leading-[19px] text-muted lg:mt-0 lg:text-[16px] lg:leading-6">{face.tagline}</p>}
      </div>
    </section>
  );
}

/**
 * The one label on the photo. In the grid: the markdown in red, else "few
 * left" or "sold out" on white. In the deals panel: the markdown alone, large
 * and yellow, since it is why the card is there.
 */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  if (card.variant === "deal") {
    if (kind !== "sale") return { ...card, pill: null };
    return { ...card, pill: { ...card.pill, className: "rozgor-cut absolute left-2 top-2 bg-spot px-2 py-1.5 text-[20px] font-extrabold leading-none text-on-spot tabular-nums" } };
  }
  const tone = kind === "sale" ? "rozgor-sale-tag text-white tabular-nums" : kind === "low" ? "bg-card text-warning-700" : "bg-card text-muted";
  return { ...card, pill: { ...card.pill, className: `rozgor-tag absolute left-2 top-2 max-w-[calc(100%-16px)] truncate px-1.5 text-[12px] font-bold leading-[22px] ${tone}` } };
}

/**
 * The card: a white bordered card, the photo to its edges, the price as a
 * yellow tag over the photo's lower-left corner with the old price beside it,
 * the name under them and a round "+" on the photo. In the cart the stepper
 * stands on the photo above the tag, so the price stays in view.
 *
 * As a "deal" (the deals panel): no border and no "+", the markdown large on
 * the photo, the new price in red.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  const inCart = useCartQty(card.id) > 0;
  const href = `/products/${card.id}`;
  const ring = "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/60";
  const name = "mx-2.5 line-clamp-2 min-h-[34px] break-words text-[13px] leading-[17px] text-ink lg:text-[14px] lg:leading-[18px] lg:min-h-9";
  const was = card.was && <s className="whitespace-nowrap text-[12px] leading-[15px] text-muted tabular-nums">{formatAmount(card.was)}</s>;

  if (card.variant === "deal") {
    return (
      <article className="rozgor-deal h-full min-w-0 overflow-hidden bg-card">
        <Link href={href} aria-label={card.spoken} className={`group flex h-full min-w-0 flex-col pb-3 ${ring}`}>
          <CardPhoto card={card} tile="bg-card" />
          <h3 className={`${name} mt-[9px]`}>{card.name}</h3>
          <p className="mx-2.5 mt-1.5 flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
            <span className="rozgor-sale whitespace-nowrap text-[16px] font-extrabold leading-5">
              {card.amount} <span className="text-[12px] font-semibold">{card.suffix}</span>
            </span>
            {was}
          </p>
        </Link>
      </article>
    );
  }

  return (
    <article className="rozgor-card r-card relative flex h-full min-w-0 flex-col overflow-hidden border border-line bg-card">
      <Link href={href} aria-label={card.spoken} className={`group flex min-w-0 flex-1 flex-col pb-3 ${ring}`}>
        <CardPhoto card={card} tile="bg-card" />
        {/* The tag hangs over the photo's lower edge; the sum in it never breaks. */}
        <p className="relative -mt-[15px] ml-1 mr-0.5 flex flex-wrap items-end gap-x-[3px] tabular-nums">
          <span className={`rozgor-price whitespace-nowrap px-1.5 py-[5px] text-[16px] font-extrabold leading-5 ${card.soldOut ? "bg-panel text-muted" : card.was ? "rozgor-sale bg-spot" : "bg-spot text-on-spot"}`}>
            {card.amount} <span className="text-[12px] font-semibold">{card.suffix}</span>
          </span>
          {was}
        </p>
        <h3 className={`${name} mt-2`}>{card.name}</h3>
        {card.orderLabel && <p className="mx-2.5 mt-0.5 truncate text-[12px] leading-4 text-muted">{card.orderLabel}</p>}
      </Link>
      {/* Over the photo: only the control takes taps. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-card">
        <div className={`absolute inset-x-2 flex justify-end ${inCart ? "bottom-6" : "bottom-2"}`}>
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

function Home({ info, categories, products, sections, total, sharedLead }: HomeProps) {
  const { t } = useTranslations();
  const look = useSohaLook();
  const face = useShopFace(info);
  if (!look) return null;
  const shelved = sections.length > 0;
  const deals = dealsOf(products, sections);
  const hide = gridLimits(products.length, shelved, look.phoneCols, look.cols, 2);
  const head = "mt-4 flex min-h-11 items-center justify-between gap-3 lg:mt-10";
  const title = "min-w-0 truncate font-head text-[20px] font-extrabold leading-[26px] text-ink lg:text-[26px] lg:leading-8";
  const more = "text-[13.5px] font-semibold text-brand-600 lg:text-[14px]";
  const grid = `${sohaCols(look)} gap-2.5 lg:gap-4`;
  const link = `r-ctl flex h-14 min-w-0 items-center gap-2.5 border border-line bg-card pl-2 pr-2.5 ${focus}`;
  const linkName = "line-clamp-2 min-w-0 break-words text-[13.5px] font-semibold leading-[17px] text-ink";

  return (
    <>
      {categories.length > 0 && (
        <nav aria-labelledby="home-sections">
          <h2 id="home-sections" className={`${title} mt-6 lg:mt-8`}>
            {t("home.sections")}
          </h2>
          <ul className="mt-2.5 grid grid-cols-2 gap-2 lg:mt-4 lg:grid-cols-6 lg:gap-3">
            {categories.map((c) => (
              <li key={c.id} className="min-w-0">
                <Link href={categoryHref(c.id)} className={link}>
                  <CategoryPhoto src={c.image} className="r-tile h-10 w-10 shrink-0" />
                  <span className={linkName}>{c.name}</span>
                </Link>
              </li>
            ))}
            <li className="min-w-0">
              <Link href="/catalog" aria-label={t("home.allProducts")} className={link}>
                <span className="r-tile flex h-10 w-10 shrink-0 items-center justify-center bg-page text-brand-600">
                  <ArrowRightIcon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className={linkName}>{t("home.seeAll")}</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {/* Phone: the panel, then the cover, each edge to edge. Wide: side by side while the panel leaves room. */}
      <div className="lg:mt-10 lg:flex lg:flex-wrap lg:gap-4">
        {deals.length > 0 && (
          <section aria-labelledby="home-deals" className="rozgor-deals -mx-4 mt-6 bg-primary py-[18px] lg:mx-0 lg:mt-0 lg:min-w-0 lg:max-w-full lg:flex-none lg:p-6">
            <h2 id="home-deals" className="px-4 pb-3 font-head text-[20px] font-extrabold leading-[26px] text-on-primary lg:px-0 lg:text-[26px] lg:leading-8">
              {t("home.deals")}
            </h2>
            {/* A row to swipe: two cards to a phone's screen. */}
            <ul className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 lg:gap-4 lg:px-0">
              {deals.map((p, i) => (
                <li key={p.id} className={`min-w-[150px] max-w-[200px] flex-1 basis-[150px] lg:w-[190px] lg:flex-none ${i >= look.cols ? "lg:hidden" : ""}`}>
                  <HomeCard product={p} sharedLead={sharedLead} variant="deal" />
                </li>
              ))}
            </ul>
          </section>
        )}
        <CoverPhoto
          cover={face.cover}
          priority={false}
          className={`rozgor-cover -mx-4 h-[150px] w-[calc(100%+32px)] max-w-none lg:mx-0 lg:h-auto lg:max-h-[380px] lg:min-h-[200px] lg:w-auto lg:min-w-[320px] lg:flex-1 lg:self-stretch ${deals.length > 0 ? "" : "max-lg:mt-6"}`}
        />
      </div>

      <section aria-labelledby="home-products">
        <div className={head}>
          <h2 id="home-products" className={title}>
            {shelved ? t("home.newArrivals") : t("home.popular")}
          </h2>
          {total > products.length && <SeeAll href="/catalog" label={t("home.seeAll")} aria={t("home.allProducts")} className={more} />}
        </div>
        {products.length > 0 ? (
          <div className={grid}>
            {products.map((p, i) => (
              <div key={p.id} className={`min-w-0 ${hide(i)}`}>
                <HomeCard product={p} sharedLead={sharedLead} />
              </div>
            ))}
          </div>
        ) : (
          <StatePanel className="mt-1" icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />
        )}
      </section>

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`}>
            <div className={head}>
              <h2 id={`home-shelf-${s.id}`} className={title}>
                {s.name}
              </h2>
              <SeeAll href={categoryHref(s.id)} label={t("home.seeAll")} aria={`${t("home.seeAll")}: ${s.name}`} className={more} />
            </div>
            {/* Two rows on a phone, one on a wide screen. */}
            <ul className={grid}>
              {s.products.map((p, i) => (
                <li key={p.id} className={`min-w-0 ${i >= look.phoneCols * 2 ? "max-lg:hidden" : ""} ${i >= look.cols ? "lg:hidden" : ""}`}>
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

export const rozgor: SohaParts = { Intro, Home, Card };
