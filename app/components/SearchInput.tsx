"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStoreTheme } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { CloseIcon, SearchIcon } from "./icons/ShopIcons";

/**
 * Header search pill: submitting opens the catalogue with ?q=…. The field
 * follows the URL, so it is the one place that shows and clears the current
 * search: clearing it while a search is active drops ?q and keeps the rest.
 * useSearchParams needs a Suspense boundary on prerendered pages; the fallback
 * is the same field, empty.
 */
export function SearchInput({ className = "", autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  return (
    <Suspense fallback={<SearchField className={className} query="" params="" autoFocus={autoFocus} />}>
      <SearchFromUrl className={className} autoFocus={autoFocus} />
    </Suspense>
  );
}

function SearchFromUrl({ className, autoFocus }: { className: string; autoFocus: boolean }) {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  // Remount when the URL's search changes so the field never shows stale text.
  return <SearchField key={query} className={className} query={query} params={params.toString()} autoFocus={autoFocus} />;
}

// The field in each storefront theme: Jurnal's underline, Afisha's ruled cell
// (the header draws the rules), Tungi's dark pill. The default keeps its own.
const THEMED_FIELD = {
  jurnal:
    "h-11 w-full border-0 border-b border-current bg-transparent pl-10 pr-10 text-[15px] text-current outline-none placeholder:text-current placeholder:opacity-70 focus:border-b-2 [&::-webkit-search-cancel-button]:hidden",
  afisha:
    "h-12 w-full border-0 bg-white pl-11 pr-10 text-[14px] font-medium text-gray-900 outline-none placeholder:uppercase placeholder:text-gray-500 focus:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900 [&::-webkit-search-cancel-button]:hidden",
  tungi:
    "h-11 w-full rounded-full border border-transparent bg-gray-800 pl-11 pr-10 text-[15px] font-medium text-white outline-none placeholder:text-gray-400 focus:border-brand-400 [&::-webkit-search-cancel-button]:hidden",
} as const;

function SearchField({
  className,
  query,
  params,
  autoFocus,
}: {
  className: string;
  query: string;
  params: string;
  /** Focus the field on mount: a theme's header opens it from a search button. */
  autoFocus: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const theme = useStoreTheme();
  const [value, setValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = value.trim();
    router.push(term ? `/catalog?q=${encodeURIComponent(term)}` : "/catalog");
  };

  const clear = () => {
    setValue("");
    if (!query) return;
    const rest = new URLSearchParams(params);
    rest.delete("q");
    const qs = rest.toString();
    router.push(qs ? `/catalog?${qs}` : "/catalog");
  };

  return (
    <form onSubmit={submit} role="search" className={`relative min-w-0 flex-1 ${className}`}>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("common.search")}
        aria-label={t("header.searchAria")}
        enterKeyHint="search"
        className={
          theme === "default"
            ? "h-11 w-full rounded-full border border-transparent bg-gray-900/[0.05] pl-11 pr-10 text-[15px] font-medium text-gray-900 outline-none transition-colors placeholder:font-normal placeholder:text-gray-500 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:bg-white/[0.06] dark:text-white/90 dark:placeholder:text-gray-400 dark:focus:border-brand-700 dark:focus:bg-gray-900 [&::-webkit-search-cancel-button]:hidden"
            : THEMED_FIELD[theme]
        }
      />
      <button
        type="submit"
        aria-label={t("header.searchAria")}
        className={
          theme === "jurnal"
            ? "absolute left-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            : "absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-gray-400 dark:hover:text-white"
        }
      >
        <SearchIcon className="h-[18px] w-[18px]" strokeWidth={theme === "jurnal" ? 1.5 : 2} />
      </button>
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label={t("catalog.clearSearch")}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-900/[0.06] hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
