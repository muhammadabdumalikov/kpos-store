"use client";

import { useTelegram } from "@/context/TelegramContext";
import { useTranslations } from "@/hooks/useTranslations";

/**
 * Mini App entry point — the URL configured in BotFather for the shared bot.
 *
 * A bot opens one fixed URL, but the storefront is multi-tenant by subdomain,
 * so the store arrives as `?startapp=<slug>` (delivered in the URL hash, which
 * the server never sees). This page renders nothing but a spinner while
 * TelegramProvider hands the session over to `<slug>.kpos.uz`; landing here
 * without a slug means the link was malformed.
 */
export default function TelegramEntryPage() {
  const { t } = useTranslations();
  const { probed, isTelegram, startParam } = useTelegram();

  // Still probing, or the provider is about to replace the location.
  const redirecting = !probed || (isTelegram && startParam !== null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-[12px] px-[24px] text-center">
      {redirecting ? (
        <>
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500 dark:border-gray-700"
            aria-hidden
          />
          <p className="text-md font-medium text-gray-500 dark:text-gray-400">
            {t("tg.opening")}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-black dark:text-white/90">
            {t("tg.noStore")}
          </h1>
          <p className="max-w-[36ch] text-md font-medium text-gray-500 dark:text-gray-400">
            {t("tg.noStoreHint")}
          </p>
        </>
      )}
    </main>
  );
}
