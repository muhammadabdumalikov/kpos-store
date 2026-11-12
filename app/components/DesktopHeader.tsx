"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoginButton } from "./LoginButton";
import { useTranslations } from "@/hooks/useTranslations";
import { usePrice } from "@/hooks/usePrice";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import { summarizeCart, useCart } from "@/lib/cart-store";
import { useStoreInfo } from "@/lib/use-store-info";
import type { StoreInfo } from "@/lib/store-api";
import { SearchInput } from "./SearchInput";
import { BagIcon, GridIcon, ReceiptIcon } from "./icons/ShopIcons";

const quietItem =
  "flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40";

/**
 * Desktop header: the shop's own name where a platform logo would sit, then
 * catalogue, search, orders and the cart. The cart is quiet while empty and
 * becomes the one brand-coloured control once it holds something.
 */
export function DesktopHeader({ store }: { store?: StoreInfo | null }) {
  const { t } = useTranslations();
  const { parts } = usePrice();
  const pathname = usePathname();
  const info = useStoreInfo(store);
  const summary = summarizeCart(useCart());
  const total = summary.total !== null ? parts(summary.total) : null;
  const onCatalog = pathname.startsWith("/catalog");
  const onOrders = pathname.startsWith("/orders");

  return (
    <header className="sticky top-0 z-20 hidden border-b border-gray-900/[0.06] bg-white lg:block dark:border-white/[0.06] dark:bg-gray-900">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center gap-3 px-4">
        {info?.name && (
          <Link
            href="/"
            title={info.name}
            className="mr-2 min-w-0 max-w-[260px] shrink truncate rounded-lg text-[22px] font-extrabold tracking-[-0.02em] text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-white"
          >
            {info.name}
          </Link>
        )}

        <Link
          href="/catalog"
          aria-current={onCatalog ? "page" : undefined}
          className={`${quietItem} ${
            onCatalog
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "bg-gray-900/[0.05] text-gray-900 hover:bg-gray-900/[0.08] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
          }`}
        >
          <GridIcon className="h-[18px] w-[18px]" strokeWidth={2} />
          {t("nav.catalog")}
        </Link>

        <SearchInput className="max-w-[560px]" />

        <nav className="ml-auto flex shrink-0 items-center gap-1" aria-label={t("nav.mainNav")}>
          <Link
            href="/orders"
            aria-current={onOrders ? "page" : undefined}
            className={`${quietItem} ${
              onOrders
                ? "text-brand-500 dark:text-brand-400"
                : "text-gray-700 hover:bg-gray-900/[0.05] hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
            }`}
          >
            <ReceiptIcon className="h-5 w-5" />
            {t("nav.orders")}
          </Link>

          {summary.lines > 0 ? (
            <Link
              href="/cart"
              aria-label={`${t("cartBar.open")}: ${t("cartBar.items").replace("{count}", String(summary.units))}${
                total ? `, ${total.amount} ${total.suffix}` : ""
              }`}
              className={`${quietItem} bg-brand-500 pl-2.5 pr-4 text-white hover:bg-brand-600`}
            >
              <BagIcon className="h-5 w-5" strokeWidth={1.9} />
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/20 px-1.5 text-[12px] font-bold tabular-nums">
                {summary.units > 99 ? "99+" : summary.units}
              </span>
              {total ? (
                <span className="whitespace-nowrap tabular-nums">
                  <span className="font-bold">{total.amount}</span>{" "}
                  <span className="text-[12px] font-semibold text-white/80">{total.suffix}</span>
                </span>
              ) : (
                t("nav.cart")
              )}
            </Link>
          ) : (
            <Link
              href="/cart"
              className={`${quietItem} text-gray-700 hover:bg-gray-900/[0.05] hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white`}
            >
              <BagIcon className="h-5 w-5" />
              {t("nav.cart")}
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 border-l border-gray-900/[0.06] pl-3 dark:border-white/[0.08]">
          <ThemeToggleButton />
          <LocaleSwitcher />
          <LoginButton className="h-11 rounded-full bg-gray-900/[0.05] px-4 text-[14px] font-semibold text-gray-900 transition-colors hover:bg-gray-900/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10">
            {t("header.login")}
          </LoginButton>
        </div>
      </div>
    </header>
  );
}
