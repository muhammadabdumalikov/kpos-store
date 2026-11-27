"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import { useStoreTheme } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import type { StoreInfo } from "@/lib/store-api";
import type { StoreTheme } from "@/lib/store-theme";
import { useStoreInfo } from "@/lib/use-store-info";
import { SearchInput } from "./SearchInput";
import { CloseIcon, SearchIcon } from "./icons/ShopIcons";

/** The id of the home page's cover hero, which Jurnal's header lies over. */
export const STORE_HERO_ID = "store-hero";

/**
 * Phone header: just the search pill and the language switch, sticky in the
 * normal flow (no fixed bar, no padding hack on every page). The shop itself is
 * named by the home page's h1, so there is no wordmark here. A hairline appears
 * only once content scrolls underneath.
 *
 * A storefront theme draws its own bar (ThemedMobileHeader); the props are
 * only read there. A trade theme with a band intro repaints this bar through
 * `.soha-bar` (app/globals.css).
 */
export function MobileHeader({
  store,
  overlay = false,
  home = false,
}: {
  /** The shop, when the page has it from the server; fetched otherwise. */
  store?: StoreInfo | null;
  /** Jurnal home with a cover: the bar lies over the cover until it scrolls by. */
  overlay?: boolean;
  /** The home page: Tungi's bar then carries the shop's name as the page h1. */
  home?: boolean;
} = {}) {
  const theme = useStoreTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    // A restored scroll position (back navigation) needs the hairline at once.
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (theme !== "default") {
    return <ThemedMobileHeader theme={theme} store={store} overlay={overlay} home={home} scrolled={scrolled} />;
  }

  return (
    <header
      className={`soha-bar sticky top-0 z-20 flex items-center gap-2 border-b bg-white py-2 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] transition-colors duration-150 dark:bg-gray-900 lg:hidden ${
        scrolled
          ? "border-gray-900/[0.06] dark:border-white/[0.06]"
          : "border-transparent"
      }`}
    >
      <SearchInput />
      <LocaleSwitcher />
    </header>
  );
}

/**
 * The phone bar of a storefront theme, sticky like the default one.
 * - Jurnal: search, the shop's name as a letter-spaced wordmark, language. On
 *   a home page with a cover it lies over the photo in white and turns to
 *   paper once the cover has scrolled by.
 * - Afisha: a ruled strip, the search field and the language cell.
 * - Tungi: the shop's logo and name (the page h1 on the home page), then a
 *   round search button and the language switch.
 * In Jurnal and Tungi the search button opens the field in the bar itself.
 */
function ThemedMobileHeader({
  theme,
  store,
  overlay,
  home,
  scrolled,
}: {
  theme: Exclude<StoreTheme, "default">;
  store?: StoreInfo | null;
  overlay: boolean;
  home: boolean;
  scrolled: boolean;
}) {
  const { t } = useTranslations();
  const info = useStoreInfo(store);
  const [searching, setSearching] = useState(false);
  // Over the cover until it has scrolled under the bar (56px).
  const [overHero, setOverHero] = useState(overlay);
  useEffect(() => {
    const hero = overlay ? document.getElementById(STORE_HERO_ID) : null;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setOverHero(entry.isIntersecting), {
      rootMargin: "-56px 0px 0px 0px",
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [overlay]);

  const name = info?.name ?? null;
  const safeX = "pl-[max(8px,env(safe-area-inset-left))] pr-[max(8px,env(safe-area-inset-right))]";

  const closeButton = (className: string) => (
    <button
      type="button"
      onClick={() => setSearching(false)}
      aria-label={t("common.close")}
      className={`flex h-11 w-11 shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 ${className}`}
    >
      <CloseIcon className="h-5 w-5" />
    </button>
  );

  if (theme === "afisha") {
    return (
      <header className="sticky top-0 z-20 flex items-stretch border-b border-gray-900 bg-white lg:hidden">
        <SearchInput />
        <div className="flex border-l border-gray-900">
          <LocaleSwitcher buttonClassName="h-12 w-12 text-[12px] font-bold text-gray-900 hover:bg-gray-900 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900" />
        </div>
      </header>
    );
  }

  if (theme === "jurnal") {
    const solid = !overlay || !overHero || searching;
    return (
      <header
        className={`sticky top-0 z-30 flex h-14 items-center gap-1 border-b transition-colors duration-200 motion-reduce:transition-none lg:hidden ${safeX} ${
          overlay ? "-mb-14" : ""
        } ${solid ? "border-gray-200 bg-white text-gray-900" : "border-transparent bg-transparent text-white"}`}
      >
        {searching ? (
          <>
            <div className="min-w-0 flex-1 pl-2">
              <SearchInput autoFocus />
            </div>
            {closeButton("focus-visible:ring-gray-900")}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSearching(true)}
              aria-label={t("header.searchAria")}
              className="flex h-11 w-11 shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              <SearchIcon className="h-[21px] w-[21px]" strokeWidth={1.4} />
            </button>
            <div className="flex min-w-0 flex-1 justify-center">
              {name && (
                <Link
                  href="/"
                  className="flex h-11 min-w-0 items-center px-1 font-head text-[19px] font-medium uppercase tracking-[0.24em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                >
                  <span className="truncate">{name}</span>
                </Link>
              )}
            </div>
            <LocaleSwitcher buttonClassName="h-11 w-11 text-[12px] font-medium tracking-[0.12em] text-current focus-visible:ring-2 focus-visible:ring-current" />
          </>
        )}
      </header>
    );
  }

  // Tungi
  const logo = info?.logo ?? null;
  const tagline = home ? info?.tagline?.trim() || null : null;
  const identity = (
    <>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-10 w-10 shrink-0 rounded-full bg-white object-cover" />
      )}
      <div className="min-w-0">
        {home ? (
          <h1 className="truncate text-[18px] font-extrabold leading-6 tracking-[-0.01em] text-white">{name}</h1>
        ) : (
          <p className="truncate text-[18px] font-extrabold leading-6 tracking-[-0.01em] text-white">{name}</p>
        )}
        {tagline && <p className="truncate text-[12px] font-medium leading-4 text-gray-400">{tagline}</p>}
      </div>
    </>
  );
  return (
    <header
      className={`sticky top-0 z-20 flex h-16 items-center gap-2.5 border-b bg-gray-900 pl-[max(16px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))] transition-colors duration-150 lg:hidden ${
        scrolled ? "border-white/[0.06]" : "border-transparent"
      }`}
    >
      {searching ? (
        <>
          <div className="min-w-0 flex-1">
            <SearchInput autoFocus />
          </div>
          {closeButton("rounded-full text-white focus-visible:ring-brand-400")}
        </>
      ) : (
        <>
          {/* On the home page the name is the page's title, not a link to it. */}
          {home ? (
            <div className="flex min-w-0 flex-1 items-center gap-2.5">{identity}</div>
          ) : (
            <Link
              href="/"
              className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {identity}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSearching(true)}
            aria-label={t("header.searchAria")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <SearchIcon className="h-[19px] w-[19px]" strokeWidth={2} />
          </button>
          <LocaleSwitcher buttonClassName="h-11 w-11 rounded-full bg-gray-800 text-[13px] font-bold text-white hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-brand-400" />
        </>
      )}
    </header>
  );
}
