"use client";

import Link from "@/app/components/ShopLink";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { formatAmount } from "@/lib/format";
import { AddControl, CartCount } from "../../AddControl";
import { HomeCard, type HomeProduct } from "../../HomeContent";
import { CardPhoto, type CardModel } from "../../ProductCard";
import { StatePanel } from "../../StatePanel";
import { BoxIcon } from "../../icons/ShopIcons";
import {
  CategoryPhoto,
  CoverPhoto,
  SeeAll,
  SohaAbout,
  categoryHref,
  focus,
  useDeliveryLine,
  useShopFace,
  type HomeProps,
  type IntroProps,
  type SohaParts,
} from "../parts";

// Guldasta: a florist, after Bloom & Wild and UrbanStems. The picture sells:
// the cover edge to edge with nothing on it, the shop's own line on a solid
// block of the accent's deep shade under it, categories as photo circles, and
// every section a row of large 4:5 pictures to swipe. Titles are centred, in
// Prata. The shop's name stands in the phone bar (`bar: "wordmark"`).
// Paint: app/soha/guldasta.css.

/** Above the bar: the delivery terms on a thin strip. */
function Intro({ info }: IntroProps) {
  const line = useDeliveryLine(info);
  if (!line) return null;
  return (
    <p className="flex min-h-[30px] items-center justify-center bg-band px-4 text-[12.5px] font-medium leading-4 tracking-[0.01em] text-on-band">
      <span className="truncate">{line}</span>
    </p>
  );
}

/**
 * Under the bar: the cover from edge to edge, then the tagline on the solid
 * block. Side by side on a wide screen. Either one stands alone.
 */
function AfterBar({ info }: IntroProps) {
  const face = useShopFace(info);
  if (!face.cover.url && !face.tagline) return null;
  return (
    <div className={`-mx-4 lg:mx-0 lg:mt-6 ${face.cover.url && face.tagline ? "lg:grid lg:grid-cols-[3fr_2fr]" : ""}`}>
      <CoverPhoto cover={face.cover} className="aspect-[13/10] max-h-[420px] w-full lg:aspect-auto lg:h-[420px]" />
      {face.tagline && (
        <p className="flex items-center justify-center bg-band p-5 text-center font-head text-[22px] leading-[30px] text-on-band lg:p-12 lg:text-[32px] lg:leading-[42px]">
          <span className="min-w-0 text-balance break-words">{face.tagline}</span>
        </p>
      )}
    </div>
  );
}

/** The one label on the photo: the markdown on the accent, else "few left" or "sold out" on white. */
function tagged(card: CardModel): CardModel {
  const kind = card.pill?.kind;
  if (!card.pill || kind === "new" || kind === "popular") return { ...card, pill: null };
  const tone = kind === "sale" ? "bg-band text-on-band tabular-nums" : "bg-card text-ink";
  return { ...card, pill: { ...card.pill, className: `absolute left-0 top-3.5 px-2 py-1.5 text-[12.5px] font-bold leading-none ${tone}` } };
}

/**
 * The card: a 4:5 picture with a round white "+" on its corner, the name in
 * Prata and the price, both centred. In the cart the "+" becomes a stepper
 * along the picture's lower edge. The name grows with the card (a large one
 * in a row to swipe, a small one in the catalogue's two columns).
 */
function Card({ card: model }: { card: CardModel }) {
  const card = tagged(model);
  return (
    <article className="guldasta-card @container relative flex h-full min-w-0 flex-col text-center">
      <Link href={`/products/${card.id}`} aria-label={card.spoken} className={`group flex min-w-0 flex-col ${focus}`}>
        <CardPhoto card={card} tile="bg-panel" />
        <h3 className="mt-3 line-clamp-2 break-words px-1.5 font-head text-[15px] leading-[21px] text-ink @[220px]:text-[17px] @[220px]:leading-[23px]">{card.name}</h3>
        {card.orderLabel && <p className="mt-0.5 truncate text-[12.5px] leading-[18px] text-muted">{card.orderLabel}</p>}
        <p className="mt-[5px] flex flex-wrap items-baseline justify-center gap-x-2 text-[14px] font-bold leading-5 tabular-nums">
          <span className={`whitespace-nowrap ${card.soldOut ? "text-muted" : card.was ? "text-band" : "text-ink"}`}>
            {card.amount} {card.suffix}
          </span>
          {card.was && <s className="whitespace-nowrap text-[13px] font-normal text-muted">{formatAmount(card.was)}</s>}
        </p>
      </Link>
      {/* Laid over the picture; only the control takes taps. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-card">
        <div className="guldasta-ctl absolute inset-x-2.5 bottom-2.5 flex justify-end">
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

  /** A centred title with "Hammasi" under it. */
  const head = (id: string, name: string, all: { href: string; aria: string } | null) => (
    <div className={`pt-[34px] text-center lg:pt-14 ${all ? "pb-1 lg:pb-3" : "pb-4 lg:pb-6"}`}>
      <h2 id={id} className="break-words font-head text-[26px] leading-8 text-ink lg:text-[34px] lg:leading-[42px]">
        {name}
      </h2>
      {all && <SeeAll href={all.href} label={t("home.seeAll")} aria={all.aria} className="-mt-1.5 text-[13px] text-ink underline underline-offset-4" />}
    </div>
  );

  /** Phone: large cards to swipe, about 1.35 a screen. Wide: the grid, one row of it when shelves follow. */
  const rail = (list: HomeProduct[], oneRow: boolean) => (
    <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10 lg:overflow-visible lg:px-0">
      {list.map((p, i) => (
        <li key={p.id} className={`w-[264px] shrink-0 snap-start lg:w-auto ${oneRow && i >= look.cols ? "lg:hidden" : ""}`}>
          <HomeCard product={p} sharedLead={sharedLead} />
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label={t("home.categories")} className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 pt-6 lg:mx-0 lg:flex-wrap lg:justify-center lg:gap-x-8 lg:gap-y-6 lg:px-0 lg:pt-10">
          {categories.map((c) => (
            <Link key={c.id} href={categoryHref(c.id)} className={`block w-[74px] shrink-0 text-center lg:w-[104px] ${focus}`}>
              <CategoryPhoto src={c.image} className="keep-round h-[74px] w-[74px] rounded-full lg:h-[104px] lg:w-[104px]" />
              <span className="-mx-2 mt-2 line-clamp-2 break-words text-[13px] leading-[17px] text-ink lg:text-[14px] lg:leading-5">{c.name}</span>
            </Link>
          ))}
        </nav>
      )}

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

export const guldasta: SohaParts = { Intro, AfterBar, Home, Card };
