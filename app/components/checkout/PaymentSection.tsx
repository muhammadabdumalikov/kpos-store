"use client";

import { fillTemplate, formatPrice } from "@/lib/format";
import type { PaymentMode, StorePaymentMethods } from "@/lib/store-api";
import { useTranslations } from "@/hooks/useTranslations";
import { CardIcon, CheckLineIcon } from "../icons/ShopIcons";
import { checkoutTitle, panel } from "./styles";

/**
 * "How do you pay": on receipt, or by a transfer to the shop's card. Shown
 * only when the shop takes card transfers; with both methods on the buyer
 * chooses, with the card alone the method is stated instead of asked.
 *
 * The two choices are stacked, not side by side like pickup / delivery: the
 * card one has to say how much is due now ("Hozir 125 000 soʼm, qolgani
 * olganda"), and that line does not fit half a phone screen.
 */
export function PaymentSection({
  methods,
  mode,
  onSelect,
  prepay,
  payable,
}: {
  methods: StorePaymentMethods;
  mode: PaymentMode;
  onSelect: (mode: PaymentMode) => void;
  /** What a card transfer asks for now, for the basket as it stands. */
  prepay: number;
  /** Goods plus delivery. */
  payable: number;
}) {
  const { t } = useTranslations();
  if (!methods.cardTransfer) return null;

  const hasChoice = methods.onReceipt;
  const nowLine = fillTemplate(
    t(prepay < payable ? "payment.nowPart" : "payment.nowFull"),
    { amount: formatPrice(prepay, t("common.currency")) }
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className={checkoutTitle}>{t("payment.title")}</h2>

      {hasChoice ? (
        <div
          role="radiogroup"
          aria-label={t("payment.title")}
          className="flex flex-col gap-1 rounded-3xl bg-gray-900/[0.05] p-1 dark:bg-white/[0.06]"
        >
          <PayOption
            label={t("payment.onReceipt")}
            caption={t("payment.onReceiptCaption")}
            active={mode === "on_receipt"}
            onSelect={() => onSelect("on_receipt")}
          />
          <PayOption
            label={t("payment.byCard")}
            caption={nowLine}
            active={mode === "card_transfer"}
            onSelect={() => onSelect("card_transfer")}
          />
        </div>
      ) : (
        <div className={`flex items-center gap-3 p-3 ${panel}`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
            <CardIcon />
          </span>
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-gray-900 dark:text-white/90">
              {t("payment.cardOnlyTitle")}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{nowLine}</p>
          </div>
        </div>
      )}

      {mode === "card_transfer" && (
        <p className="px-1 text-[13px] font-medium text-gray-500 dark:text-gray-400">
          {t("payment.cardAfterOrder")}
        </p>
      )}
    </section>
  );
}

function PayOption({
  label,
  caption,
  active,
  onSelect,
}: {
  label: string;
  caption: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`flex min-h-[60px] w-full items-center gap-3 rounded-[20px] px-3.5 py-2.5 text-left transition-[background-color,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
        active
          ? "bg-white ring-1 ring-gray-900/[0.06] dark:bg-gray-800 dark:ring-white/[0.08]"
          : "hover:bg-gray-900/[0.03] motion-safe:active:scale-[0.99] dark:hover:bg-white/[0.04]"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-100 ${
          active
            ? "bg-primary text-on-primary"
            : "bg-white ring-[1.5px] ring-inset ring-gray-300 dark:bg-transparent dark:ring-gray-600"
        }`}
        aria-hidden
      >
        {active && <CheckLineIcon className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-5 text-gray-900 dark:text-white/90">
          {label}
        </span>
        <span className="mt-0.5 block text-[13px] font-medium leading-[18px] text-gray-500 dark:text-gray-400">
          {caption}
        </span>
      </span>
    </button>
  );
}
