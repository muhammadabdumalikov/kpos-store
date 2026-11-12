"use client";

import Link from "next/link";
import { useState } from "react";
import { useTelegram } from "@/context/TelegramContext";
import { useTranslations } from "@/hooks/useTranslations";
import { isWeighed, usePrice, type QuantityType } from "@/hooks/usePrice";
import { useCartQty } from "@/lib/cart-store";
import type { CatalogProduct } from "@/lib/catalog-pages";
import { stockOf } from "@/lib/stock";
import type { StoreInfo } from "@/lib/store-api";
import { AddControl } from "./AddControl";
import { BackButton, useBackFallback } from "./BackButton";
import { ProductCard } from "./ProductCard";
import { pillSecondary } from "./StatePanel";
import { useFulfilmentLines } from "./StoreIntro";
import { BoxIcon, ChevronRightIcon } from "./icons/ShopIcons";

export type ProductViewProduct = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  quantityType: QuantityType;
};

export type RelatedProducts = {
  /** "category": the product's own category. "shop": anything else the shop
   *  sells, when the category has nothing else to offer. */
  kind: "category" | "shop";
  products: CatalogProduct[];
};

const sectionTitle =
  "text-[20px] font-bold leading-7 tracking-[-0.01em] text-gray-900 dark:text-white lg:text-[22px]";

export function categoryHref(categoryId: string | null | undefined) {
  return categoryId ? `/catalog?category=${encodeURIComponent(categoryId)}` : "/catalog";
}

/**
 * The product page body: the photo, then what the shopper decides on (name,
 * price, the rare stock warning) and the one action, then more from the same
 * shelf. The server page fetches; this renders, so every string is localised.
 */
export function ProductView({
  product,
  category,
  categoryId,
  related,
  info,
}: {
  product: ProductViewProduct;
  /** The product's category, when it has one and its name is known. */
  category: { id: string; name: string } | null;
  categoryId: string | null;
  related: RelatedProducts | null;
  info: StoreInfo | null;
}) {
  const { t } = useTranslations();
  const { parts } = usePrice();
  const { isTelegram } = useTelegram();
  const qty = useCartQty(product.id);
  const fulfilment = useFulfilmentLines(info);

  const backHref = categoryHref(categoryId);
  useBackFallback(backHref);

  const { max, soldOut, lowStock } = stockOf(product.quantity);
  const weighed = isWeighed(product.quantityType);
  const unit = weighed ? t("common.unitKg") : null;
  const { amount, suffix } = parts(product.price, product.quantityType);
  const atCap = qty > 0 && qty >= max && Number.isFinite(max);

  return (
    <>
      {/* Phone: one round back button above the photo. Inside Telegram the
          client's own back button (same rule) already sits in the header. */}
      {!isTelegram && (
        <div className="flex h-[60px] items-center md:h-16 lg:hidden">
          <BackButton fallback={backHref} variant="round" />
        </div>
      )}
      <div className="hidden pt-5 lg:block">
        <BackButton fallback={backHref} variant="link" />
      </div>

      <div
        className={`grid grid-cols-1 gap-x-8 md:grid-cols-2 md:items-start lg:mt-3 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] lg:gap-x-14 ${
          isTelegram ? "pt-3 lg:pt-0" : ""
        }`}
      >
        <ProductPhoto
          key={product.image ?? ""}
          image={product.image}
          name={product.name}
          soldOut={soldOut}
        />

        <div className="min-w-0 pt-3 md:pt-0 lg:pt-2">
          {category && (
            <Link
              href={categoryHref(category.id)}
              className="group -my-1.5 inline-flex h-11 max-w-full items-center rounded-full outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-brand-500/60 focus-visible:[&>span]:ring-offset-2 focus-visible:[&>span]:ring-offset-white dark:focus-visible:[&>span]:ring-offset-gray-900"
            >
              <span className="flex h-8 min-w-0 items-center rounded-full bg-gray-900/[0.05] px-3.5 text-[13px] font-semibold text-gray-600 transition-colors duration-100 group-hover:bg-gray-900/[0.08] group-hover:text-gray-900 dark:bg-white/[0.07] dark:text-gray-300 dark:group-hover:bg-white/[0.11] dark:group-hover:text-white">
                <span className="truncate">{category.name}</span>
              </span>
            </Link>
          )}

          <h1
            className={`${
              category ? "mt-2" : ""
            } break-words text-[24px] font-bold leading-[30px] tracking-[-0.02em] text-gray-900 dark:text-white lg:text-[32px] lg:leading-[40px]`}
          >
            {product.name}
          </h1>

          <p
            className={`mt-2 flex flex-wrap items-baseline gap-x-1.5 tabular-nums lg:mt-3 ${
              soldOut ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
            }`}
          >
            <span className="whitespace-nowrap text-[30px] font-bold leading-9 tracking-[-0.02em] lg:text-[36px] lg:leading-[44px]">
              {amount}
            </span>
            <span
              className={`whitespace-nowrap text-[16px] font-semibold leading-6 lg:text-[18px] ${
                soldOut ? "" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {suffix}
            </span>
          </p>

          {lowStock && (
            <p className="mt-1.5 flex items-center gap-2 text-[14px] font-semibold leading-5 text-warning-700 dark:text-warning-400">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning-500" />
              {t(weighed ? "product.onlyLeftKg" : "product.onlyLeft").replace("{count}", String(max))}
            </p>
          )}

          <div className="mt-5 flex gap-3 lg:mt-7 lg:max-w-[440px]">
            <div className="min-w-0 flex-1">
              <AddControl
                id={product.id}
                name={product.name}
                price={product.price}
                max={max}
                soldOut={soldOut}
                unit={unit}
                size="lg"
                tone="primary"
              />
            </div>
            {/* Desktop has no cart bar: once this product is in the cart, the
                way to it sits right here. */}
            {qty > 0 && (
              <div className="hidden shrink-0 lg:block">
                <Link href="/cart" className={`${pillSecondary} h-[52px] pr-4`}>
                  {t("cartBar.open")}
                  <ChevronRightIcon className="-ml-0.5 h-[18px] w-[18px] text-gray-400" />
                </Link>
              </div>
            )}
          </div>
          <p aria-live="polite" className="min-h-0 text-[13px] font-medium leading-5 text-gray-500 dark:text-gray-400">
            {atCap && <span className="mt-2.5 block">{t("product.allInCart")}</span>}
          </p>

          {fulfilment.length > 0 && (
            <ul
              aria-label={t("home.fulfilmentAria")}
              className="mt-6 flex flex-col gap-2.5 rounded-[20px] bg-gray-900/[0.035] px-4 py-3.5 dark:bg-white/[0.04] lg:mt-10 lg:max-w-[440px] lg:px-5 lg:py-4"
            >
              {fulfilment.map((l) => (
                <li
                  key={l.key}
                  className="flex min-w-0 items-start gap-2.5 text-[14px] font-medium leading-5 text-gray-500 dark:text-gray-400"
                >
                  <span className="mt-px shrink-0 text-gray-400 dark:text-gray-500">{l.icon}</span>
                  <span className="min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-white">{l.label}</span>
                    {l.detail && (
                      <>
                        <span aria-hidden> · </span>
                        <span className="tabular-nums">{l.detail}</span>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {related && related.products.length > 0 && (
        <section aria-labelledby="related-title" className="mt-10 lg:mt-16">
          <div className="flex items-center justify-between gap-3">
            <h2 id="related-title" className={sectionTitle}>
              {related.kind === "category" ? t("product.sameCategory") : t("product.moreProducts")}
            </h2>
            <Link
              href={related.kind === "category" ? categoryHref(categoryId) : "/catalog"}
              aria-label={
                related.kind === "category" && category
                  ? `${t("home.seeAll")}: ${category.name}`
                  : t("home.allProducts")
              }
              className="-mr-2 inline-flex h-11 shrink-0 items-center gap-0.5 rounded-full pl-3 pr-2 text-[14px] font-semibold text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-gray-400 dark:hover:text-white"
            >
              {t("home.seeAll")}
              <ChevronRightIcon className="h-[18px] w-[18px]" />
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:mt-4 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-8">
            {related.products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                image={p.image}
                quantity={p.quantity}
                quantityType={p.quantityType}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/**
 * The whole product, never cropped: packshots are contained on a tinted tile
 * and multiplied into it, as on the card. Sold out ghosts the photo the same
 * way the card does.
 */
function ProductPhoto({ image, name, soldOut }: { image: string | null; name: string; soldOut: boolean }) {
  const { t } = useTranslations();
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(image) && !broken;

  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-[28px] ${
        showImage ? "bg-gray-900/[0.035] dark:bg-gray-200" : "bg-gray-900/[0.035] dark:bg-white/[0.04]"
      } ${soldOut && showImage ? "dark:opacity-60" : ""}`}
    >
      {showImage ? (
        // Plain <img>: shop photos come from whatever host the shop's storage
        // uses, and next/image throws on hosts missing from config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image!}
          alt={name}
          decoding="async"
          fetchPriority="high"
          onError={() => setBroken(true)}
          // A photo that failed before hydration fired its error event with
          // no listener attached yet; catch that case when React attaches.
          ref={(el) => {
            if (el?.complete && el.naturalWidth === 0) setBroken(true);
          }}
          className={`absolute inset-0 h-full w-full object-contain p-[7%] mix-blend-multiply ${
            soldOut ? "opacity-40 grayscale" : ""
          }`}
        />
      ) : (
        <div
          className={`flex h-full w-full flex-col items-center justify-center gap-3 text-gray-900/25 dark:text-white/25 ${
            soldOut ? "opacity-60" : ""
          }`}
        >
          <BoxIcon className="h-16 w-16" strokeWidth={1.2} />
          <p className="text-[14px] font-semibold text-gray-900/40 dark:text-white/40">
            {broken ? t("product.photoFailed") : t("product.noPhoto")}
          </p>
        </div>
      )}
    </div>
  );
}
