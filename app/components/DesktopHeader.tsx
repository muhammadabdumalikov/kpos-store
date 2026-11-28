"use client";

import Link from "@/app/components/ShopLink";
import { usePathname } from "next/navigation";
import { useStoreTheme } from "@/context/StoreThemeContext";
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
import { afishaCaps, jurnalCaps } from "./themes/classes";

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
  const theme = useStoreTheme();
  const cartLabel = `${t("cartBar.open")}: ${t("cartBar.items").replace("{count}", String(summary.units))}${
    total ? `, ${total.amount} ${total.suffix}` : ""
  }`;
  const units = summary.units > 99 ? "99+" : String(summary.units);

  if (theme === "jurnal") {
    // A masthead: the shop's name centred in the serif, letter-spaced links
    // either side, the cart as "Savat (2)" turning black once it holds something.
    const link = (active: boolean) =>
      `inline-flex h-11 shrink-0 items-center border-b ${jurnalCaps} outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 ${
        active ? "border-gray-900 text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900"
      }`;
    return (
      <header className="sticky top-0 z-20 hidden border-b border-gray-200 bg-white lg:block">
        <div className="mx-auto grid h-[76px] w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 px-4">
          <nav className="flex min-w-0 items-center gap-7" aria-label={t("nav.mainNav")}>
            <Link href="/catalog" aria-current={onCatalog ? "page" : undefined} className={link(onCatalog)}>
              {t("nav.catalog")}
            </Link>
            <Link href="/orders" aria-current={onOrders ? "page" : undefined} className={link(onOrders)}>
              {t("nav.orders")}
            </Link>
          </nav>
          {info?.name ? (
            <Link
              href="/"
              title={info.name}
              className="flex min-w-0 max-w-[460px] items-center justify-center font-head text-[26px] font-medium uppercase tracking-[0.24em] text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              <span className="truncate">{info.name}</span>
            </Link>
          ) : (
            <span />
          )}
          <div className="flex min-w-0 items-center justify-end gap-4">
            <SearchInput className="max-w-[240px]" />
            <LocaleSwitcher buttonClassName="h-11 w-9 text-[12px] font-medium tracking-[0.12em] text-gray-700 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-gray-900" />
            <LoginButton className={`h-11 shrink-0 ${jurnalCaps} text-gray-700 outline-none hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-gray-900`}>
              {t("header.login")}
            </LoginButton>
            <Link
              href="/cart"
              aria-label={summary.lines > 0 ? cartLabel : undefined}
              className={`inline-flex h-11 shrink-0 items-center px-4 ${jurnalCaps} outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${
                summary.lines > 0 ? "bg-gray-900 text-white hover:bg-black" : "border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
              }`}
            >
              {t("nav.cart")}
              {summary.lines > 0 && ` (${units})`}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  if (theme === "afisha") {
    // A ruled bar: the name in the poster face, then cells split by black
    // rules; the cart cell takes the accent once it holds something.
    const cell = (active: boolean) =>
      `flex h-full shrink-0 items-center gap-2 border-l border-gray-900 px-5 ${afishaCaps} outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900 ${
        active ? "bg-gray-900 text-white" : "text-gray-900 hover:bg-brand-300"
      }`;
    return (
      <header className="sticky top-0 z-20 hidden border-b border-gray-900 bg-white lg:block">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-stretch border-x border-gray-900">
          {info?.name && (
            <Link
              href="/"
              title={info.name}
              className="flex min-w-0 max-w-[320px] shrink items-center px-5 font-head text-[20px] font-black uppercase tracking-[-0.03em] text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900"
            >
              <span className="truncate">{info.name}</span>
            </Link>
          )}
          <Link href="/catalog" aria-current={onCatalog ? "page" : undefined} className={cell(onCatalog)}>
            {t("nav.catalog")}
          </Link>
          <div className="flex min-w-0 flex-1 items-center border-l border-gray-900">
            <SearchInput />
          </div>
          <nav className="flex items-stretch" aria-label={t("nav.mainNav")}>
            <Link href="/orders" aria-current={onOrders ? "page" : undefined} className={cell(onOrders)}>
              {t("nav.orders")}
            </Link>
            <Link
              href="/cart"
              aria-label={summary.lines > 0 ? cartLabel : undefined}
              className={`${cell(false)} ${summary.lines > 0 ? "bg-brand-300" : ""}`}
            >
              {t("nav.cart")} [{summary.lines > 0 ? units : 0}]
              {total && summary.lines > 0 && (
                <span className="font-head text-[12px] font-extrabold tabular-nums">
                  {total.amount} {total.suffix}
                </span>
              )}
            </Link>
          </nav>
          <div className="flex items-stretch border-l border-gray-900">
            <LocaleSwitcher buttonClassName="h-full w-14 text-[12px] font-bold text-gray-900 hover:bg-gray-900 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900" />
          </div>
          <LoginButton className={cell(false)}>{t("header.login")}</LoginButton>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 hidden border-b border-gray-900/[0.06] bg-white lg:block dark:border-white/[0.06] dark:bg-gray-900">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center gap-3 px-4">
        {info?.name && (
          <Link
            href="/"
            title={info.name}
            className="mr-2 flex min-w-0 max-w-[300px] shrink items-center gap-2.5 rounded-lg text-[22px] font-extrabold tracking-[-0.02em] text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-white"
          >
            {info.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.logo}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full bg-white object-cover ring-1 ring-gray-900/[0.06]"
              />
            )}
            <span className="min-w-0 truncate">{info.name}</span>
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
              className={`${quietItem} bg-primary pl-2.5 pr-4 text-on-primary hover:bg-primary-hover`}
            >
              <BagIcon className="h-5 w-5" strokeWidth={1.9} />
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-on-primary/20 px-1.5 text-[12px] font-bold tabular-nums">
                {summary.units > 99 ? "99+" : summary.units}
              </span>
              {total ? (
                <span className="whitespace-nowrap tabular-nums">
                  <span className="font-bold">{total.amount}</span>{" "}
                  <span className="text-[12px] font-semibold text-on-primary/80">{total.suffix}</span>
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
