"use client";

import type React from "react";
import { createContext, useCallback, useContext } from "react";
import { SOHA_LOOKS, type SohaKey, type SohaLook } from "@/lib/soha-looks";
import type { StoreTheme } from "@/lib/store-theme";
import { previewHref } from "@/lib/theme-preview";

const StoreThemeContext = createContext<{ theme: StoreTheme; soha: SohaKey | null; preview: string | null }>({
  theme: "default",
  soha: null,
  preview: null,
});

/** Hands the theme the root layout read on the server to client components. */
export function StoreThemeProvider({
  theme,
  soha = null,
  preview = null,
  children,
}: {
  theme: StoreTheme;
  /** The shop's trade theme (lib/soha-looks); `theme` is then "default". */
  soha?: SohaKey | null;
  /** The theme the owner is trying on in the dashboard (lib/theme-preview); null on an ordinary visit. */
  preview?: string | null;
  children: React.ReactNode;
}) {
  return <StoreThemeContext.Provider value={{ theme, soha, preview }}>{children}</StoreThemeContext.Provider>;
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

/** The theme being tried on in the dashboard's preview (lib/theme-preview); null on an ordinary visit. */
export function usePreviewTheme(): string | null {
  return useContext(StoreThemeContext).preview;
}

/** Keeps an address inside the shop in the previewed theme; on an ordinary visit it is returned as it is. */
export function usePreviewHref(): (href: string) => string {
  const preview = usePreviewTheme();
  return useCallback((href: string) => (preview ? previewHref(href, preview) : href), [preview]);
}
