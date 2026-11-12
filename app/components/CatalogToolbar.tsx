"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { SORT_VALUES, type SortValue } from "@/lib/catalog-sort";
import { ChipButton } from "./Chip";
import { CheckLineIcon, ChevronDownIcon, SortIcon } from "./icons/ShopIcons";


const SORT_LABEL_KEYS: Record<SortValue, string> = {
  new: "catalog.sort.new",
  price_asc: "catalog.sort.priceAsc",
  price_desc: "catalog.sort.priceDesc",
};

type Category = { id: string; name: string };

/** Category chips: one horizontal scroller on the phone, wrapped rows on desktop. */
export function CategoryChips({
  categories,
  current,
  onSelect,
}: {
  categories: readonly Category[];
  current: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslations();
  const rowRef = useRef<HTMLDivElement>(null);

  // Bring the active chip into view when the page opens on a category that
  // sits off-screen in the scroller.
  useEffect(() => {
    const row = rowRef.current;
    const active = row?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!row || !active || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = active.offsetLeft - row.clientWidth / 2 + active.offsetWidth / 2;
  }, [current]);

  return (
    <div
      ref={rowRef}
      role="radiogroup"
      aria-label={t("catalog.selectCategory")}
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:gap-x-2 lg:gap-y-0 lg:overflow-visible lg:px-0"
    >
      <ChipButton role="radio" aria-checked={!current} active={!current} onClick={() => onSelect("")}>
        {t("common.all")}
      </ChipButton>
      {categories.map((cat) => (
        <ChipButton
          key={cat.id}
          role="radio"
          aria-checked={current === cat.id}
          active={current === cat.id}
          onClick={() => onSelect(cat.id)}
          title={cat.name}
        >
          {cat.name}
        </ChipButton>
      ))}
    </div>
  );
}

/** One pill showing the current order; it opens a small menu. */
export function SortMenu({
  current,
  onSelect,
}: {
  current: SortValue;
  onSelect: (value: SortValue) => void;
}) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Focus the checked option so arrow keys start from it.
    itemRefs.current[SORT_VALUES.indexOf(current)]?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open, current]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = itemRefs.current;
    const i = items.findIndex((el) => el === document.activeElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("catalog.sortAria")}: ${t(SORT_LABEL_KEYS[current])}`}
        className="flex h-11 items-center gap-1.5 rounded-full pl-3 pr-2.5 text-[14px] font-semibold text-gray-700 transition-colors hover:bg-gray-900/[0.05] hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
      >
        <SortIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="whitespace-nowrap">{t(SORT_LABEL_KEYS[current])}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t("catalog.sortAria")}
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-30 mt-1 w-56 origin-top-right rounded-2xl bg-white p-1.5 shadow-theme-lg ring-1 ring-gray-900/[0.06] motion-safe:animate-popover-in dark:bg-gray-800 dark:ring-white/[0.08]"
        >
          {SORT_VALUES.map((value, i) => {
            const checked = value === current;
            return (
              <button
                key={value}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                  if (!checked) onSelect(value);
                }}
                className={`flex h-11 w-full items-center justify-between gap-2 rounded-full px-3.5 text-left text-[14px] outline-none transition-colors focus-visible:bg-gray-900/[0.05] dark:focus-visible:bg-white/[0.06] ${
                  checked
                    ? "font-bold text-gray-900 dark:text-white"
                    : "font-medium text-gray-700 hover:bg-gray-900/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.06]"
                }`}
              >
                {t(SORT_LABEL_KEYS[value])}
                {checked && <CheckLineIcon className="h-4 w-4 text-brand-500 dark:text-brand-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
