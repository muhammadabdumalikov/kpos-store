"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthDrawerProvider } from "../components/AuthDrawerContext";
import { useLoading } from "../components/TopLoadingBar";
import { DesktopFooter } from "../components/DesktopFooter";
import { DesktopHeader } from "../components/DesktopHeader";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNav } from "../components/MobileNav";
import { FulfillmentSection } from "../components/checkout/FulfillmentSection";
import { OrderSummary } from "../components/checkout/OrderSummary";
import { useCheckoutFulfillment } from "../components/checkout/useCheckoutFulfillment";
import { Money, checkoutTitle, field, panel, pillPrimary } from "../components/checkout/styles";
import { themedTitle } from "../components/themes/classes";
import { StatePanel, pillSecondary } from "../components/StatePanel";
import { BagIcon, BoxIcon, CheckLineIcon, MinusIcon, PlusIcon, TrashIcon } from "../components/icons/ShopIcons";
import { storeErrorMessage } from "../../lib/api-errors";
import { cartLineKey, getCart, setCart, type CartLine } from "../../lib/cart-store";
import { formatPrice, toAmount } from "../../lib/format";
import { LEGACY_PICKUP_ONLY, normalizeFulfillment } from "../../lib/fulfillment";
import { choicesText, cleanChoices, optionGroups, type OptionChoice } from "../../lib/product-options";
import {
  fetchStoreInfo,
  fetchStoreProduct,
  createStoreOrder,
  type StoreFulfillment,
  type StoreOrderResult,
  type StoreProduct,
} from "../../lib/store-api";
import { onOrderLabel } from "../../lib/stock";
import { saveOrderId } from "../../lib/order-store";
import { getStoreSlugClient } from "../../lib/store-slug";
import { requestTelegramContact } from "../../lib/telegram";
import { useTelegram } from "@/context/TelegramContext";
import { useTranslations } from "@/hooks/useTranslations";

type CartItem = {
  /** The line's identity: the product plus the choices made on it. */
  key: string;
  /** The product id; two lines share it when the choices differ. */
  id: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  selected: boolean;
  /** What was chosen on the product page ("Oʼlcham: 41"). */
  options?: OptionChoice[];
  /** Choice groups of the product this line has no value for: the line was
   *  added before the shop gave the product options, or from a card that
   *  could not ask. The line says so and links back to the product. */
  missing: string[];
  /** Taken on order: what the shelf cannot cover waits for the goods. */
  preorder: boolean;
  leadTime: string | null;
  /** Whole units on hand right now. */
  stock: number;
};

/** A round tick: which lines go into this order. */
function Check({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="group/check -m-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-100 group-focus-visible/check:ring-2 group-focus-visible/check:ring-brand-500/50 group-focus-visible/check:ring-offset-2 ${
          checked
            ? "bg-primary text-on-primary"
            : "bg-white ring-[1.5px] ring-inset ring-gray-300 dark:bg-transparent dark:ring-gray-600"
        }`}
      >
        {checked && <CheckLineIcon className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

/** Quantity of one line. Removing is the bin's job, so it stops at 1. */
function QtyControl({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (next: number) => void;
  labels: { decrease: string; increase: string; quantity: string };
}) {
  const step =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-900 transition-[background-color,transform] duration-100 hover:bg-gray-900/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/50 motion-safe:active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent dark:text-white dark:hover:bg-white/10";
  return (
    <div className="flex h-10 shrink-0 items-center rounded-full bg-gray-900/[0.05] dark:bg-white/[0.07]">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className={step}
        aria-label={labels.decrease}
      >
        <MinusIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>
      <input
        type="tel"
        inputMode="numeric"
        value={String(value)}
        onChange={(e) => {
          const next = Number.parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
          if (Number.isFinite(next)) onChange(Math.max(1, next));
        }}
        className="h-10 w-9 bg-transparent p-0 text-center text-[16px] font-bold tabular-nums text-gray-900 outline-none dark:text-white"
        aria-label={labels.quantity}
      />
      <button type="button" onClick={() => onChange(value + 1)} className={step} aria-label={labels.increase}>
        <PlusIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function persistItems(items: CartItem[]) {
  setCart(
    items.map((i) => ({
      id: i.id,
      qty: i.qty,
      selected: i.selected,
      ...(i.options ? { options: i.options } : {}),
    }))
  );
}

export default function CartPage() {
  const { t, locale } = useTranslations();
  const { setLoading: setTopLoading } = useLoading();
  const { isTelegram, user: telegramUser, initData } = useTelegram();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<StoreOrderResult | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [phone, setPhone] = useState("+998 ");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [contactPending, setContactPending] = useState(false);
  const [contactFailed, setContactFailed] = useState(false);
  // Pickup / delivery settings of this shop. Fetched fresh (not the cached
  // server snapshot) because the fee and thresholds decide what is charged.
  const [fulfillment, setFulfillment] = useState<StoreFulfillment | null>(null);
  const [fulfillmentFailed, setFulfillmentFailed] = useState(false);
  const [fulfillmentAttempt, setFulfillmentAttempt] = useState(0);

  // Valid when the +998 prefix is followed by a full 9-digit subscriber number.
  const phoneValid = phone.replace(/\D/g, "").length >= 12;

  useEffect(() => {
    let stale = false;
    fetchStoreInfo(getStoreSlugClient())
      .then((info) => {
        if (!stale) setFulfillment(normalizeFulfillment(info));
      })
      .catch(() => {
        if (!stale) setFulfillmentFailed(true);
      });
    return () => {
      stale = true;
    };
  }, [fulfillmentAttempt]);

  const retryFulfillment = useCallback(() => {
    setFulfillmentFailed(false);
    setFulfillmentAttempt((n) => n + 1);
  }, []);

  // In the mini app the shopper is already identified — don't make them retype
  // their name. Only prefills an untouched field.
  useEffect(() => {
    if (!telegramUser) return;
    const name = [telegramUser.first_name, telegramUser.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (name) setCustomerName((prev) => prev || name);
  }, [telegramUser]);

  const useTelegramPhone = useCallback(async () => {
    setContactPending(true);
    setContactFailed(false);
    try {
      const number = await requestTelegramContact();
      if (!number) {
        setContactFailed(true);
        return;
      }
      // Normalise to the same "+998 XXXXXXXXX" shape the field produces.
      const digits = number.replace(/\D/g, "").replace(/^998/, "");
      setPhone("+998 " + digits.slice(0, 9));
      setPhoneTouched(true);
    } finally {
      setContactPending(false);
    }
  }, []);

  useEffect(() => {
    const lines = getCart();
    if (lines.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setTopLoading(true);
    const slug = getStoreSlugClient();
    // One request per product: lines that differ only in the choices made
    // (size 40, size 41) share it.
    const ids = [...new Set(lines.map((l) => l.id))];
    Promise.all(
      ids.map(async (id) => [id, await fetchStoreProduct(id, slug)] as const)
    ).then((pairs) => {
      const byId = new Map<string, StoreProduct | null>(pairs);
      const valid = lines.flatMap((line: CartLine): CartItem[] => {
        const product = byId.get(line.id);
        if (!product) return [];
        return [
          {
            key: cartLineKey(line),
            id: product.id,
            name: product.name,
            price: Math.round(parseFloat(String(product.priceOut)) || 0),
            image: product.image ?? undefined,
            qty: line.qty,
            selected: line.selected,
            options: line.options,
            missing: optionGroups(product.options)
              .map((g) => g.name)
              .filter((name) => !line.options?.some((o) => o.name === name)),
            preorder: product.preorder === true,
            leadTime: product.leadTime?.trim() || null,
            stock: Math.floor(Number(product.quantity) || 0),
          },
        ];
      });
      setItems(valid);
      if (valid.length !== lines.length) persistItems(valid);
    }).finally(() => {
      setLoading(false);
      setTopLoading(false);
    });
  }, [setTopLoading]);

  const allSelected = items.length > 0 && items.every((i) => i.selected);
  const selectedCount = items.reduce((acc, i) => acc + (i.selected ? 1 : 0), 0);

  const selectedTotals = useMemo(() => {
    const total = items.reduce((sum, i) => sum + (i.selected ? i.price * i.qty : 0), 0);
    const qty = items.reduce((sum, i) => sum + (i.selected ? i.qty : 0), 0);
    return { total, qty };
  }, [items]);

  // Lines that come on order: a preorder product asked for in a larger
  // quantity than the shelf holds (stock is per product, so its lines count
  // together). Nothing is blocked; the shopper is only told once, and given
  // the lead time when the lines being ordered agree on one.
  const onOrder = useMemo(() => {
    const asked = new Map<string, number>();
    for (const i of items) asked.set(i.id, (asked.get(i.id) ?? 0) + i.qty);
    const keys = new Set(
      items.filter((i) => i.preorder && (asked.get(i.id) ?? 0) > i.stock).map((i) => i.key)
    );
    const ordered = items.filter((i) => i.selected && keys.has(i.key));
    const leads = new Set(ordered.map((i) => i.leadTime ?? ""));
    const lead = leads.size === 1 ? [...leads][0] : "";
    return { keys, inOrder: ordered.length > 0, lead: lead || null };
  }, [items]);

  // Until the shop's settings arrive the hook runs on the legacy default; the
  // section itself shows a skeleton and the order button stays disabled.
  const checkout = useCheckoutFulfillment(
    fulfillment ?? LEGACY_PICKUP_ONLY,
    selectedTotals.total
  );
  const canSubmit =
    selectedCount > 0 && !placing && fulfillment !== null && !checkout.blocked;

  const toggleAll = useCallback(() => {
    const next = !allSelected;
    setItems((prev) => {
      const updated = prev.map((i) => ({ ...i, selected: next }));
      persistItems(updated);
      return updated;
    });
  }, [allSelected]);

  const toggleOne = useCallback((key: string) => {
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.key === key ? { ...i, selected: !i.selected } : i
      );
      persistItems(updated);
      return updated;
    });
  }, []);

  const deleteSelected = useCallback(() => {
    setItems((prev) => {
      const updated = prev.filter((i) => !i.selected);
      persistItems(updated);
      return updated;
    });
  }, []);

  const deleteOne = useCallback((key: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.key !== key);
      persistItems(updated);
      return updated;
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => {
      const updated = prev.map((i) => (i.key === key ? { ...i, qty } : i));
      persistItems(updated);
      return updated;
    });
  }, []);

  const placeOrder = useCallback(async () => {
    const selected = items.filter((i) => i.selected);
    if (selected.length === 0 || fulfillment === null) return;
    // Surface every missing field at once rather than one per tap.
    if (!phoneValid) setPhoneTouched(true);
    const deliveryOk = checkout.validate();
    if (!phoneValid || !deliveryOk) return;
    setPlacing(true);
    setOrderError(null);
    setTopLoading(true);
    try {
      const result = await createStoreOrder(
        {
          items: selected.map((i) => {
            // Re-checked against the checkout limits (3 choices, 40 chars).
            const options = cleanChoices(i.options);
            return { productId: i.id, quantity: i.qty, ...(options ? { options } : {}) };
          }),
          phone: phone.trim(),
          customerName: customerName.trim() || undefined,
          note: note.trim() || undefined,
          ...checkout.payload(),
          // The shop's Telegram messages to this customer follow this language.
          locale,
          // Verified server-side; when it checks out the order is bound to this
          // Telegram user for durable history and status notifications.
          initData: initData ?? undefined,
        },
        getStoreSlugClient()
      );
      checkout.remember();
      // Remember the order id so the customer can track its status later.
      saveOrderId(result.id);
      // Remove the ordered items from the cart, keep the rest.
      setItems((prev) => {
        const remaining = prev.filter((i) => !i.selected);
        persistItems(remaining);
        return remaining;
      });
      setPlacedOrder(result);
    } catch (err) {
      setOrderError(storeErrorMessage(err, t, t("cart.orderError")));
    } finally {
      setPlacing(false);
      setTopLoading(false);
    }
  }, [
    items,
    fulfillment,
    phone,
    phoneValid,
    customerName,
    note,
    checkout,
    locale,
    initData,
    setTopLoading,
    t,
  ]);

  const currency = t("common.currency");
  const qtyLabels = {
    decrease: t("cart.decrease"),
    increase: t("cart.increase"),
    quantity: t("cart.quantity"),
  };
  const hasItems = !loading && items.length > 0;
  const submitLabel = placing ? t("common.sending") : t("cart.checkout");

  return (
    <AuthDrawerProvider>
      <DesktopHeader />
      <MobileHeader />

      <main className="mx-auto w-full max-w-5xl px-4 pt-4 lg:px-6 lg:pb-16 lg:pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h1
            className={`text-[26px] font-extrabold leading-8 tracking-[-0.02em] text-gray-900 dark:text-white lg:text-[32px] lg:leading-10 ${themedTitle} jurnal:text-[34px] jurnal:lg:text-[44px] jurnal:lg:leading-[48px]`}
          >
            {t("cart.title")}
          </h1>
          {hasItems && (
            <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400">
              {t("cart.productsTotal")
                .replace("{count}", String(items.reduce((sum, i) => sum + i.qty, 0)))
                .replace(/:$/, "")}
            </p>
          )}
        </div>

        {placedOrder && (
          <StatePanel
            className="mt-4"
            titleAs="h2"
            icon={<CheckLineIcon className="h-7 w-7 text-brand-500" strokeWidth={2.4} />}
            title={t("cart.sentForConfirmation")}
            body={
              <>
                {t("cart.sentHint")}
                <span className="mt-3 block text-gray-600 dark:text-gray-300">
                  {t("cart.orderNumber")}:{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    #{placedOrder.id.slice(0, 8).toUpperCase()}
                  </span>
                  {" · "}
                  <Money
                    value={toAmount(placedOrder.payable ?? placedOrder.totalAmount)}
                    currency={currency}
                    className="font-bold text-gray-900 dark:text-white"
                  />
                </span>
                {placedOrder.deliveryType === "delivery" && (
                  <span className="mt-1 block">
                    {t("cart.deliveryFee")}:{" "}
                    {toAmount(placedOrder.deliveryFee) === 0
                      ? t("cart.free")
                      : formatPrice(toAmount(placedOrder.deliveryFee), currency)}
                  </span>
                )}
              </>
            }
            action={
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <Link href="/orders" className={pillPrimary}>
                  {t("cart.viewOrders")}
                </Link>
                <Link href="/" className={`${pillSecondary} h-12`}>
                  {t("cart.continueShopping")}
                </Link>
              </div>
            }
          />
        )}

        {orderError && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-error-50 px-4 py-3 text-[14px] font-semibold leading-5 text-error-700 dark:bg-error-500/10 dark:text-error-400"
          >
            {orderError}
          </p>
        )}

        {loading ? (
          <ul className="mt-5 flex flex-col gap-5" aria-hidden>
            {[0, 1].map((i) => (
              <li key={i} className="flex animate-pulse gap-3">
                <div className="h-[84px] w-[84px] shrink-0 rounded-2xl bg-gray-900/[0.05] dark:bg-white/[0.06]" />
                <div className="flex-1 pt-1">
                  <div className="h-4 w-3/4 rounded bg-gray-900/[0.05] dark:bg-white/[0.06]" />
                  <div className="mt-2 h-4 w-1/3 rounded bg-gray-900/[0.05] dark:bg-white/[0.06]" />
                  <div className="mt-4 h-10 w-28 rounded-full bg-gray-900/[0.05] dark:bg-white/[0.06]" />
                </div>
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          // Right after an order the confirmation above is the whole page.
          !placedOrder && (
            <StatePanel
              className="mt-5"
              icon={<BagIcon className="h-7 w-7" />}
              title={t("cart.empty")}
              body={t("cart.emptyHint")}
              action={
                <Link href="/" className={pillPrimary}>
                  {t("cart.backHome")}
                </Link>
              }
            />
          )
        ) : (
          <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
            <div className="flex min-w-0 flex-col gap-8">
              {/* Lines */}
              <section aria-label={t("cart.title")}>
                {items.length > 1 && (
                  <div className="mb-1 flex min-h-11 items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-3 text-[14px] font-semibold text-gray-700 dark:text-gray-300">
                      <Check checked={allSelected} onToggle={toggleAll} label={t("cart.selectAll")} />
                      <span aria-hidden>{t("cart.selectAll")}</span>
                    </label>
                    {selectedCount > 0 && (
                      <button
                        type="button"
                        onClick={deleteSelected}
                        className="-mr-2 rounded-full px-3 py-2 text-[14px] font-semibold text-gray-500 transition-colors hover:text-error-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-gray-400 dark:hover:text-error-400"
                      >
                        {t("cart.deleteSelected")}
                      </button>
                    )}
                  </div>
                )}
                <ul className="flex flex-col">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-start gap-3 border-b border-gray-900/[0.06] py-4 last:border-b-0 dark:border-white/[0.07]"
                    >
                      <div className="flex h-[84px] items-center">
                        <Check checked={item.selected} onToggle={() => toggleOne(item.key)} label={item.name} />
                      </div>
                      <Link
                        href={`/products/${item.id}`}
                        className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-2xl bg-gray-900/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:bg-white/[0.06]"
                        aria-label={item.name}
                      >
                        {item.image ? (
                          <Image src={item.image} alt="" fill className="object-cover" sizes="84px" unoptimized />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
                            <BoxIcon className="h-7 w-7" />
                          </span>
                        )}
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start gap-1">
                          <Link href={`/products/${item.id}`} className="min-w-0 flex-1 focus-visible:outline-none focus-visible:underline">
                            <h3 className="line-clamp-2 break-words text-[15px] font-semibold leading-5 text-gray-900 dark:text-white">
                              {item.name}
                            </h3>
                            {item.options && (
                              <p className="mt-0.5 break-words text-[13px] font-medium leading-5 text-gray-500 dark:text-gray-400">
                                {choicesText(item.options)}
                              </p>
                            )}
                            {item.missing.length > 0 && (
                              <p className="mt-0.5 break-words text-[13px] font-semibold leading-5 text-warning-700 underline decoration-warning-700/40 underline-offset-2 dark:text-warning-400">
                                {t("productOptions.missing").replace("{name}", item.missing.join(", "))}
                              </p>
                            )}
                            {onOrder.keys.has(item.key) && (
                              <p className="mt-0.5 break-words text-[13px] font-medium leading-5 text-gray-500 dark:text-gray-400">
                                {onOrderLabel(t("preorder.label"), item.leadTime)}
                              </p>
                            )}
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteOne(item.key)}
                            aria-label={`${t("cart.remove")}: ${item.name}`}
                            className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-900/[0.05] hover:text-error-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-gray-500 dark:hover:bg-white/[0.07] dark:hover:text-error-400"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                        {/* Theme fonts run wider than Gilroy: when the sum and the
                            stepper don't fit side by side, the stepper drops below. */}
                        <div className="mt-2 flex items-center justify-between gap-3 jurnal:flex-wrap jurnal:gap-y-2 afisha:flex-wrap afisha:gap-y-2 tungi:flex-wrap tungi:gap-y-2">
                          <Money
                            value={item.price * item.qty}
                            currency={currency}
                            className="text-[17px] font-bold tracking-[-0.01em] text-gray-900 dark:text-white"
                          />
                          <QtyControl value={item.qty} onChange={(q) => setQty(item.key, q)} labels={qtyLabels} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {/* Neutral, not brand-tinted: in a shop whose colour is red or
                    rose a tinted note would read as an error. */}
                {onOrder.inOrder && (
                  <p
                    role="note"
                    className={`mt-1 px-4 py-3 text-[14px] font-medium leading-5 text-gray-600 dark:text-gray-300 ${panel}`}
                  >
                    {t("preorder.cartNote")}
                    {onOrder.lead && <> {t("preorder.cartNoteLead").replace("{lead}", onOrder.lead)}</>}
                  </p>
                )}
              </section>

              {/* Pickup or delivery (and where) */}
              {fulfillment ? (
                <FulfillmentSection model={checkout} />
              ) : fulfillmentFailed ? (
                <section className={`flex items-center justify-between gap-3 px-4 py-3 ${panel}`}>
                  <p className="text-[14px] font-medium text-gray-600 dark:text-gray-300">
                    {t("cart.fulfillmentLoadFailed")}
                  </p>
                  <button type="button" onClick={retryFulfillment} className={`${pillSecondary} h-10 shrink-0 px-4`}>
                    {t("cart.retry")}
                  </button>
                </section>
              ) : (
                <section className="flex animate-pulse flex-col gap-3" aria-hidden>
                  <div className="h-6 w-32 rounded bg-gray-900/[0.05] dark:bg-white/[0.06]" />
                  <div className="h-[60px] w-full rounded-full bg-gray-900/[0.05] dark:bg-white/[0.06]" />
                  <div className="h-16 w-full rounded-3xl bg-gray-900/[0.05] dark:bg-white/[0.06]" />
                </section>
              )}

              {/* Customer info (required for the store to call back) */}
              <section className="flex flex-col gap-3">
                <h2 className={checkoutTitle}>{t("cart.customerInfo")}</h2>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="checkout-phone" className="px-1 text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                      {t("cart.phone")} *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").replace(/^998/, "");
                        setPhone("+998 " + digits.slice(0, 9));
                      }}
                      onBlur={() => setPhoneTouched(true)}
                      aria-invalid={(phoneTouched && !phoneValid) || undefined}
                      aria-describedby={phoneTouched && !phoneValid ? "checkout-phone-error" : undefined}
                      className={`${field(phoneTouched && !phoneValid)} h-[52px] tabular-nums`}
                      placeholder="+998 90 123 45 67"
                    />
                    {phoneTouched && !phoneValid && (
                      <p id="checkout-phone-error" className="px-1 text-[13px] font-semibold text-error-600 dark:text-error-400">
                        {t("cart.phoneRequired")}
                      </p>
                    )}
                    {/* Inside Telegram the number is one tap away — no keyboard. */}
                    {isTelegram && (
                      <button
                        type="button"
                        onClick={useTelegramPhone}
                        disabled={contactPending}
                        className={`${pillSecondary} mt-1 h-10 self-start px-4 disabled:opacity-60`}
                      >
                        {contactPending ? t("common.loading") : t("cart.phoneFromTelegram")}
                      </button>
                    )}
                    {contactFailed && (
                      <p className="px-1 text-[13px] font-medium text-gray-500 dark:text-gray-400">
                        {t("cart.phoneFromTelegramFailed")}
                      </p>
                    )}
                  </div>
                  <input
                    type="text"
                    autoComplete="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    maxLength={255}
                    className={`${field()} h-[52px]`}
                    placeholder={t("cart.namePlaceholder")}
                    aria-label={t("cart.namePlaceholder")}
                  />
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className={`${field()} resize-none py-3`}
                    placeholder={t("cart.notePlaceholder")}
                    aria-label={t("cart.notePlaceholder")}
                  />
                </div>
              </section>
            </div>

            {/* What it comes to; on a wide screen it stays in view. */}
            <aside className="mt-8 flex flex-col gap-4 lg:sticky lg:top-24 lg:mt-0">
              <OrderSummary subtotal={selectedTotals.total} count={selectedTotals.qty} model={checkout} />
              {/* The phone has its own bar for this, above the tab bar. */}
              <div className="hidden lg:block">
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={!canSubmit}
                  className={`${pillPrimary} h-14 w-full text-[16px] disabled:bg-gray-900/[0.08] disabled:text-gray-400 dark:disabled:bg-white/[0.08] dark:disabled:text-gray-500`}
                >
                  {submitLabel}
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Phone: the order button rides above the tab bar, like the cart bar
            does on the other pages. */}
        {hasItems && (
          <>
            <div className="lg:hidden" style={{ height: "calc(var(--nav-total) + 92px)" }} aria-hidden />
            <div
              className="fixed inset-x-0 z-20 bg-gradient-to-t from-white from-70% to-transparent px-4 pb-3 pt-4 dark:from-gray-900 lg:hidden"
              style={{ bottom: "var(--nav-total)" }}
            >
              <button
                type="button"
                onClick={placeOrder}
                disabled={!canSubmit}
                className="flex h-14 w-full items-center justify-between gap-3 rounded-full bg-primary pl-6 pr-5 text-on-primary transition-[background-color,transform] duration-100 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 motion-safe:active:scale-[0.98] jurnal:uppercase jurnal:tracking-[0.12em] afisha:uppercase disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
              >
                <span className="min-w-0 truncate text-[16px] font-bold">{submitLabel}</span>
                <Money
                  value={checkout.payable}
                  currency={currency}
                  className="shrink-0 text-[17px] font-bold tracking-[-0.01em]"
                  suffixClassName="opacity-80"
                />
              </button>
            </div>
          </>
        )}
        {!hasItems && <div className="lg:hidden" style={{ height: "calc(var(--nav-total) + 24px)" }} aria-hidden />}
      </main>

      <MobileNav />
      <DesktopFooter />
    </AuthDrawerProvider>
  );
}
