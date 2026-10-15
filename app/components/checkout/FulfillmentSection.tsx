"use client";

import { formatPrice } from "@/lib/format";
import { canOpenLocationSettings, openLocationSettings } from "@/lib/geolocation";
import { useTranslations } from "@/hooks/useTranslations";
import { PinIcon, StoreIcon, TruckIcon } from "../icons/DeliveryIcons";
import type { CheckoutFulfillment } from "./useCheckoutFulfillment";

const fill = (template: string, params: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? "");

/**
 * "How do you want it": pickup vs delivery, the pickup address, or the
 * delivery address + optional location. When the shop offers one method only
 * there is nothing to choose, so the method is stated instead of asked.
 */
export function FulfillmentSection({ model }: { model: CheckoutFulfillment }) {
  const { t } = useTranslations();
  const { fulfillment: f, type, hasChoice } = model;

  const deliveryCaption = (() => {
    if (!model.deliveryAllowed) {
      return fill(t("cart.deliveryMinShort"), {
        min: formatPrice(f.minDeliveryAmount ?? 0),
      });
    }
    if (f.deliveryFee === 0) return t("cart.free");
    if (f.freeDeliveryFrom !== null) {
      return fill(t("cart.freeFrom"), { amount: formatPrice(f.freeDeliveryFrom) });
    }
    return formatPrice(f.deliveryFee);
  })();

  return (
    <section className="flex flex-col gap-[12px] rounded-[18px] bg-white px-[16px] py-[12px] dark:bg-gray-900">
      <h2 className="text-xl font-semibold text-black dark:text-white/90">
        {t("cart.fulfillmentTitle")}
      </h2>

      {hasChoice ? (
        <div
          role="radiogroup"
          aria-label={t("cart.fulfillmentTitle")}
          className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.06]"
        >
          <MethodOption
            label={t("cart.pickup")}
            caption={t("cart.free")}
            active={type === "pickup"}
            onSelect={() => model.setType("pickup")}
          />
          <MethodOption
            label={t("cart.delivery")}
            caption={deliveryCaption}
            active={type === "delivery"}
            disabled={!model.deliveryAllowed}
            onSelect={() => model.setType("delivery")}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
            {type === "pickup" ? <StoreIcon /> : <TruckIcon />}
          </span>
          <div className="min-w-0">
            <p className="text-md font-semibold text-gray-900 dark:text-white/90">
              {type === "pickup" ? t("cart.pickup") : t("cart.delivery")}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {type === "pickup" ? t("cart.free") : deliveryCaption}
            </p>
          </div>
        </div>
      )}

      {/* Under the minimum: tell the customer what unlocks delivery. The tone
          depends on whether they can still order (pickup) or are stuck. */}
      {f.deliveryEnabled && model.minShortfall > 0 && (
        <p
          className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
            model.blocked
              ? "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
              : "bg-gray-50 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300"
          }`}
        >
          {fill(t("cart.deliveryMin"), {
            min: formatPrice(f.minDeliveryAmount ?? 0),
            amount: formatPrice(model.minShortfall),
          })}
        </p>
      )}

      {type === "pickup" ? <PickupCard model={model} /> : <DeliveryForm model={model} />}
    </section>
  );
}

function MethodOption({
  label,
  caption,
  active,
  disabled,
  onSelect,
}: {
  label: string;
  caption: string;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onSelect}
      className={`flex h-[54px] flex-col items-center justify-center rounded-xl px-2 transition ${
        active
          ? "bg-white text-gray-900 shadow-theme-sm dark:bg-gray-800 dark:text-white/90"
          : disabled
            ? "cursor-not-allowed text-gray-400 dark:text-gray-500"
            : "text-gray-600 hover:text-gray-900 active:scale-[0.98] dark:text-gray-400 dark:hover:text-white/90"
      }`}
    >
      <span className="text-sm font-semibold leading-tight">{label}</span>
      <span
        className={`mt-0.5 text-[11px] font-medium leading-tight ${
          active && !disabled
            ? "text-brand-600 dark:text-brand-400"
            : "text-gray-500 dark:text-gray-500"
        }`}
      >
        {caption}
      </span>
    </button>
  );
}

function PickupCard({ model }: { model: CheckoutFulfillment }) {
  const { t } = useTranslations();
  const { pickupBranchName, pickupAddress } = model.fulfillment;
  const known = pickupBranchName || pickupAddress;

  return (
    <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.04]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
        <StoreIcon />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("cart.pickupAddressTitle")}
        </p>
        {known ? (
          <>
            {pickupBranchName && (
              <p className="mt-0.5 text-md font-semibold text-gray-900 dark:text-white/90">
                {pickupBranchName}
              </p>
            )}
            {pickupAddress && (
              <p className="mt-0.5 text-sm font-medium leading-snug text-gray-600 dark:text-gray-300">
                {pickupAddress}
              </p>
            )}
          </>
        ) : (
          <p className="mt-0.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("cart.pickupNoAddress")}
          </p>
        )}
      </div>
    </div>
  );
}

function DeliveryForm({ model }: { model: CheckoutFulfillment }) {
  const { t } = useTranslations();
  const { location } = model;
  const pending = location.status === "pending";
  const failure =
    location.status === "denied" ||
    location.status === "unsupported" ||
    location.status === "failed"
      ? location.status
      : null;

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex flex-col gap-[6px]">
        <label
          htmlFor="checkout-address"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("cart.deliveryAddress")} *
        </label>
        <textarea
          id="checkout-address"
          value={model.address}
          onChange={(e) => model.setAddress(e.target.value)}
          maxLength={500}
          rows={2}
          autoComplete="street-address"
          aria-invalid={model.addressError || undefined}
          aria-describedby={model.addressError ? "checkout-address-error" : undefined}
          className={`w-full resize-none rounded-[12px] border bg-white px-3 py-2.5 text-md font-medium text-black outline-none placeholder:text-gray-400 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 ${
            model.addressError
              ? "border-red"
              : "border-gray-300 focus:border-brand-500 dark:border-gray-700"
          }`}
          placeholder={t("cart.addressHint")}
        />
        {model.addressError && (
          <p id="checkout-address-error" className="text-sm font-medium text-red">
            {t("cart.addressRequired")}
          </p>
        )}
      </div>

      {location.status === "captured" ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-25 px-3 py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <PinIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
              {t("cart.locationCaptured")}
            </p>
            <p className="text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">
              {location.point.lat.toFixed(5)}, {location.point.lng.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={model.clearLocation}
            className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white/90"
          >
            {t("cart.locationRemove")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-[6px]">
          <button
            type="button"
            onClick={model.requestLocation}
            disabled={pending}
            className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-brand-500 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-brand-400 dark:hover:bg-white/[0.04]"
          >
            <PinIcon className="h-[18px] w-[18px]" />
            {pending ? t("cart.locating") : t("cart.sendLocation")}
          </button>
          {failure ? (
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t(`cart.location_${failure}`)}
              {failure === "denied" && canOpenLocationSettings() && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={openLocationSettings}
                    className="font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {t("cart.openLocationSettings")}
                  </button>
                </>
              )}
            </p>
          ) : (
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {t("cart.locationHelp")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
