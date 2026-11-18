import { formatAmount } from "@/lib/format";

// Shared looks of the cart and checkout: the same filled, borderless fields
// and pill buttons as the rest of the storefront (search field, add control).

/** Section heading inside the cart ("Olish usuli", "Buyurtmangiz"). */
export const checkoutTitle = "text-[18px] font-bold leading-6 tracking-[-0.01em] text-gray-900 dark:text-white";

/** A filled text field. 16px text, so iOS does not zoom the page on focus. */
const fieldBase =
  "w-full rounded-2xl border bg-gray-900/[0.05] px-4 text-[16px] font-medium text-gray-900 outline-none transition-colors placeholder:font-normal placeholder:text-gray-500 focus:bg-white focus:ring-4 dark:bg-white/[0.06] dark:text-white/90 dark:placeholder:text-gray-400 dark:focus:bg-gray-900";

export const field = (invalid = false) =>
  `${fieldBase} ${
    invalid
      ? "border-error-500 focus:ring-error-500/10"
      : "border-transparent focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-700"
  }`;

/** The one loud button of a screen: a brand pill. */
export const pillPrimary =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[15px] font-bold text-white transition-[background-color,transform] duration-100 hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 motion-safe:active:scale-[0.98]";

/** A tinted panel, flat: no border, no shadow. */
export const panel = "rounded-3xl bg-gray-900/[0.035] dark:bg-white/[0.04]";

/**
 * An amount with its currency set smaller and quieter after it, as on the
 * product cards: "760 000 soʼm".
 */
export function Money({
  value,
  currency,
  className = "",
  suffixClassName = "text-gray-500 dark:text-gray-400",
}: {
  value: number;
  currency: string;
  className?: string;
  suffixClassName?: string;
}) {
  return (
    <span className={`whitespace-nowrap tabular-nums ${className}`}>
      {formatAmount(value)}{" "}
      <span className={`text-[0.78em] font-semibold ${suffixClassName}`}>{currency}</span>
    </span>
  );
}
