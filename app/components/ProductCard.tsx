"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { isWeighed, usePrice, type QuantityType } from "@/hooks/usePrice";
import { stockOf } from "@/lib/stock";
import { AddControl } from "./AddControl";
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
};

/**
 * The shop's product tile: photo, price, name, and an add control that never
 * leaves the page. The photo and text link to the product; the control sits
 * outside the link so a tap on it only changes the cart.
 */
export function ProductCard({ id, name, price, image, quantity, quantityType }: ProductCardProps) {
  const { t } = useTranslations();
  const { parts, format } = usePrice();
  const [broken, setBroken] = useState(false);

  const { max, soldOut, lowStock } = stockOf(quantity);
  const showImage = Boolean(image) && !broken;
  const { amount, suffix } = parts(price, quantityType);

  return (
    <article className="flex h-full min-w-0 flex-col">
      <Link
        href={`/products/${id}`}
        aria-label={`${name}, ${format(price, quantityType)}${soldOut ? `, ${t("product.soldOut")}` : ""}`}
        className="group flex min-w-0 flex-col rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
      >
        <div
          className={`relative aspect-square w-full overflow-hidden rounded-[20px] ${
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
          {lowStock && (
            <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-[3px] text-[11px] font-bold leading-4 text-warning-700">
              {t("product.lowStock")}
            </span>
          )}
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
        </p>
        <h3 className="mt-0.5 line-clamp-2 break-words px-0.5 text-[14px] font-medium leading-5 text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
          {name}
        </h3>
      </Link>

      <div className="mt-auto pt-2.5">
        <AddControl
          id={id}
          name={name}
          price={price}
          max={max}
          soldOut={soldOut}
          unit={isWeighed(quantityType) ? t("common.unitKg") : null}
        />
      </div>
    </article>
  );
}
