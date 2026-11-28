export const locales = ['en', 'ru', 'uz'] as const;
export type Locale = (typeof locales)[number];

// Storefront defaults to Uzbek (Latin) — its primary market.
export const defaultLocale: Locale = 'uz';

// Short labels shown in the language switcher. Uzbek is Latin only: the
// shop's customers are not offered Cyrillic (the dashboard keeps it).
export const localeLabels: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU',
  uz: 'UZ',
};
