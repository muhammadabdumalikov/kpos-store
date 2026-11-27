import { LocaleProvider } from "@/context/LocaleContext";
import { StoreThemeProvider } from "@/context/StoreThemeContext";
import { TelegramProvider } from "@/context/TelegramContext";
import { ThemeProvider } from "@/context/ThemeContext";
import type { Metadata } from "next";
import Script from "next/script";
import { PreviewBeacon } from "./components/PreviewBeacon";
import TopLoadingBar from "./components/TopLoadingBar";
import { Tracking } from "./components/Tracking";
import { getStoreInfo } from "../lib/store-api";
import { storeAccentCss } from "../lib/store-accent";
import { getStoreSlugServer } from "../lib/store-slug-server";
import { getSiteOrigin } from "../lib/site-url";
import { SOHA_LOOKS, type SohaKey } from "../lib/soha-looks";
import { normalizeSohaKey, normalizeStoreTheme, themeScheme, type StoreTheme } from "../lib/store-theme";
import { getThemePreview } from "../lib/theme-preview-server";
import { cleanTrackingIds, NO_TRACKING, type TrackingIds } from "../lib/tracking";
import {
  comfortaa,
  cormorant,
  exo2,
  geologica,
  gilroy,
  golos,
  jetbrainsMono,
  literata,
  mulish,
  nunito,
  nunitoSans,
  onest,
  oswald,
  plexMono,
  plexSans,
  prata,
  raleway,
  rubik,
  shantell,
  sofia,
  sofiaXCondensed,
  unbounded,
  yeseva,
  ysabeau,
  ysabeauOffice,
} from "./fonts";
import "./globals.css";

const FALLBACK_TITLE = "KPOS — Do‘kon";
const FALLBACK_DESCRIPTION = "Mahsulotlar va xizmatlar";

/**
 * The shop's name and tagline for the tab, search results and link previews
 * (Telegram, Instagram). Pages add their own title in front of the shop's
 * name through the template ("Krossovka · Salom Market"). `metadataBase` makes
 * every relative canonical and image address absolute on this shop's host.
 */
export async function generateMetadata(): Promise<Metadata> {
  const slug = await getStoreSlugServer();
  const origin = await getSiteOrigin();
  const base: Metadata = origin ? { metadataBase: new URL(origin) } : {};
  let info: Awaited<ReturnType<typeof getStoreInfo>>;
  try {
    info = await getStoreInfo(slug);
  } catch {
    return { ...base, title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  const name = info.name?.trim() || FALLBACK_TITLE;
  const description = info.tagline?.trim() || `${name} — onlayn do‘kon: mahsulotlar, narxlar va buyurtma.`;
  const image = info.cover || info.logo || null;
  return {
    ...base,
    title: { default: name, template: `%s · ${name}` },
    description,
    applicationName: name,
    openGraph: {
      type: "website",
      siteName: name,
      title: name,
      description,
      locale: "uz_UZ",
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
    twitter: { card: info.cover ? "summary_large_image" : "summary", title: name, description },
  };
}

/**
 * The shop's look for the `<head>` and `<html>`: its accent colour and photo
 * shape as CSS (null for the defaults), and its storefront theme. Read here,
 * on the server, so the first paint is already in the shop's colour and
 * theme. The same request as the pages make, so within one render it is
 * deduplicated, and across renders it is the 60-second data cache.
 *
 * `preview` (lib/theme-preview) stands in for the saved theme: the owner is
 * looking at their home page in a theme they have not chosen yet.
 */
async function loadShopLook(preview: string | null): Promise<{ css: string | null; theme: StoreTheme; soha: SohaKey | null }> {
  // Outside the try: reading the host is what makes the route per-request,
  // and Next signals that by throwing; it must not be swallowed.
  const slug = await getStoreSlugServer();
  try {
    const info = await getStoreInfo(slug);
    // Portrait cards (4:5) for shops that photograph clothes on people; a
    // fixed string, never API text. Square needs nothing: it is the default.
    const shape = info.photoShape === "portrait" ? ":root{--card-aspect:4/5}" : "";
    const key = preview ?? info.theme;
    const soha = normalizeSohaKey(key);
    // A trade theme brings an accent of its own for a shop that chose none.
    const accent = info.accent ?? (soha ? SOHA_LOOKS[soha].accent : null);
    return {
      css: (storeAccentCss(accent) ?? "") + shape || null,
      theme: normalizeStoreTheme(key),
      soha,
    };
  } catch {
    // Colour, shape and theme are decoration: the shop opens in the defaults.
    return { css: null, theme: normalizeStoreTheme(preview), soha: normalizeSohaKey(preview) };
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
  bozor: geologica.variable,
  usta: `${oswald.variable} ${golos.variable}`,
  guldasta: `${prata.variable} ${mulish.variable}`,
  mayin: `${ysabeau.variable} ${ysabeauOffice.variable}`,
  oynoqi: `${comfortaa.variable} ${nunito.variable}`,
  texno: `${plexSans.variable} ${plexMono.variable}`,
  rozgor: rubik.variable,
  kitob: literata.variable,
  marafon: `${sofiaXCondensed.variable} ${sofia.variable}`,
  tuhfa: `${yeseva.variable} ${nunitoSans.variable}`,
  uy: raleway.variable,
  garaj: exo2.variable,
  daftar: `${shantell.variable} ${golos.variable}`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preview = await getThemePreview();
  const [{ css: shopCss, theme, soha }, tracking] = await Promise.all([
    loadShopLook(preview),
    // The owner trying themes on is not a shopper: no ad tracker hears of it.
    preview ? NO_TRACKING : loadTracking(),
  ]);
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
      data-bar={look?.bar}
      // A theme preview: links and buttons are switched off (globals.css).
      data-preview={preview ? "" : undefined}
      className={htmlClass}
      style={{ ["--tg-viewport-height" as string]: "100vh", ["--tg-viewport-stable-height" as string]: "100vh" }} suppressHydrationWarning>
      <head>
        {/* This shop's look over the defaults in globals.css: its brand
            scale and its card photo shape. Built from fixed tables and
            strings (lib/store-accent), never from API text. The theme's own
            tokens key off data-theme on <html>. */}
        {shopCss && <style dangerouslySetInnerHTML={{ __html: shopCss }} />}
        {preview && <meta name="robots" content="noindex, nofollow" />}
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
        {preview && <PreviewBeacon theme={preview} />}
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
