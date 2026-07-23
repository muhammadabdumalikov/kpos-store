"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";

type SortOption = { value: string; label: string };
type Category = { id: string; name: string };

const CHIP_LIMIT = 6; // Show chips when categories count <= this; otherwise dropdown

export function CatalogToolbar({
  categories,
  currentCategory,
  currentSort,
  sortOptions,
}: {
  categories: readonly Category[];
  currentCategory: string;
  currentSort: string;
  sortOptions: readonly SortOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const useCategoryDropdown = categories.length > CHIP_LIMIT;
  const currentCategoryLabel =
    !currentCategory ? "Barchasi" : categories.find((c) => c.id === currentCategory)?.name ?? "Barchasi";

  const buildUrl = (category: string, sort: string) => {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (sort && sort !== "popular") p.set("sort", sort);
    const q = p.toString();
    return q ? `/catalog?${q}` : "/catalog";
  };

  const handleSortSelect = (value: string) => {
    setSortOpen(false);
    const p = new URLSearchParams(searchParams.toString());
    if (value === "popular") p.delete("sort");
    else p.set("sort", value);
    router.push(p.toString() ? `/catalog?${p.toString()}` : "/catalog");
  };

  const handleCategorySelect = (categoryId: string) => {
    setCategoryOpen(false);
    const p = new URLSearchParams(searchParams.toString());
    if (categoryId) p.set("category", categoryId);
    else p.delete("category");
    if (currentSort && currentSort !== "popular") p.set("sort", currentSort);
    router.push(p.toString() ? `/catalog?${p.toString()}` : "/catalog");
  };

  useEffect(() => {
    const close = () => {
      setSortOpen(false);
      setCategoryOpen(false);
    };
    window.addEventListener("scroll", close, { capture: true });
    return () => window.removeEventListener("scroll", close, { capture: true });
  }, []);

  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      {/* Categories: chips when few, dropdown when many */}
      {useCategoryDropdown ? (
        <div className="relative flex items-center gap-2" ref={categoryRef}>
          <span className="shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">
            Kategoriya:
          </span>
          <button
            type="button"
            onClick={() => {
              setCategoryOpen((o) => !o);
              setSortOpen(false);
            }}
            className="flex h-9 min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 sm:w-[180px]"
            aria-expanded={categoryOpen}
            aria-haspopup="listbox"
            aria-label="Kategoriyani tanlash"
          >
            <span className="truncate">{currentCategoryLabel}</span>
            <svg
              className={`h-4 w-4 shrink-0 text-gray-400 transition ${categoryOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {categoryOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setCategoryOpen(false)}
              />
              <ul
                role="listbox"
                className="absolute left-0 top-full z-20 mt-1 max-h-[min(280px,60vh)] min-w-[180px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-theme-lg"
              >
                <li role="option" aria-selected={!currentCategory}>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect("")}
                    className={`w-full px-4 py-2.5 text-left text-sm font-medium ${
                      !currentCategory ? "bg-brand-50 text-brand-500" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    Barchasi
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id} role="option" aria-selected={currentCategory === cat.id}>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium ${
                        currentCategory === cat.id
                          ? "bg-brand-50 text-brand-500"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:overflow-visible">
          <button
            type="button"
            onClick={() => handleCategorySelect("")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              !currentCategory ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            Barchasi
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                currentCategory === cat.id
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Sort dropdown */}
      <div className="relative flex items-center gap-2" ref={sortRef}>
        <span className="shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">Saralash:</span>
        <button
          type="button"
          onClick={() => {
            setSortOpen((o) => !o);
            setCategoryOpen(false);
          }}
          className="flex h-9 min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 sm:w-[160px]"
          aria-expanded={sortOpen}
          aria-haspopup="listbox"
          aria-label="Saralash"
        >
          <span className="truncate">
            {sortOptions.find((o) => o.value === currentSort)?.label ?? "Mashhur"}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-gray-400 transition ${sortOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {sortOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              aria-hidden
              onClick={() => setSortOpen(false)}
            />
            <ul
              role="listbox"
              className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-theme-lg sm:right-0"
            >
              {sortOptions.map((opt) => (
                <li key={opt.value} role="option" aria-selected={currentSort === opt.value}>
                  <button
                    type="button"
                    onClick={() => handleSortSelect(opt.value)}
                    className={`w-full px-4 py-2.5 text-left text-sm font-medium ${
                      currentSort === opt.value
                        ? "bg-brand-50 text-brand-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
