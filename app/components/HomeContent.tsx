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
/** One category's shelf on the home page: its first few products. */
export type HomeSection = { id: string; name: string; products: HomeProduct[] };

function HomeCard({ product: p }: { product: HomeProduct }) {
  return (
    <ProductCard
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
  );
}

const sectionTitle =
  "text-[20px] font-bold leading-7 tracking-[-0.01em] text-gray-900 dark:text-white lg:text-[22px]";

export function HomeContent({
  categories,
  products,
  sections,
  total,
  failed,
}: {
  categories: HomeCategory[];
  products: HomeProduct[];
  /** Category shelves under the newest products; empty for a small shop,
   *  whose whole range already fits the grid above. */
  sections: HomeSection[];
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

  // With shelves below, the grid is a short "new arrivals" block (three rows
  // at most at each width) rather than the whole first page.
  const shelved = sections.length > 0;
  const gridHide = (i: number) => (!shelved ? "" : i >= 8 ? "max-lg:hidden" : i >= 6 ? "max-md:hidden" : "");

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
          {shelved ? t("home.newArrivals") : t("home.popular")}
        </h2>
        {products.length > 0 ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:mt-4 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-8">
              {products.map((p, i) => (
                <div key={p.id} className={`min-w-0 ${gridHide(i)}`}>
                  <HomeCard product={p} />
                </div>
              ))}
            </div>

            {sections.map((section) => (
              <section key={section.id} aria-labelledby={`home-shelf-${section.id}`} className="mt-9 lg:mt-12">
                <div className="flex items-center justify-between gap-3">
                  <h2 id={`home-shelf-${section.id}`} className={`${sectionTitle} min-w-0 truncate`}>
                    {section.name}
                  </h2>
                  <Link
                    href={`/catalog?category=${encodeURIComponent(section.id)}`}
                    aria-label={`${t("home.seeAll")}: ${section.name}`}
                    className="-mr-2 inline-flex h-11 shrink-0 items-center gap-0.5 rounded-full pl-3 pr-2 text-[14px] font-semibold text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-gray-400 dark:hover:text-white"
                  >
                    {t("home.seeAll")}
                    <ChevronRightIcon className="h-[18px] w-[18px]" />
                  </Link>
                </div>
                {/* Phone: a shelf to swipe, the third card peeking in. Desktop:
                    one row of the grid. */}
                <ul className="no-scrollbar -mx-4 mt-2 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:mt-3 lg:grid lg:grid-cols-5 lg:gap-x-5 lg:overflow-visible lg:px-0 lg:pb-0">
                  {section.products.map((p, i) => (
                    <li
                      key={p.id}
                      className={`w-[42%] shrink-0 snap-start sm:w-[30%] md:w-[23%] lg:w-auto ${i >= 5 ? "lg:hidden" : ""}`}
                    >
                      <HomeCard product={p} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {total > products.length && (
              <Link
                href="/catalog"
                className={`${pillSecondary} mt-8 flex h-12 w-full lg:mx-auto lg:mt-10 lg:max-w-[360px]`}
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
