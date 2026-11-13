"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { refreshPriceSnapshot, setLineQty, useCartQty, useProductCartQty } from "@/lib/cart-store";
import type { OptionChoice } from "@/lib/product-options";
import { ChevronRightIcon, MinusIcon, PlusIcon } from "./icons/ShopIcons";

export type AddControlSize = "md" | "lg";
/** "quiet": a tinted add pill (the card, where the cart bar is the loud thing).
 *  "primary": a brand add pill (the product page, where adding is the action). */
export type AddControlTone = "quiet" | "primary";

// Everything that differs between the card (md) and the product page (lg).
const SIZES: Record<
  AddControlSize,
  { height: string; step: string; icon: string; label: string; qty: string; unit: string }
> = {
  md: {
    height: "h-11",
    step: "h-11 w-11",
    icon: "h-[18px] w-[18px]",
    label: "text-[14px]",
    qty: "text-[15px]",
    unit: "text-[13px]",
  },
  lg: {
    height: "h-[52px]",
    step: "h-[52px] w-[52px]",
    icon: "h-5 w-5",
    label: "text-[16px]",
    qty: "text-[18px]",
    unit: "text-[14px]",
  },
};

const TONES: Record<AddControlTone, string> = {
  quiet:
    "bg-gray-900/[0.05] text-gray-900 hover:bg-gray-900/[0.08] focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.11]",
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/30",
};

/**
 * Add to cart, then a stepper in the same place: stops at the whole quantity
 * on hand, a decrement from 1 removes the line, and it never navigates. One
 * implementation for the product card and the product page.
 *
 * With `options` it drives the cart line for exactly those choices, so the
 * same product in another size is its own line with its own count.
 */
export function AddControl({
  id,
  name,
  price,
  max,
  soldOut,
  unit,
  size = "md",
  tone = "quiet",
  options,
  beforeAdd,
}: {
  id: string;
  name: string;
  price: number;
  /** Whole units this line may hold (Infinity when stock is unknown or the
   *  product is taken on order). */
  max: number;
  soldOut: boolean;
  /** "kg" for weighed goods, shown after the count; null for pieces. */
  unit: string | null;
  size?: AddControlSize;
  tone?: AddControlTone;
  /** The choices this line is for; omit for a product without options. */
  options?: OptionChoice[];
  /** Asked before a new line is added; returning false cancels the add (the
   *  product page uses it to ask for a missing choice). */
  beforeAdd?: () => boolean;
}) {
  const { t } = useTranslations();
  const qty = useCartQty(id, options);
  const inCart = qty > 0;
  const atCap = qty >= max;
  // Nothing left for a new line: the product's other lines hold all of it.
  const noRoom = !inCart && !soldOut && max < 1;
  const s = SIZES[size];

  // Keyboard focus follows the control across its two shapes: adding moves it
  // to "+", removing the last unit moves it back to "Add".
  const addRef = useRef<HTMLButtonElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<"add" | "plus" | null>(null);
  useEffect(() => {
    if (focusAfter.current === "plus" && inCart) plusRef.current?.focus();
    if (focusAfter.current === "add" && !inCart) addRef.current?.focus();
    focusAfter.current = null;
  }, [inCart]);

  // A card showing a newer price than the one stored with the line updates it,
  // so the cart bar's total does not drift from what the shop now charges.
  useEffect(() => {
    if (inCart) refreshPriceSnapshot(id, price);
  }, [inCart, id, price]);

  if (soldOut && !inCart) {
    return (
      <span
        className={`flex ${s.height} w-full select-none items-center justify-center rounded-full ${s.label} font-semibold text-gray-400 ring-1 ring-inset ring-gray-900/[0.08] dark:text-gray-500 dark:ring-white/[0.08]`}
      >
        {t("product.soldOut")}
      </span>
    );
  }

  if (!inCart) {
    const label = tone === "primary" ? t("product.addToCart") : t("product.add");
    return (
      <button
        ref={addRef}
        type="button"
        aria-disabled={noRoom || undefined}
        onClick={(e) => {
          if (noRoom) return;
          if (beforeAdd && !beforeAdd()) return;
          if (e.detail === 0) focusAfter.current = "plus";
          setLineQty(id, 1, price, options);
        }}
        aria-label={`${noRoom ? t("product.maxReached") : label}: ${name}`}
        className={`flex ${s.height} w-full items-center justify-center gap-1.5 rounded-full ${s.label} font-bold transition-[background-color,transform] duration-100 focus-visible:outline-none ${
          noRoom ? "cursor-not-allowed opacity-40" : "motion-safe:active:scale-[0.97]"
        } ${TONES[tone]}`}
      >
        <PlusIcon className={s.icon} strokeWidth={2.2} />
        {label}
      </button>
    );
  }

  const stepBtn = `flex ${s.step} shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80`;

  return (
    <div
      role="group"
      aria-label={name}
      className={`flex ${s.height} w-full items-center justify-between rounded-full bg-brand-500 text-white motion-safe:animate-[popover-in_0.16s_cubic-bezier(0.23,1,0.32,1)]`}
    >
      <button
        type="button"
        onClick={(e) => {
          if (qty === 1 && e.detail === 0) focusAfter.current = "add";
          setLineQty(id, qty - 1, price, options);
        }}
        aria-label={`${t("cart.decrease")}: ${name}`}
        className={`${stepBtn} hover:bg-white/15 motion-safe:active:scale-90`}
      >
        <MinusIcon className={s.icon} strokeWidth={2.4} />
      </button>
      <span className={`min-w-0 truncate text-center ${s.qty} font-bold tabular-nums`} aria-hidden>
        {qty}
        {unit && <span className={`ml-0.5 ${s.unit} font-semibold text-white/80`}>{unit}</span>}
      </span>
      <span className="sr-only" role="status">
        {t("product.inCart").replace("{count}", unit ? `${qty} ${unit}` : String(qty))}
      </span>
      <button
        ref={plusRef}
        type="button"
        aria-disabled={atCap || undefined}
        onClick={() => {
          if (!atCap) setLineQty(id, qty + 1, price, options);
        }}
        aria-label={atCap ? `${t("product.maxReached")}: ${name}` : `${t("cart.increase")}: ${name}`}
        className={`${stepBtn} ${
          atCap ? "cursor-not-allowed opacity-40" : "hover:bg-white/15 motion-safe:active:scale-90"
        }`}
      >
        <PlusIcon className={s.icon} strokeWidth={2.4} />
      </button>
    </div>
  );
}

/**
 * The card's control for a product with choices (size, colour): they are made
 * on the product page, so the pill goes there instead of adding blind. Once
 * some are in the cart it says how many, across every choice.
 */
export function ChooseLink({
  id,
  name,
  soldOut,
  unit,
}: {
  id: string;
  name: string;
  soldOut: boolean;
  /** "kg" for weighed goods, shown after the count; null for pieces. */
  unit: string | null;
}) {
  const { t } = useTranslations();
  const qty = useProductCartQty(id);
  const inCart = qty > 0;
  const s = SIZES.md;

  if (soldOut && !inCart) {
    return (
      <span
        className={`flex ${s.height} w-full select-none items-center justify-center rounded-full ${s.label} font-semibold text-gray-400 ring-1 ring-inset ring-gray-900/[0.08] dark:text-gray-500 dark:ring-white/[0.08]`}
      >
        {t("product.soldOut")}
      </span>
    );
  }

  const label = inCart
    ? t("product.inCart").replace("{count}", unit ? `${qty} ${unit}` : String(qty))
    : t("productOptions.choose");

  return (
    <Link
      href={`/products/${id}`}
      aria-label={`${label}: ${name}`}
      className={`flex ${s.height} w-full items-center justify-center gap-1 rounded-full pl-2 ${s.label} font-bold tabular-nums transition-[background-color,transform] duration-100 focus-visible:outline-none motion-safe:active:scale-[0.97] ${
        inCart
          ? "bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/30"
          : TONES.quiet
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <ChevronRightIcon className={`${s.icon} shrink-0 ${inCart ? "text-white/80" : "text-gray-400"}`} strokeWidth={2.2} />
    </Link>
  );
}
