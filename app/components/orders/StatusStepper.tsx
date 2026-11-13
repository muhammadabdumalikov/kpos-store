"use client";

import { formatStepTime } from "@/lib/format";
import type { StoreOrderStatus } from "@/lib/store-api";
import { useTranslations } from "@/hooks/useTranslations";
import { CheckIcon, CrossIcon } from "../icons/DeliveryIcons";
import { normalizeStatus, reachedStep, stepTime, stepsFor } from "./order-status";

type StepState = "done" | "current" | "upcoming" | "failedBefore" | "failedAt";

/**
 * Four fixed stages per flow (delivery: sent, assembling, on the way,
 * delivered; pickup: sent, assembling, ready, handed over). Reached steps show
 * when they happened; the current one is ringed; a cancelled order paints the
 * reached steps red with a cross where it stopped. While the shop waits for
 * the goods of an accepted order, the second stage reads "waiting for the
 * product" (see stepsFor).
 */
export function StatusStepper({
  order,
}: {
  order: Pick<
    StoreOrderStatus,
    "status" | "deliveryType" | "timeline" | "createdAt"
  >;
}) {
  const { t, locale } = useTranslations();
  const steps = stepsFor(order);
  const status = normalizeStatus(order.status);
  const cancelled = status === "Cancelled";
  const reached = reachedStep(order);
  const last = steps.length - 1;

  return (
    <ol className="flex w-full items-start">
      {steps.map((step, i) => {
        const state: StepState = cancelled
          ? i < reached
            ? "failedBefore"
            : i === reached
              ? "failedAt"
              : "upcoming"
          : i < reached
            ? "done"
            : i === reached
              ? "current"
              : "upcoming";
        const at = i <= reached ? stepTime(order, step, i) : null;
        const lineReached = i < reached;

        // "Sent" and the terminal step are facts once reached (check); the
        // middle stages are in progress while current (dot).
        const inProgress = state === "current" && i > 0 && i < last;
        const circle = {
          done: "bg-brand-500 text-white",
          current: "bg-brand-500 text-white ring-4 ring-brand-100 dark:ring-brand-500/20",
          upcoming:
            "border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
          failedBefore: "bg-error-500 text-white",
          failedAt: "bg-error-500 text-white",
        }[state];

        const label = {
          done: "text-gray-900 dark:text-white/90",
          current: "text-gray-900 dark:text-white/90",
          upcoming: "text-gray-400 dark:text-gray-500",
          failedBefore: "text-error-600 dark:text-error-400",
          failedAt: "text-error-600 dark:text-error-400",
        }[state];

        return (
          <li
            key={step.status}
            className="relative flex flex-1 flex-col items-center gap-1.5"
            aria-current={state === "current" ? "step" : undefined}
          >
            {i < last && (
              <span
                aria-hidden
                className={`absolute left-1/2 top-[11px] h-0.5 w-full ${
                  lineReached
                    ? cancelled
                      ? "bg-error-300 dark:bg-error-500/50"
                      : "bg-brand-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
            <div
              className={`relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${circle}`}
            >
              {state === "failedAt" ? (
                <CrossIcon />
              ) : inProgress ? (
                <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
              ) : state === "upcoming" ? null : (
                <CheckIcon />
              )}
            </div>
            <span
              className={`px-0.5 text-center text-[11px] font-medium leading-tight ${label}`}
            >
              {t(step.labelKey)}
            </span>
            {at && (
              <span className="-mt-1 text-[10px] font-medium tabular-nums text-gray-400 dark:text-gray-500">
                {formatStepTime(at, order.createdAt, locale)}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
