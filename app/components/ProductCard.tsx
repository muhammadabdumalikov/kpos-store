"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  image?: string;
  /** Stock on hand; when 0 or less the card shows an out-of-stock state. */
  quantity?: number;
};

const formatPrice = (value: number) =>
  Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

export function ProductCard({ id, name, price, image, quantity }: ProductCardProps) {
  const { t } = useTranslations();
  const outOfStock = quantity != null && quantity <= 0;

  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white p-2 shadow-theme-xs transition hover:shadow-theme-md dark:border dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <Link href={`/products/${id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
          {image ? (
            <img
              src={image}
              alt=""
              className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] ${
                outOfStock ? "opacity-50" : ""
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-300 dark:text-gray-600">
              {name.slice(0, 1)}
            </div>
          )}
          {outOfStock && (
            <span className="absolute left-2 top-2 rounded-lg bg-gray-900/80 px-2 py-1 text-xs font-semibold text-white">
              {t("product.outOfStock")}
            </span>
          )}
        </div>
        <div className="flex w-full min-w-0 flex-1 flex-col gap-1 px-1 pt-2.5">
          <p className="text-base font-bold text-gray-900 dark:text-white/90">
            {formatPrice(price)}
          </p>
          <p className="text-sm font-medium leading-snug text-gray-600 line-clamp-2 dark:text-gray-400">
            {name}
          </p>
        </div>
      </Link>
      {outOfStock ? (
        <span className="mt-2.5 block w-full rounded-xl bg-gray-100 py-2.5 text-center text-sm font-semibold text-gray-400 dark:bg-gray-800 dark:text-gray-500">
          {t("product.outOfStock")}
        </span>
      ) : (
        <Link
          href={`/products/${id}`}
          className="mt-2.5 block w-full rounded-xl bg-brand-50 py-2.5 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-500 hover:text-white active:scale-[0.98] dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500 dark:hover:text-white"
        >
          {t("product.buy")}
        </Link>
      )}
    </article>
  );
}
