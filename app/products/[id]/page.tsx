import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { DesktopFooter } from "../../components/DesktopFooter";
import { MobileNav } from "../../components/MobileNav";
import { ProductCard } from "../../components/ProductCard";
import { AddToCartButton } from "../../components/AddToCartButton";
import { AuthDrawerProvider } from "../../components/AuthDrawerContext";
import { getStoreProduct, getStoreProducts } from "../../../lib/store-api";
import { getStoreSlugServer } from "../../../lib/store-slug-server";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("uz-UZ").format(value) + " UZS";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const slug = await getStoreSlugServer();
  const apiProduct = await getStoreProduct(id, slug);
  if (!apiProduct) notFound();

  const outOfStock = apiProduct.quantity <= 0;
  const product = {
    id: apiProduct.id,
    name: apiProduct.name,
    price: Math.round(parseFloat(String(apiProduct.priceOut)) || 0),
    image: apiProduct.image ?? undefined,
    stock: String(apiProduct.quantity),
  };

  let recommendedProducts: { id: string; name: string; price: number; quantity?: number }[] = [];
  try {
    const res = await getStoreProducts({ limit: 5, slug });
    recommendedProducts = res.products
      .filter((p) => p.id !== id)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: Math.round(parseFloat(String(p.priceOut)) || 0),
        quantity: p.quantity,
      }));
  } catch {
    recommendedProducts = [];
  }

  return (
    <AuthDrawerProvider>
      <main className="relative mx-auto flex min-h-full max-w-7xl flex-col gap-1.5 px-0 pb-24 pt-0 lg:pb-8">
        {/* Gallery + overlay */}
        <div className="relative">
          <div className="relative h-[60vh] w-full overflow-hidden bg-gray-200">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="100vw"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-gray-400">
                {product.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="absolute left-0 right-0 top-4 z-10 flex items-center justify-between px-4">
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:bg-gray-900"
              aria-label="Orqaga"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 max-h-[70px] rounded-t-[18px] bg-white dark:bg-gray-900 px-4 py-3">
            <h1 className="line-clamp-2 text-xl font-semibold text-black dark:text-white/90">
              {product.name}
            </h1>
          </div>
          <div className="h-12" />
        </div>

        {/* Price + stock strip */}
        <section className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900 px-4 py-3 lg:bg-transparent lg:p-0">
          <h2 className="text-2xl font-semibold text-black dark:text-white/90 lg:text-3xl">
            {formatPrice(product.price)}
          </h2>
          <div
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-4 ${
              outOfStock
                ? "bg-gray-100 dark:bg-gray-800"
                : "bg-brand-50 dark:bg-brand-500/10"
            }`}
          >
            <svg className="h-6 w-6 shrink-0 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48622 2 2 6.48622 2 12C2 17.5138 6.48622 22 12 22C17.5138 22 22 17.5138 22 12C22 6.48622 17.5138 2 12 2ZM17.589 9.36842L11.198 15.7093C10.8221 16.0852 10.2206 16.1103 9.81955 15.7343L6.43609 12.6516C6.03509 12.2757 6.01003 11.6491 6.3609 11.2481C6.73684 10.8471 7.36341 10.8221 7.76441 11.198L10.4461 13.6541L16.1604 7.93985C16.5614 7.53885 17.188 7.53885 17.589 7.93985C17.99 8.34085 17.99 8.96742 17.589 9.36842Z" />
            </svg>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">
              {outOfStock ? (
                <span className="font-medium">Omborda yo‘q</span>
              ) : (
                <>
                  <span className="font-medium">{product.stock} dona</span> mahsulotni sotib olishingiz mumkin
                </>
              )}
            </h4>
          </div>
        </section>

        {/* Desktop buy section — in flow (not fixed) */}
        <section className="hidden w-full justify-center rounded-2xl bg-white dark:bg-gray-900 py-4 lg:flex">
          <div className="flex w-full max-w-7xl justify-between gap-24 px-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                {product.image ? (
                  <Image src={product.image} alt="" fill className="object-cover" unoptimized />
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-black dark:text-white/90 line-clamp-1">{product.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-black dark:text-white/90 lg:text-3xl">
                {formatPrice(product.price)}
              </h3>
              <AddToCartButton
                productId={product.id}
                disabled={outOfStock}
                className="h-14 min-w-[210px] rounded-2xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-200 dark:disabled:bg-gray-800"
              >
                {outOfStock ? "Omborda yo‘q" : "Savatchaga qo‘shish"}
              </AddToCartButton>
            </div>
          </div>
        </section>

        {/* Reviews empty state */}
        <section className="flex w-full flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between p-4 pb-0 lg:hidden">
            <h3 className="text-xl font-semibold">Sharhlar</h3>
          </div>
          <div className="grid w-full pb-4 lg:pb-0">
            <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-white dark:bg-gray-900 py-8">
              <div className="flex h-[95px] w-[118px] items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <svg className="h-16 w-24 text-gray-400" viewBox="0 0 118 95" fill="none" aria-hidden>
                  <path fillRule="evenodd" clipRule="evenodd" d="M29.7354 63.249H72.6874C72.9305 63.249 73.1674 63.2227 73.3954 63.173C73.6235 63.2227 73.8604 63.249 74.1034 63.249H98.6474C100.472 63.249 101.951 61.7697 101.951 59.945C101.951 58.1202 100.472 56.641 98.6474 56.641H95.8154C93.9907 56.641 92.5114 55.1617 92.5114 53.337C92.5114 51.5122 93.9907 50.033 95.8154 50.033H104.783C106.608 50.033 108.087 48.5537 108.087 46.729C108.087 44.9042 106.608 43.425 104.783 43.425H94.3994C96.2242 43.425 97.7034 41.9457 97.7034 40.121C97.7034 38.2962 96.2242 36.817 94.3994 36.817H64.1914C66.0162 36.817 67.4954 35.3377 67.4954 33.513C67.4954 31.6882 66.0162 30.209 64.1914 30.209H37.2874C35.4627 30.209 33.9834 31.6882 33.9834 33.513C33.9834 35.3377 35.4627 36.817 37.2874 36.817H18.4074C16.5827 36.817 15.1034 38.2962 15.1034 40.121C15.1034 41.9457 16.5827 43.425 18.4074 43.425H30.2074C32.0322 43.425 33.5114 44.9042 33.5114 46.729C33.5114 48.5537 32.0322 50.033 30.2074 50.033H11.3274C9.50269 50.033 8.02344 51.5122 8.02344 53.337C8.02344 55.1617 9.50269 56.641 11.3274 56.641H29.7354C27.9107 56.641 26.4314 58.1202 26.4314 59.945C26.4314 61.7697 27.9107 63.249 29.7354 63.249Z" fill="currentColor" />
                </svg>
              </div>
              <h3 className="text-center text-sm font-semibold lg:text-xl">
                Hozircha sharhlar yo‘q
              </h3>
              <p className="max-w-[300px] text-center text-sm text-gray-500 dark:text-gray-400 lg:text-base">
                Mahsulot haqida xariddan keyin fikr bildiring. Sharhlar boshqalarga to‘g‘ri tanlov qilishga yordam beradi
              </p>
            </div>
          </div>
        </section>

        {/* Recommended */}
        {recommendedProducts.length > 0 && (
          <section className="flex w-full flex-col gap-3 rounded-2xl bg-white dark:bg-gray-900 px-4 py-3">
            <h3 className="text-xl font-semibold text-black dark:text-white/90">Biz ham tavsiya qilamiz</h3>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-4 lg:grid-cols-5 lg:gap-y-4">
              {recommendedProducts.map((p) => (
                <li key={p.id} className="flex grow">
                  <ProductCard id={p.id} name={p.name} price={p.price} quantity={p.quantity} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Mobile buy section — fixed above bottom nav */}
        <div
          className="fixed left-0 right-0 z-20 flex w-full items-center justify-between border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden"
          style={{ bottom: "var(--nav-total)" }}
        >
          <span className="text-lg font-bold text-gray-900 dark:text-white/90">{formatPrice(product.price)}</span>
          <div className="flex items-center gap-2">
            <AddToCartButton
              productId={product.id}
              disabled={outOfStock}
              className="h-10 min-w-[120px] rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 active:bg-brand-500/80 disabled:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-200 dark:disabled:bg-gray-800"
            >
              {outOfStock ? "Omborda yo‘q" : "Sotib olish"}
            </AddToCartButton>
            <AddToCartButton
              productId={product.id}
              disabled={outOfStock}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800"
              goToCart={true}
            >
              <span className="sr-only">Savat</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path fillRule="evenodd" clipRule="evenodd" d="M6.63191 5.75C4.00567 5.75 2.00798 8.10818 2.43974 10.6987L3.77307 18.6987C4.11462 20.748 5.88768 22.25 7.96525 22.25H16.0353C18.1129 22.25 19.886 20.748 20.2275 18.6987L21.5609 10.6987C21.9926 8.10819 19.9949 5.75 17.3687 5.75H16.4357C16.3964 5.75 16.3571 5.75133 16.3181 5.75395L16.2799 5.47702C15.9847 3.34091 14.1589 1.75 12.0025 1.75C9.84378 1.75 8.01675 3.34418 7.72427 5.48297L7.68717 5.75427C7.6466 5.75143 7.60581 5.75 7.56487 5.75H6.63191Z" />
              </svg>
            </AddToCartButton>
          </div>
        </div>

        {/* Spacer so content isn't hidden behind buy section + nav */}
        <div className="lg:hidden" style={{ minHeight: "calc(var(--nav-total) + 56px)" }} />
      </main>

      <MobileNav />
      <DesktopFooter />
    </AuthDrawerProvider>
  );
}
