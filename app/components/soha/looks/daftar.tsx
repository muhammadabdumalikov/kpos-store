"use client";

import Link from "@/app/components/ShopLink";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { useCartQty, useProductCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { ArrowRightIcon, BoxIcon, ChevronRightIcon } from "../../icons/ShopIcons";
import { sohaCols } from "../classes";
import {
  CategoryPhoto,
  CoverPhoto,
  DeliveryLine,
  SeeAll,
  SohaAbout,
  categoryHref,
  focus,
  gridLimits,
  useShopFace,
  type HomeProps,
  type IntroProps,
  type SohaParts,
} from "../parts";

// Daftar: stationery, after the bright shops of the trade (Smiggle, Typo,
// Flying Tiger). The categories are the first screen, as flat colour tiles;
// the cover comes after them as an outlined card with the delivery line.
// Titles are written with a marker (a yellow stroke behind them); products
// sit in ink-outlined cards with a square add button.
// Paint: app/soha/daftar.css.

/**
 * Above the search bar: the shop's name over a marker stroke and its tagline
 * as plain text. On a wide screen the header already names the shop, so only
 * the tagline shows.
 */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className={`bg-page px-4 pb-1 pt-3.5 lg:mx-auto lg:max-w-7xl lg:pb-0 ${face.tagline ? "lg:pt-8" : "lg:pt-0"}`}>
      <h1 id="store-title" className="break-words font-head text-[26px] font-bold leading-8 text-ink lg:sr-only">
        <span className="daftar-mark">{face.name}</span>
      </h1>
      {face.tagline && <p className="mt-1.5 break-words text-[14px] leading-5 text-gray-600 lg:mt-0 lg:text-[18px] lg:leading-7">{face.tagline}</p>}
    </section>
  );
}

const TILES = ["bg-[#ff7eb6]", "bg-[#19c2b0]", "bg-[#ffd23f]", "bg-[#4aa8ff]", "bg-[#a78bfa]"];
// Category tiles before "Hammasi": an odd number on a phone, so the ink tile completes the last pair; one row of six on a wide screen.
const PHONE_TILES = 7;
const WIDE_TILES = 5;
const WIDE_SPAN = ["", "lg:col-span-1", "lg:col-span-2", "lg:col-span-3", "lg:col-span-4", "lg:col-span-5"];

/** The one label on the photo: the markdown on marker yellow, else "few left" or "sold out" in an ink outline. */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  const tone =
    kind === "sale" ? "bg-spot text-on-spot tabular-nums" : `bg-card shadow-[inset_0_0_0_1.5px_var(--color-ink)] ${kind === "low" ? "text-ink" : "text-muted"}`;
  return { ...card, pill: { ...card.pill, className: `daftar-tag absolute left-2 top-2 px-1.5 py-[5px] text-[12.5px] font-bold leading-none ${tone}` } };
}

/**
 * The square add button at the card's lower right. A product with choices is
 * added on its own page: its card shows an arrow there instead (the whole
 * card is the link), and the count once some are in the cart.
 */
function Control({ card }: { card: CardModel }) {
  const picked = useProductCartQty(card.id) > 0;
  if (!card.hasOptions) {
    return <AddControl id={card.id} name={card.name} price={card.price} max={card.max} soldOut={card.soldOut} unit={card.unit} shape="inline" />;
  }
  if (picked) return <CartCount id={card.id} unit={card.unit} />;
  return card.soldOut ? null : (
    <span aria-hidden className="add-mark pointer-events-none flex items-center justify-center">
      <ChevronRightIcon className="h-5 w-5" />
    </span>
  );
}

/**
 * The card: an ink-outlined box with the whole photo on white, a rule under
 * it, the name, the old price over the price and the add button beside them.
 * Once in the cart the stepper takes a line of its own.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  const inCart = useCartQty(card.id) > 0;
  const stepperRow = inCart && !card.hasOptions;
  return (
    <article className="r-card relative flex h-full min-w-0 flex-col overflow-hidden border-[1.5px] border-ink bg-card">
      {/* The outline clips what is drawn outside the link, so its ring is drawn inside. */}
      <Link
        href={`/products/${card.id}`}
        aria-label={card.spoken}
        className="group flex min-w-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/60"
      >
        <CardPhoto card={card} tile="daftar-photo border-b-[1.5px] border-ink bg-card" />
        <h3 className="mx-2.5 mt-2.5 line-clamp-2 min-h-9 break-words text-[13.5px] leading-[18px] text-ink lg:text-[14px] lg:leading-[19px]">{card.name}</h3>
        {card.orderLabel && <p className="mx-2.5 mt-0.5 truncate text-[12px] leading-4 text-muted">{card.orderLabel}</p>}
        {/* Room on the right for the button laid over the corner below. The sum never breaks; a long one sends "so'm" to the next line. */}
        <div className={`mt-auto flex min-h-[54px] flex-col justify-end pl-2.5 pr-[52px] pt-2 ${stepperRow ? "pb-2" : "pb-3"}`}>
          {card.was && <s className="whitespace-nowrap text-[12px] leading-[14px] text-muted tabular-nums">{formatAmount(card.was)}</s>}
          <span className={`flex flex-wrap gap-x-1 text-[15px] font-bold leading-5 tabular-nums ${card.soldOut ? "text-muted" : card.was ? "text-error-600" : "text-ink"}`}>
            <span className="whitespace-nowrap">{card.amount}</span>
            <span className="whitespace-nowrap">{card.suffix}</span>
          </span>
        </div>
      </Link>
      <div className={stepperRow ? "px-2.5 pb-3" : "absolute bottom-3 right-2.5"}>
        <Control card={card} />
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
  const hide = gridLimits(products.length, shelved, look.phoneCols, look.cols, 2);
  const tiles = categories.slice(0, PHONE_TILES);
  // "Hammasi" pairs with the last tile on a phone; after an even number it is a bar across both columns.
  const alone = tiles.length % 2 === 0;
  const wideSpan = WIDE_SPAN[6 - Math.min(tiles.length, WIDE_TILES)];
  const title = "min-w-0 break-words font-head text-[22px] font-bold leading-7 text-ink lg:text-[28px] lg:leading-9";
  const more = "text-[13.5px] font-semibold text-ink underline underline-offset-[3px]";
  const name = "font-head text-[16px] font-bold leading-5";

  return (
    <>
      {tiles.length > 0 && (
        <nav aria-labelledby="home-sections" className="mt-4 lg:mt-8">
          <h2 id="home-sections" className={title}>
            <span className="daftar-mark">{t("home.sections")}</span>
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-4 lg:mt-4 lg:grid-cols-6">
            {tiles.map((c, i) => (
              <li key={c.id} className={`min-w-0 ${i >= WIDE_TILES ? "lg:hidden" : ""}`}>
                <Link href={categoryHref(c.id)} className={`r-card flex h-full min-h-[150px] flex-col justify-between gap-1.5 p-3 text-ink ${TILES[i % TILES.length]} ${focus}`}>
                  <CategoryPhoto src={c.image} className="r-tile h-[88px] w-[88px] self-center border-4 border-white bg-white" />
                  <span className={`line-clamp-2 break-words ${name}`}>{c.name}</span>
                </Link>
              </li>
            ))}
            <li className={`min-w-0 ${alone ? "max-lg:col-span-2" : ""} ${wideSpan}`}>
              <Link
                href="/catalog"
                className={`r-card flex h-full flex-col justify-between gap-1.5 bg-ink p-3 text-white lg:min-h-[150px] ${alone ? "max-lg:min-h-16 max-lg:flex-row-reverse max-lg:items-center max-lg:px-4" : "min-h-[150px]"} ${focus}`}
              >
                <ArrowRightIcon className={`h-[26px] w-[26px] shrink-0 ${alone ? "lg:self-end" : "self-end"}`} />
                <span className={name}>{t("home.seeAll")}</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {/* After the tiles, so the categories stay the first screen: the cover as an outlined card, the delivery terms under it. */}
      <CoverPhoto cover={face.cover} priority={false} className="r-card mt-4 aspect-[358/150] w-full border-[1.5px] border-ink lg:mt-8 lg:aspect-[4/1]" />
      <DeliveryLine info={info} className="mt-3 text-[13.5px] leading-5 text-ink lg:text-[15px]" iconClass="h-5 w-5" />

      <section aria-labelledby="home-products" className="mt-4 lg:mt-10">
        <div className="mb-1.5 flex min-h-11 items-center justify-between gap-3 lg:mb-3">
          <h2 id="home-products" className={title}>
            <span className="daftar-mark">{shelved ? t("home.newArrivals") : t("home.popular")}</span>
          </h2>
          {total > products.length && <SeeAll href="/catalog" label={t("home.seeAll")} aria={t("home.allProducts")} className={more} />}
        </div>
        {products.length > 0 ? (
          <ul className={`${sohaCols(look)} gap-3 lg:gap-4`}>
            {products.map((p, i) => (
              <li key={p.id} className={`min-w-0 ${hide(i)}`}>
                <HomeCard product={p} sharedLead={sharedLead} />
              </li>
            ))}
          </ul>
        ) : (
          <StatePanel icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />
        )}
      </section>

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`} className="mt-4 lg:mt-10">
            <div className="mb-1.5 flex min-h-11 items-center justify-between gap-3 lg:mb-3">
              <h2 id={`home-shelf-${s.id}`} className={title}>
                <span className="daftar-mark">{s.name}</span>
              </h2>
              <SeeAll href={categoryHref(s.id)} label={t("home.seeAll")} aria={`${t("home.seeAll")}: ${s.name}`} className={more} />
            </div>
            {/* Two rows of two on a phone, one row of the grid on a wide screen. */}
            <ul className={`${sohaCols(look)} gap-3 lg:gap-4`}>
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

export const daftar: SohaParts = { Intro, Home, Card };
