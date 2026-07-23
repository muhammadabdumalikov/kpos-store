import { LocaleProvider } from "@/context/LocaleContext";
import { ThemeProvider } from "@/context/ThemeContext";
import type { Metadata } from "next";
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
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900" suppressHydrationWarning>
        <ThemeProvider>
          <LocaleProvider>
            <TopLoadingBar>{children}</TopLoadingBar>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
