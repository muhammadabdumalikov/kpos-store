"use client";

import Link from "@/app/components/ShopLink";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { useCartQty, useProductCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard, type HomeProduct } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { ArrowRightIcon, BoxIcon, ChevronRightIcon, TelegramIcon } from "../../icons/ShopIcons";
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

// Garaj: auto parts, after the parts counters of the trade (Autodoc, Exist).
// The search is the tool, so it opens the page: a charcoal block with the
// shop's name, what to type and a wide search button. Then the catalogue as a
// ruled table of departments with what is in them, and goods as list rows
// with a stock line. Paint: app/soha/garaj.css, which also turns the phone's
// search bar into the middle of the charcoal block.

/** The table lists as many departments as the home page counts (app/page.tsx). */
const TABLE_GROUPS = 6;
/** Product names under a department in the table. */
const GROUP_NAMES = 2;
/** Rows of a department's shelf on the home page: three on a phone, one row of three on a wide screen. */
const SHELF_ROWS = 3;

/** On the charcoal block the focus ring is white. */
const focusOnBand = "outline-none focus-visible:ring-2 focus-visible:ring-white";

/**
 * Above the search bar: the top of the charcoal block. The shop's name, its
 * own line, and what the field under it takes. On a wide screen the header
 * has the name and the search, so only the shop's line stays, on a band.
 */
function Intro({ info }: IntroProps) {
  const { t } = useTranslations();
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className="garaj-tool bg-band px-4 pt-3.5 text-on-band lg:pt-0">
      <div className={`lg:mx-auto lg:max-w-7xl ${face.tagline ? "lg:py-3" : ""}`}>
        <h1 id="store-title" className="truncate font-head text-[22px] font-extrabold uppercase italic leading-7 tracking-[0.01em] lg:sr-only">
          {face.name}
        </h1>
        {face.tagline && <p className="mt-1 break-words text-[13px] leading-[18px] text-gray-300 lg:mt-0 lg:text-[15px] lg:leading-[22px]">{face.tagline}</p>}
        <p className="mt-4 text-[13.5px] font-semibold leading-[18px] lg:hidden">{t("home.partSearch")}</p>
      </div>
    </section>
  );
}

/**
 * Under the search bar: the end of the charcoal block, where a buyer who
 * found nothing can ask the shop on Telegram (only when the shop has one),
 * then the delivery terms on a pale strip. Edge to edge on a phone; one pale
 * row on a wide screen.
 */
function AfterBar({ info }: IntroProps) {
  const { t } = useTranslations();
  const face = useShopFace(info);
  const telegram = face.contacts.find((c) => c.key === "telegram");
  if (!telegram && !face.delivery) return null;
  return (
    <div className="garaj-after -mx-4 lg:mx-0 lg:mt-6 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:bg-panel lg:px-5">
      {telegram && (
        <p className="garaj-ask bg-band px-4 pb-[7px] text-gray-200 lg:order-2 lg:bg-transparent lg:p-0 lg:text-ink">
          <a
            href={telegram.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-9 items-center gap-2 text-[13px] leading-[18px] lg:min-h-11 lg:text-[14px] ${focusOnBand} lg:focus-visible:ring-brand-500/60`}
          >
            <TelegramIcon className="h-[18px] w-[18px] shrink-0" />
            <span className="underline underline-offset-[3px]">{t("home.askTelegram")}</span>
          </a>
        </p>
      )}
      <DeliveryLine info={info} className="h-[38px] bg-panel px-4 text-[13px] font-medium text-ink lg:h-11 lg:px-0 lg:text-[14px]" iconClass="h-[19px] w-[19px]" />
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
    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] leading-4 text-gray-700">
      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${STOCK_DOT[card.stock]}`} />
      <span className="truncate">{text}</span>
    </p>
  );
}

/** The photo carries the markdown alone, in its corner; the stock line says the rest. */
function tagged(card: CardModel): CardModel {
  if (card.pill?.kind !== "sale") return { ...card, pill: null };
  return { ...card, pill: { ...card.pill, className: "garaj-tag absolute left-0 top-0 bg-error-600 px-[5px] text-[12px] font-bold leading-5 text-white tabular-nums" } };
}

/**
 * The square "+" at the row's end. A product with choices is added on its
 * own page: its row shows an arrow there instead (the whole row is the
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
 * The card: a list row between hairlines. A small framed photo, the name,
 * the stock line and the price, and the "+" at the right. In the cart the
 * stepper takes the "+"'s place and the text gives it the room.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  const inCart = useCartQty(card.id) > 0;
  const stepper = inCart && !card.hasOptions;
  const tone = card.soldOut ? "text-muted" : card.was ? "text-error-600" : "text-ink";
  return (
    <article className="garaj-row flex h-full min-w-0 items-center gap-3 border-b border-line py-3">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group flex min-w-0 flex-1 items-center gap-3 ${focus}`}>
        <div className="w-[76px] shrink-0">
          <CardPhoto card={card} tile="r-tile border border-line bg-card" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words text-[14px] font-medium leading-[18px] text-ink">{card.name}</h3>
          <StockLine card={card} />
          {/* The sum never breaks; the old price moves to the next line instead. */}
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
            <span className={`whitespace-nowrap text-[17px] font-bold leading-[22px] ${tone}`}>
              {card.amount} <span className="text-[12.5px] font-semibold">{card.suffix}</span>
            </span>
            {card.was && <s className="whitespace-nowrap text-[12.5px] leading-[22px] text-muted">{formatAmount(card.was)}</s>}
          </p>
        </div>
      </Link>
      <div className={`shrink-0 ${stepper ? "w-[104px]" : ""}`}>
        <Control card={card} />
      </div>
    </article>
  );
}

function Home({ info, categories, products, sections, total, sharedLead, counts }: HomeProps) {
  const { t } = useTranslations();
  const look = useSohaLook();
  const face = useShopFace(info);
  if (!look) return null;
  const shelved = sections.length > 0;
  const hide = gridLimits(products.length, shelved, look.phoneCols, look.cols, 5);
  const head = "mt-4 flex min-h-11 items-center justify-between gap-3 lg:mt-10";
  const title = "min-w-0 truncate font-head text-[20px] font-extrabold uppercase italic leading-[26px] tracking-[0.01em] text-ink lg:text-[26px] lg:leading-8";
  const more = "text-[13.5px] font-semibold text-brand-500 lg:text-[14px]";
  // List rows: no row gaps, a hairline over the first row; each row draws the one under it.
  const rows = `${sohaCols(look)} border-t border-line md:gap-x-8`;

  // The table names goods from what this page already holds: each department's shelf, then the newest.
  const groups = categories.slice(0, TABLE_GROUPS);
  const held = new Map<string, HomeProduct[]>();
  const seen = new Set<string>();
  for (const p of [...sections.flatMap((s) => s.products), ...products]) {
    if (!p.categoryId || seen.has(p.id)) continue;
    seen.add(p.id);
    held.set(p.categoryId, [...(held.get(p.categoryId) ?? []), p]);
  }
  // The last cell, "all", fills what is left of its row.
  const restPhone = groups.length % 2 === 0 ? "max-lg:col-span-2" : "";
  const restWide = ["lg:col-span-3", "lg:col-span-2", ""][groups.length % 3];
  const cell = "h-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/60";

  return (
    <>
      {groups.length > 0 && (
        <nav aria-labelledby="home-catalog">
          <h2 id="home-catalog" className={`${title} mt-6 lg:mt-10`}>
            {t("home.catalog")}
          </h2>
          {/* The lines of the table are the gaps of the grid. */}
          <ul className="r-card mt-[11px] grid grid-cols-2 gap-px overflow-hidden border border-line bg-line lg:mt-4 lg:grid-cols-3">
            {groups.map((c) => (
              <li key={c.id} className="min-w-0 bg-card">
                <Link href={categoryHref(c.id)} className={`${cell} block px-[11px] pb-2.5 pt-[11px] lg:px-4 lg:py-3.5`}>
                  <span className="flex min-h-10 items-start justify-between gap-2">
                    <span className="min-w-0 break-words text-[15px] font-bold leading-5 text-brand-500 underline decoration-[1.5px] underline-offset-4">{c.name}</span>
                    <CategoryPhoto src={c.image} className="garaj-thumb h-10 w-10 shrink-0 border border-line" />
                  </span>
                  {(held.get(c.id) ?? []).slice(0, GROUP_NAMES).map((p) => (
                    <span key={p.id} className="mt-1.5 block truncate text-[13px] leading-[17px] text-ink">
                      {p.name}
                    </span>
                  ))}
                  {/* The department's size only where the page was told it. */}
                  <span className="mt-2 block text-[13px] font-semibold leading-[18px] text-ink tabular-nums">
                    {t("home.seeAll")}
                    {typeof counts[c.id] === "number" && ` (${counts[c.id]})`}
                  </span>
                </Link>
              </li>
            ))}
            <li className={`min-w-0 bg-panel ${restPhone} ${restWide}`}>
              <Link href="/catalog" className={`${cell} flex min-h-14 items-center justify-between gap-2 px-[11px] py-3 text-[15px] font-bold leading-5 text-ink tabular-nums lg:px-4`}>
                <span className="min-w-0">
                  {t("home.seeAll")}
                  {total > 0 && ` (${total})`}
                </span>
                <ArrowRightIcon className="h-[22px] w-[22px] shrink-0" strokeWidth={1.8} />
              </Link>
            </li>
          </ul>
        </nav>
      )}

      <CoverPhoto cover={face.cover} priority={false} className="r-card mt-4 h-[130px] w-full lg:mt-6 lg:aspect-[5/1] lg:h-auto" />

      <section aria-labelledby="home-products">
        <div className={head}>
          <h2 id="home-products" className={title}>
            {shelved ? t("home.newArrivals") : t("home.popular")}
          </h2>
          {total > products.length && <SeeAll href="/catalog" label={t("home.seeAll")} aria={t("home.allProducts")} className={more} />}
        </div>
        {products.length > 0 ? (
          <div className={rows}>
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
            <ul className={rows}>
              {s.products.slice(0, SHELF_ROWS).map((p) => (
                <li key={p.id} className="min-w-0">
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

export const garaj: SohaParts = { Intro, AfterBar, Home, Card };
