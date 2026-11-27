"use client";

import Link from "next/link";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { BoxIcon, ChevronRightIcon } from "../../icons/ShopIcons";
import { sohaCols } from "../classes";
import { CoverPhoto, SeeAll, SohaAbout, categoryHref, focus, gridLimits, useShopFace, type HomeProps, type IntroProps, type SohaParts } from "../parts";

// The plain parts: a trade theme that has not been drawn yet (a new key) gets
// these, so its shop still opens. Name and tagline, the cover as a card, chips,
// a grid and shelves, the shop's facts.

function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="px-4 pt-4 lg:mx-auto lg:max-w-7xl lg:pt-8">
      <h1 id="store-title" className="break-words font-head text-[24px] font-bold leading-[1.15] text-ink lg:text-[36px]">
        {face.name}
      </h1>
      {face.tagline && <p className="mt-1 break-words text-[14px] leading-5 text-muted lg:text-[16px] lg:leading-6">{face.tagline}</p>}
    </section>
  );
}

function AfterBar({ info }: IntroProps) {
  const face = useShopFace(info);
  return <CoverPhoto cover={face.cover} className="r-card mt-3 aspect-[2/1] w-full lg:aspect-[4/1]" />;
}

function Card({ card }: { card: CardModel }) {
  return (
    <article className="relative flex h-full min-w-0 flex-col">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group r-tile flex min-w-0 flex-col ${focus}`}>
        <CardPhoto card={card} tile="r-tile bg-panel" />
        <p className={`mt-2.5 flex flex-wrap items-baseline gap-x-1.5 px-0.5 tabular-nums ${card.soldOut ? "text-muted" : "text-ink"}`}>
          <span className="whitespace-nowrap text-[16px] font-bold">
            {card.amount} <span className="text-[12px] font-semibold text-muted">{card.suffix}</span>
          </span>
          {card.was && <s className="whitespace-nowrap text-[12px] text-muted">{formatAmount(card.was)}</s>}
        </p>
        <h3 className="mt-0.5 line-clamp-2 break-words px-0.5 text-[14px] leading-5 text-ink">{card.name}</h3>
        {card.orderLabel && <p className="mt-0.5 truncate px-0.5 text-[12px] leading-5 text-muted">{card.orderLabel}</p>}
      </Link>
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
  const hide = gridLimits(products.length, shelved, look.phoneCols, look.cols);
  const title = "min-w-0 truncate font-head text-[21px] font-bold leading-7 text-ink lg:text-[26px] lg:leading-8";
  const more = "text-[14px] font-semibold text-brand-600";
  const chip = `r-ctl flex h-10 max-w-[240px] shrink-0 items-center border border-line bg-card px-4 text-[14px] font-semibold text-ink ${focus}`;

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label={t("home.categories")} className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {categories.map((c) => (
            <Link key={c.id} href={categoryHref(c.id)} className={chip}>
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </nav>
      )}

      <section aria-labelledby="home-products" className="mt-7 lg:mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="home-products" className={title}>
            {shelved ? t("home.newArrivals") : t("home.popular")}
          </h2>
          {total > products.length && (
            <SeeAll href="/catalog" label={t("home.seeAll")} aria={t("home.allProducts")} className={more}>
              <ChevronRightIcon className="h-[18px] w-[18px]" />
            </SeeAll>
          )}
        </div>
        {products.length > 0 ? (
          <div className={`${sohaCols(look)} gap-x-3 gap-y-5 lg:gap-x-5 lg:gap-y-8`}>
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
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`} className="mt-9 lg:mt-12">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id={`home-shelf-${s.id}`} className={title}>
                {s.name}
              </h2>
              <SeeAll href={categoryHref(s.id)} label={t("home.seeAll")} aria={`${t("home.seeAll")}: ${s.name}`} className={more}>
                <ChevronRightIcon className="h-[18px] w-[18px]" />
              </SeeAll>
            </div>
            <ul className={`${sohaCols(look)} gap-x-3 gap-y-5 lg:gap-x-5`}>
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

export const base: SohaParts = { Intro, AfterBar, Home, Card };
