"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";
import { useCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import type { SohaLook } from "@/lib/soha-looks";
import { AddControl, CartCount } from "../AddControl";
import { CardPhoto, type CardModel } from "../ProductCard";

const focus =
  "outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-page";

/**
 * The product card of a trade theme (lib/soha-looks). The same facts, label
 * rules and controls as the default card, in one of four shapes:
 * - soft: a tinted block (the theme may turn the tints: `--card-tint`), the
 *   add button across its foot.
 * - market: a bordered card, the price first, the add button across its foot.
 * - plain: no surface. The photo on a panel tile with a round "+" on its
 *   corner, the text under it.
 * - spec: a dense bordered cell, the "+" beside the price; the stepper takes a
 *   row of its own once the product is in the cart.
 * Small differences between themes (frames, a price tag, a serif name) are
 * CSS on the `soha-*` classes in app/globals.css.
 */
export function SohaCard({ look, card }: { look: SohaLook; card: CardModel }) {
  const { t } = useTranslations();
  const inCart = useCartQty(card.id) > 0;
  const href = `/products/${card.id}`;
  const align = look.centered ? "text-center" : "";
  const justify = look.centered ? "justify-center" : "";

  const name = (size: string) => (
    <h3 className={`soha-name line-clamp-2 break-words text-ink ${size}`}>{card.name}</h3>
  );
  const price = (size: string) => (
    <p className={`flex flex-wrap items-baseline gap-x-1.5 tabular-nums ${justify} ${card.soldOut ? "text-muted" : "text-ink"}`}>
      <span className={`soha-price whitespace-nowrap ${size}`}>
        {card.amount} <span className="soha-suffix text-[12px] font-semibold text-muted">{card.suffix}</span>
      </span>
      {card.was && <s className="whitespace-nowrap text-[12px] font-medium text-muted">{formatAmount(card.was)}</s>}
    </p>
  );
  const lead = card.orderLabel && (
    <p className="mt-0.5 truncate text-[12px] font-medium leading-5 text-muted">{card.orderLabel}</p>
  );

  if (look.card === "plain") {
    return (
      <article className="soha-card soha-card--plain relative flex h-full min-w-0 flex-col">
        <Link href={href} aria-label={card.spoken} className={`group r-tile flex min-w-0 flex-col ${focus}`}>
          <CardPhoto card={card} tile="soha-photo r-tile bg-panel" />
          <div className={`px-0.5 pt-2.5 ${align}`}>
            {look.nameFirst ? (
              <>
                {name("text-[14px] font-semibold leading-[1.3]")}
                <div className="mt-1">{price("text-[15px] font-bold")}</div>
              </>
            ) : (
              <>
                {price("text-[17px] font-extrabold tracking-[-0.01em]")}
                <div className="mt-0.5">{name("text-[14px] font-medium leading-5")}</div>
              </>
            )}
            {lead}
          </div>
        </Link>
        {/* Over the photo, as on the default card: only the control takes taps. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-card">
          <div className="absolute inset-x-2 bottom-2 flex justify-end">
            {card.hasOptions ? (
              <CartCount id={card.id} unit={card.unit} />
            ) : (
              <AddControl
                id={card.id}
                name={card.name}
                price={card.price}
                max={card.max}
                soldOut={card.soldOut}
                unit={card.unit}
                shape="corner"
              />
            )}
          </div>
        </div>
      </article>
    );
  }

  if (look.card === "spec") {
    const stepperRow = inCart && !card.hasOptions;
    return (
      <article className="soha-card soha-card--spec r-card relative flex h-full min-w-0 flex-col overflow-hidden border border-line bg-card">
        <Link href={href} aria-label={card.spoken} className={`group flex min-w-0 flex-1 flex-col ${focus} focus-visible:ring-inset focus-visible:ring-offset-0`}>
          <CardPhoto card={card} tile="soha-photo soha-photo--light border-b border-line" />
          {/* Room on the right for the "+" laid over the corner below. */}
          <div className="flex-1 px-2.5 pb-3 pr-12 pt-2.5">
            {name("text-[13px] font-semibold leading-[1.3]")}
            <div className="mt-1.5">{price("text-[15px] font-extrabold")}</div>
            {lead}
          </div>
        </Link>
        <div className={stepperRow ? "px-2 pb-2.5" : "absolute bottom-2 right-2"}>
          {card.hasOptions ? (
            <CartCount id={card.id} unit={card.unit} />
          ) : (
            <AddControl
              id={card.id}
              name={card.name}
              price={card.price}
              max={card.max}
              soldOut={card.soldOut}
              unit={card.unit}
              shape="inline"
            />
          )}
        </div>
      </article>
    );
  }

  // soft and market: a surface with the add button across its foot.
  const soft = look.card === "soft";
  return (
    <article
      className={`soha-card r-card relative flex h-full min-w-0 flex-col p-2 pb-2.5 ${
        soft ? "soha-card--soft bg-[var(--card-tint,var(--color-panel))]" : "soha-card--market border border-line bg-card"
      }`}
    >
      <Link href={href} aria-label={card.spoken} className={`group r-tile flex min-w-0 flex-1 flex-col ${focus}`}>
        <CardPhoto card={card} tile={`soha-photo r-tile ${soft ? "bg-card" : "bg-gray-900/[0.035] dark:bg-gray-200"}`} />
        <div className={`flex-1 px-1 pt-2.5 ${align}`}>
          {soft ? (
            <>
              {name("text-[14px] font-semibold leading-[1.3]")}
              <div className="mt-1">{price("text-[16px] font-extrabold")}</div>
            </>
          ) : (
            <>
              {price("text-[17px] font-extrabold tracking-[-0.01em]")}
              <div className="mt-0.5">{name("text-[13px] font-medium leading-[1.35]")}</div>
            </>
          )}
          {lead}
        </div>
      </Link>
      <div className="mt-2.5">
        {card.hasOptions ? (
          // Choices are made on the product page; the count says what is in the cart.
          <Link href={href} tabIndex={-1} aria-hidden className="add-pill r-ctl flex h-11 w-full items-center justify-center gap-2 bg-gray-900/[0.05] text-[14px] font-bold text-ink">
            {t("home.viewProduct")}
            <CartCount id={card.id} unit={card.unit} />
          </Link>
        ) : (
          <AddControl
            id={card.id}
            name={card.name}
            price={card.price}
            max={card.max}
            soldOut={card.soldOut}
            unit={card.unit}
          />
        )}
      </div>
    </article>
  );
}
