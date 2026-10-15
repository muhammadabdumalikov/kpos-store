"use client";

import { formatPrice } from "@/lib/format";
import { useTranslations } from "@/hooks/useTranslations";
import type { CheckoutFulfillment } from "./useCheckoutFulfillment";

/**
 * Goods total, the delivery line (when delivering) and what the customer pays.
 * The free-delivery nudge lives here because it is about the total, not the
 * method: "add this much and the fee goes away".
 */
export function OrderSummary({
  subtotal,
  count,
  model,
}: {
  subtotal: number;
  count: number;
  model: CheckoutFulfillment;
}) {
  const { t } = useTranslations();
  const isDelivery = model.type === "delivery";
  const threshold = model.fulfillment.freeDeliveryFrom;
  const showNudge = isDelivery && model.freeShortfall > 0 && threshold !== null;
  const progress = showNudge ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 0;

  return (
    <section className="flex flex-col gap-[12px] rounded-[18px] bg-white px-[16px] py-[12px] dark:bg-gray-900">
      <h2 className="text-xl font-semibold text-black dark:text-white/90">
        {t("cart.yourOrder")}
      </h2>
      <div className="flex flex-col gap-[10px] border-y border-dashed border-gray-200 py-[14px] dark:border-gray-700">
        <div className="flex items-center justify-between gap-3">
          <span className="text-md font-medium text-gray-600 dark:text-gray-300">
            {t("cart.productsTotal").replace("{count}", String(count))}
          </span>
          <span className="text-md font-semibold text-gray-900 dark:text-white/90">
            {formatPrice(subtotal)}
          </span>
        </div>

        {isDelivery && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-md font-medium text-gray-600 dark:text-gray-300">
              {t("cart.deliveryFee")}
            </span>
            {model.fee === 0 ? (
              <span className="text-md font-semibold text-success-600 dark:text-success-400">
                {t("cart.free")}
              </span>
            ) : (
              <span className="text-md font-semibold text-gray-900 dark:text-white/90">
                {formatPrice(model.fee)}
              </span>
            )}
          </div>
        )}

        {showNudge && (
          <div className="flex flex-col gap-2 rounded-xl bg-brand-50 px-3.5 py-2.5 dark:bg-brand-500/10">
            <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
              {t("cart.freeDeliveryHint").replace(
                "{amount}",
                formatPrice(model.freeShortfall)
              )}
            </p>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-brand-500/20"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-medium text-gray-900 dark:text-white/90">
          {isDelivery ? t("cart.payable") : t("cart.totalPrice")}
        </span>
        <span className="text-xl font-bold text-gray-900 dark:text-white/90">
          {formatPrice(model.payable)}
        </span>
      </div>
    </section>
  );
}
