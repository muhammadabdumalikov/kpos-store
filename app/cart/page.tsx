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

function Checkbox({
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
      onClick={onToggle}
      className="relative flex h-[20px] w-[20px] items-center justify-center focus:outline-none"
      aria-label={label}
    >
      {checked ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-success-500"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 0H4C1.79086 0 0 1.79086 0 4V16C0 18.2091 1.79086 20 4 20H16C18.2091 20 20 18.2091 20 16V4C20 1.79086 18.2091 0 16 0ZM14.592 7.46049C14.8463 7.13353 14.7874 6.66232 14.4605 6.40802C14.1335 6.15372 13.6623 6.21262 13.408 6.53958L9.40099 11.6914C9.31189 11.806 9.14429 11.8209 9.03641 11.7238L6.50173 9.44256C6.19385 9.16547 5.71963 9.19043 5.44254 9.49831C5.16544 9.80619 5.1904 10.2804 5.49828 10.5575L8.03296 12.8387C8.78809 13.5183 9.9613 13.4143 10.585 12.6123L14.592 7.46049Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <span
          className="h-[20px] w-[20px] rounded-[4px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          aria-hidden
        />
      )}
    </button>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="36" height="36" rx="10" fill="#F1F3F4" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.0343 11.3877C20.0891 11.5742 19.2838 12.1394 18.7813 12.6238C18.3514 13.0382 17.6597 13.0382 17.2298 12.6238C16.7274 12.1394 15.922 11.5742 14.9769 11.3877C14.0695 11.2087 12.9706 11.364 11.7844 12.4225L11.7738 12.4318C10.9619 13.1241 10.1612 14.6496 10.3112 16.4815L10.3117 16.4881C10.3936 17.6364 11.0105 18.9332 12.1767 20.3059C13.3375 21.6724 15.0044 23.0684 17.0939 24.408C17.6495 24.7643 18.3617 24.7643 18.9172 24.408C21.0058 23.0685 22.6704 21.6726 23.8292 20.3063C24.9932 18.9337 25.6088 17.6368 25.6907 16.4881L25.6912 16.4815C25.8414 14.6474 25.0476 13.1227 24.2373 12.4318L24.2267 12.4225C23.0405 11.364 21.9417 11.2087 21.0343 11.3877ZM25.0538 11.4853C23.5821 10.1745 22.0892 9.90552 20.7923 10.1614C19.5933 10.3979 18.6188 11.07 18.0056 11.6372C17.3923 11.07 16.4178 10.3979 15.2188 10.1614C13.9219 9.90553 12.429 10.1745 10.9573 11.4853C9.83405 12.4467 8.8847 14.364 9.06508 16.5803C9.17399 18.0941 9.9666 19.635 11.224 21.1152C12.4878 22.6028 14.2601 24.076 16.4192 25.4603C17.3859 26.0801 18.6252 26.0802 19.592 25.4602C21.7506 24.0758 23.5208 22.6025 24.7825 21.1148C26.0381 19.6343 26.8284 18.0936 26.9373 16.5803C27.1175 14.3663 26.1787 12.4481 25.0538 11.4853Z"
        fill={active ? "#f04438" : "#80868B"}
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="36" height="36" rx="10" fill="#F1F3F4" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.2502 10.75C15.2502 9.23122 16.4814 8 18.0002 8C19.519 8 20.7502 9.23122 20.7502 10.75V10.9157C23.1352 11.2059 25.3632 11.868 27.3287 12.8258C27.7011 13.0073 27.8558 13.4562 27.6744 13.8286C27.4929 14.2009 27.044 14.3557 26.6716 14.1742C24.18 12.96 21.2044 12.25 18.0002 12.25C14.7959 12.25 11.8204 12.96 9.32872 14.1742C8.95637 14.3557 8.50742 14.2009 8.32597 13.8286C8.14451 13.4562 8.29926 13.0073 8.67162 12.8258C10.6371 11.868 12.8652 11.2059 15.2502 10.9156V10.75ZM24.2656 24.283C24.1161 26.3763 22.3743 27.998 20.2757 27.998H15.7247C13.6261 27.998 11.8844 26.3763 11.7349 24.283L11.0466 14.6479C13.164 13.9096 15.5189 13.498 18.0002 13.498C20.4815 13.498 22.8365 13.9096 24.9538 14.6479L24.2656 24.283ZM16.7502 16.998C16.7502 16.5838 16.4144 16.248 16.0002 16.248C15.586 16.248 15.2502 16.5838 15.2502 16.998V22.998C15.2502 23.4123 15.586 23.748 16.0002 23.748C16.4144 23.748 16.7502 23.4123 16.7502 22.998V16.998ZM20.0002 16.248C20.4144 16.248 20.7502 16.5838 20.7502 16.998V22.998C20.7502 23.4123 20.4144 23.748 20.0002 23.748C19.586 23.748 19.2502 23.4123 19.2502 22.998V16.998C19.2502 16.5838 19.586 16.248 20.0002 16.248Z"
        fill="#80868B"
      />
    </svg>
  );
}

function QtyControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="bg-gray60 flex min-w-[132px] items-center justify-between rounded-[10px] p-[4px]">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[10px] bg-white dark:bg-gray-900"
        aria-label="Kamaytirish"
      >
        <svg width="14" height="2" viewBox="0 0 14 2" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.75 1C13.75 1.41421 13.4142 1.75 13 1.75L1 1.75C0.585786 1.75 0.25 1.41421 0.25 1C0.25 0.585786 0.585786 0.25 1 0.25L13 0.25C13.4142 0.25 13.75 0.585786 13.75 1Z"
            fill="var(--color-brand-500)"
          />
        </svg>
      </button>
      <div className="w-[50px]">
        <input
          type="tel"
          value={String(value)}
          onChange={(e) => {
            const next = Number.parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
            if (Number.isFinite(next)) onChange(Math.max(1, next));
          }}
          className="bg-gray10 h-[30px] w-full rounded-[12px] p-0 text-center text-md font-medium text-black dark:text-white/90 outline-transparent"
          inputMode="numeric"
          aria-label="Soni"
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[10px] bg-white dark:bg-gray-900"
        aria-label="Ko‘paytirish"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.75 1C7.75 0.585786 7.41421 0.25 7 0.25C6.58579 0.25 6.25 0.585786 6.25 1V6.25H1C0.585786 6.25 0.25 6.58579 0.25 7C0.25 7.41421 0.585786 7.75 1 7.75H6.25V13C6.25 13.4142 6.58579 13.75 7 13.75C7.41421 13.75 7.75 13.4142 7.75 13V7.75H13C13.4142 7.75 13.75 7.41421 13.75 7C13.75 6.58579 13.4142 6.25 13 6.25H7.75V1Z"
            fill="var(--color-brand-500)"
          />
        </svg>
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

  return (
    <AuthDrawerProvider>
      {/* Stage 3 restyles this page; until then it keeps the old grey ground
          its white cards were drawn against (the body is white now). */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DesktopHeader />
      <MobileHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-[6px] pb-24 lg:pb-8 lg:pt-4">
        {placedOrder && (
          <section className="mx-[8px] flex flex-col items-center gap-[10px] rounded-2xl bg-white dark:bg-gray-900 px-[16px] py-[28px] text-center">
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-brand-500" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth={1.8} d="M6 12L3.27 3.96a.6.6 0 01.83-.73l16.5 8.23a.6.6 0 010 1.08L4.1 20.77a.6.6 0 01-.83-.73L6 12zm0 0h8" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-black dark:text-white/90">{t("cart.sentForConfirmation")}</h2>
            <p className="max-w-[36ch] text-md font-medium text-gray-500 dark:text-gray-400">
              {t("cart.sentHint")}
            </p>
            <p className="text-md font-medium text-gray-500 dark:text-gray-400">
              {t("cart.orderNumber")}:{" "}
              <span className="font-semibold text-black dark:text-white/90">#{placedOrder.id.slice(0, 8).toUpperCase()}</span>
              {" · "}
              <span className="font-semibold text-black dark:text-white/90">
                {formatPrice(toAmount(placedOrder.payable ?? placedOrder.totalAmount))}
              </span>
            </p>
            {placedOrder.deliveryType === "delivery" && (
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t("cart.deliveryFee")}:{" "}
                {toAmount(placedOrder.deliveryFee) === 0
                  ? t("cart.free")
                  : formatPrice(toAmount(placedOrder.deliveryFee))}
              </p>
            )}
            <div className="mt-2 flex w-full max-w-sm flex-col gap-2">
              <Link
                href="/orders"
                className="inline-flex h-[44px] items-center justify-center rounded-xl bg-brand-500 px-5 text-md font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]"
              >
                {t("cart.viewOrders")}
              </Link>
              <Link
                href="/"
                className="inline-flex h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-md font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t("cart.continueShopping")}
              </Link>
            </div>
          </section>
        )}

        {orderError && (
          <div className="mx-[8px] rounded-[14px] border border-red/30 bg-red/10 px-[16px] py-[12px] text-center text-md font-medium text-red">
            {orderError}
          </div>
        )}

        {/* Title + actions */}
        <div className="flex flex-col gap-[12px] rounded-b-[18px] bg-white dark:bg-gray-900 px-[16px] pb-[16px] pt-[16px] text-center">
          <h1 className="text-xl font-semibold text-black dark:text-white/90">{t("cart.title")}</h1>
          <div className="border-gray20 flex items-center justify-between border-t pt-[12px]">
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm font-medium text-red disabled:opacity-50"
              disabled={selectedCount === 0}
              onClick={deleteSelected}
            >
              {t("cart.deleteSelected")}
            </button>
            <div className="flex items-center gap-2">
              <Checkbox checked={allSelected} onToggle={toggleAll} label={t("cart.selectAll")} />
              <h6 className="text-sm font-medium text-black dark:text-white/90">{t("cart.selectAll")}</h6>
            </div>
          </div>
        </div>

        {loading ? (
          <section className="flex items-center justify-center rounded-[18px] bg-white dark:bg-gray-900 px-[16px] py-[20px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-700 border-t-primary" aria-hidden />
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-[18px] bg-white dark:bg-gray-900 px-[16px] py-[20px] text-center">
            <h2 className="text-lg font-semibold text-black dark:text-white/90">{t("cart.empty")}</h2>
            <p className="mt-2 text-md font-medium text-gray-500 dark:text-gray-400">
              {t("cart.emptyHint")}
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-brand-500 px-5 text-md font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]"
            >
              {t("cart.backHome")}
            </Link>
          </section>
        ) : (
          <>
            {/* Items */}
            <section className="rounded-[18px] bg-white dark:bg-gray-900 px-[16px] py-[12px]">
              <ul className="flex flex-col gap-[24px]">
                {items.map((item) => (
                  <li key={item.key} className="border-b border-gray-100 last:border-b-0">
                    <div className="flex flex-col gap-[11px] pb-[24px]">
                      <div className="flex justify-between gap-[50px]">
                        <Link href={`/products/${item.id}`} className="flex grow cursor-pointer gap-[12px]">
                          <div className="relative h-[64px] w-[48px] shrink-0 overflow-hidden rounded-[12px]">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                {item.name.slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <div className="w-full min-w-0">
                            <h5 className="mb-[6px] mt-[2px] text-lg font-bold text-black dark:text-white/90">
                              {formatPrice(item.price * item.qty)}
                            </h5>
                            <h3 className="text-md font-medium text-black10 line-clamp-2">{item.name}</h3>
                            {item.options && (
                              <p className="mt-[4px] break-words text-sm font-medium text-gray-500 dark:text-gray-400">
                                {choicesText(item.options)}
                              </p>
                            )}
                            {item.missing.length > 0 && (
                              <p className="mt-[4px] break-words text-sm font-semibold text-warning-700 underline decoration-warning-700/40 underline-offset-2 dark:text-warning-400">
                                {t("productOptions.missing").replace("{name}", item.missing.join(", "))}
                              </p>
                            )}
                            {onOrder.keys.has(item.key) && (
                              <p className="mt-[4px] flex min-w-0 items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                <span className="min-w-0 break-words">
                                  {onOrderLabel(t("preorder.label"), item.leadTime)}
                                </span>
                              </p>
                            )}
                          </div>
                        </Link>
                        <div className="pt-[2px]">
                          <Checkbox
                            checked={item.selected}
                            onToggle={() => toggleOne(item.key)}
                            label={`${item.name} ni tanlash`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-[8px]">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center"
                            aria-label="Sevimlilarga qo‘shish"
                          >
                            <IconHeart active={false} />
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center"
                            aria-label={t("cart.remove")}
                            onClick={() => deleteOne(item.key)}
                          >
                            <IconTrash />
                          </button>
                        </div>
                        <QtyControl value={item.qty} onChange={(q) => setQty(item.key, q)} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {onOrder.inOrder && (
                <p
                  role="note"
                  className="mb-[4px] rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
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
              <section className="flex items-center justify-between gap-3 rounded-[18px] bg-white px-[16px] py-[14px] dark:bg-gray-900">
                <p className="text-md font-medium text-gray-600 dark:text-gray-300">
                  {t("cart.fulfillmentLoadFailed")}
                </p>
                <button
                  type="button"
                  onClick={retryFulfillment}
                  className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand-500 transition hover:text-brand-600 dark:text-brand-400"
                >
                  {t("cart.retry")}
                </button>
              </section>
            ) : (
              <section
                className="flex animate-pulse flex-col gap-3 rounded-[18px] bg-white px-[16px] py-[12px] dark:bg-gray-900"
                aria-hidden
              >
                <div className="h-6 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-[62px] w-full rounded-2xl bg-gray-100 dark:bg-gray-800" />
                <div className="h-16 w-full rounded-xl bg-gray-100 dark:bg-gray-800" />
              </section>
            )}

            {/* Customer info (required for the store to call back) */}
            <section className="flex flex-col gap-[12px] rounded-[18px] bg-white dark:bg-gray-900 px-[16px] py-[12px]">
              <h2 className="text-xl font-semibold text-black dark:text-white/90">{t("cart.customerInfo")}</h2>
              <div className="flex flex-col gap-[10px]">
                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="checkout-phone" className="text-sm font-medium text-gray90">
                    {t("cart.phone")} *
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").replace(/^998/, "");
                      setPhone("+998 " + digits.slice(0, 9));
                    }}
                    onBlur={() => setPhoneTouched(true)}
                    className={`h-[44px] w-full rounded-[12px] border bg-white px-3 text-md font-medium text-black outline-none dark:bg-gray-900 dark:text-white/90 ${
                      phoneTouched && !phoneValid
                        ? "border-red"
                        : "border-gray-300 dark:border-gray-700 focus:border-brand-500"
                    }`}
                    placeholder="+998 90 123 45 67"
                  />
                  {phoneTouched && !phoneValid && (
                    <p className="text-sm font-medium text-red">{t("cart.phoneRequired")}</p>
                  )}
                  {/* Inside Telegram the number is one tap away — no keyboard. */}
                  {isTelegram && (
                    <button
                      type="button"
                      onClick={useTelegramPhone}
                      disabled={contactPending}
                      className="self-start rounded-lg px-1 py-0.5 text-sm font-semibold text-brand-500 transition hover:text-brand-600 disabled:opacity-60"
                    >
                      {contactPending
                        ? t("common.loading")
                        : t("cart.phoneFromTelegram")}
                    </button>
                  )}
                  {contactFailed && (
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t("cart.phoneFromTelegramFailed")}
                    </p>
                  )}
                </div>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={255}
                  className="h-[44px] w-full rounded-[12px] border border-gray-300 bg-white px-3 text-md font-medium text-black outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder={t("cart.namePlaceholder")}
                  aria-label={t("cart.namePlaceholder")}
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full resize-none rounded-[12px] border border-gray-300 bg-white px-3 py-2 text-md font-medium text-black outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder={t("cart.notePlaceholder")}
                  aria-label={t("cart.notePlaceholder")}
                />
              </div>
            </section>

            {/* Order summary */}
            <div className="flex w-full flex-col gap-[16px]">
              <OrderSummary
                subtotal={selectedTotals.total}
                count={selectedTotals.qty}
                model={checkout}
              />

              <div className="hidden w-full lg:flex">
                <button
                  type="button"
                  onClick={placeOrder}
                  className="h-[56px] w-full rounded-[16px] bg-brand-500 text-md font-semibold text-white hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-500 dark:text-gray-400"
                  disabled={!canSubmit}
                >
                  {placing ? t("common.sending") : t("cart.checkout")}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Mobile sticky checkout bar */}
        <div
          className="fixed left-0 right-0 z-20 w-full border-t border-gray60 bg-gray50/95 backdrop-blur-[20px] lg:hidden"
          style={{ bottom: "var(--nav-total)" }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-[16px] py-[10px]">
            <div className="flex flex-col gap-[2px]">
              <h3 className="text-lg font-bold text-black dark:text-white/90">{formatPrice(checkout.payable)}</h3>
              <h4 className="text-md font-medium text-gray-500 dark:text-gray-400">
                {t("cart.productsTotal").replace("{count}", String(selectedTotals.qty)).replace(/:$/, "")}
                {checkout.type === "delivery" && checkout.fee > 0 && (
                  <> + {t("cart.deliveryFee").toLocaleLowerCase()}</>
                )}
              </h4>
            </div>
            <button
              type="button"
              onClick={placeOrder}
              className="h-[36px] rounded-lg bg-brand-500 px-4 text-md font-semibold text-white hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-500"
              disabled={!canSubmit}
            >
              {placing ? t("common.sending") : t("cart.checkout")}
            </button>
          </div>
        </div>

        {/* Spacer: the nav (plus its inset) and the checkout bar above it. */}
        <div
          className="lg:hidden"
          style={{ minHeight: "calc(var(--nav-total) + 56px)" }}
        />
      </main>

      <MobileNav />
      <DesktopFooter />
      </div>
    </AuthDrawerProvider>
  );
}

