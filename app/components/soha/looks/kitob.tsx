"use client";

import Link from "@/app/components/ShopLink";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { useCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { BoxIcon } from "../../icons/ShopIcons";
import { sohaCols } from "../classes";
import { CoverPhoto, SeeAll, SohaAbout, categoryHref, focus, gridLimits, useShopFace, type HomeProps, type IntroProps, type SohaParts } from "../parts";

// Kitob: a bookshop, after the booksellers of the trade (Waterstones,
// Labirint, Asaxiy books). The page is set like a book: the shop's own line
// as an epigraph between two rules, the cover as a strip under it, categories
// as underlined text tabs, covers three across standing on shelf lines with
// the title and the price under the shelf. Paint: app/soha/kitob.css.

/** Above the search bar: the shop's name. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="bg-page px-4 pb-1 pt-4 lg:sr-only">
      <h1 id="store-title" className="break-words font-head text-[24px] font-semibold leading-[30px] text-ink">
        {face.name}
      </h1>
    </section>
  );
}

/** Under the search bar: the tagline as an epigraph between two thin rules, then the cover from edge to edge. */
function AfterBar({ info }: IntroProps) {
  const face = useShopFace(info);
  if (!face.tagline && !face.cover.url) return null;
  return (
    <div className="pt-3 lg:pt-10">
      {face.tagline && (
        <p className="mx-auto max-w-[760px] break-words border-y border-ink px-6 pb-[17px] pt-4 text-center text-[19px] italic leading-[27px] text-ink lg:py-7 lg:text-[26px] lg:leading-9">
          {face.tagline}
        </p>
      )}
      <CoverPhoto
        cover={face.cover}
        className={`-mx-4 aspect-[390/150] w-[calc(100%+32px)] max-w-none lg:mx-0 lg:aspect-[5/1] lg:w-full ${face.tagline ? "mt-5 lg:mt-10" : ""}`}
      />
    </div>
  );
}

/** The one label on the cover: the markdown in the accent, else "few left" or "sold out" on paper. */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  const tone = kind === "sale" ? "bg-primary text-on-primary tabular-nums" : kind === "low" ? "bg-page text-ink" : "bg-page text-muted";
  return { ...card, pill: { ...card.pill, className: `absolute left-0 top-2 px-1.5 py-1 text-[12px] font-semibold leading-none ${tone}` } };
}

/**
 * The card: a 2:3 cover standing on its piece of the shelf, the title and
 * the price under the shelf. On the home page's shelves ("shelf") that is
 * all: the book's own page adds it. Where a shopper comes to buy (the
 * catalogue, related books) a small ruled "add" button follows the price,
 * and the stepper takes its place once the book is in the cart.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  const inCart = useCartQty(card.id) > 0;
  const onShelf = card.variant === "shelf";
  return (
    <article className="relative flex h-full min-w-0 flex-col">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group flex min-w-0 flex-1 flex-col ${focus}`}>
        <CardPhoto card={card} tile="kitob-cover r-tile bg-panel" />
        <span aria-hidden className="kitob-shelf block h-1.5 shrink-0 bg-line" />
        <h3 className="mt-2.5 line-clamp-3 break-words text-[13px] font-semibold leading-[17px] text-ink lg:text-[15px] lg:leading-5">{card.name}</h3>
        {card.orderLabel && <p className="mt-0.5 truncate text-[12px] italic leading-4 text-muted">{card.orderLabel}</p>}
        {/* The sum never breaks; a long one sends "so'm" and the old price to the next line. */}
        <p className="mt-[5px] flex flex-wrap items-baseline gap-x-1 text-[13.5px] font-bold leading-[18px] tabular-nums lg:text-[15px] lg:leading-5">
          <span className={`whitespace-nowrap ${card.soldOut ? "text-muted" : card.was ? "text-primary" : "text-ink"}`}>{card.amount}</span>
          <span className={`whitespace-nowrap ${card.soldOut ? "text-muted" : card.was ? "text-primary" : "text-ink"}`}>{card.suffix}</span>
          {card.was && <s className="ml-0.5 whitespace-nowrap text-[12px] font-normal text-muted">{formatAmount(card.was)}</s>}
        </p>
      </Link>
      {!onShelf &&
        (card.hasOptions ? (
          <div className="mt-2 flex empty:hidden">
            <CartCount id={card.id} unit={card.unit} />
          </div>
        ) : (
          // The cover already says "sold out"; nothing stands in for the button.
          (!card.soldOut || inCart) && (
            <div className="kitob-add mt-2">
              <AddControl id={card.id} name={card.name} price={card.price} max={card.max} soldOut={card.soldOut} unit={card.unit} shape="pill" />
            </div>
          )
        ))}
    </article>
  );
}

function Home({ info, categories, products, sections, total, sharedLead }: HomeProps) {
  const { t } = useTranslations();
  const look = useSohaLook();
  if (!look) return null;
  const shelved = sections.length > 0;
  const hide = gridLimits(products.length, shelved, look.phoneCols, look.cols, 2);
  const head = "flex min-h-11 items-center justify-between gap-3";
  const title = "min-w-0 truncate font-head text-[22px] font-semibold leading-7 text-ink lg:text-[28px] lg:leading-9";
  const more = "text-[12px] font-medium uppercase tracking-[0.09em] text-ink";
  const rows = `kitob-rows ${sohaCols(look)} gap-x-5 gap-y-[22px] lg:gap-x-8`;
  const tab = `flex min-h-11 shrink-0 items-center whitespace-nowrap ${focus}`;

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label={t("home.sections")} className="no-scrollbar -mx-4 mt-2 flex gap-[22px] overflow-x-auto px-4 text-[15px] leading-[22px] lg:mx-0 lg:mt-6 lg:flex-wrap lg:gap-x-8 lg:px-0 lg:text-[16px]">
          {/* "Everything" is where this page already stands; the others lead to their department. */}
          <Link href="/catalog" className={`${tab} font-semibold text-primary`}>
            <span className="border-b-2 border-primary pb-[5px]">{t("home.seeAll")}</span>
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={categoryHref(c.id)} className={`${tab} text-ink`}>
              <span className="border-b-2 border-transparent pb-[5px]">{c.name}</span>
            </Link>
          ))}
        </nav>
      )}

      <section aria-labelledby="home-products" className="mt-4 lg:mt-10">
        <div className={`${head} mb-2 lg:mb-4`}>
          <h2 id="home-products" className={title}>
            {shelved ? t("home.newArrivals") : t("home.popular")}
          </h2>
          {total > products.length && <SeeAll href="/catalog" label={t("home.seeAll")} aria={t("home.allProducts")} className={more} />}
        </div>
        {products.length > 0 ? (
          <ul className={rows}>
            {products.map((p, i) => (
              <li key={p.id} className={`min-w-0 ${hide(i)}`}>
                <HomeCard product={p} sharedLead={sharedLead} variant="shelf" />
              </li>
            ))}
          </ul>
        ) : (
          <StatePanel icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />
        )}
      </section>

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`} className="mt-9 lg:mt-14">
            <div className={`${head} mb-2 lg:mb-4`}>
              <h2 id={`home-shelf-${s.id}`} className={title}>
                {s.name}
              </h2>
              <SeeAll href={categoryHref(s.id)} label={t("home.seeAll")} aria={`${t("home.seeAll")}: ${s.name}`} className={more} />
            </div>
            {/* One shelf: three covers on a phone, a full row on a wide screen. */}
            <ul className={rows}>
              {s.products.map((p, i) => (
                <li key={p.id} className={`min-w-0 ${i >= look.phoneCols ? "max-lg:hidden" : ""} ${i >= look.cols ? "lg:hidden" : ""}`}>
                  <HomeCard product={p} sharedLead={sharedLead} variant="shelf" />
                </li>
              ))}
            </ul>
          </section>
        ))}

      <SohaAbout info={info} orderLead={sharedLead} />
    </>
  );
}

export const kitob: SohaParts = { Intro, AfterBar, Home, Card };
