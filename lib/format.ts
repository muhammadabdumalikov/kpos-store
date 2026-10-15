import type { Locale } from "@/i18n/config";

/** Storefront money format: "1 250 000 UZS". Same shape on every page. */
export const formatPrice = (value: number) =>
  new Intl.NumberFormat("uz-UZ").format(value) + " UZS";

/** Backend money fields arrive as numeric strings; round to whole so'm. */
export const toAmount = (value: string | number | null | undefined) =>
  Math.round(Number(value ?? 0)) || 0;

const DATE_LOCALES: Record<Locale, string> = {
  uz: "uz-UZ",
  uzc: "uz-Cyrl-UZ",
  ru: "ru-RU",
  en: "en-GB",
};

export function formatDateTime(iso: string, locale: Locale = "uz") {
  const d = new Date(iso);
  const tag = DATE_LOCALES[locale] ?? DATE_LOCALES.uz;
  return `${d.toLocaleDateString(tag)} ${d.toLocaleTimeString(tag, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/**
 * Compact time for a timeline step: "14:32" on the same day as `relativeTo`,
 * otherwise "12.10 14:32". The stepper has no room for a full date on every
 * step, and the order's own date already sits in the card header.
 */
export function formatStepTime(
  iso: string,
  relativeTo: string,
  locale: Locale = "uz"
) {
  const d = new Date(iso);
  const base = new Date(relativeTo);
  const tag = DATE_LOCALES[locale] ?? DATE_LOCALES.uz;
  const time = d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
  const sameDay =
    d.getFullYear() === base.getFullYear() &&
    d.getMonth() === base.getMonth() &&
    d.getDate() === base.getDate();
  if (sameDay) return time;
  const day = d.toLocaleDateString(tag, { day: "2-digit", month: "2-digit" });
  return `${day} ${time}`;
}
