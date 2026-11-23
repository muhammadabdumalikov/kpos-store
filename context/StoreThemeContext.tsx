"use client";

import type React from "react";
import { createContext, useContext } from "react";
import type { StoreTheme } from "@/lib/store-theme";

const StoreThemeContext = createContext<StoreTheme>("default");

/** Hands the theme the root layout read on the server to client components. */
export function StoreThemeProvider({ theme, children }: { theme: StoreTheme; children: React.ReactNode }) {
  return <StoreThemeContext.Provider value={theme}>{children}</StoreThemeContext.Provider>;
}

/** The shop's storefront theme; "default" outside the provider. */
export function useStoreTheme(): StoreTheme {
  return useContext(StoreThemeContext);
}
