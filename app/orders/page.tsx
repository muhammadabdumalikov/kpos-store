"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthDrawerProvider } from "../components/AuthDrawerContext";
import { DesktopFooter } from "../components/DesktopFooter";
import { DesktopHeader } from "../components/DesktopHeader";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNav } from "../components/MobileNav";
import { OrderCard } from "../components/orders/OrderCard";
import { getSavedOrderIds } from "../../lib/order-store";
import { getStoreSlugClient } from "../../lib/store-slug";
import {
  cancelStoreOrder,
  fetchMyTelegramOrders,
  fetchStoreOrderStatus,
  StoreApiError,
  type StoreOrderStatus,
} from "../../lib/store-api";
import { useTelegram } from "@/context/TelegramContext";
import { useTranslations } from "@/hooks/useTranslations";

export default function OrdersPage() {
  const { t } = useTranslations();
  const { probed, initData } = useTelegram();
  const [orders, setOrders] = useState<StoreOrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent: boolean) => {
      if (!silent) setRefreshing(true);
      const slug = getStoreSlugClient();
      try {
        // In the mini app the Telegram user id is the key, so history survives
        // a cleared webview and follows the customer across devices. The ids in
        // localStorage still count: they cover orders placed in the browser, or
        // before the launch payload could be verified.
        const [remote, local] = await Promise.all([
          initData ? fetchMyTelegramOrders(initData, slug) : null,
          Promise.all(
            getSavedOrderIds().map((id) =>
              fetchStoreOrderStatus(id, slug).catch(() => null)
            )
          ),
        ]);

        const merged = new Map<string, StoreOrderStatus>();
        for (const order of [
          ...(remote ?? []),
          ...local.filter((o): o is StoreOrderStatus => o !== null),
        ]) {
          merged.set(order.id, order);
        }
        setOrders(
          [...merged.values()].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [initData]
  );

  useEffect(() => {
    // Wait for the Telegram probe so the first load can already use initData
    // (otherwise a mini-app user briefly sees only their localStorage orders).
    if (!probed) return;
    load(true);
    // Statuses change on the POS side; refresh quietly while the page is open.
    const id = setInterval(() => load(true), 30_000);
    return () => clearInterval(id);
  }, [load, probed]);

  const cancelOrder = useCallback(
    async (id: string) => {
      try {
        await cancelStoreOrder(id, getStoreSlugClient(), initData);
      } catch (err) {
        // The shop may have picked the order up in the meantime: pull the real
        // state so the card stops offering cancel, then let it show the message.
        if (err instanceof StoreApiError && err.code === "STORE_ORDER_NOT_CANCELLABLE") {
          void load(true);
        }
        throw err;
      }
      await load(true);
    },
    [initData, load]
  );

  return (
    <AuthDrawerProvider>
      <DesktopHeader />
      <MobileHeader />

      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-[calc(var(--nav-total)_+_24px)] pt-[68px] lg:pb-12 lg:pt-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white/90 lg:text-2xl">
            {t("orders.title")}
          </h1>
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => load(false)}
              disabled={refreshing}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-gray-600 shadow-theme-xs transition hover:text-gray-900 disabled:opacity-60 dark:bg-gray-900 dark:text-gray-400 dark:shadow-none dark:hover:text-white/90"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M5 14a7.5 7.5 0 0013.4 3M19 10A7.5 7.5 0 005.6 7" />
              </svg>
              {t("orders.refresh")}
            </button>
          )}
        </div>

        {loading ? (
          // Skeletons matching the order-card shape.
          <div className="flex flex-col gap-3" aria-hidden>
            {[0, 1].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white p-5 dark:bg-gray-900"
              >
                <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="mt-4 h-6 w-full rounded bg-gray-100 dark:bg-gray-800" />
                <div className="mt-3 h-4 w-28 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <section className="flex flex-col items-center gap-2 rounded-2xl bg-white px-6 py-14 text-center dark:bg-gray-900">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 4h14a1 1 0 011 1v16l-3-2-2 2-3-2-3 2-2-2-3 2V5a1 1 0 011-1z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
              {t("orders.empty")}
            </h2>
            <p className="max-w-[34ch] text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("orders.emptyHint")}
            </p>
            <Link
              href="/catalog"
              className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]"
            >
              {t("orders.goCatalog")}
            </Link>
          </section>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} onCancel={cancelOrder} />
          ))
        )}
      </main>

      <MobileNav />
      <DesktopFooter />
    </AuthDrawerProvider>
  );
}
