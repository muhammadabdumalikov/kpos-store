"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";

export function Banners() {
  const { t } = useTranslations();

  return (
    <section className="relative overflow-hidden rounded-b-2xl bg-brand-600 lg:rounded-2xl" aria-label={t("home.heroTitle")}>
      {/* Decorative brand-tone circles; purely ornamental. */}
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-500/60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 right-24 h-56 w-56 rounded-full bg-brand-400/30"
        aria-hidden
      />
      <div className="relative flex min-h-[150px] flex-col items-start justify-center gap-2 px-5 py-6 lg:min-h-[190px] lg:px-10">
        <h1 className="max-w-[24ch] text-xl font-extrabold leading-tight text-white lg:text-3xl">
          {t("home.heroTitle")}
        </h1>
        <p className="max-w-[38ch] text-sm font-medium text-white/80 lg:text-base">
          {t("home.heroSubtitle")}
        </p>
        <Link
          href="/catalog"
          className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 active:scale-[0.98]"
        >
          {t("home.heroCta")}
        </Link>
      </div>
    </section>
  );
}
