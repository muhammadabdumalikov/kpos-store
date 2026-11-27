"use client";

import type React from "react";
import { createContext, useContext } from "react";
import { SOHA_LOOKS, type SohaKey, type SohaLook } from "@/lib/soha-looks";
import type { StoreTheme } from "@/lib/store-theme";

const StoreThemeContext = createContext<{ theme: StoreTheme; soha: SohaKey | null }>({ theme: "default", soha: null });

/** Hands the theme the root layout read on the server to client components. */
export function StoreThemeProvider({
  theme,
  soha = null,
  children,
}: {
  theme: StoreTheme;
  /** The shop's trade theme (lib/soha-looks); `theme` is then "default". */
  soha?: SohaKey | null;
  children: React.ReactNode;
}) {
  return <StoreThemeContext.Provider value={{ theme, soha }}>{children}</StoreThemeContext.Provider>;
}

/**
 * The shop's hand-drawn storefront theme; "default" outside the provider and
 * for a shop on a trade theme (see `useSohaLook`).
 */
export function useStoreTheme(): StoreTheme {
  return useContext(StoreThemeContext).theme;
}

/** The parts a trade theme is built from; null for every other shop. */
export function useSohaLook(): (SohaLook & { key: SohaKey }) | null {
  const { soha } = useContext(StoreThemeContext);
  return soha ? { ...SOHA_LOOKS[soha], key: soha } : null;
}
