"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/hooks/useTranslations";

/** Header search box: submitting navigates to the catalog with ?q=…
 *  (window.location is read on mount instead of useSearchParams so the shared
 *  headers don't need a Suspense boundary on every page). */
export function SearchInput() {
  const router = useRouter();
  const { t } = useTranslations();
  const [value, setValue] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setValue(q);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = value.trim();
    router.push(term ? `/catalog?q=${encodeURIComponent(term)}` : "/catalog");
  };

  return (
    <form onSubmit={submit} role="search" className="relative min-w-0 flex-1">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("common.search")}
        aria-label={t("header.searchAria")}
        enterKeyHint="search"
        className="h-10 w-full rounded-xl border border-transparent bg-gray-100 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-brand-300 focus:bg-white focus:outline-none dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-400 dark:focus:bg-gray-800"
      />
      <button
        type="submit"
        aria-label={t("header.searchAria")}
        className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center text-gray-400 transition hover:text-brand-500"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}
