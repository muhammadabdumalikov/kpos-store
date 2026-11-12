"use client";

import { useEffect, useState } from "react";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import { SearchInput } from "./SearchInput";

/**
 * Phone header: just the search pill and the language switch, sticky in the
 * normal flow (no fixed bar, no padding hack on every page). The shop itself is
 * named by the home page's h1, so there is no wordmark here. A hairline appears
 * only once content scrolls underneath.
 */
export function MobileHeader() {
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

  return (
    <header
      className={`sticky top-0 z-20 flex items-center gap-2 border-b bg-white py-2 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] transition-colors duration-150 dark:bg-gray-900 lg:hidden ${
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
