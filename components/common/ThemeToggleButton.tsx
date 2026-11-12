import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { MoonIcon, SunIcon } from "@/app/components/icons/ShopIcons";

export const ThemeToggleButton: React.FC = () => {
  const { toggleTheme } = useTheme();
  const { t } = useTranslations();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("theme.toggle")}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-900/[0.05] hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
    >
      <SunIcon className="hidden h-5 w-5 dark:block" />
      <MoonIcon className="h-5 w-5 dark:hidden" />
    </button>
  );
};
