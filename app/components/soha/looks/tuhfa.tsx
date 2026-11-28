"use client";

import Link from "@/app/components/ShopLink";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { formatAmount } from "@/lib/format";
import type { StoreInfo } from "@/lib/store-api";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { BoxIcon } from "../../icons/ShopIcons";
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

// Tuhfa: a gift shop, after Not On The High Street and Uncommon Goods. The
// top of the page is the lid of a box in the shop's accent (ribbon red by
// default): the name in Yeseva One, the search and the tagline on it, and the
// occasions (the shop's categories) as tall photo cards that hang over its
// lower edge. Below it cream paper, round corners, a round "+" on each photo.
//
// The lid is three pieces that touch: the Intro (the name), the phone's sticky
// bar (painted in app/soha/tuhfa.css) and the AfterBar (the tagline). The
// occasion cards open the Home part and are pulled up over the lid by the
// CSS, only when nothing (the owner's banners) stands between the two.

/** The lid's top: the shop's name. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="bg-band px-4 pb-1 pt-3.5 lg:sr-only">
      <h1 id="store-title" className="truncate font-head text-[28px] leading-[1.1] text-on-band">
        {face.name}
      </h1>
    </section>
  );
}

/** The lid's lower part, under the search bar: the tagline. On a wide screen it spans the window. */
function AfterBar({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <div className={`tuhfa-lid -mx-4 bg-band px-4 text-on-band lg:mx-0 lg:px-0 ${face.tagline ? "pt-1" : "pt-2.5"}`}>
      {face.tagline && (
        <p className="break-words pb-[18px] text-[14px] leading-[1.45] lg:mx-auto lg:max-w-[820px] lg:pb-8 lg:pt-8 lg:text-center lg:font-head lg:text-[28px] lg:leading-[1.3]">
          {face.tagline}
        </p>
      )}
    </div>
  );
}

/** The cover as a plain card between the sections; nothing is written on it. */
function Cover({ info }: { info: StoreInfo | null }) {
  const face = useShopFace(info);
  return <CoverPhoto cover={face.cover} priority={false} className="r-card mt-7 aspect-[358/170] w-full lg:mt-12 lg:aspect-[4/1]" />;
}

/** The one label on the photo, a cream pill: the markdown in red, else "few left" or "sold out". */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  const tone = kind === "sale" ? "text-spot tabular-nums" : "text-ink";
  return { ...card, pill: { ...card.pill, className: `absolute left-2 top-2 rounded-full bg-page px-[9px] py-1.5 text-[12px] font-extrabold leading-none ${tone}` } };
}

/**
 * The card: a rounded square photo with a round "+" in the accent on its
 * corner, two lines of name and a heavy price. In the cart the "+" becomes a
 * stepper along the photo's lower edge; a product with choices shows only its
 * count there.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  return (
    <article className="relative flex h-full min-w-0 flex-col">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group r-card flex min-w-0 flex-col ${focus}`}>
        <CardPhoto card={card} tile="r-card bg-panel" />
        <h3 className="mt-[9px] line-clamp-2 break-words text-[13.5px] leading-[1.35] text-ink">{card.name}</h3>
        {card.orderLabel && <p className="mt-0.5 truncate text-[12.5px] leading-[18px] text-muted">{card.orderLabel}</p>}
        <p className="mt-[3px] flex flex-wrap items-baseline gap-x-[7px] tabular-nums">
          <span className={`whitespace-nowrap text-[15px] font-extrabold leading-[22px] ${card.soldOut ? "text-muted" : card.was ? "text-spot" : "text-ink"}`}>
            {card.amount} {card.suffix}
          </span>
          {card.was && <s className="whitespace-nowrap text-[12.5px] text-muted">{formatAmount(card.was)}</s>}
        </p>
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

function Home({ info, categories, products, sections, total, sharedLead }: HomeProps) {
  const { t } = useTranslations();
  const look = useSohaLook();
  if (!look) return null;
  const shelved = sections.length > 0;
  const hide = gridLimits(products.length, shelved, look.phoneCols, look.cols, 2);
  const grid = `${sohaCols(look)} gap-x-3 gap-y-[18px] lg:gap-x-5 lg:gap-y-8`;

  /** A title with "Hammasi" on its right. */
  const head = (id: string, name: string, all: { href: string; aria: string } | null) => (
    <div className="flex min-h-11 items-center justify-between gap-3 pb-1.5 pt-[18px] lg:pb-3 lg:pt-10">
      <h2 id={id} className="min-w-0 truncate font-head text-[23px] leading-[1.25] text-ink lg:text-[30px]">
        {name}
      </h2>
      {all && <SeeAll href={all.href} label={t("home.seeAll")} aria={all.aria} className="text-[13.5px] font-semibold text-ink underline underline-offset-[3px]" />}
    </div>
  );

  return (
    <>
      {/* The occasions. The first thing in <main> after the lid, so they hang over its edge. */}
      {categories.length > 0 && (
        <nav aria-label={t("home.categories")} className="tuhfa-occ no-scrollbar relative -mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 pb-1 pt-1 lg:mx-0 lg:gap-4 lg:px-0">
          {categories.map((c) => (
            <Link key={c.id} href={categoryHref(c.id)} className={`r-card block w-[132px] shrink-0 lg:w-[184px] ${focus}`}>
              <CategoryPhoto src={c.image} className="r-card h-[176px] w-full lg:h-[244px]" />
              <span className="mt-[9px] line-clamp-2 break-words font-head text-[15px] leading-[1.2] text-ink lg:text-[18px]">{c.name}</span>
            </Link>
          ))}
        </nav>
      )}

      <DeliveryLine info={info} className="mt-[18px] text-[13px] leading-[18px] text-muted lg:mt-6 lg:text-[14px]" />

      <section aria-labelledby="home-products">
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

      <Cover info={info} />

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`}>
            {head(`home-shelf-${s.id}`, s.name, { href: categoryHref(s.id), aria: `${t("home.seeAll")}: ${s.name}` })}
            {/* Two rows on a phone, one row of the grid on a wide screen. */}
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

export const tuhfa: SohaParts = { Intro, AfterBar, Home, Card };
