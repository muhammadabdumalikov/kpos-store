"use client";

import Link from "next/link";
import { useTelegram } from "@/context/TelegramContext";
import { useTranslations } from "@/hooks/useTranslations";
import { BackButton, useBackFallback } from "./BackButton";
import { StatePanel, pillSecondary } from "./StatePanel";
import { BoxIcon } from "./icons/ShopIcons";

/** A product link that no longer leads anywhere: say so, and offer the catalogue. */
export function ProductNotFound() {
  const { t } = useTranslations();
  const { isTelegram } = useTelegram();
  useBackFallback("/catalog");

  return (
    <>
      {!isTelegram && (
        <div className="flex h-[60px] items-center md:h-16 lg:hidden">
          <BackButton fallback="/catalog" variant="round" />
        </div>
      )}
      <div className="hidden pt-5 lg:block">
        <BackButton fallback="/catalog" variant="link" />
      </div>
      <div className={`lg:mx-auto lg:mt-6 lg:max-w-[640px] ${isTelegram ? "pt-4" : ""}`}>
        <StatePanel
          icon={<BoxIcon className="h-7 w-7" />}
          titleAs="h1"
          title={t("product.notFoundTitle")}
          body={t("product.notFoundBody")}
          action={
            <Link href="/catalog" className={pillSecondary}>
              {t("product.toCatalog")}
            </Link>
          }
        />
      </div>
    </>
  );
}
