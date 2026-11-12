import { LocaleProvider } from "@/context/LocaleContext";
import { TelegramProvider } from "@/context/TelegramContext";
import { ThemeProvider } from "@/context/ThemeContext";
import type { Metadata } from "next";
import Script from "next/script";
import TopLoadingBar from "./components/TopLoadingBar";
import { gilroy } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "KPOS — Do‘kon",
  description: "Mahsulotlar va xizmatlar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={gilroy.variable} style={{ ["--tg-viewport-height" as string]: "100vh", ["--tg-viewport-stable-height" as string]: "100vh" }} suppressHydrationWarning>
      <head>
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
