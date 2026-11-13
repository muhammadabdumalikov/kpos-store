"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { CategoryCard } from "./CategoryCard";
import { ChipLink } from "./Chip";
import { ProductCard } from "./ProductCard";
import { StatePanel, pillSecondary } from "./StatePanel";
import { BoxIcon, ChevronRightIcon, CloudOffIcon } from "./icons/ShopIcons";

export type HomeCategory = { id: string; name: string; image: string | null };
export type HomeProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  quantityType: string | null;
  /** Taken on order ("Buyurtmaga"), its lead time, and whether it has choices. */
  preorder?: boolean;
  leadTime?: string | null;
  hasOptions?: boolean;
};

const sectionTitle =
  "text-[20px] font-bold leading-7 tracking-[-0.01em] text-gray-900 dark:text-white lg:text-[22px]";

export function HomeContent({
  categories,
  products,
  total,
  failed,
}: {
  categories: HomeCategory[];
  products: HomeProduct[];
  total: number;
  /** The product request failed: say so instead of showing an empty shop. */
  failed: boolean;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  if (failed) {
    return (
      <StatePanel
        className="mt-4"
        icon={<CloudOffIcon className="h-7 w-7" />}
        title={t("home.errorTitle")}
        body={t("home.errorBody")}
        action={
          <button
            type="button"
            onClick={() => startRetry(() => router.refresh())}
            disabled={retrying}
            className={`${pillSecondary} disabled:opacity-60`}
          >
            {retrying ? t("common.loading") : t("common.retry")}
          </button>
        }
      />
    );
  }

  // Photo tiles only when most categories have a photo; a row of mostly
  // placeholder tiles reads worse than plain chips.
  const withImage = categories.filter((c) => c.image).length;
  const photoTiles = categories.length > 0 && withImage * 2 >= categories.length;

  return (
    <>
      {categories.length > 0 && (
        <section aria-labelledby="home-categories" className="mt-4 lg:mt-8">
          <h2 id="home-categories" className={sectionTitle}>
            {t("home.categories")}
          </h2>
          {photoTiles ? (
            <ul className="no-scrollbar -mx-4 mt-3 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:gap-4 lg:px-0">
              {categories.map((cat) => (
                <li key={cat.id} className="w-[76px] shrink-0 snap-start lg:w-[112px]">
                  <CategoryCard id={cat.id} name={cat.name} image={cat.image} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
              {categories.map((cat) => (
                <ChipLink key={cat.id} href={`/catalog?category=${encodeURIComponent(cat.id)}`}>
                  {cat.name}
                </ChipLink>
              ))}
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="home-products" className="mt-7 lg:mt-10">
        <h2 id="home-products" className={sectionTitle}>
          {t("home.popular")}
        </h2>
        {products.length > 0 ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:mt-4 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-8">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image}
                  quantity={p.quantity}
                  quantityType={p.quantityType}
                  preorder={p.preorder}
                  leadTime={p.leadTime}
                  hasOptions={p.hasOptions}
                />
              ))}
            </div>
            {total > products.length && (
              <Link
                href="/catalog"
                className={`${pillSecondary} mt-6 flex h-12 w-full lg:mx-auto lg:mt-8 lg:max-w-[360px]`}
              >
                {t("home.allProducts")}
                <span className="font-semibold tabular-nums text-gray-500 dark:text-gray-400">{total}</span>
                <ChevronRightIcon className="-mr-1 h-[18px] w-[18px] text-gray-400" />
              </Link>
            )}
          </>
        ) : (
          <StatePanel
            className="mt-3"
            icon={<BoxIcon className="h-7 w-7" />}
            title={t("home.emptyTitle")}
            body={t("home.emptyBody")}
          />
        )}
      </section>
    </>
  );
}
