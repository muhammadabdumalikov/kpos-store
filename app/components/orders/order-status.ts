import type { DeliveryType, StoreOrderStatus } from "@/lib/store-api";

export interface FlowStep {
  status: string;
  labelKey: string;
}

/** The customer-facing stages of each flow (YETKAZISH.md 2). */
export const FLOW_STEPS: Record<DeliveryType, FlowStep[]> = {
  delivery: [
    { status: "Pending", labelKey: "orders.stepSent" },
    { status: "Assembling", labelKey: "orders.stepAssembling" },
    { status: "Delivering", labelKey: "orders.stepOnTheWay" },
    { status: "Completed", labelKey: "orders.stepDelivered" },
  ],
  pickup: [
    { status: "Pending", labelKey: "orders.stepSent" },
    { status: "Assembling", labelKey: "orders.stepAssembling" },
    { status: "ReadyForPickup", labelKey: "orders.stepReady" },
    { status: "Completed", labelKey: "orders.stepHandedOver" },
  ],
};

/** Orders older than the delivery module carry no type; they were collected at the shop. */
export function flowOf(order: Pick<StoreOrderStatus, "deliveryType">): DeliveryType {
  return order.deliveryType === "delivery" ? "delivery" : "pickup";
}

/** `Confirmed` is the pre-migration name of Assembling; map it so an order
 *  read from a stale cache still renders on the right step. */
export function normalizeStatus(status: string): string {
  return status === "Confirmed" ? "Assembling" : status;
}

/** Index of the furthest step the order reached, or -1 when the status is
 *  not part of this flow (unknown codes render as "sent"). For cancelled
 *  orders the timeline says where it stopped. */
export function reachedStep(
  order: Pick<StoreOrderStatus, "status" | "deliveryType" | "timeline">
): number {
  const steps = FLOW_STEPS[flowOf(order)];
  const status = normalizeStatus(order.status);
  if (status !== "Cancelled") {
    const idx = steps.findIndex((s) => s.status === status);
    return idx === -1 ? 0 : idx;
  }
  let last = 0;
  for (const event of order.timeline ?? []) {
    const idx = steps.findIndex((s) => s.status === normalizeStatus(event.status));
    if (idx > last) last = idx;
  }
  return last;
}

/** When the order entered a given step, from the timeline. The first step is
 *  the placement itself, so createdAt stands in when no event was written. */
export function stepTime(
  order: Pick<StoreOrderStatus, "timeline" | "createdAt">,
  step: FlowStep,
  index: number
): string | null {
  const hit = (order.timeline ?? []).find(
    (e) => normalizeStatus(e.status) === step.status
  );
  if (hit) return hit.at;
  return index === 0 ? order.createdAt : null;
}

export function cancelledAt(order: Pick<StoreOrderStatus, "timeline">): string | null {
  const events = order.timeline ?? [];
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].status === "Cancelled") return events[i].at;
  }
  return null;
}

export function statusLabelKey(status: string, flow: DeliveryType): string {
  const s = normalizeStatus(status);
  if (s === "Completed") {
    return flow === "delivery"
      ? "orders.statusCompletedDelivery"
      : "orders.statusCompletedPickup";
  }
  return `orders.status${s}`;
}

export function statusNoteKey(status: string, flow: DeliveryType): string | null {
  switch (normalizeStatus(status)) {
    case "Pending":
      return "orders.pendingNote";
    case "Assembling":
      return "orders.assemblingNote";
    case "Delivering":
      return "orders.deliveringNote";
    case "ReadyForPickup":
      return "orders.readyNote";
    case "Completed":
      return flow === "delivery"
        ? "orders.completedDeliveryNote"
        : "orders.completedPickupNote";
    default:
      return null;
  }
}

export function statusBadgeClass(status: string): string {
  switch (normalizeStatus(status)) {
    case "Pending":
      return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400";
    case "Assembling":
    case "Delivering":
    case "ReadyForPickup":
      return "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400";
    case "Completed":
      return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
    case "Cancelled":
      return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  }
}

const CANCEL_REASONS = new Set([
  "customer_refused",
  "no_answer",
  "out_of_stock",
  "customer_cancelled",
  "other",
]);

export function cancelReasonKey(reason: string | null | undefined): string | null {
  if (!reason || !CANCEL_REASONS.has(reason)) return null;
  return `orders.cancelReasons.${reason}`;
}

/** Strip formatting so the dialer gets a clean number. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
