"use client";

import Link from "@/app/components/ShopLink";
import type { CSSProperties } from "react";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { useProductCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard, type HomeProduct } from "../../HomeContent";
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

// O'ynoqi: children's goods, after the toy shops of the trade (Hamleys,
// Detsky Mir). A band in the shop's accent that holds the name, the search
// and the delivery line; the cover as a rounded card with the shop's own line
// under it; categories as pastel squares; every product section a grey panel
// of identical white cards with an outlined "add" pill.
// Paint: app/soha/oynoqi.css.

/** Above the search bar: the shop's name, opening the band. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="bg-band px-4 pb-1 pt-3.5 text-on-band lg:sr-only">
      <h1 id="store-title" className="break-words font-head text-[24px] font-bold leading-[30px]">
        {face.name}
      </h1>
    </section>
  );
}

/**
 * Under the search bar: the delivery line closes the band, square; then the
 * cover as a card and the tagline as plain text under it.
 */
function AfterBar({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <>
      <DeliveryLine
        info={info}
        className="oynoqi-band -mx-4 bg-band px-4 pb-3 pt-0.5 text-[12.5px] font-semibold leading-[18px] text-on-band lg:mx-0 lg:px-0 lg:py-2.5 lg:text-[14px] lg:leading-5"
      />
      <CoverPhoto cover={face.cover} className="r-card mt-4 aspect-[358/190] w-full lg:mt-6 lg:aspect-[4/1]" />
      {face.tagline && (
        <p className="mt-3.5 break-words font-head text-[19px] font-bold leading-[26px] text-ink lg:mt-5 lg:text-[26px] lg:leading-9">{face.tagline}</p>
      )}
    </>
  );
}

const PASTELS = ["bg-[#fff0b3]", "bg-[#d8ecff]", "bg-[#d6f5e3]", "bg-[#ffdfe9]"];
// The category grid is two rows of four on a phone, one row of eight on a wide screen; the last cell is "Hammasi".
const CATEGORY_CELLS = 7;

const VOWELS = "aeiouAEIOU";
/**
 * A soft hyphen in each long word of a category's name, so it can break
 * under a narrow square: after a vowel, before a consonant and a vowel,
 * nearest the middle.
 */
function hyphenated(name: string): string {
  return name
    .split(" ")
    .map((word) => {
      if (word.length < 11 || word.includes("-")) return word;
      let at = -1;
      for (let i = 2; i < word.length - 3; i++) {
        const breakable = VOWELS.includes(word[i]) && !VOWELS.includes(word[i + 1]) && VOWELS.includes(word[i + 2]);
        if (breakable && (at < 0 || Math.abs(i - word.length / 2) < Math.abs(at - word.length / 2))) at = i;
      }
      return at < 0 ? word : `${word.slice(0, at + 1)}­${word.slice(at + 1)}`;
    })
    .join(" ");
}

/** The one label on the photo: the markdown on sun yellow, else "few left". "Sold out" is said where the button was. */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || (kind !== "sale" && kind !== "low")) return { ...card, pill: null };
  const tone = kind === "sale" ? "bg-spot text-on-spot tabular-nums" : "bg-card text-ink";
  return { ...card, pill: { ...card.pill, className: `absolute left-1.5 top-1.5 rounded-[9px] px-2 py-[5px] text-[12.5px] font-extrabold leading-none ${tone}` } };
}

const pill = "flex h-9 w-full items-center justify-center gap-1 rounded-full border-[1.5px] border-primary text-[13.5px] font-extrabold text-primary";

/**
 * The card: a white tile with the photo, the name, the price and a full-width
 * outlined pill that adds the product; once in the cart the stepper stands in
 * the pill's place. A product with choices is added on its own page: its pill
 * says "choose" and is part of the card's link, and the count takes its place
 * once some are in the cart.
 */
function Card({ card: model }: { card: CardModel }) {
  const { t } = useTranslations();
  const card = tagged(model);
  const picked = useProductCartQty(card.id) > 0;
  const chosenElsewhere = card.hasOptions && !card.soldOut;

  return (
    <article className="oynoqi-card relative flex h-full min-w-0 flex-col rounded-[16px] bg-card p-2 pb-2.5">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group flex min-w-0 flex-1 flex-col rounded-[11px] ${focus}`}>
        <CardPhoto card={card} tile="rounded-[11px] bg-gray-50" />
        <h3 className="mt-2 line-clamp-2 min-h-[34px] break-words px-0.5 text-[13px] leading-[17px] text-ink lg:text-[14px] lg:leading-[19px]">{card.name}</h3>
        {card.orderLabel && <p className="mt-0.5 truncate px-0.5 text-[12px] leading-4 text-muted">{card.orderLabel}</p>}
        {/* The sum never breaks; a long one sends "so'm" and the old price to the next line. */}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-1 px-0.5 pb-2 pt-1.5 font-extrabold leading-[19px] tabular-nums">
          <span className={`whitespace-nowrap text-[15px] ${card.soldOut ? "text-muted" : card.was ? "text-error-600" : "text-ink"}`}>{card.amount}</span>
          <span className={`whitespace-nowrap text-[12px] font-bold ${card.soldOut ? "text-muted" : card.was ? "text-error-600" : "text-ink"}`}>{card.suffix}</span>
          {card.was && <s className="ml-0.5 whitespace-nowrap text-[12px] font-normal text-muted">{formatAmount(card.was)}</s>}
        </p>
        {chosenElsewhere && !picked && (
          <span aria-hidden className={pill}>
            {t("productOptions.choose")}
            <ChevronRightIcon className="h-4 w-4" />
          </span>
        )}
      </Link>
      {chosenElsewhere ? (
        picked && (
          <div className="flex h-9 items-center justify-center">
            <CartCount id={card.id} unit={card.unit} />
          </div>
        )
      ) : (
        <div className="oynoqi-add">
          <AddControl id={card.id} name={card.name} price={card.price} max={card.max} soldOut={card.soldOut} unit={card.unit} shape="pill" />
        </div>
      )}
    </article>
  );
}

function Home({ info, categories, products, sections, total, sharedLead }: HomeProps) {
  const { t } = useTranslations();
  const look = useSohaLook();
  if (!look) return null;
  const shelved = sections.length > 0;
  const hide = gridLimits(products.length, shelved, look.phoneCols, look.cols, 2);
  const cells = categories.slice(0, CATEGORY_CELLS);
  // "Hammasi" takes the rest of the last row: of four columns on a phone, of eight on a wide screen.
  const phoneSpan = 4 - (cells.length % 4);
  const wideSpan = 8 - cells.length;
  const title = "min-w-0 truncate font-head text-[19px] font-bold leading-6 text-ink lg:text-[24px] lg:leading-[30px]";
  const more = "text-[13.5px] font-bold text-primary";

  /** A grey panel: a title, "Hammasi" and a grid of cards. */
  const panel = (id: string, name: string, href: string | null, aria: string, list: HomeProduct[], hidden: (i: number) => string) => (
    <section key={id} aria-labelledby={id} className="-mx-1.5 mt-[22px] rounded-[22px] bg-panel px-3 pb-3 pt-1.5 lg:mx-0 lg:mt-8 lg:px-5 lg:pb-5 lg:pt-3">
      <div className="flex min-h-11 items-center justify-between gap-3 px-1 pb-1.5">
        <h2 id={id} className={title}>
          {name}
        </h2>
        {href && <SeeAll href={href} label={t("home.seeAll")} aria={aria} className={more} />}
      </div>
      <ul className={`${sohaCols(look)} gap-2.5 lg:gap-4`}>
        {list.map((p, i) => (
          <li key={p.id} className={`min-w-0 ${hidden(i)}`}>
            <HomeCard product={p} sharedLead={sharedLead} />
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <>
      {cells.length > 0 && (
        <nav aria-labelledby="home-sections" className="mt-[26px] lg:mt-10">
          <h2 id="home-sections" className={title}>
            {t("home.sections")}
          </h2>
          <ul className="mt-3 grid grid-cols-4 gap-x-2.5 gap-y-3.5 lg:mt-4 lg:grid-cols-8 lg:gap-4">
            {cells.map((c, i) => (
              <li key={c.id} className="min-w-0">
                <Link href={categoryHref(c.id)} className={`r-tile block text-center ${focus}`}>
                  <span className={`r-tile flex aspect-square items-center justify-center ${PASTELS[i % PASTELS.length]}`}>
                    <CategoryPhoto src={c.image} className="h-[73%] w-[73%] rounded-[12px]" />
                  </span>
                  <span className="-mx-1 mt-1.5 line-clamp-2 block break-words text-[12.5px] font-bold leading-[15px] text-ink lg:text-[14px] lg:leading-[18px]">
                    {hyphenated(c.name)}
                  </span>
                </Link>
              </li>
            ))}
            <li className="oynoqi-all min-w-0" style={{ "--sp": phoneSpan, "--sw": wideSpan } as CSSProperties}>
              <Link href="/catalog" className={`r-tile block ${focus}`}>
                <span className="oynoqi-all-box r-tile relative flex bg-panel text-primary">
                  <span
                    className={`absolute inset-0 flex items-center justify-between px-[18px] font-head text-[16px] font-bold ${phoneSpan === 1 ? "max-lg:justify-center max-lg:px-0" : ""} ${wideSpan === 1 ? "lg:justify-center lg:px-0" : ""}`}
                  >
                    <span className={`${phoneSpan === 1 ? "max-lg:hidden" : ""} ${wideSpan === 1 ? "lg:hidden" : ""}`}>{t("home.seeAll")}</span>
                    <ArrowRightIcon className="h-[22px] w-[22px] shrink-0" />
                  </span>
                </span>
                {/* One column wide, the name stands under the square like its neighbours'. */}
                <span
                  className={`mt-1.5 block text-center text-[12.5px] font-bold leading-[15px] text-ink lg:text-[14px] lg:leading-[18px] ${phoneSpan === 1 ? "" : "max-lg:hidden"} ${wideSpan === 1 ? "" : "lg:hidden"}`}
                >
                  {t("home.seeAll")}
                </span>
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {products.length > 0 ? (
        panel("home-products", shelved ? t("home.newArrivals") : t("home.popular"), total > products.length ? "/catalog" : null, t("home.allProducts"), products, hide)
      ) : (
        <StatePanel className="mt-6" icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />
      )}

      {products.length > 0 &&
        sections.map((s) =>
          // Two rows of two on a phone, one row of the grid on a wide screen.
          panel(`home-shelf-${s.id}`, s.name, categoryHref(s.id), `${t("home.seeAll")}: ${s.name}`, s.products, (i) => `${i >= 4 ? "max-lg:hidden" : ""} ${i >= look.cols ? "lg:hidden" : ""}`),
        )}

      <SohaAbout info={info} orderLead={sharedLead} />
    </>
  );
}

export const oynoqi: SohaParts = { Intro, AfterBar, Home, Card };
