'use client';

import { useTranslations } from '@/hooks/useTranslations';
import { formatAmount, formatPrice } from '@/lib/format';

/** `quantityType` as the store API sends it; "kg" means the price is per kilogram. */
export type QuantityType = string | null | undefined;

export const isWeighed = (type: QuantityType) => type === 'kg';

/**
 * Localised money for the redesigned surfaces: the currency label and the
 * per-kg unit come from i18n, the digits from the one formatter in lib/format.
 */
export function usePrice() {
  const { t } = useTranslations();
  const currency = t('common.currency');
  const kg = t('common.unitKg');
  return {
    currency,
    unitKg: kg,
    /** "18 000 soʼm/kg" — for aria labels and plain text. */
    format: (value: number, type?: QuantityType) =>
      formatPrice(value, currency, isWeighed(type) ? kg : null),
    /** The parts, for layouts that set the figure and the currency apart. */
    parts: (value: number, type?: QuantityType) => ({
      amount: formatAmount(value),
      suffix: isWeighed(type) ? `${currency}/${kg}` : currency,
    }),
  };
}
