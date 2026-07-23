"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type LoadingContextValue = {
  setLoading: (loading: boolean) => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoading() {
  const ctx = useContext(LoadingContext);
  return ctx ?? { setLoading: () => {} };
}

export default function TopLoadingBar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoadingState] = useState(false);
  const [done, setDone] = useState(false);
  const prevPathname = useRef(pathname);

  const setLoading = useCallback((value: boolean) => {
    setLoadingState(value);
    if (!value) setDone(true);
  }, []);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setLoadingState(false);
      setDone(true);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a");
      if (!a?.href) return;
      try {
        const url = new URL(a.href);
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          setLoadingState(true);
          setDone(false);
        }
      } catch {
        // ignore
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!loading && done) {
      const t = setTimeout(() => setDone(false), 350);
      return () => clearTimeout(t);
    }
  }, [loading, done]);

  const show = loading || done;

  return (
    <LoadingContext.Provider value={{ setLoading }}>
      <div
        role="progressbar"
        aria-hidden={!show}
        className="fixed left-0 right-0 top-0 z-[9999] h-0.5 overflow-hidden bg-gray-200/80 dark:bg-gray-800/80"
        style={{ opacity: show ? 1 : 0, transition: "opacity 0.15s ease" }}
      >
        <div
          className="h-full bg-brand-500"
          style={{
            width: done ? "100%" : loading ? "82%" : "0%",
            transition: done ? "width 0.15s ease-out" : "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
      {children}
    </LoadingContext.Provider>
  );
}
