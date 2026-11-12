"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { navigateBack, setBackFallback } from "@/lib/nav-history";
import { ChevronLeftIcon } from "./icons/ShopIcons";

/**
 * Registers where Back goes on this page when there is no storefront page
 * behind it (opened from a shared link, a new tab, a Telegram deep link). The
 * Telegram back button reads it too, so both controls agree.
 */
export function useBackFallback(href: string) {
  useEffect(() => {
    setBackFallback(href);
    return () => setBackFallback(null);
  }, [href]);
}

/**
 * The page's own back control. A real history Back when the shopper came from
 * another storefront page (the catalogue then restores its list and scroll),
 * otherwise up to `fallback`. It is a link to `fallback` underneath, so
 * opening it in a new tab or without JavaScript still lands somewhere useful.
 */
export function BackButton({
  fallback,
  variant,
  className = "",
}: {
  fallback: string;
  /** "round": the phone's icon button. "link": desktop's quiet text link. */
  variant: "round" | "link";
  className?: string;
}) {
  const { t } = useTranslations();
  const router = useRouter();

  return (
    <a
      href={fallback}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigateBack(router, fallback);
      }}
      aria-label={variant === "round" ? t("common.back") : undefined}
      className={
        variant === "round"
          ? `flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900/[0.05] text-gray-900 transition-[background-color,transform] duration-100 hover:bg-gray-900/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 motion-safe:active:scale-95 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.11] ${className}`
          : `-ml-3 inline-flex h-11 items-center gap-1 rounded-full pl-2 pr-4 text-[14px] font-semibold text-gray-500 transition-colors duration-100 hover:bg-gray-900/[0.04] hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white ${className}`
      }
    >
      <ChevronLeftIcon className={variant === "round" ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2.2} />
      {variant === "link" && t("common.back")}
    </a>
  );
}
