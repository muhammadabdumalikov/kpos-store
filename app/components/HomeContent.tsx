"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";
import { Banners } from "./Banners";
import { CategoryCard } from "./CategoryCard";
import { ProductCard } from "./ProductCard";

export type HomeCategory = { id: string; name: string; image: string | null };
export type HomeProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

export function HomeContent({
  categories,
  products,
  total,
}: {
  categories: HomeCategory[];
  products: HomeProduct[];
  total: number;
}) {
  const { t } = useTranslations();

  return (
    <>
      <Banners />

      {categories.length > 0 && (
        <section aria-label={t("home.categories")} className="mt-4 lg:mt-6">
          <div className="flex items-center justify-between px-4 lg:px-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white/90">
              {t("home.categories")}
            </h2>
            <Link
              href="/catalog"
              className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              {t("home.seeAll")}
            </Link>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1 lg:px-0">
            {categories.map((cat) => (
              <div key={cat.id} className="w-[76px] shrink-0">
                <CategoryCard id={cat.id} name={cat.name} image={cat.image} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-label={t("home.popular")} className="mt-6 pb-2">
        <div className="flex items-center justify-between px-4 lg:px-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white/90">
            {t("home.popular")}
          </h2>
          {total > products.length && (
            <Link
              href="/catalog"
              className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              {t("home.seeAll")}
            </Link>
          )}
        </div>
        {products.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4 lg:px-0">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                image={p.image}
                quantity={p.quantity}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 px-4 text-sm text-gray-500 dark:text-gray-400 lg:px-0">
            {t("home.noProducts")}
          </p>
        )}
      </section>
    </>
  );
}
