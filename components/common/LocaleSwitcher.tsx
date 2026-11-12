'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';

export default function LocaleSwitcher() {
  const { locale, setLocale, t } = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('common.selectLanguage')}: ${localeLabels[locale]}`}
        className="dropdown-toggle flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gray-900/[0.05] text-[13px] font-bold text-gray-700 transition-colors hover:bg-gray-900/[0.08] hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
      >
        {localeLabels[locale]}
      </button>

      <Dropdown isOpen={open} onClose={() => setOpen(false)} className="w-28 p-1.5">
        {locales.map((loc) => {
          const isSelected = loc === locale;
          return (
            <DropdownItem
              key={loc}
              onItemClick={() => {
                setLocale(loc as Locale);
                setOpen(false);
              }}
              baseClassName="flex h-10 w-full items-center rounded-full px-3.5 text-left text-sm transition-colors"
              className={
                isSelected
                  ? 'bg-gray-900 font-bold text-white dark:bg-white dark:text-gray-900'
                  : 'font-medium text-gray-700 hover:bg-gray-900/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.06]'
              }
            >
              {localeLabels[loc]}
            </DropdownItem>
          );
        })}
      </Dropdown>
    </div>
  );
}
