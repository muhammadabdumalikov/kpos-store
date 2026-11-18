import { LocaleProvider } from "@/context/LocaleContext";
import { TelegramProvider } from "@/context/TelegramContext";
import { ThemeProvider } from "@/context/ThemeContext";
import type { Metadata } from "next";
import Script from "next/script";
import TopLoadingBar from "./components/TopLoadingBar";
import { getStoreInfo } from "../lib/store-api";
import { storeAccentCss } from "../lib/store-accent";
import { getStoreSlugServer } from "../lib/store-slug-server";
import { gilroy } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "KPOS — Do‘kon",
  description: "Mahsulotlar va xizmatlar",
};

/**
 * The shop's accent colour as CSS for the `<head>`, or null for the default.
 * Read here, on the server, so the first paint is already in the shop's
 * colour. The same request as the pages make, so within one render it is
 * deduplicated, and across renders it is the 60-second data cache.
 */
async function loadShopCss(): Promise<string | null> {
  // Outside the try: reading the host is what makes the route per-request,
  // and Next signals that by throwing; it must not be swallowed.
  const slug = await getStoreSlugServer();
  try {
    const info = await getStoreInfo(slug);
    // Portrait cards (4:5) for shops that photograph clothes on people; a
    // fixed string, never API text. Square needs nothing: it is the default.
    const shape = info.photoShape === "portrait" ? ":root{--card-aspect:4/5}" : "";
    return (storeAccentCss(info.accent) ?? "") + shape || null;
  } catch {
    // Colour and shape are decoration: the shop opens in the defaults.
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shopCss = await loadShopCss();
  return (
    <html lang="uz" className={gilroy.variable} style={{ ["--tg-viewport-height" as string]: "100vh", ["--tg-viewport-stable-height" as string]: "100vh" }} suppressHydrationWarning>
      <head>
        {/* This shop's look over the defaults in globals.css: its brand
            scale and its card photo shape. Built from fixed tables and
            strings (lib/store-accent), never from API text. */}
        {shopCss && <style dangerouslySetInnerHTML={{ __html: shopCss }} />}
        {/* Telegram Mini App SDK. Loaded on every page: the same build serves
            the plain web storefront (where it stays inert) and the mini app. */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-900" suppressHydrationWarning>
        <ThemeProvider>
          <LocaleProvider>
            <TelegramProvider>
              <TopLoadingBar>{children}</TopLoadingBar>
            </TelegramProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
