"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";
import { usePrice } from "@/hooks/usePrice";
import { summarizeCart, useCart } from "@/lib/cart-store";
import { BagIcon, ChevronRightIcon } from "./icons/ShopIcons";

/** Bar height (h-14) plus the gap to the nav; the in-flow spacer matches it. */
const BAR_SPACE = 56 + 12;

/**
 * Phone-only way to the cart on the pages that sell (home, catalogue): a
 * brand pill above the bottom nav with the count and, when every line has a
 * price snapshot, the total. It is the one loud element on those screens.
 * Render it at the end of <main>: it leaves an in-flow spacer of its own height
 * so the last row of products is never hidden under it.
 */
export function CartBar() {
  const { t } = useTranslations();
  const { parts } = usePrice();
  const summary = summarizeCart(useCart());
  const visible = summary.lines > 0;
  const total = summary.total !== null ? parts(summary.total) : null;

  return (
    <>
      <div
        aria-hidden
        className="transition-[height] duration-200 motion-reduce:transition-none lg:hidden"
        style={{ height: visible ? BAR_SPACE : 0 }}
      />
      <div
        className={`fixed inset-x-0 z-20 px-4 pb-3 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none lg:hidden ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
        style={{ bottom: "var(--nav-total)" }}
        inert={!visible}
      >
        <Link
          href="/cart"
          aria-label={`${t("cartBar.open")}: ${t("cartBar.items").replace("{count}", String(summary.units))}${
            total ? `, ${total.amount} ${total.suffix}` : ""
          }`}
          className="flex h-14 w-full items-center gap-3 rounded-full bg-brand-500 pl-2 pr-4 text-white transition-[background-color,transform] duration-100 hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 motion-safe:active:scale-[0.98]"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
            <BagIcon className="h-[22px] w-[22px]" strokeWidth={1.9} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold leading-none tabular-nums text-brand-600">
              {summary.units > 99 ? "99+" : summary.units}
            </span>
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{t("nav.cart")}</span>
          {total && (
            <span className="shrink-0 whitespace-nowrap tabular-nums">
              <span className="text-[17px] font-bold tracking-[-0.01em]">{total.amount}</span>{" "}
              <span className="text-[13px] font-semibold text-white/80">{total.suffix}</span>
            </span>
          )}
          <ChevronRightIcon className="-mr-1 h-5 w-5 shrink-0 text-white/80" strokeWidth={2.2} />
        </Link>
      </div>
    </>
  );
}
