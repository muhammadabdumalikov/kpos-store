"use client";

import { formatAmount } from "@/lib/format";
import { useTranslations } from "@/hooks/useTranslations";
import { Money, checkoutTitle, panel } from "./styles";
import type { CheckoutFulfillment } from "./useCheckoutFulfillment";

/**
 * Goods total, the delivery line (when delivering) and what the customer pays.
 * The free-delivery nudge lives here because it is about the total, not the
 * method: "add this much and the fee goes away". Paying by card transfer adds
 * what is due now and, for a part payment, what is left for the handover.
 */
export function OrderSummary({
  subtotal,
  count,
  model,
  prepay = null,
}: {
  subtotal: number;
  count: number;
  model: CheckoutFulfillment;
  /** Card transfer: the amount to send now. Null when paying on receipt. */
  prepay?: number | null;
}) {
  const { t } = useTranslations();
  const currency = t("common.currency");
  const isDelivery = model.type === "delivery";
  const threshold = model.fulfillment.freeDeliveryFrom;
  const showNudge = isDelivery && model.freeShortfall > 0 && threshold !== null;
  const progress = showNudge ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 0;
  const later = prepay === null ? 0 : Math.max(0, model.payable - prepay);

  return (
    <section className={`flex flex-col gap-3 p-4 lg:p-5 ${panel}`}>
      <h2 className={checkoutTitle}>{t("cart.yourOrder")}</h2>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15px] font-medium text-gray-600 dark:text-gray-300">
            {t("cart.productsTotal").replace("{count}", String(count)).replace(/:$/, "")}
          </span>
          <Money
            value={subtotal}
            currency={currency}
            className="text-[15px] font-bold text-gray-900 dark:text-white/90"
          />
        </div>

        {isDelivery && (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-medium text-gray-600 dark:text-gray-300">
              {t("cart.deliveryFee")}
            </span>
            {model.fee === 0 ? (
              <span className="text-[15px] font-bold text-success-600 dark:text-success-400">
                {t("cart.free")}
              </span>
            ) : (
              <Money
                value={model.fee}
                currency={currency}
                className="text-[15px] font-bold text-gray-900 dark:text-white/90"
              />
            )}
          </div>
        )}

        {showNudge && (
          <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-white px-4 py-3 dark:bg-white/[0.06]">
            <p className="text-[14px] font-medium leading-5 text-gray-700 dark:text-gray-200">
              {t("cart.freeDeliveryHint").replace(
                "{amount}",
                `${formatAmount(model.freeShortfall)} ${currency}`
              )}
            </p>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-gray-900/[0.08] dark:bg-white/10"
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

      <div className="flex items-baseline justify-between gap-3 border-t border-gray-900/[0.08] pt-3 dark:border-white/[0.08]">
        <span className="text-[16px] font-bold text-gray-900 dark:text-white/90">
          {isDelivery ? t("cart.payable") : t("cart.totalPrice")}
        </span>
        <Money
          value={model.payable}
          currency={currency}
          className="text-[22px] font-bold tracking-[-0.01em] text-gray-900 dark:text-white"
        />
      </div>

      {prepay !== null && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-bold text-gray-900 dark:text-white/90">
              {t("payment.payNow")}
            </span>
            <Money
              value={prepay}
              currency={currency}
              className="text-[15px] font-bold text-gray-900 dark:text-white/90"
            />
          </div>
          {later > 0 && (
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-medium text-gray-600 dark:text-gray-300">
                {t("payment.payLater")}
              </span>
              <Money
                value={later}
                currency={currency}
                className="text-[15px] font-bold text-gray-900 dark:text-white/90"
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
