export const locales = ['en', 'ru', 'uz', 'uzc'] as const;
export type Locale = (typeof locales)[number];

// Storefront defaults to Uzbek (Latin) — its primary market.
export const defaultLocale: Locale = 'uz';

// Short labels shown in the language switcher.
// `uz` = Uzbek (Latin), `uzc` = Uzbek (Cyrillic) — the Cyrillic label keeps them distinguishable.
export const localeLabels: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU',
  uz: 'UZ',
  uzc: 'ЎЗ',
};
