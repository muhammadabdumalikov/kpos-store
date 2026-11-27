"use client";

import Link from "next/link";
import { useSohaLook } from "@/context/StoreThemeContext";
import { usePrice } from "@/hooks/usePrice";
import { useTranslations } from "@/hooks/useTranslations";
import { formatAmount } from "@/lib/format";
import { normalizeFulfillment } from "@/lib/fulfillment";
import type { StoreInfo } from "@/lib/store-api";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard, type HomeProduct } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { TruckIcon } from "../../icons/DeliveryIcons";
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
  useDeliveryLine,
  useShopFace,
  useShopImage,
  type HomeProps,
  type IntroProps,
  type SohaParts,
} from "../parts";

// Bozor: groceries, after the delivery apps of the trade (Yandex Lavka, Weee).
// No hero: the delivery terms as the first row, the cover as one of two promo
// tiles, departments as grey tiles with the name inside, and goods three to a
// row with the price before the name. Paint: app/soha/bozor.css.

/** Where the marked-down goods stand on the home page; the promo tile leads there. */
const DEALS_ID = "home-deals";

/** Above the search bar: the shop's name and its own line. */
function Intro({ info }: IntroProps) {
  const face = useShopFace(info);
  return (
    <section aria-labelledby="store-title" className={`bg-page px-4 pt-3.5 lg:mx-auto lg:max-w-7xl ${face.tagline ? "lg:pt-6" : "lg:pt-0"}`}>
      <h1 id="store-title" className="break-words font-head text-[22px] font-bold leading-7 tracking-[-0.01em] text-ink lg:sr-only">
        {face.name}
      </h1>
      {face.tagline && (
        <p className="mt-1 break-words text-[13.5px] font-light leading-[19px] text-muted lg:mt-0 lg:text-[16px] lg:leading-6">{face.tagline}</p>
      )}
    </section>
  );
}

/**
 * Under the search bar: what delivery costs, as a delivery app says it. The
 * fee in bold and the sum it is free from beside it; a shop with other terms
 * gets its one line.
 */
function AfterBar({ info }: IntroProps) {
  const { t } = useTranslations();
  const { format } = usePrice();
  const line = useDeliveryLine(info);
  if (!line) return null;
  const f = normalizeFulfillment(info);
  const paid = f.deliveryEnabled && f.deliveryFee > 0 && f.freeDeliveryFrom !== null;
  return (
    <p className="bozor-ship mt-0.5 flex min-h-[42px] items-center gap-2 bg-brand-50 px-2.5 py-2 text-[12px] leading-[17px] tracking-[-0.01em] text-ink lg:mt-5 lg:px-4 lg:text-[14px]">
      <TruckIcon className="h-[19px] w-[19px] shrink-0 text-brand-600" />
      {paid ? (
        <span className="min-w-0">
          <b className="font-semibold">{t("home.shipFee").replace("{amount}", format(f.deliveryFee))}</b>{" "}
          <span className="font-light">{t("home.freeFrom").replace("{amount}", format(f.freeDeliveryFrom ?? 0))}</span>
        </span>
      ) : (
        <b className="min-w-0 font-semibold">{line}</b>
      )}
    </p>
  );
}

/**
 * The promo row: the cover as a picture with no text, and a tile in the
 * shop's colour that leads to the marked-down goods, with one of them on it.
 * The tile exists only while something is marked down.
 */
function Promo({ info, deal }: { info: StoreInfo | null; deal: HomeProduct | null }) {
  const { t } = useTranslations();
  const face = useShopFace(info);
  const photo = useShopImage(deal?.image);
  if (!face.cover.url && !deal) return null;
  return (
    <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:mt-3 lg:gap-3 lg:overflow-visible lg:px-0">
      <CoverPhoto cover={face.cover} className={`r-card h-32 shrink-0 lg:h-[220px] lg:w-auto lg:min-w-0 lg:flex-1 ${deal ? "w-[250px]" : "w-full"}`} />
      {deal && (
        <a
          href={`#${DEALS_ID}`}
          className={`r-card relative h-32 min-w-[150px] flex-1 overflow-hidden bg-primary p-3 text-on-primary lg:h-[220px] lg:max-w-[300px] lg:p-5 ${focus}`}
        >
          <span className="relative block font-head text-[16px] font-bold leading-5 lg:text-[22px] lg:leading-7">{t("home.deals")}</span>
          {photo.url && (
            // eslint-disable-next-line @next/next/no-img-element -- shop pictures come from whatever host the shop's storage uses
            <img
              src={photo.url}
              alt=""
              loading="lazy"
              decoding="async"
              onError={photo.onError}
              className="bozor-pick absolute bottom-2 right-2 h-[76px] w-[76px] bg-card object-cover lg:bottom-4 lg:right-4 lg:h-[132px] lg:w-[132px]"
            />
          )}
        </a>
      )}
    </div>
  );
}

/** The one label on the photo: the markdown in red, else "few left" or "sold out" on white. */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  // On the white tile a white label needs its hairline.
  const quiet = "bg-card shadow-[inset_0_0_0_1px_var(--color-line)]";
  const tone = kind === "sale" ? "bg-error-600 text-white tabular-nums" : kind === "low" ? `${quiet} text-warning-700` : `${quiet} text-muted`;
  return { ...card, pill: { ...card.pill, className: `bozor-tag absolute left-1 top-1 max-w-[calc(100%-8px)] truncate px-[5px] text-[12px] font-semibold leading-5 ${tone}` } };
}

/**
 * The card: the photo on white with a round "+" on its corner, then the
 * price, then the name. The stepper takes the photo's lower edge once the
 * product is in the cart; a product with choices shows only its count there.
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  const tone = card.soldOut ? "text-muted" : card.was ? "text-error-600" : "text-ink";
  return (
    <article className="bozor-card relative flex h-full min-w-0 flex-col">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group r-tile flex min-w-0 flex-col ${focus}`}>
        <CardPhoto card={card} tile="r-tile bg-card" />
        {/* The sum never breaks; "so'm" and the old price move to the next line instead. */}
        <p className={`mt-[7px] flex flex-wrap items-baseline gap-x-[3px] tabular-nums ${tone}`}>
          <span className="whitespace-nowrap text-[15px] font-bold leading-[19px] tracking-[-0.035em] lg:text-[17px] lg:leading-[22px]">{card.amount}</span>
          <span className="whitespace-nowrap text-[12px] leading-[19px] tracking-[-0.02em]">{card.suffix}</span>
          {card.was && <s className="whitespace-nowrap text-[12px] font-light leading-[19px] tracking-[-0.04em] text-muted">{formatAmount(card.was)}</s>}
        </p>
        <h3 className="mt-0.5 line-clamp-2 break-words text-[12.5px] font-light leading-4 text-gray-600 lg:text-[14px] lg:leading-[18px]">{card.name}</h3>
        {card.orderLabel && <p className="mt-0.5 truncate text-[12px] leading-4 text-muted">{card.orderLabel}</p>}
      </Link>
      {/* Over the photo's lower edge: only the control takes taps. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-card">
        <div className="absolute inset-x-1 bottom-1 flex justify-end">
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
  const deals = dealsOf(products, sections, look.cols);
  const hide = gridLimits(products.length, shelved, look.phoneCols, look.cols, 2);
  const head = "mt-4 flex min-h-11 items-center justify-between gap-3 lg:mt-9";
  const title = "min-w-0 truncate font-head text-[18px] font-bold leading-6 tracking-[-0.01em] text-ink lg:text-[24px] lg:leading-8";
  const more = "text-[13px] font-medium text-brand-600 lg:text-[14px]";
  // Narrower gutters than the page's: three cards a row need the width.
  const grid = `${sohaCols(look)} -mx-1.5 gap-x-1 gap-y-3.5 lg:mx-0 lg:gap-x-4 lg:gap-y-7`;
  const tile = `r-card relative block h-28 overflow-hidden bg-panel px-2.5 py-2 lg:h-32 lg:px-3.5 lg:py-3 ${focus}`;
  const tileName = "relative line-clamp-2 break-words text-[13px] font-semibold leading-4 text-ink lg:text-[14px] lg:leading-[18px]";

  return (
    <>
      <Promo info={info} deal={deals[0] ?? null} />

      {categories.length > 0 && (
        <nav aria-labelledby="home-sections">
          <h2 id="home-sections" className={`${title} mt-6 lg:mt-10`}>
            {t("home.sections")}
          </h2>
          <ul className="mt-2.5 grid grid-cols-3 gap-2 lg:mt-4 lg:grid-cols-6 lg:gap-3">
            {categories.map((c) => (
              <li key={c.id} className="min-w-0">
                <Link href={categoryHref(c.id)} className={tile}>
                  <span className={tileName}>{c.name}</span>
                  <CategoryPhoto src={c.image} className="r-tile absolute bottom-1.5 right-1.5 h-[58px] w-[58px] mix-blend-multiply lg:bottom-2.5 lg:right-2.5 lg:h-[68px] lg:w-[68px]" />
                </Link>
              </li>
            ))}
            <li className="min-w-0">
              <Link href="/catalog" aria-label={t("home.allProducts")} className={tile}>
                <span className={tileName}>{t("home.seeAll")}</span>
                <ArrowRightIcon className="absolute bottom-2.5 right-2.5 h-[22px] w-[22px] text-ink" strokeWidth={1.8} />
              </Link>
            </li>
          </ul>
        </nav>
      )}

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

      {/* Clear of the sticky search bar when the promo tile jumps here. */}
      {deals.length > 0 && (
        <section id={DEALS_ID} aria-labelledby="home-deals-title" className="scroll-mt-16">
          <div className={head}>
            <h2 id="home-deals-title" className={title}>
              {t("home.deals")}
            </h2>
          </div>
          <div className={grid}>
            {deals.map((p) => (
              <div key={p.id} className="min-w-0">
                <HomeCard product={p} sharedLead={sharedLead} />
              </div>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 &&
        sections.map((s) => (
          <section key={s.id} aria-labelledby={`home-shelf-${s.id}`}>
            <div className={head}>
              <h2 id={`home-shelf-${s.id}`} className={title}>
                {s.name}
              </h2>
              <SeeAll href={categoryHref(s.id)} label={t("home.seeAll")} aria={`${t("home.seeAll")}: ${s.name}`} className={more} />
            </div>
            {/* One row of the grid; "Hammasi" opens the rest. */}
            <ul className={grid}>
              {s.products.map((p, i) => (
                <li key={p.id} className={`min-w-0 ${i >= look.phoneCols ? "max-lg:hidden" : ""} ${i >= look.cols ? "lg:hidden" : ""}`}>
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

export const bozor: SohaParts = { Intro, AfterBar, Home, Card };
