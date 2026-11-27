"use client";

import Link from "next/link";
import { useState } from "react";
import { useSohaLook, useStoreTheme } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { isWeighed, usePrice, type QuantityType } from "@/hooks/usePrice";
import { useCartQty } from "@/lib/cart-store";
import { formatAmount } from "@/lib/format";
import { discountLabel, discountPercent } from "@/lib/product-badges";
import { onOrderLabel, stockOf } from "@/lib/stock";
import type { StoreTheme } from "@/lib/store-theme";
import { AddControl, CartCount } from "./AddControl";
import { BoxIcon } from "./icons/ShopIcons";
import { SohaCard } from "./soha/SohaCard";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  /** Stock on hand; 0 or less is sold out. Unknown means "no cap". */
  quantity?: number;
  /** "kg" prices per kilogram; anything else is per piece. */
  quantityType?: QuantityType;
  /** Taken on order: with no stock the card says "Buyurtmaga", not sold out. */
  preorder?: boolean;
  /** Free text after that label ("15–20 kun"). */
  leadTime?: string | null;
  /** The product has choices; the control leads to its page to make them. */
  hasOptions?: boolean;
  /** The price it was marked down from; shown struck through beside the price. */
  oldPrice?: number | null;
  /** The shop's flags; at most one of them reaches the photo's corner. */
  isNew?: boolean;
  popular?: boolean;
  /** The lead time the shop header already states for every product
   *  (lib/stock sharedOrderLead); a card with that same lead does not repeat it. */
  sharedLead?: string | null;
};

const cornerPill = "absolute left-2 top-2 rounded-full px-2 py-[3px] text-[11px] font-bold leading-4";

/** Which label the photo's corner carries; each look colours it its own way. */
type PillKind = "soldOut" | "sale" | "low" | "popular" | "new";
const PILL_TONES: Record<StoreTheme, Record<PillKind, string>> = {
  default: {
    soldOut: "bg-white text-gray-600",
    sale: "bg-error-600 text-white tabular-nums",
    low: "bg-white text-warning-700",
    popular: "bg-white text-gray-900",
    new: "bg-white text-brand-600",
  },
  jurnal: {
    soldOut: "bg-white text-gray-600",
    sale: "bg-error-600 text-white tabular-nums",
    low: "bg-white text-warning-700",
    popular: "bg-white text-gray-900",
    new: "bg-white text-brand-600",
  },
  afisha: {
    soldOut: "border-b border-r border-gray-900 bg-white text-gray-600",
    sale: "bg-error-600 text-white tabular-nums",
    low: "border-b border-r border-gray-900 bg-white text-warning-700",
    popular: "bg-gray-900 text-white",
    new: "border-b border-r border-gray-900 bg-brand-300 text-gray-900",
  },
  tungi: {
    soldOut: "bg-gray-950/85 text-white",
    sale: "bg-error-600 text-white tabular-nums",
    low: "bg-white text-warning-700",
    popular: "bg-white text-gray-950",
    new: "bg-brand-300 text-gray-950",
  },
};
const THEMED_PILL: Record<Exclude<StoreTheme, "default">, string> = {
  jurnal: "absolute left-0 top-0 px-2 py-1 text-[10px] font-medium uppercase leading-4 tracking-[0.14em]",
  afisha: "absolute left-0 top-0 px-2 py-1 text-[10px] font-bold uppercase leading-4 tracking-[0.1em]",
  tungi: "absolute left-2 top-2 rounded-full px-2.5 py-[3px] text-[11px] font-extrabold leading-4",
};

/**
 * The shop's product tile: photo, price and name, all one link to the product.
 * Adding is a round "+" on the photo's corner that never leaves the page; it
 * sits outside the link so a tap on it only changes the cart. A product with
 * choices has no "+": its card leads to the page where they are made.
 *
 * The photo's top-left corner holds one label at most: sold out wins, then the
 * markdown, running low, popular, new. The "+" keeps the bottom-right corner.
 */
export function ProductCard({
  id,
  name,
  price,
  image,
  quantity,
  quantityType,
  preorder,
  leadTime,
  hasOptions,
  oldPrice,
  isNew,
  popular,
  sharedLead = null,
}: ProductCardProps) {
  const { t } = useTranslations();
  const { parts, format } = usePrice();
  const theme = useStoreTheme();
  const soha = useSohaLook();
  const [broken, setBroken] = useState(false);

  const { max, soldOut, lowStock, onOrder } = stockOf(quantity, preorder);
  const showImage = Boolean(image) && !broken;
  const { amount, suffix } = parts(price, quantityType);
  const orderLabel = onOrder ? onOrderLabel(t("preorder.label"), leadTime) : null;
  // Said once in the shop header when it holds for everything on sale.
  const showOrderLabel = orderLabel !== null && (sharedLead === null || sharedLead !== (leadTime?.trim() ?? ""));
  const unit = isWeighed(quantityType) ? t("common.unitKg") : null;

  // A sold-out card is greyed and says only that; no markdown, no flags.
  const was = !soldOut && oldPrice && oldPrice > price ? oldPrice : null;
  const percent = was ? discountPercent(price, was) : null;
  // The sale red is fixed (white on error-600 is 4.83:1) so it reads as a
  // markdown under any shop accent.
  const pillAs = (kind: PillKind, text: string) => ({ kind, text, tone: PILL_TONES[theme][kind] });
  const pill = soldOut
    ? pillAs("soldOut", t("product.soldOut"))
    : percent
      ? pillAs("sale", discountLabel(percent))
      : lowStock
        ? pillAs("low", t("product.lowStock"))
        : popular
          ? pillAs("popular", t("product.badgePopular"))
          : isNew
            ? pillAs("new", t("product.badgeNew"))
            : null;
  // Read out with the link: the corner label, unless it is the markdown,
  // which the old price already says.
  const spoken = [
    `${name}, ${format(price, quantityType)}`,
    was ? `${t("product.oldPrice")} ${format(was, quantityType)}` : null,
    pill && !percent ? pill.text : null,
    orderLabel,
  ]
    .filter(Boolean)
    .join(", ");

  if (soha) {
    return (
      <SohaCard
        look={soha}
        card={{
          id,
          name,
          price,
          image: showImage ? image! : null,
          onImageError: () => setBroken(true),
          soldOut,
          max,
          amount,
          suffix,
          was,
          orderLabel: showOrderLabel ? orderLabel : null,
          unit,
          hasOptions: hasOptions === true,
          spoken,
          pill: pill && { text: pill.text, className: `soha-pill ${cornerPill} ${pill.tone}` },
        }}
      />
    );
  }

  if (theme !== "default") {
    return (
      <ThemedCard
        theme={theme}
        card={{
          id,
          name,
          price,
          image: showImage ? image! : null,
          onImageError: () => setBroken(true),
          soldOut,
          max,
          amount,
          suffix,
          was,
          orderLabel: showOrderLabel ? orderLabel : null,
          unit,
          hasOptions: hasOptions === true,
          spoken,
          pill: pill && { text: pill.text, className: `${THEMED_PILL[theme]} ${pill.tone}` },
        }}
      />
    );
  }

  return (
    <article className="relative flex h-full min-w-0 flex-col">
      <Link
        href={`/products/${id}`}
        aria-label={spoken}
        className="group flex min-w-0 flex-col rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
      >
        <div
          className={`relative aspect-card w-full overflow-hidden rounded-[20px] ${
            showImage ? "bg-gray-900/[0.035] dark:bg-gray-200" : "bg-gray-900/[0.035] dark:bg-white/[0.04]"
          } ${soldOut && showImage ? "dark:opacity-60" : ""}`}
        >
          {showImage ? (
            // Plain <img>: shop photos come from whatever host the shop's
            // storage uses, and next/image throws on hosts missing from config.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image!}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setBroken(true)}
              // Packshots sit on white: multiply melts that white into the
              // tile. Dark mode keeps a soft light tile so the trick still
              // works without a glaring white square.
              className={`h-full w-full object-cover mix-blend-multiply motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03] ${
                soldOut ? "opacity-40 grayscale" : ""
              }`}
            />
          ) : (
            <span className={`flex h-full w-full flex-col items-center justify-center gap-1.5 text-gray-900/25 dark:text-white/25 ${soldOut ? "opacity-50" : ""}`}>
              <BoxIcon className="h-9 w-9" />
              <span className="sr-only">{t("product.noPhoto")}</span>
            </span>
          )}
          {pill && <span className={`${cornerPill} ${pill.tone}`}>{pill.text}</span>}
        </div>

        <p
          className={`mt-2.5 flex flex-wrap items-baseline gap-x-1 px-0.5 tabular-nums ${
            soldOut ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
          }`}
        >
          <span className="text-[17px] font-bold leading-6 tracking-[-0.01em]">{amount}</span>
          <span
            className={`text-[13px] font-semibold leading-5 ${
              soldOut ? "" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {suffix}
          </span>
          {was && (
            <s className="ml-0.5 whitespace-nowrap text-[13px] font-medium leading-5 text-gray-500 dark:text-gray-400">
              {formatAmount(was)}
            </s>
          )}
        </p>
        <h3 className="mt-0.5 line-clamp-2 break-words px-0.5 text-[14px] font-medium leading-5 text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
          {name}
        </h3>
        {/* Plain grey, no dot: it is a fact about delivery, not an alert. */}
        {showOrderLabel && (
          <p className="mt-0.5 truncate px-0.5 text-[13px] font-medium leading-5 text-gray-500 dark:text-gray-400">
            {orderLabel}
          </p>
        )}
      </Link>

      {/* Laid over the photo (the same shape, at the top of the tile); only
          the control itself takes taps, the rest falls through to the link. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-card">
        <div className="absolute inset-x-2 bottom-2 flex justify-end">
          {hasOptions ? (
            <CartCount id={id} unit={unit} />
          ) : (
            <AddControl id={id} name={name} price={price} max={max} soldOut={soldOut} unit={unit} shape="corner" />
          )}
        </div>
      </div>
    </article>
  );
}

/** What a themed card shows, worked out once by ProductCard. */
export type CardModel = {
  id: string;
  name: string;
  price: number;
  /** null when there is no photo or it failed to load. */
  image: string | null;
  onImageError: () => void;
  soldOut: boolean;
  max: number;
  amount: string;
  suffix: string;
  was: number | null;
  /** "Buyurtmaga · 15–20 kun", unless the shop header already says it. */
  orderLabel: string | null;
  unit: string | null;
  hasOptions: boolean;
  /** The link's accessible name. */
  spoken: string;
  pill: { text: string; className: string } | null;
};

/**
 * The card in a storefront theme. The same facts, label rules and controls as
 * the default card, in the theme's shape:
 * - Jurnal: a magazine tile. Photo on warm paper, the name in the serif, the
 *   price small under it; a hairline "+" on the photo's corner.
 * - Afisha: a ruled cell. Mono caps name, the price in the poster face, a
 *   square accent "+" beside it.
 * - Tungi: a rounded dark card with a white round "+" beside the price.
 * In Afisha and Tungi the stepper takes a row of its own under the price once
 * the product is in the cart: the same element, moved by class, so keyboard
 * focus stays on it.
 */
function ThemedCard({ theme, card }: { theme: Exclude<StoreTheme, "default">; card: CardModel }) {
  const inCart = useCartQty(card.id) > 0;
  const control = card.hasOptions ? (
    <CartCount id={card.id} unit={card.unit} />
  ) : (
    <AddControl
      id={card.id}
      name={card.name}
      price={card.price}
      max={card.max}
      soldOut={card.soldOut}
      unit={card.unit}
      shape={theme === "jurnal" ? "corner" : "inline"}
    />
  );
  const stepperRow = inCart && !card.hasOptions;

  if (theme === "jurnal") {
    return (
      <article className="relative flex h-full min-w-0 flex-col">
        <Link
          href={`/products/${card.id}`}
          aria-label={card.spoken}
          className="group flex min-w-0 flex-col outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-4 focus-visible:ring-offset-white"
        >
          <CardPhoto card={card} tile="bg-gray-100" />
          <h3 className="mt-2.5 line-clamp-2 break-words font-head text-[19px] font-medium leading-[1.15] text-gray-900 lg:text-[21px]">
            {card.name}
          </h3>
          <p
            className={`mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[13px] leading-5 tabular-nums ${
              card.soldOut ? "text-gray-500" : "text-gray-600"
            }`}
          >
            <span className="whitespace-nowrap">
              {card.amount} {card.suffix}
            </span>
            {card.was && <s className="whitespace-nowrap text-gray-500">{formatAmount(card.was)}</s>}
          </p>
          {card.orderLabel && <p className="mt-0.5 truncate text-[12px] leading-5 text-gray-500">{card.orderLabel}</p>}
        </Link>
        {/* Over the photo, as on the default card: only the control takes taps. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-card">
          <div className="absolute inset-x-2 bottom-2 flex justify-end">{control}</div>
        </div>
      </article>
    );
  }

  const afisha = theme === "afisha";
  return (
    <article
      className={`relative flex h-full min-w-0 flex-col ${
        afisha ? "border-b border-r border-gray-900 bg-white" : "rounded-[24px] bg-gray-800 p-1.5 pb-3"
      }`}
    >
      <Link
        href={`/products/${card.id}`}
        aria-label={card.spoken}
        className={`group flex min-w-0 flex-1 flex-col outline-none ${
          afisha
            ? "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900"
            : "rounded-[20px] focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
        }`}
      >
        <CardPhoto
          card={card}
          tile={afisha ? "border-b border-gray-900 bg-white" : "rounded-[18px] bg-gray-200"}
        />
        {/* Room on the right for the "+" laid over the corner below. */}
        <div className={afisha ? "flex-1 px-2.5 pb-3 pr-12 pt-2.5" : "px-1.5 pr-11 pt-2.5"}>
          <h3
            className={
              afisha
                ? "line-clamp-2 break-words text-[11px] font-bold uppercase leading-[1.3] tracking-[0.04em] text-gray-900"
                : "line-clamp-2 break-words text-[13px] font-semibold leading-[1.3] text-gray-300"
            }
          >
            {card.name}
          </h3>
          <p
            className={`mt-1.5 flex flex-wrap items-baseline gap-x-1 tabular-nums ${
              card.soldOut ? "text-gray-500" : afisha ? "text-gray-900" : "text-white"
            }`}
          >
            {/* The sum and its "so'm" stay on one line; the old price may wrap. */}
            <span className="whitespace-nowrap">
              <span className={afisha ? "font-head text-[13px] font-extrabold" : "text-[15px] font-extrabold"}>
                {card.amount}
              </span>{" "}
              <span className={afisha ? "text-[10px] font-bold uppercase" : "text-[12px] font-semibold text-gray-400"}>
                {card.suffix}
              </span>
            </span>
            {card.was && (
              <s className={`whitespace-nowrap font-medium ${afisha ? "text-[11px] text-gray-500" : "text-[12px] text-gray-400"}`}>
                {formatAmount(card.was)}
              </s>
            )}
          </p>
          {card.orderLabel && (
            <p
              className={
                afisha
                  ? "mt-1 truncate text-[10px] font-bold uppercase tracking-[0.04em] text-gray-500"
                  : "mt-0.5 truncate text-[12px] font-medium text-gray-400"
              }
            >
              {card.orderLabel}
            </p>
          )}
        </div>
      </Link>
      <div
        className={
          stepperRow
            ? afisha
              ? "px-2.5 pb-3"
              : "px-0.5 pt-2.5"
            : afisha
              ? "absolute bottom-2 right-2"
              : "absolute bottom-2.5 right-2.5"
        }
      >
        {control}
      </div>
    </article>
  );
}

/** A themed card's photo tile with its corner label; a box when there is no photo. */
export function CardPhoto({ card, tile }: { card: CardModel; tile: string }) {
  const { t } = useTranslations();
  return (
    <div className={`relative aspect-card w-full overflow-hidden ${tile}`}>
      {card.image ? (
        // Plain <img>, as on the default card: shop photos come from any host.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.image}
          alt=""
          loading="lazy"
          decoding="async"
          onError={card.onImageError}
          className={`h-full w-full object-cover mix-blend-multiply motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03] ${
            card.soldOut ? "opacity-40 grayscale" : ""
          }`}
        />
      ) : (
        <span className={`flex h-full w-full items-center justify-center text-gray-900/25 ${card.soldOut ? "opacity-50" : ""}`}>
          <BoxIcon className="h-9 w-9" />
          <span className="sr-only">{t("product.noPhoto")}</span>
        </span>
      )}
      {card.pill && <span className={card.pill.className}>{card.pill.text}</span>}
    </div>
  );
}
