"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { isWeighed, usePrice, type QuantityType } from "@/hooks/usePrice";
import { formatAmount } from "@/lib/format";
import { discountLabel, discountPercent } from "@/lib/product-badges";
import { onOrderLabel, stockOf } from "@/lib/stock";
import { AddControl, CartCount } from "./AddControl";
import { BoxIcon } from "./icons/ShopIcons";

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
  const pill = soldOut
    ? { text: t("product.soldOut"), tone: "bg-white text-gray-600" }
    : percent
      ? { text: discountLabel(percent), tone: "bg-error-600 text-white tabular-nums" }
      : lowStock
        ? { text: t("product.lowStock"), tone: "bg-white text-warning-700" }
        : popular
          ? { text: t("product.badgePopular"), tone: "bg-white text-gray-900" }
          : isNew
            ? { text: t("product.badgeNew"), tone: "bg-white text-brand-600" }
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
