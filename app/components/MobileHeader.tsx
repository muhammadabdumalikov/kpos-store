"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import { SearchInput } from "./SearchInput";

export function MobileHeader() {
  const { t } = useTranslations();

  return (
    <header className="fixed left-0 right-0 top-0 z-10 flex min-h-[56px] items-center gap-3 border-b border-gray-200 bg-white pl-[max(16px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))] dark:border-gray-800 dark:bg-gray-900 lg:hidden">
      <Link
        href="/"
        className="shrink-0 text-lg font-extrabold tracking-tight text-brand-600 dark:text-brand-400"
      >
        {t("common.brand")}
      </Link>
      <SearchInput />
      <LocaleSwitcher />
    </header>
  );
}
