"use client";

import Link from "next/link";
import { LoginButton } from "./LoginButton";
import { useTranslations } from "@/hooks/useTranslations";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import { SearchInput } from "./SearchInput";

export function DesktopHeader() {
  const { t } = useTranslations();

  return (
    <header className="sticky top-0 z-10 hidden border-b border-gray-200 bg-white lg:block dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-5 px-4">
        <Link
          href="/"
          className="shrink-0 text-2xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400"
        >
          {t("common.brand")}
        </Link>

        <Link
          href="/catalog"
          className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-brand-50 px-4 text-sm font-semibold text-brand-600 transition hover:bg-brand-100 active:scale-[0.98] dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {t("nav.catalog")}
        </Link>

        <SearchInput />

        <nav className="flex shrink-0 items-center gap-1" aria-label={t("nav.mainNav")}>
          <Link
            href="/orders"
            className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white/90"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 4h14a1 1 0 011 1v16l-3-2-2 2-3-2-3 2-2-2-3 2V5a1 1 0 011-1z" />
            </svg>
            <span className="text-[10px] font-medium leading-none">{t("nav.orders")}</span>
          </Link>
          <Link
            href="/cart"
            className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white/90"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-[10px] font-medium leading-none">{t("nav.cart")}</span>
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggleButton />
          <LocaleSwitcher />
          <LoginButton className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]" />
        </div>
      </div>
    </header>
  );
}
