"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthDrawerProvider } from "../components/AuthDrawerContext";
import { DesktopFooter } from "../components/DesktopFooter";
import { DesktopHeader } from "../components/DesktopHeader";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNav } from "../components/MobileNav";
import { getSavedOrderIds } from "../../lib/order-store";
import { getStoreSlugClient } from "../../lib/store-slug";
import {
  fetchMyTelegramOrders,
  fetchStoreOrderStatus,
  type StoreOrderStatus,
} from "../../lib/store-api";
import { useTelegram } from "@/context/TelegramContext";
import { useTranslations } from "@/hooks/useTranslations";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("uz-UZ").format(value) + " UZS";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("uz-UZ")} ${d.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 10.5l4 4 8-9"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Sent → Accepted → Handed over progress for one order. Cancelled renders the
 *  reached steps in red with a cross on the last one. */
function StatusStepper({ status }: { status: string }) {
  const { t } = useTranslations();
  const cancelled = status === "Cancelled";
  // How many steps are complete: Pending = 1 (sent), Confirmed = 2, Completed = 3.
  const reached = status === "Completed" ? 3 : status === "Confirmed" ? 2 : 1;
  const steps = [
    t("orders.stepSent"),
    t("orders.stepConfirmed"),
    t("orders.stepDone"),
  ];

  return (
    <ol className="flex w-full items-start">
      {steps.map((label, i) => {
        const done = i < reached && !cancelled;
        const failed = cancelled && i === reached - 1;
        const reachedCancelled = cancelled && i < reached - 1;
        const circle = done || reachedCancelled
          ? "bg-brand-500 text-white"
          : failed
            ? "bg-error-500 text-white"
            : "border-2 border-gray-200 bg-white text-transparent dark:border-gray-700 dark:bg-gray-900";
        const lineDone = i < reached - 1 && !cancelled;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <div
                className={`mx-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${circle} ${
                  i > 0 ? "" : ""
                }`}
              >
                {failed ? <CrossIcon /> : <CheckIcon />}
              </div>
            </div>
            <span
              className={`px-1 text-center text-[11px] font-medium leading-tight ${
                failed
                  ? "text-error-600 dark:text-error-400"
                  : done
                    ? "text-gray-900 dark:text-white/90"
                    : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case "Pending":
      return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400";
    case "Confirmed":
      return "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400";
    case "Completed":
      return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
    case "Cancelled":
      return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  }
}

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

  const statusLabel = (status: string) => {
    const key = `orders.status${status}`;
    const label = t(key);
    return label === key ? status : label;
  };

  const statusNote = (status: string) => {
    switch (status) {
      case "Pending":
        return t("orders.pendingNote");
      case "Confirmed":
        return t("orders.confirmedNote");
      case "Completed":
        return t("orders.completedNote");
      case "Cancelled":
        return t("orders.cancelledNote");
      default:
        return null;
    }
  };

  return (
    <AuthDrawerProvider>
      <DesktopHeader />
      <MobileHeader />

      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-24 pt-[68px] lg:pb-12 lg:pt-8">
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
            <article
              key={order.id}
              className="flex flex-col gap-4 rounded-2xl bg-white p-5 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white/90">
                    {t("orders.order")} #{order.id.slice(0, 8).toUpperCase()}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(order.status)}`}
                >
                  {statusLabel(order.status)}
                </span>
              </div>

              <StatusStepper status={order.status} />

              {statusNote(order.status) && (
                <p
                  className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                    order.status === "Cancelled"
                      ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                      : "bg-gray-50 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300"
                  }`}
                >
                  {statusNote(order.status)}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                {order.items.slice(0, 3).map((item, i) => (
                  <div
                    key={`${order.id}-${i}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium text-gray-700 dark:text-gray-300">
                      {item.quantity} × {item.productName}
                    </span>
                    <span className="shrink-0 font-semibold text-gray-900 dark:text-white/90">
                      {formatPrice(Math.round(Number(item.lineTotal)))}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    +{order.items.length - 3}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("orders.productsCount").replace(
                    "{count}",
                    String(order.itemCount)
                  )}
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white/90">
                  {formatPrice(Math.round(Number(order.totalAmount)))}
                </span>
              </div>
            </article>
          ))
        )}
      </main>

      <MobileNav />
      <DesktopFooter />
    </AuthDrawerProvider>
  );
}
