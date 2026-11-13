"use client";

import { useState } from "react";
import { storeErrorMessage } from "@/lib/api-errors";
import { formatDateTime, formatPrice, formatStepTime, toAmount } from "@/lib/format";
import type { StoreOrderStatus } from "@/lib/store-api";
import { useTranslations } from "@/hooks/useTranslations";
import { PhoneIcon, PinIcon, StoreIcon } from "../icons/DeliveryIcons";
import { StatusStepper } from "./StatusStepper";
import {
  cancelReasonKey,
  cancelledAt,
  flowOf,
  normalizeStatus,
  statusBadgeClass,
  statusLabelKey,
  statusNoteKey,
  telHref,
} from "./order-status";

/**
 * One order on the tracking page: header, stepper, the note for the current
 * stage, courier or pickup details when they matter, items, totals and, while
 * the shop has not picked it up yet, the customer's own cancel.
 */
export function OrderCard({
  order,
  onCancel,
  defaultConfirming = false,
}: {
  order: StoreOrderStatus;
  /** Cancels on the server; throws a StoreApiError on failure. */
  onCancel?: (id: string) => Promise<void>;
  /** Preview only: open the inline confirmation straight away. */
  defaultConfirming?: boolean;
}) {
  const { t, locale } = useTranslations();
  // Kept on the card, not the control: when the shop accepted the order in the
  // meantime, the refresh drops `canCancel` and the control with it, but the
  // customer still needs to read why their cancel did not go through.
  const [cancelError, setCancelError] = useState<string | null>(null);
  const flow = flowOf(order);
  const status = normalizeStatus(order.status);
  const isDelivery = flow === "delivery";
  const cancelled = status === "Cancelled";

  const labelKey = statusLabelKey(status, flow);
  const label = t(labelKey);
  const noteKey = statusNoteKey(status, flow);
  const reasonKey = cancelled ? cancelReasonKey(order.cancelReason) : null;
  const byCustomer = order.cancelReason === "customer_cancelled";
  const cancelTime = cancelled ? cancelledAt(order) : null;

  const goods = toAmount(order.totalAmount);
  const fee = toAmount(order.deliveryFee);
  const payable = order.payable !== undefined ? toAmount(order.payable) : goods + fee;

  const showCourier = status === "Delivering" && order.courier?.name;
  const showPickupCard =
    status === "ReadyForPickup" &&
    order.pickup &&
    (order.pickup.branchName || order.pickup.address);
  const pickupLine =
    !isDelivery && !showPickupCard && order.pickup
      ? [order.pickup.branchName, order.pickup.address].filter(Boolean).join(", ")
      : "";

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-5 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white/90">
            {t("orders.order")} #{order.id.slice(0, 8).toUpperCase()}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            {formatDateTime(order.createdAt, locale)}
            {" · "}
            {isDelivery ? t("orders.typeDelivery") : t("orders.typePickup")}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
        >
          {label === labelKey ? order.status : label}
        </span>
      </div>

      <StatusStepper order={order} />

      {cancelled ? (
        <div className="rounded-xl bg-error-50 px-3.5 py-2.5 dark:bg-error-500/10">
          <p className="text-sm font-medium text-error-700 dark:text-error-400">
            {/* Each reason is a full sentence in the customer's words; an
                unknown code falls back to the plain "the shop cancelled". */}
            {reasonKey ? t(reasonKey) : t("orders.cancelledByStoreNote")}
            {!byCustomer && <> {t("orders.cancelledContact")}</>}
          </p>
          {order.cancelNote && (
            <p className="mt-1 text-sm text-error-700/90 dark:text-error-400/90">
              {order.cancelNote}
            </p>
          )}
          {cancelTime && (
            <p className="mt-1 text-xs font-medium tabular-nums text-error-600/80 dark:text-error-400/80">
              {formatStepTime(cancelTime, order.createdAt, locale)}
            </p>
          )}
        </div>
      ) : (
        noteKey && (
          <p className="rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm font-medium text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
            {t(noteKey)}
          </p>
        )
      )}

      {showCourier && order.courier && (
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.04]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {order.courier.name.trim().slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("orders.courier")}
            </p>
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white/90">
              {order.courier.name}
            </p>
          </div>
          {order.courier.phone && (
            <a
              href={telHref(order.courier.phone)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]"
            >
              <PhoneIcon />
              {t("orders.call")}
            </a>
          )}
        </div>
      )}

      {showPickupCard && order.pickup && (
        <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-500 dark:bg-gray-900 dark:text-brand-400">
            <StoreIcon />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
              {t("orders.pickupTitle")}
            </p>
            {order.pickup.branchName && (
              <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white/90">
                {order.pickup.branchName}
              </p>
            )}
            {order.pickup.address && (
              <p className="mt-0.5 text-sm font-medium leading-snug text-gray-700 dark:text-gray-300">
                {order.pickup.address}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {order.items.slice(0, 3).map((item, i) => (
          <div
            key={`${order.id}-${i}`}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="min-w-0 truncate font-medium text-gray-700 dark:text-gray-300">
              {item.quantity} × {item.productName}
              {item.options && item.options.length > 0 && (
                <span className="font-normal text-gray-500 dark:text-gray-400">
                  {" · "}
                  {item.options.map((o) => o.value).join(" · ")}
                </span>
              )}
            </span>
            <span className="shrink-0 font-semibold text-gray-900 dark:text-white/90">
              {formatPrice(toAmount(item.lineTotal))}
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            +{order.items.length - 3}
          </span>
        )}
      </div>

      {(isDelivery && order.deliveryAddress) || pickupLine ? (
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500">
            {isDelivery ? <PinIcon className="h-4 w-4" /> : <StoreIcon className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isDelivery ? t("orders.deliveryAddress") : t("orders.pickupTitle")}
            </p>
            <p className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-200">
              {isDelivery ? order.deliveryAddress : pickupLine}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5 border-t border-dashed border-gray-200 pt-3 dark:border-gray-700">
        {isDelivery ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {t("orders.productsCount").replace("{count}", String(order.itemCount))}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white/90">
                {formatPrice(goods)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {t("orders.deliveryFee")}
              </span>
              {fee === 0 ? (
                <span className="font-semibold text-success-600 dark:text-success-400">
                  {t("orders.free")}
                </span>
              ) : (
                <span className="font-semibold text-gray-900 dark:text-white/90">
                  {formatPrice(fee)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white/90">
                {t("orders.payable")}
              </span>
              <span className="text-base font-bold text-gray-900 dark:text-white/90">
                {formatPrice(payable)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("orders.productsCount").replace("{count}", String(order.itemCount))}
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-white/90">
              {formatPrice(payable)}
            </span>
          </div>
        )}
      </div>

      {order.canCancel && onCancel ? (
        <CancelControl
          orderId={order.id}
          onCancel={onCancel}
          error={cancelError}
          onError={setCancelError}
          defaultConfirming={defaultConfirming}
        />
      ) : cancelError ? (
        <p className="text-sm font-medium text-error-600 dark:text-error-400">{cancelError}</p>
      ) : null}
    </article>
  );
}

function CancelControl({
  orderId,
  onCancel,
  error,
  onError,
  defaultConfirming,
}: {
  orderId: string;
  onCancel: (id: string) => Promise<void>;
  error: string | null;
  onError: (message: string | null) => void;
  defaultConfirming: boolean;
}) {
  const { t } = useTranslations();
  const [confirming, setConfirming] = useState(defaultConfirming);
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    onError(null);
    try {
      await onCancel(orderId);
      // The parent reloads; this card is about to re-render without canCancel.
    } catch (err) {
      onError(storeErrorMessage(err, t, t("orders.cancelFailed")));
    } finally {
      setPending(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="h-11 w-full rounded-xl border border-gray-200 text-sm font-semibold text-error-600 transition hover:bg-error-50 active:scale-[0.98] dark:border-gray-700 dark:text-error-400 dark:hover:bg-error-500/10"
      >
        {t("orders.cancel")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.04]">
      <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
        {t("orders.cancelConfirm")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          className="h-11 rounded-xl bg-error-500 text-sm font-semibold text-white transition hover:bg-error-600 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? t("orders.cancelling") : t("orders.cancelYes")}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onError(null);
          }}
          disabled={pending}
          className="h-11 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-100 active:scale-[0.98] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t("orders.cancelNo")}
        </button>
      </div>
      {error && (
        <p className="text-sm font-medium text-error-600 dark:text-error-400">{error}</p>
      )}
    </div>
  );
}
