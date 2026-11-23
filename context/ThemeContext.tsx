"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

// The shop is light unless the shopper flips the toggle themselves: neither
// the device setting nor the Telegram client's scheme is followed. The key
// replaces the old "theme" one, which Telegram following used to write "dark"
// into for people who never chose it.
const STORAGE_KEY = "kpos-store-theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  /** Set for a themed shop (lib/store-theme themeScheme): the scheme is the
   *  theme's, the server already rendered its class, and the shopper's stored
   *  choice is neither read nor overwritten. */
  forced?: Theme | null;
}> = ({ children, forced = null }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (forced) return;
    // This code will only run on the client side
    localStorage.removeItem("theme");
    const initialTheme: Theme =
      localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";

    setTheme(initialTheme);
    setIsInitialized(true);
  }, [forced]);

  useEffect(() => {
    if (!forced && isInitialized) {
      localStorage.setItem(STORAGE_KEY, theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, isInitialized, forced]);

  const toggleTheme = () => {
    if (forced) return;
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme: forced ?? theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
