import { LocaleProvider } from "@/context/LocaleContext";
import { StoreThemeProvider } from "@/context/StoreThemeContext";
import { TelegramProvider } from "@/context/TelegramContext";
import { ThemeProvider } from "@/context/ThemeContext";
import type { Metadata } from "next";
import Script from "next/script";
import TopLoadingBar from "./components/TopLoadingBar";
import { Tracking } from "./components/Tracking";
import { getStoreInfo } from "../lib/store-api";
import { storeAccentCss } from "../lib/store-accent";
import { getStoreSlugServer } from "../lib/store-slug-server";
import { SOHA_LOOKS, type SohaKey } from "../lib/soha-looks";
import { normalizeSohaKey, normalizeStoreTheme, themeScheme, type StoreTheme } from "../lib/store-theme";
import { cleanTrackingIds, NO_TRACKING, type TrackingIds } from "../lib/tracking";
import {
  balsamiq,
  caveat,
  comfortaa,
  cormorant,
  exo2,
  gilroy,
  golos,
  inter,
  jetbrainsMono,
  literata,
  lora,
  manrope,
  mulish,
  nunito,
  onest,
  oswald,
  plexSans,
  raleway,
  rubik,
  sofiaCondensed,
  unbounded,
} from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "KPOS — Do‘kon",
  description: "Mahsulotlar va xizmatlar",
};

/**
 * The shop's look for the `<head>` and `<html>`: its accent colour and photo
 * shape as CSS (null for the defaults), and its storefront theme. Read here,
 * on the server, so the first paint is already in the shop's colour and
 * theme. The same request as the pages make, so within one render it is
 * deduplicated, and across renders it is the 60-second data cache.
 */
async function loadShopLook(): Promise<{ css: string | null; theme: StoreTheme; soha: SohaKey | null }> {
  // Outside the try: reading the host is what makes the route per-request,
  // and Next signals that by throwing; it must not be swallowed.
  const slug = await getStoreSlugServer();
  try {
    const info = await getStoreInfo(slug);
    // Portrait cards (4:5) for shops that photograph clothes on people; a
    // fixed string, never API text. Square needs nothing: it is the default.
    const shape = info.photoShape === "portrait" ? ":root{--card-aspect:4/5}" : "";
    const soha = normalizeSohaKey(info.theme);
    // A trade theme brings an accent of its own for a shop that chose none.
    const accent = info.accent ?? (soha ? SOHA_LOOKS[soha].accent : null);
    return {
      css: (storeAccentCss(accent) ?? "") + shape || null,
      theme: normalizeStoreTheme(info.theme),
      soha,
    };
  } catch {
    // Colour, shape and theme are decoration: the shop opens in the defaults.
    return { css: null, theme: "default", soha: null };
  }
}

/**
 * The shop's ad tracker ids (REKLAMA-KUZATUV.md), each kept only when it
 * matches its strict format (lib/tracking), so nothing else from the API can
 * reach a script. The same deduplicated request as loadShopLook.
 */
async function loadTracking(): Promise<TrackingIds> {
  const slug = await getStoreSlugServer();
  try {
    return cleanTrackingIds((await getStoreInfo(slug)).tracking);
  } catch {
    // Trackers are extras: the shop opens without them.
    return NO_TRACKING;
  }
}

/** Font variables for the active theme only; default keeps Gilroy alone. */
const THEME_FONTS: Record<StoreTheme, string> = {
  default: "",
  jurnal: `${cormorant.variable} ${mulish.variable}`,
  afisha: `${unbounded.variable} ${jetbrainsMono.variable}`,
  tungi: onest.variable,
};
const SOHA_FONTS: Record<SohaKey, string> = {
  bozor: golos.variable,
  usta: `${oswald.variable} ${golos.variable}`,
  shifo: manrope.variable,
  guldasta: `${lora.variable} ${mulish.variable}`,
  mayin: nunito.variable,
  oynoqi: `${comfortaa.variable} ${nunito.variable}`,
  texno: inter.variable,
  rozgor: rubik.variable,
  kitob: literata.variable,
  marafon: exo2.variable,
  tuhfa: `${caveat.variable} ${nunito.variable}`,
  uy: raleway.variable,
  garaj: `${sofiaCondensed.variable} ${plexSans.variable}`,
  daftar: `${balsamiq.variable} ${golos.variable}`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ css: shopCss, theme, soha }, tracking] = await Promise.all([loadShopLook(), loadTracking()]);
  const scheme = themeScheme(theme, soha);
  const look = soha ? SOHA_LOOKS[soha] : null;
  // A themed shop's scheme is fixed (lib/store-theme): Tungi is dark from the
  // first paint; the provider below keeps the class as it is.
  const htmlClass = [gilroy.variable, soha ? SOHA_FONTS[soha] : THEME_FONTS[theme], scheme === "dark" ? "dark" : ""].filter(Boolean).join(" ");
  return (
    <html
      lang="uz"
      data-theme={soha ?? theme}
      // A trade theme: marks the shared chrome for its corners and phone bar.
      data-soha={soha ? "" : undefined}
      data-corner={look?.corner}
      data-intro={look?.intro}
      className={htmlClass}
      style={{ ["--tg-viewport-height" as string]: "100vh", ["--tg-viewport-stable-height" as string]: "100vh" }} suppressHydrationWarning>
      <head>
        {/* This shop's look over the defaults in globals.css: its brand
            scale and its card photo shape. Built from fixed tables and
            strings (lib/store-accent), never from API text. The theme's own
            tokens key off data-theme on <html>. */}
        {shopCss && <style dangerouslySetInnerHTML={{ __html: shopCss }} />}
        {/* Telegram Mini App SDK. Loaded on every page: the same build serves
            the plain web storefront (where it stays inert) and the mini app. */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-900" suppressHydrationWarning>
        {/* Ad trackers: nothing visible, nothing loaded without an id. */}
        <Tracking ids={tracking} />
        <StoreThemeProvider theme={theme} soha={soha}>
          <ThemeProvider forced={scheme}>
            <LocaleProvider>
              <TelegramProvider>
                <TopLoadingBar>{children}</TopLoadingBar>
              </TelegramProvider>
            </LocaleProvider>
          </ThemeProvider>
        </StoreThemeProvider>
      </body>
    </html>
  );
}
