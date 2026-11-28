"use client";

import Link from "@/app/components/ShopLink";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { useCartQty, useProductCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import type { StoreInfo } from "@/lib/store-api";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard, type HomeProduct } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { BoxIcon } from "../../icons/ShopIcons";
import { CategoryPhoto, CoverPhoto, SeeAll, SohaAbout, categoryHref, focus, useShopFace, type HomeProps, type IntroProps, type SohaParts } from "../parts";

// Mayin: cosmetics, after Sephora and Glossier. White and nude, one ink and a
// rose for the markdown alone. The name in spaced caps, categories as chips
// with a round photo, the shop's own line on a nude field beside the cover,
// then small shelves of identical bordered cards with an outlined "Qo'shish".
// Ysabeau (a flared sans) for the name and titles. Paint: app/soha/mayin.css.

/** Above the search bar: the shop's name, centred, in spaced caps. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="flex h-[46px] items-end justify-center bg-page px-4 lg:sr-only">
      <h1 id="store-title" className="min-w-0 truncate pl-[0.22em] font-head text-[18px] font-medium uppercase leading-[30px] tracking-[0.22em] text-ink">
        {face.name}
      </h1>
    </section>
  );
}

/**
 * The nude field: the tagline on the left, the cover on the right with
 * nothing on it; the delivery terms as a quiet line under it. It follows the
 * chips, so it is part of the home page body and not a block under the bar.
 * A long tagline is set smaller and the field grows with it.
 */
function Say({ info }: { info: StoreInfo | null }) {
  const face = useShopFace(info);
  const { tagline, cover } = face;
  const size = tagline && tagline.length > 60 ? "text-[20px] leading-[25px]" : "text-[26px] leading-[31px]";
  return (
    <>
      {(tagline || cover.url) && (
        <div className="-mx-4 flex min-h-[190px] bg-band lg:mx-0 lg:min-h-[360px]">
          {tagline && (
            <p className={`min-w-0 flex-1 self-center break-words py-5 pl-5 pr-3.5 font-head font-light text-on-band lg:px-14 lg:text-[44px] lg:leading-[52px] ${size}`}>
              {tagline}
            </p>
          )}
          {cover.url && (
            <div className={`relative shrink-0 ${tagline ? "w-[172px] lg:w-1/2" : "w-full"}`}>
              <CoverPhoto cover={cover} className="absolute inset-0 h-full w-full" />
            </div>
          )}
        </div>
      )}
      {face.delivery && <p className="mt-2.5 break-words text-[12.5px] leading-[18px] text-muted lg:text-[14px] lg:leading-5">{face.delivery}</p>}
    </>
  );
}

/** The one label on the photo: the markdown as a rose flag, else "few left" or "sold out" in white. */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  const tone = kind === "sale" ? "bg-spot text-on-spot tabular-nums" : "bg-card text-ink shadow-[inset_0_0_0_1px_var(--color-line)]";
  return { ...card, pill: { ...card.pill, className: `absolute left-0 top-2.5 px-[7px] py-[5px] text-[12px] font-semibold leading-none ${tone}` } };
}

/**
 * The card: a bordered white tile, all of them alike. The photo whole on a
 * pale ground, two lines of name, the price, and the outlined "Qo'shish"
 * centred under them; in the cart the stepper takes the button's place. A
 * product with choices is added on its own page, so its button reads
 * "Ko'rish" and is part of the link; once some are in the cart the count
 * stands there instead.
 */
function Card({ card: model }: { card: CardModel }) {
  const { t } = useTranslations();
  const card = tagged(model);
  const inCart = useCartQty(card.id) > 0;
  const picked = useProductCartQty(card.id) > 0;
  const view = card.hasOptions && !picked && !card.soldOut;
  const control = card.hasOptions ? (
    picked && <CartCount id={card.id} unit={card.unit} />
  ) : (
    // A sold-out card says so on its photo; the stepper stays for what is already in the cart.
    (!card.soldOut || inCart) && <AddControl id={card.id} name={card.name} price={card.price} max={card.max} soldOut={card.soldOut} unit={card.unit} shape="pill" />
  );

  return (
    <article className="mayin-card r-card relative flex h-full min-w-0 flex-col border border-line bg-card">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group r-card flex min-w-0 flex-1 flex-col ${focus}`}>
        <CardPhoto card={card} tile="mayin-photo bg-panel" />
        <div className="flex flex-1 flex-col px-2.5 pt-2.5">
          <h3 className="line-clamp-2 min-h-[34px] break-words text-[13px] leading-[17px] text-ink">{card.name}</h3>
          {card.orderLabel && <p className="mt-0.5 truncate text-[12px] leading-4 text-muted">{card.orderLabel}</p>}
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 text-[14.5px] font-semibold leading-5 tabular-nums">
            <span className={`whitespace-nowrap ${card.soldOut ? "text-muted" : card.was ? "text-spot" : "text-ink"}`}>
              {card.amount} {card.suffix}
            </span>
            {card.was && <s className="whitespace-nowrap text-[12px] font-normal text-muted">{formatAmount(card.was)}</s>}
          </p>
          {view && (
            <span aria-hidden className="mt-auto flex justify-center pb-3 pt-2.5">
              <span className="mayin-view">{t("home.viewProduct")}</span>
            </span>
          )}
        </div>
      </Link>
      {!view && <div className="flex min-h-[58px] items-start justify-center px-2.5 pb-3 pt-2.5">{control}</div>}
    </article>
  );
}

function Home({ info, categories, products, sections, total, sharedLead }: HomeProps) {
  const { t } = useTranslations();
  const look = useSohaLook();
  if (!look) return null;
  const shelved = sections.length > 0;

  /** A title with "Hammasi" on its right. */
  const head = (id: string, name: string, all: { href: string; aria: string } | null) => (
    <div className="flex min-h-11 items-center justify-between gap-3 pb-1 pt-[18px] lg:pb-3 lg:pt-10">
      <h2 id={id} className="min-w-0 truncate font-head text-[22px] font-medium leading-7 text-ink lg:text-[30px] lg:leading-9">
        {name}
      </h2>
      {all && <SeeAll href={all.href} label={t("home.seeAll")} aria={all.aria} className="text-[13.5px] text-ink underline underline-offset-[3px]" />}
    </div>
  );

  /** Phone: a shelf to swipe, 2.3 cards a screen. Wide: the grid, one row of it when shelves follow. */
  const rail = (list: HomeProduct[], oneRow: boolean) => (
    <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
      {list.map((p, i) => (
        <li key={p.id} className={`w-[150px] shrink-0 snap-start lg:w-auto ${oneRow && i >= look.cols ? "lg:hidden" : ""}`}>
          <HomeCard product={p} sharedLead={sharedLead} />
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label={t("home.categories")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-4 pt-1.5 lg:mx-0 lg:flex-wrap lg:px-0 lg:pb-6 lg:pt-6">
          {categories.map((c) => (
            <Link key={c.id} href={categoryHref(c.id)} className={`r-ctl flex h-10 max-w-[240px] shrink-0 items-center gap-2 border border-line bg-card pl-[5px] pr-3.5 text-[14px] font-medium text-ink ${focus}`}>
              <CategoryPhoto src={c.image} className="h-7 w-7 shrink-0 rounded-full" />
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </nav>
      )}

      <Say info={info} />

      <section aria-labelledby="home-products">
        {head("home-products", shelved ? t("home.newArrivals") : t("home.popular"), total > products.length ? { href: "/catalog", aria: t("home.allProducts") } : null)}
        {products.length > 0 ? rail(products, shelved) : <StatePanel icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />}
      </section>

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`}>
            {head(`home-shelf-${s.id}`, s.name, { href: categoryHref(s.id), aria: `${t("home.seeAll")}: ${s.name}` })}
            {rail(s.products, true)}
          </section>
        ))}

      <SohaAbout info={info} orderLead={sharedLead} />
    </>
  );
}

export const mayin: SohaParts = { Intro, Home, Card };
