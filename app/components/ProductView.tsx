"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useStoreTheme } from "@/context/StoreThemeContext";
import { useTelegram } from "@/context/TelegramContext";
import { useTranslations } from "@/hooks/useTranslations";
import { isWeighed, usePrice, type QuantityType } from "@/hooks/usePrice";
import { summarizeCart, useCart, useCartQty, useProductCartQty } from "@/lib/cart-store";
import type { CatalogProduct } from "@/lib/catalog-pages";
import { formatAmount } from "@/lib/format";
import { discountLabel, discountPercent } from "@/lib/product-badges";
import type { OptionChoice, OptionGroup } from "@/lib/product-options";
import { onOrderLabel, stockOf } from "@/lib/stock";
import type { StoreInfo } from "@/lib/store-api";
import { sellerChatHref } from "@/lib/store-contacts";
import { trackViewItem } from "@/lib/tracking";
import { AddControl } from "./AddControl";
import { BackButton, useBackFallback } from "./BackButton";
import { PlatformCredit } from "./PlatformCredit";
import { ProductCard } from "./ProductCard";
import { pillSecondary } from "./StatePanel";
import { ClockIcon } from "./icons/DeliveryIcons";
import { useFulfilmentLines } from "./StoreIntro";
import { BagIcon, BoxIcon, ChatIcon, ChevronRightIcon } from "./icons/ShopIcons";
import { themedGrid, themedTitle } from "./themes/classes";

export type ProductViewProduct = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  /** Every photo, main one first; absent when the shop gave only `image`. */
  images?: string[];
  quantity: number;
  quantityType: QuantityType;
  /** Taken on order: with no stock it says "Buyurtmaga" and can still be added. */
  preorder?: boolean;
  /** Free text after that label ("15–20 kun"). */
  leadTime?: string | null;
  /** Choice groups, already normalised (lib/product-options). */
  options?: OptionGroup[];
  /** Plain text; line breaks are kept. */
  description?: string | null;
  /** The price it was marked down from; null when there is no markdown. */
  oldPrice?: number | null;
  /** The shop's flags; one of them is shown above the name. */
  isNew?: boolean;
  popular?: boolean;
};

export type RelatedProducts = {
  /** "category": the product's own category. "shop": anything else the shop
   *  sells, when the category has nothing else to offer. */
  kind: "category" | "shop";
  products: CatalogProduct[];
};

const sectionTitle =
  "text-[20px] font-bold leading-7 tracking-[-0.01em] text-gray-900 dark:text-white lg:text-[22px]";

// The themes' touches on this page (lib/store-theme); the default never
// matches them. Jurnal: serif title, light price, hairline-outlined chips.
// Afisha: poster title and price, black-ruled chips and labels.
const THEMED_SECTION_TITLE =
  "jurnal:font-head jurnal:text-[28px] jurnal:font-normal jurnal:lg:text-[36px] afisha:text-[11px] afisha:uppercase afisha:leading-4 afisha:tracking-[0.1em]";
const THEMED_PILL =
  "jurnal:bg-transparent jurnal:text-[11px] jurnal:font-medium jurnal:uppercase jurnal:tracking-[0.14em] jurnal:ring-1 jurnal:ring-inset jurnal:ring-gray-300 afisha:bg-white afisha:text-[11px] afisha:font-bold afisha:uppercase afisha:tracking-[0.08em] afisha:text-gray-900 afisha:ring-1 afisha:ring-inset afisha:ring-gray-900";

export function categoryHref(categoryId: string | null | undefined) {
  return categoryId ? `/catalog?category=${encodeURIComponent(categoryId)}` : "/catalog";
}

/**
 * The product page body: the photo, then what the shopper decides on (name,
 * price, the rare stock warning, the choices), the one action with how the
 * order reaches them right under it, then the description and more from the
 * same shelf. The server page fetches; this
 * renders, so every string is localised.
 */
export function ProductView({
  product,
  category,
  categoryId,
  related,
  info,
}: {
  product: ProductViewProduct;
  /** The product's category, when it has one and its name is known. */
  category: { id: string; name: string } | null;
  categoryId: string | null;
  related: RelatedProducts | null;
  info: StoreInfo | null;
}) {
  const { t } = useTranslations();
  const { parts } = usePrice();
  const theme = useStoreTheme();
  const { isTelegram } = useTelegram();
  const fulfilment = useFulfilmentLines(info);

  // One value per group, picked on chips. A group with a single value needs
  // no tap. The cart line is the product plus these choices, so another size
  // is another line with its own count.
  const groups = product.options ?? [];
  const [picked, setPicked] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.filter((g) => g.values.length === 1).map((g) => [g.name, g.values[0]]))
  );
  // The group the shopper was asked for after tapping Add without it.
  const [asked, setAsked] = useState<string | null>(null);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const firstMissing = groups.find((g) => !picked[g.name])?.name ?? null;
  // While a choice is missing this matches no stored line (its value is
  // empty), so the control shows Add and `beforeAdd` asks for the choice.
  const choices: OptionChoice[] | undefined =
    groups.length > 0 ? groups.map((g) => ({ name: g.name, value: picked[g.name] ?? "" })) : undefined;
  const qty = useCartQty(product.id, choices);
  const productQty = useProductCartQty(product.id);
  const cart = summarizeCart(useCart());

  const pick = (group: string, value: string) => {
    setPicked((prev) => ({ ...prev, [group]: value }));
    if (asked === group) setAsked(null);
  };
  const beforeAdd = () => {
    if (!firstMissing) return true;
    setAsked(firstMissing);
    groupRefs.current[firstMissing]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return false;
  };

  const backHref = categoryHref(categoryId);
  useBackFallback(backHref);

  // Ad trackers (REKLAMA-KUZATUV.md §2): this product was viewed.
  useEffect(() => { trackViewItem({ id: product.id, name: product.name, price: product.price }); }, [product.id, product.name, product.price]);

  const { max, soldOut, lowStock, onOrder } = stockOf(product.quantity, product.preorder);
  const weighed = isWeighed(product.quantityType);
  const unit = weighed ? t("common.unitKg") : null;
  const { amount, suffix } = parts(product.price, product.quantityType);
  // Stock is per product, not per choice: what the other lines of this
  // product hold is not available to this one.
  const lineMax = max - (productQty - qty);
  const atCap = productQty > 0 && productQty >= max && Number.isFinite(max);
  const description = product.description?.trim() || null;
  const chatHref = sellerChatHref(info);
  const gallery = product.images?.length ? product.images : product.image ? [product.image] : [];
  // As on the card: a sold-out product shows no markdown and no flags.
  const was = !soldOut && product.oldPrice && product.oldPrice > product.price ? product.oldPrice : null;
  const percent = was ? discountPercent(product.price, was) : null;
  const flag = soldOut ? null : product.popular ? "popular" : product.isNew ? "new" : null;

  return (
    <>
      <div className="hidden pt-5 lg:block">
        <BackButton fallback={backHref} variant="link" />
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 md:items-start md:pt-4 lg:mt-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-x-12 lg:pt-0 xl:gap-x-16">
        {/* Phone: the photo runs edge to edge from the top of the page, the
            back button on it. Inside Telegram the client's own back button
            (same rule) already sits in the header. */}
        <div className="relative -mx-4 md:mx-0">
          <ProductGallery
            key={gallery.join("|")}
            images={gallery}
            name={product.name}
            soldOut={soldOut}
          />
          {!isTelegram && (
            <BackButton fallback={backHref} variant="float" className="absolute left-3 top-3 lg:hidden" />
          )}
        </div>

        <div className="min-w-0 pt-4 md:pt-0 lg:sticky lg:top-24 lg:pt-2">
          {(category || flag) && (
            <div className="flex min-w-0 flex-wrap items-center gap-x-2">
              {category && (
                <Link
                  href={categoryHref(category.id)}
                  className="group -my-1.5 inline-flex h-11 min-w-0 max-w-full items-center rounded-full outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-brand-500/60 focus-visible:[&>span]:ring-offset-2 focus-visible:[&>span]:ring-offset-white dark:focus-visible:[&>span]:ring-offset-gray-900"
                >
                  <span className={`flex h-8 min-w-0 items-center rounded-full bg-gray-900/[0.05] px-3.5 text-[13px] font-semibold text-gray-600 transition-colors duration-100 group-hover:bg-gray-900/[0.08] group-hover:text-gray-900 dark:bg-white/[0.07] dark:text-gray-300 dark:group-hover:bg-white/[0.11] dark:group-hover:text-white ${THEMED_PILL}`}>
                    <span className="truncate">{category.name}</span>
                  </span>
                </Link>
              )}
              {/* The shop's own flag, in the category's pill shape but
                  coloured: it is a label, not a link. */}
              {flag && (
                <span
                  className={`flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold jurnal:text-[11px] jurnal:font-medium jurnal:uppercase jurnal:tracking-[0.14em] afisha:text-[11px] afisha:font-bold afisha:uppercase afisha:tracking-[0.08em] ${
                    flag === "popular"
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 afisha:bg-brand-300 afisha:text-gray-900 afisha:ring-1 afisha:ring-inset afisha:ring-gray-900 tungi:bg-brand-300 tungi:text-gray-950"
                  }`}
                >
                  {t(flag === "popular" ? "product.badgePopular" : "product.badgeNew")}
                </span>
              )}
            </div>
          )}

          <h1
            className={`${
              category || flag ? "mt-2" : ""
            } break-words text-[24px] font-bold leading-[30px] tracking-[-0.02em] text-gray-900 dark:text-white lg:text-[32px] lg:leading-[40px] ${themedTitle} jurnal:text-[32px] jurnal:leading-[36px] jurnal:lg:text-[46px] jurnal:lg:leading-[50px]`}
          >
            {product.name}
          </h1>

          <p
            className={`mt-2 flex flex-wrap items-baseline gap-x-1.5 tabular-nums lg:mt-3 ${
              soldOut ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
            }`}
          >
            <span className="whitespace-nowrap text-[30px] font-bold leading-9 tracking-[-0.02em] lg:text-[36px] lg:leading-[44px] jurnal:text-[24px] jurnal:font-normal jurnal:tracking-normal jurnal:lg:text-[28px] afisha:font-head afisha:text-[26px] afisha:font-extrabold afisha:lg:text-[32px]">
              {amount}
            </span>
            <span
              className={`whitespace-nowrap text-[16px] font-semibold leading-6 lg:text-[18px] ${
                soldOut ? "" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {suffix}
            </span>
            {was && (
              <s className="ml-1 whitespace-nowrap text-[17px] font-medium leading-6 text-gray-500 dark:text-gray-400 lg:text-[19px]">
                <span className="sr-only">{t("product.oldPrice")}: </span>
                {formatAmount(was)}
              </s>
            )}
            {/* Fixed sale red, whatever the shop's accent: white on error-600
                is 4.83:1. */}
            {percent && (
              <span className="ml-1 self-center whitespace-nowrap rounded-full bg-error-600 px-2.5 py-0.5 text-[13px] font-bold leading-5 text-white">
                {discountLabel(percent)}
              </span>
            )}
          </p>

          {lowStock && (
            <p className="mt-1.5 flex items-center gap-2 text-[14px] font-semibold leading-5 text-warning-700 dark:text-warning-400">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning-500" />
              {t(weighed ? "product.onlyLeftKg" : "product.onlyLeft").replace("{count}", String(max))}
            </p>
          )}

          {onOrder && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[14px] font-semibold leading-5 text-gray-600 dark:text-gray-300">
              <ClockIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
              <span className="min-w-0 break-words">{onOrderLabel(t("preorder.label"), product.leadTime)}</span>
            </p>
          )}

          {groups.length > 0 && (
            <div className="mt-5 flex flex-col gap-4 lg:mt-6 lg:max-w-[520px]">
              {groups.map((group) => (
                <OptionChips
                  key={group.name}
                  group={group}
                  value={picked[group.name] ?? null}
                  asked={asked === group.name}
                  onPick={(value) => pick(group.name, value)}
                  containerRef={(el) => {
                    groupRefs.current[group.name] = el;
                  }}
                />
              ))}
            </div>
          )}

          {/* From the tablet up. On a phone the same control rides in the bar
              above the tab bar, always in reach (see the end of this view). */}
          <div className="mt-5 hidden gap-3 md:flex lg:mt-7 lg:max-w-[440px]">
            <div className="min-w-0 flex-1">
              <AddControl
                id={product.id}
                name={product.name}
                price={product.price}
                max={lineMax}
                soldOut={soldOut}
                unit={unit}
                size="lg"
                tone="primary"
                options={choices}
                beforeAdd={groups.length > 0 ? beforeAdd : undefined}
              />
            </div>
            {/* No cart bar from the tablet up: once this product is in the
                cart, the way to it sits right here. */}
            {productQty > 0 && (
              <div className="shrink-0">
                <Link href="/cart" className={`${pillSecondary} h-[52px] pr-4`}>
                  {t("cartBar.open")}
                  <ChevronRightIcon className="-ml-0.5 h-[18px] w-[18px] text-gray-400" />
                </Link>
              </div>
            )}
          </div>
          <p aria-live="polite" className="min-h-0 text-[13px] font-medium leading-5 text-gray-500 dark:text-gray-400">
            {asked ? (
              <span className="mt-2.5 block text-[14px] font-semibold text-error-600 dark:text-error-400">
                {t("productOptions.missing").replace("{name}", asked)}
              </span>
            ) : (
              atCap && <span className="mt-2.5 block">{t("product.allInCart")}</span>
            )}
          </p>

          {/* How the order reaches the shopper, and what that costs, next to
              the button that starts it. */}
          {fulfilment.length > 0 && (
            <ul aria-label={t("home.fulfilmentAria")} className="mt-5 flex flex-col gap-2 md:mt-4 lg:mt-5 lg:max-w-[440px]">
              {fulfilment.map((l) => (
                <li
                  key={l.key}
                  className="flex min-w-0 items-start gap-2.5 text-[14px] font-medium leading-5 text-gray-500 dark:text-gray-400"
                >
                  <span className="mt-px shrink-0 text-gray-400 dark:text-gray-500">{l.icon}</span>
                  <span className="min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-white">{l.label}</span>
                    {l.detail && (
                      <>
                        <span aria-hidden> · </span>
                        <span className="tabular-nums">{l.detail}</span>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* A question about size or delivery goes to the seller's own chat. */}
          {chatHref && (
            <a
              href={chatHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${pillSecondary} mt-4 w-full lg:w-auto`}
            >
              <ChatIcon className="h-[18px] w-[18px]" strokeWidth={2} />
              {t("product.askSeller")}
            </a>
          )}

          {description && <Description text={description} />}
        </div>
      </div>

      {related && related.products.length > 0 && (
        <section aria-labelledby="related-title" className="mt-10 lg:mt-16">
          <div className="flex items-center justify-between gap-3">
            <h2 id="related-title" className={`${sectionTitle} ${THEMED_SECTION_TITLE}`}>
              {related.kind === "category" ? t("product.sameCategory") : t("product.moreProducts")}
            </h2>
            <Link
              href={related.kind === "category" ? categoryHref(categoryId) : "/catalog"}
              aria-label={
                related.kind === "category" && category
                  ? `${t("home.seeAll")}: ${category.name}`
                  : t("home.allProducts")
              }
              className="-mr-2 inline-flex h-11 shrink-0 items-center gap-0.5 rounded-full pl-3 pr-2 text-[14px] font-semibold text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-gray-400 dark:hover:text-white"
            >
              {t("home.seeAll")}
              <ChevronRightIcon className="h-[18px] w-[18px]" />
            </Link>
          </div>
          <div
            className={
              theme === "default"
                ? "mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:mt-4 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-8"
                : `mt-3 lg:mt-4 ${themedGrid(theme)} ${theme === "afisha" ? "border-t" : ""}`
            }
          >
            {related.products.map((p) => (
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
                oldPrice={p.oldPrice}
                isNew={p.isNew}
                popular={p.popular}
              />
            ))}
          </div>
        </section>
      )}

      {/* The platform credit closes the page on the phone. It sits above the
          spacer below, so the fixed add button never covers it. */}
      <PlatformCredit store={info} phone />

      {/* Phone: the one action of this page stays above the tab bar however
          far the shopper has scrolled, with the way to the cart beside it
          once there is something in it. */}
      <div aria-hidden className="h-[84px] md:hidden" />
      <div
        className="fixed inset-x-0 z-20 bg-gradient-to-t from-white from-70% to-transparent px-4 pb-3 pt-4 dark:from-gray-900 md:hidden"
        style={{ bottom: "var(--nav-total)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <AddControl
              id={product.id}
              name={product.name}
              price={product.price}
              max={lineMax}
              soldOut={soldOut}
              unit={unit}
              size="lg"
              tone="primary"
              options={choices}
              beforeAdd={groups.length > 0 ? beforeAdd : undefined}
            />
          </div>
          {cart.lines > 0 && (
            <Link
              href="/cart"
              aria-label={`${t("cartBar.open")}: ${t("cartBar.items").replace("{count}", String(cart.units))}`}
              className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition-[background-color,transform] duration-100 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 motion-safe:active:scale-95 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              <BagIcon className="h-6 w-6" strokeWidth={1.9} />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold leading-none tabular-nums text-white ring-2 ring-white dark:ring-gray-900">
                {cart.units}
              </span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * One choice group as a row of chips: the group's name with what is picked,
 * then every value as a 44px pill. Tapping Add without a pick marks the group.
 */
function OptionChips({
  group,
  value,
  asked,
  onPick,
  containerRef,
}: {
  group: OptionGroup;
  value: string | null;
  /** The shopper tried to add without choosing here. */
  asked: boolean;
  onPick: (value: string) => void;
  containerRef: (el: HTMLDivElement | null) => void;
}) {
  const labelId = useId();

  return (
    <div ref={containerRef} role="group" aria-labelledby={labelId} className="min-w-0 scroll-mt-24">
      <p
        id={labelId}
        className={`break-words text-[14px] font-semibold leading-5 ${
          asked ? "text-error-600 dark:text-error-400" : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {group.name}
        {value && (
          <>
            : <span className="text-gray-900 dark:text-white">{value}</span>
          </>
        )}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {group.values.map((v) => {
          const active = v === value;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={active}
              onClick={() => onPick(v)}
              className={`flex h-11 min-w-[52px] max-w-full items-center justify-center rounded-full px-4 text-[15px] leading-none transition-[background-color,color,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-safe:active:scale-[0.97] motion-reduce:transition-none dark:focus-visible:ring-offset-gray-900 ${
                active
                  ? "bg-gray-900 font-bold text-white dark:bg-white dark:text-gray-900"
                  : `bg-gray-900/[0.05] font-semibold text-gray-800 hover:bg-gray-900/[0.08] dark:bg-white/[0.07] dark:text-gray-200 dark:hover:bg-white/[0.11] ${
                      asked
                        ? "ring-1 ring-inset ring-error-500/50"
                        : "jurnal:bg-transparent jurnal:ring-1 jurnal:ring-inset jurnal:ring-gray-300 afisha:bg-white afisha:ring-1 afisha:ring-inset afisha:ring-gray-900 afisha:hover:bg-brand-300"
                    }`
              }`}
            >
              <span className="min-w-0 truncate">{v}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The shop's own words about the product: plain text with its line breaks,
 * folded to six lines when longer, with a toggle to read the rest.
 */
function Description({ text }: { text: string }) {
  const { t } = useTranslations();
  const bodyId = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  // Whether six lines cut the text; measured, since it depends on the width.
  const [long, setLong] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // Only the folded text can be measured against its own clamp.
    if (!el || expanded || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setLong(el.scrollHeight > el.clientHeight + 1));
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <section className="mt-6 lg:mt-8 lg:max-w-[520px]">
      <h2 className="text-[16px] font-bold leading-6 text-gray-900 dark:text-white">
        {t("productOptions.description")}
      </h2>
      <p
        ref={ref}
        id={bodyId}
        className={`mt-1.5 whitespace-pre-line break-words text-[15px] font-medium leading-6 text-gray-600 dark:text-gray-300 ${
          expanded ? "" : "line-clamp-6"
        }`}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((v) => !v)}
          className="-ml-1 mt-0.5 inline-flex h-11 items-center rounded-full px-1 text-[14px] font-bold text-gray-900 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-white dark:hover:text-gray-300"
        >
          {expanded ? t("productOptions.less") : t("productOptions.more")}
        </button>
      )}
    </section>
  );
}

// The photo tile follows the first photo's own shape between portrait 4:5 and
// landscape 5:4; anything beyond is contained inside the nearest of the two.
const MIN_RATIO = 4 / 5;
const MAX_RATIO = 5 / 4;

/**
 * The product's photos, never cropped: one tile in the first photo's own
 * shape, the photos side by side inside it to swipe through, each multiplied
 * into the tint as on the card. Dots say where you are; from the tablet up a
 * row of thumbnails under the tile jumps to a photo. Edge to edge on the
 * phone, a rounded tile from the tablet up. A single photo is just the tile.
 * Sold out ghosts the photos the same way the card does.
 */
function ProductGallery({ images, name, soldOut }: { images: string[]; name: string; soldOut: boolean }) {
  const { t } = useTranslations();
  const [failed, setFailed] = useState<string[]>([]);
  // Square until the first photo says otherwise.
  const [ratio, setRatio] = useState(1);
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const shown = images.filter((src) => !failed.includes(src));
  const many = shown.length > 1;
  const fail = (src: string) => setFailed((list) => (list.includes(src) ? list : [...list, src]));
  const measure = (el: HTMLImageElement) => {
    if (el.naturalWidth > 0 && el.naturalHeight > 0)
      setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, el.naturalWidth / el.naturalHeight)));
  };
  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: calm ? "auto" : "smooth" });
  };

  if (shown.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden bg-gray-900/[0.035] md:rounded-[28px] dark:bg-white/[0.04]">
        <div
          className={`flex h-full w-full flex-col items-center justify-center gap-3 text-gray-900/25 dark:text-white/25 ${
            soldOut ? "opacity-60" : ""
          }`}
        >
          <BoxIcon className="h-16 w-16" strokeWidth={1.2} />
          <p className="text-[14px] font-semibold text-gray-900/40 dark:text-white/40">
            {images.length > 0 ? t("product.photoFailed") : t("product.noPhoto")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ aspectRatio: ratio }}
        className={`relative w-full overflow-hidden bg-gray-900/[0.035] md:rounded-[28px] dark:bg-gray-200 ${
          soldOut ? "dark:opacity-60" : ""
        }`}
      >
        <div
          ref={scroller}
          role={many ? "group" : undefined}
          aria-label={many ? t("product.gallery") : undefined}
          tabIndex={many ? 0 : undefined}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.clientWidth > 0) setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="no-scrollbar absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/60"
        >
          {shown.map((src, i) => (
            <div key={src} className="relative h-full w-full shrink-0 snap-center">
              {/* Plain <img>: shop photos come from whatever host the shop's
                  storage uses, and next/image throws on hosts missing from
                  config. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={i === 0 ? name : `${name}, ${t("product.photoN").replace("{n}", String(i + 1))}`}
                decoding="async"
                loading={i === 0 ? undefined : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                onLoad={i === 0 ? (e) => measure(e.currentTarget) : undefined}
                onError={() => fail(src)}
                // The first photo may have loaded or failed before hydration,
                // its event fired with no listener attached yet; catch both
                // when React attaches. Not the lazy ones: a photo the browser
                // has not asked for yet also reports complete with no size.
                ref={
                  i === 0
                    ? (el) => {
                        if (!el?.complete) return;
                        if (el.naturalWidth === 0) fail(src);
                        else measure(el);
                      }
                    : undefined
                }
                className={`absolute inset-0 h-full w-full object-contain mix-blend-multiply ${
                  soldOut ? "opacity-40 grayscale" : ""
                }`}
              />
            </div>
          ))}
        </div>

        {many && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/85 px-2 py-1.5"
          >
            {shown.map((src, i) => (
              <span
                key={src}
                className={`h-1.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none ${
                  i === index ? "w-4 bg-gray-900" : "w-1.5 bg-gray-900/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {many && (
        <ul className="mt-3 hidden flex-wrap gap-2 md:flex">
          {shown.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={t("product.photoN").replace("{n}", String(i + 1))}
                aria-current={i === index ? "true" : undefined}
                className={`block h-16 w-16 overflow-hidden rounded-[14px] bg-gray-900/[0.035] outline-none transition-shadow duration-100 focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:bg-gray-200 ${
                  i === index ? "ring-2 ring-gray-900 dark:ring-white" : "ring-1 ring-gray-900/[0.06] hover:ring-gray-900/30"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover mix-blend-multiply" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
