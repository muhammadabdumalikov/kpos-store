"use client";

import Link from "next/link";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { useCartQty, useProductCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import type { StoreInfo } from "@/lib/store-api";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { BoxIcon, ChevronRightIcon } from "../../icons/ShopIcons";
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

// Usta: building goods, after the builders' merchants (Toolstation, Screwfix,
// Home Depot). A black band with the search fused to a yellow button, a
// yellow delivery strip, departments as small bordered squares, the shop's
// line set large on a yellow field, goods in ruled cells that say what is in
// stock. Square everywhere; buttons are yellow with ink text. Paint:
// app/soha/usta.css, which also turns the phone's search bar into the band.

/** Above the search bar: the top of the black band, with the shop's name. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="bg-band px-4 pt-3 text-on-band lg:sr-only">
      <h1 id="store-title" className="truncate font-head text-[24px] font-semibold uppercase leading-[30px] tracking-[0.02em]">
        {face.name}
      </h1>
    </section>
  );
}

/** Under the band: the delivery terms on a yellow strip, edge to edge on a phone. */
function AfterBar({ info }: IntroProps) {
  return (
    <DeliveryLine
      info={info}
      className="-mx-4 h-[30px] bg-spot px-4 text-[13px] font-bold leading-none text-on-spot lg:mx-0 lg:mt-6 lg:h-10 lg:text-[14px]"
      iconClass="h-[19px] w-[19px]"
    />
  );
}

const VOWELS = "aeiouAEIOUаеёиоуыэюяўАЕЁИОУЫЭЮЯЎ";

/**
 * A long word in a 62px label ("Mahkamlagichlar") gets one soft hyphen near
 * its middle, after a vowel and before a consonant, so it breaks as a
 * syllable would and not wherever the line ends.
 */
function soft(label: string): string {
  return label
    .split(" ")
    .map((word) => {
      if (word.length < 11 || word.includes("-")) return word;
      let best = -1;
      for (let i = 2; i < word.length - 3; i++) {
        const open = VOWELS.includes(word[i]) && !VOWELS.includes(word[i + 1]) && VOWELS.includes(word[i + 2]);
        if (open && (best < 0 || Math.abs(i - word.length / 2) < Math.abs(best - word.length / 2))) best = i;
      }
      return best < 0 ? word : `${word.slice(0, best + 1)}­${word.slice(best + 1)}`;
    })
    .join(" ");
}

/**
 * The shop's own line, large, on a yellow field with the cover as a crop on
 * its right edge. A long line is set smaller so the block stays a block. A
 * shop with a cover and no line gets the cover as a strip.
 */
function Say({ info }: { info: StoreInfo | null }) {
  const face = useShopFace(info);
  if (!face.tagline) {
    return <CoverPhoto cover={face.cover} priority={false} className="-mx-4 h-[132px] w-[calc(100%+32px)] max-w-none lg:mx-0 lg:mt-2 lg:h-[220px] lg:w-full" />;
  }
  const length = face.tagline.length;
  const size = length > 90 ? "text-[18px] lg:text-[28px]" : length > 48 ? "text-[21px] lg:text-[34px]" : "text-[26px] lg:text-[44px]";
  return (
    <div className="-mx-4 flex min-h-[132px] bg-spot text-on-spot lg:mx-0 lg:mt-2 lg:min-h-[220px]">
      <p className={`min-w-0 flex-1 self-center break-words py-3 pl-4 pr-3 font-head font-semibold uppercase leading-[1.1] tracking-[0.005em] lg:px-10 ${size}`}>
        {face.tagline}
      </p>
      {face.cover.url && (
        <div className="relative w-[132px] shrink-0 lg:w-[38%]">
          <CoverPhoto cover={face.cover} priority={false} className="absolute inset-0 h-full w-full" />
        </div>
      )}
    </div>
  );
}

const STOCK_DOT = { in: "bg-success-600", low: "bg-warning-500", order: "bg-gray-400", out: "bg-gray-400" } as const;

/** "Omborda bor" with a green dot, or what stands in for it: few left, on order, sold out. */
function StockLine({ card }: { card: CardModel }) {
  const { t } = useTranslations();
  const text =
    card.stock === "in" ? t("product.inStock") : card.stock === "low" ? t("product.lowStock") : card.stock === "out" ? t("product.soldOut") : card.orderLabel;
  if (!text) return null;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-[12px] leading-4 text-gray-700">
      <span aria-hidden className={`keep-round h-2 w-2 shrink-0 rounded-full ${STOCK_DOT[card.stock]}`} />
      <span className="truncate">{text}</span>
    </p>
  );
}

/** The photo carries the markdown alone; the stock line says the rest. */
function tagged(card: CardModel): CardModel {
  if (card.pill?.kind !== "sale") return { ...card, pill: null };
  return { ...card, pill: { ...card.pill, className: "absolute left-0 top-0 bg-error-600 px-1.5 text-[12px] font-bold leading-[22px] text-white tabular-nums" } };
}

/**
 * The yellow square beside the price. A product with choices is added on its
 * own page: its card shows an arrow there instead (the whole card is the
 * link), and the count once some are in the cart.
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
 * The card: a ruled cell. The photo whole on white, the name on three lines,
 * the stock line, then the price in the condensed face with the old price
 * struck above it. Once in the cart the stepper takes a line of its own.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  const inCart = useCartQty(card.id) > 0;
  const stepperRow = inCart && !card.hasOptions;
  const tone = card.soldOut ? "text-muted" : card.was ? "text-error-600" : "text-ink";
  return (
    <article className="usta-cell relative flex h-full min-w-0 flex-col border-b border-r border-line bg-card px-2.5 pb-3 pt-2.5">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group flex min-w-0 flex-1 flex-col ${focus}`}>
        <CardPhoto card={card} tile="bg-card" />
        <h3 className="mt-2.5 line-clamp-3 min-h-[54px] break-words text-[13.5px] font-medium leading-[18px] text-ink">{card.name}</h3>
        <StockLine card={card} />
        {/* Room on the right for the button laid over the corner below. */}
        <div className="mt-auto flex min-h-[52px] flex-col justify-end pr-10 pt-2">
          {card.was && (
            <s className="whitespace-nowrap text-[12px] leading-[15px] text-muted tabular-nums">
              {formatAmount(card.was)} {card.suffix}
            </s>
          )}
          {/* The sum never breaks; a long one sends "so'm" to the next line instead of under the button. */}
          <span className={`flex flex-wrap items-baseline gap-x-[3px] font-head ${tone}`}>
            <span className="whitespace-nowrap text-[21px] font-semibold leading-[26px]">{card.amount}</span>
            <span className="whitespace-nowrap text-[13px] font-medium leading-[18px]">{card.suffix}</span>
          </span>
        </div>
      </Link>
      <div className={stepperRow ? "pt-2" : "absolute bottom-3 right-2.5"}>
        <Control card={card} />
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
  const head = "mt-5 flex min-h-11 items-center justify-between gap-3 border-b-2 border-ink lg:mt-12";
  const title = "usta-title flex min-w-0 items-center gap-[9px] font-head text-[22px] font-semibold uppercase leading-7 tracking-[0.01em] text-ink lg:text-[28px] lg:leading-9";
  const more = "font-head text-[13px] font-medium uppercase tracking-[0.04em] text-ink lg:text-[14px]";
  // Ruled cells: no gaps; each cell draws its right and lower rule, the grid its left one.
  const grid = `${sohaCols(look)} border-l border-line`;

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label={t("home.sections")} className="-mx-4 lg:mx-0">
          {/* Five fit a phone's width; more scroll. A wrapped row on a wide screen. */}
          <ul
            className={`no-scrollbar flex gap-3 overflow-x-auto px-4 pb-[18px] pt-4 lg:flex-wrap lg:justify-start lg:gap-x-7 lg:gap-y-5 lg:overflow-visible lg:px-0 lg:pb-6 lg:pt-8 ${
              categories.length >= 5 ? "justify-between" : ""
            }`}
          >
            {categories.map((c) => (
              <li key={c.id} className="w-[62px] shrink-0 lg:w-[92px]">
                <Link href={categoryHref(c.id)} className={`block ${focus}`}>
                  <CategoryPhoto src={c.image} fit="contain" className="h-[62px] w-[62px] border border-gray-300 bg-card lg:h-[92px] lg:w-[92px]" />
                  <span className="-mx-[5px] mt-1.5 line-clamp-2 break-words text-center text-[12px] font-semibold leading-[14px] text-ink lg:text-[13px] lg:leading-4">
                    {soft(c.name)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <Say info={info} />

      <section aria-labelledby="home-products">
        <div className={head}>
          <h2 id="home-products" className={title}>
            <span className="truncate">{shelved ? t("home.newArrivals") : t("home.popular")}</span>
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
          <StatePanel className="mt-3" icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />
        )}
      </section>

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`}>
            <div className={head}>
              <h2 id={`home-shelf-${s.id}`} className={title}>
                <span className="truncate">{s.name}</span>
              </h2>
              <SeeAll href={categoryHref(s.id)} label={t("home.seeAll")} aria={`${t("home.seeAll")}: ${s.name}`} className={more} />
            </div>
            {/* Two rows of cells on a phone, one on a wide screen. */}
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

export const usta: SohaParts = { Intro, AfterBar, Home, Card };
