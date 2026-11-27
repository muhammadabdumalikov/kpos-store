"use client";

import Link from "next/link";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { useCartQty, useProductCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { PhoneIcon } from "../../icons/DeliveryIcons";
import { BoxIcon, ChevronRightIcon } from "../../icons/ShopIcons";
import { sohaCols } from "../classes";
import {
  CategoryPhoto,
  CoverPhoto,
  DeliveryLine,
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

// Texno: phones and electronics, after the local shops of the trade
// (Texnomart, Mediapark, Olcha, Technodom). Dense and price-led: a banner
// with no text on it, the shop's own line printed under it, departments as
// wide grey chips, the marked-down goods as a framed list, bordered cards
// with the options a product comes in. Paint: app/soha/texno.css.

/** Above the search bar: the shop's name and a button that calls it. */
function Intro({ info }: IntroProps) {
  const { t } = useTranslations();
  const face = useShopFace(info);
  const call = face.contacts.find((c) => c.key === "phone");
  return (
    <section aria-labelledby="store-title" className="flex items-center gap-2 bg-page px-4 pt-3.5 lg:sr-only">
      <h1 id="store-title" className="min-w-0 flex-1 truncate font-head text-[20px] font-bold leading-[26px] tracking-[-0.01em] text-ink">
        {face.name}
      </h1>
      {call && (
        <a href={call.href} aria-label={t("home.call")} className={`r-ctl flex h-[38px] w-[38px] shrink-0 items-center justify-center bg-panel text-ink ${focus}`}>
          <PhoneIcon className="h-5 w-5" />
        </a>
      )}
    </section>
  );
}

/** Under the search bar: the cover as a banner, then the tagline and the delivery terms as plain text. */
function AfterBar({ info }: IntroProps) {
  const face = useShopFace(info);
  if (!face.cover.url && !face.tagline && !face.delivery) return null;
  return (
    <div className="pt-1 lg:pt-6">
      <CoverPhoto cover={face.cover} className="r-card aspect-[358/160] w-full lg:aspect-[4/1]" />
      {face.tagline && (
        <p className="mt-3.5 break-words text-[15px] font-semibold leading-[21px] text-ink lg:mt-5 lg:text-[20px] lg:leading-7">{face.tagline}</p>
      )}
      <DeliveryLine info={info} className="mt-1.5 text-[13px] leading-[18px] text-muted lg:text-[14px]" iconClass="h-[17px] w-[17px]" />
    </div>
  );
}

const STOCK_TONE = { in: "text-success-700", low: "text-warning-700", order: "text-muted", out: "text-muted" } as const;

/** "Omborda bor" with its dot, or what stands in for it. */
function StockLine({ card }: { card: CardModel }) {
  const { t } = useTranslations();
  const text =
    card.stock === "in" ? t("product.inStock") : card.stock === "low" ? t("product.lowStock") : card.stock === "out" ? t("product.soldOut") : card.orderLabel;
  if (!text) return null;
  return (
    <p className={`mt-1 flex items-center gap-1.5 text-[12px] font-medium leading-4 ${STOCK_TONE[card.stock]}`}>
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      <span className="truncate">{text}</span>
    </p>
  );
}

/** The one label on the photo: the markdown in yellow, else "few left" or "sold out". */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  const tone = kind === "sale" ? "bg-spot text-on-spot" : "bg-card text-ink shadow-[inset_0_0_0_1px_var(--color-line)]";
  return { ...card, pill: { ...card.pill, className: `texno-tag absolute bottom-0 left-0 px-1.5 text-[12px] font-bold leading-5 tabular-nums ${tone}` } };
}

/**
 * "To cart" beside the price. A product with choices is added on its own
 * page: its card shows an arrow there instead (the whole card is the link),
 * and the count once some are in the cart.
 */
function Control({ card }: { card: CardModel }) {
  const picked = useProductCartQty(card.id) > 0;
  if (!card.hasOptions) {
    return <AddControl id={card.id} name={card.name} price={card.price} max={card.max} soldOut={card.soldOut} unit={card.unit} shape="inline" glyph="bag" />;
  }
  if (picked) return <CartCount id={card.id} unit={card.unit} />;
  return card.soldOut ? null : (
    <span aria-hidden className="add-mark pointer-events-none flex items-center justify-center">
      <ChevronRightIcon className="h-5 w-5" />
    </span>
  );
}

/**
 * The card: a bordered cell with the photo, the name, the options the product
 * comes in, the old price and the price beside a "to cart" button. As a
 * "row" (the deals list) the photo stands on the left and a stock line is
 * added. Once in the cart the stepper takes a line of its own.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  const inCart = useCartQty(card.id) > 0;
  const stepperRow = inCart && !card.hasOptions;
  const href = `/products/${card.id}`;
  // The sum never breaks; a long one sends "so'm" to the next line instead of under the button.
  const price = (size: string) => (
    <span className={`flex flex-wrap gap-x-1 font-bold tabular-nums ${size} ${card.soldOut ? "text-muted" : "text-ink"}`}>
      <span className="whitespace-nowrap">{card.amount}</span>
      <span className="whitespace-nowrap">{card.suffix}</span>
    </span>
  );
  const was = card.was && <s className="block whitespace-nowrap text-[12px] leading-4 text-muted tabular-nums">{formatAmount(card.was)}</s>;

  if (card.variant === "row") {
    return (
      <article className="texno-row relative min-w-0">
        <Link href={href} aria-label={card.spoken} className={`group flex min-w-0 gap-3 py-3 pr-12 ${focus}`}>
          <div className="w-[84px] shrink-0">
            <CardPhoto card={card} tile="r-tile bg-panel" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 break-words text-[14px] font-medium leading-[19px] text-ink">{card.name}</h3>
            <StockLine card={card} />
            <div className="mt-1.5">
              {was}
              {price("text-[17px] leading-[22px]")}
            </div>
          </div>
        </Link>
        <div className={stepperRow ? "pb-3" : "absolute bottom-3 right-0"}>
          <Control card={card} />
        </div>
      </article>
    );
  }

  return (
    <article className="texno-card r-card relative flex h-full min-w-0 flex-col border border-line bg-card p-2.5">
      <Link href={href} aria-label={card.spoken} className={`group flex min-w-0 flex-1 flex-col ${focus}`}>
        <CardPhoto card={card} tile="r-tile bg-panel" />
        <h3 className="mt-2.5 line-clamp-2 min-h-9 break-words text-[13.5px] leading-[18px] text-ink">{card.name}</h3>
        {card.optionValues.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {card.optionValues.slice(0, 3).map((v) => (
              <li key={v} className="texno-opt max-w-full truncate border border-line px-1.5 text-[11px] font-medium leading-5 text-ink">
                {v}
              </li>
            ))}
          </ul>
        )}
        {card.orderLabel && <p className="mt-1 truncate text-[12px] leading-4 text-muted">{card.orderLabel}</p>}
        {/* Room on the right for the button laid over the corner below. */}
        <div className="mt-auto pr-10 pt-2">
          {was}
          {price("text-[15px] leading-[22px] lg:text-[16px]")}
        </div>
      </Link>
      <div className={stepperRow ? "pt-2" : "absolute bottom-2.5 right-2.5"}>
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
  const deals = dealsOf(products, sections, 3);
  // The deals list already shows the marked-down goods; the grid keeps the rest.
  const dealIds = new Set(deals.map((p) => p.id));
  const fresh = deals.length > 0 ? products.filter((p) => !dealIds.has(p.id)) : products;
  const hide = gridLimits(fresh.length, shelved, look.phoneCols, look.cols);
  const title = "min-w-0 truncate font-head text-[18px] font-bold leading-6 text-ink lg:text-[24px] lg:leading-8";
  const more = "text-[13px] font-semibold text-brand-600";
  const tab = `r-ctl flex h-9 max-w-[220px] shrink-0 items-center border px-3.5 text-[13.5px] leading-none ${focus}`;

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label={t("home.sections")} className="mt-4 lg:mt-8">
          {/* Two rows that scroll together on a phone; a wrapped grid on a wide screen. */}
          <ul className="no-scrollbar -mx-4 grid auto-cols-[150px] grid-flow-col grid-rows-[56px_56px] gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-6 lg:grid-rows-none lg:overflow-visible lg:px-0">
            {categories.map((c) => (
              <li key={c.id} className="min-w-0">
                <Link href={categoryHref(c.id)} className={`r-ctl flex h-14 items-center justify-between gap-1.5 bg-panel py-1.5 pl-3 pr-1.5 ${focus}`}>
                  <span className="line-clamp-2 min-w-0 break-words text-[13.5px] font-medium leading-[17px] text-ink">{c.name}</span>
                  <CategoryPhoto src={c.image} className="r-tile h-11 w-11 shrink-0 mix-blend-multiply" />
                </Link>
              </li>
            ))}
            <li className="min-w-0">
              <Link href="/catalog" className={`r-ctl flex h-14 items-center justify-between gap-1.5 bg-panel px-3 ${focus}`}>
                <span className="min-w-0 text-[13.5px] font-medium leading-[17px] text-ink">{t("home.allProducts")}</span>
                <ChevronRightIcon className="h-[18px] w-[18px] shrink-0 text-muted" />
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {deals.length > 0 && (
        <section aria-labelledby="home-deals" className="texno-deals mt-5 border-2 border-primary px-3 pb-0.5 pt-3 lg:mt-8 lg:px-5 lg:pt-4">
          <h2 id="home-deals" className="font-head text-[17px] font-bold leading-[22px] text-ink lg:text-[20px] lg:leading-7">
            {t("home.deals")}
          </h2>
          <ul className="divide-y divide-line lg:grid lg:grid-cols-3 lg:gap-x-8 lg:divide-y-0">
            {deals.map((p) => (
              <li key={p.id} className="min-w-0">
                <HomeCard product={p} sharedLead={sharedLead} variant="row" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="home-products" className="mt-6 lg:mt-10">
        <h2 id="home-products" className="sr-only">
          {shelved ? t("home.newArrivals") : t("home.popular")}
        </h2>
        {/* The first tab is this page; the others lead to their department. */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          <span aria-current="page" className={`${tab} border-ink bg-ink font-semibold text-page`}>
            {shelved ? t("home.newArrivals") : t("home.popular")}
          </span>
          {categories.map((c) => (
            <Link key={c.id} href={categoryHref(c.id)} className={`${tab} border-line bg-card font-medium text-ink`}>
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </div>
        {fresh.length > 0 ? (
          <div className={`${sohaCols(look)} mt-3 gap-2 lg:mt-4 lg:gap-3`}>
            {fresh.map((p, i) => (
              <div key={p.id} className={`min-w-0 ${hide(i)}`}>
                <HomeCard product={p} sharedLead={sharedLead} />
              </div>
            ))}
          </div>
        ) : (
          products.length === 0 && <StatePanel className="mt-3" icon={<BoxIcon className="h-7 w-7" />} title={t("home.emptyTitle")} body={t("home.emptyBody")} />
        )}
      </section>

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`} className="mt-7 lg:mt-12">
            <div className="mb-1 flex items-center justify-between gap-3 lg:mb-2">
              <h2 id={`home-shelf-${s.id}`} className={title}>
                {s.name}
              </h2>
              <SeeAll href={categoryHref(s.id)} label={t("home.seeAll")} aria={`${t("home.seeAll")}: ${s.name}`} className={more} />
            </div>
            {/* Phone: a rail to swipe. Wide: one row of the grid. */}
            <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-3 lg:overflow-visible lg:px-0">
              {s.products.map((p, i) => (
                <li key={p.id} className={`w-[158px] shrink-0 snap-start lg:w-auto ${i >= look.cols ? "lg:hidden" : ""}`}>
                  <HomeCard product={p} sharedLead={sharedLead} />
                </li>
              ))}
            </ul>
          </section>
        ))}

      {products.length > 0 && total > products.length && (
        <Link
          href="/catalog"
          className={`r-ctl mt-7 flex h-12 w-full items-center justify-center gap-2 border border-line bg-card text-[15px] font-semibold text-ink lg:mx-auto lg:mt-12 lg:max-w-[360px] ${focus}`}
        >
          {t("home.allProducts")}
          <span className="font-medium tabular-nums text-muted">{total}</span>
        </Link>
      )}

      <SohaAbout info={info} orderLead={sharedLead} />
    </>
  );
}

export const texno: SohaParts = { Intro, AfterBar, Home, Card };
