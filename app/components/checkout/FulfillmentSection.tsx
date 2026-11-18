"use client";

import { formatPrice } from "@/lib/format";
import { canOpenLocationSettings, openLocationSettings } from "@/lib/geolocation";
import { useTranslations } from "@/hooks/useTranslations";
import { PinIcon, StoreIcon, TruckIcon } from "../icons/DeliveryIcons";
import { pillSecondary } from "../StatePanel";
import { checkoutTitle, field, panel } from "./styles";
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
  const price = (value: number) => formatPrice(value, t("common.currency"));

  const deliveryCaption = (() => {
    if (!model.deliveryAllowed) {
      return fill(t("cart.deliveryMinShort"), {
        min: price(f.minDeliveryAmount ?? 0),
      });
    }
    if (f.deliveryFee === 0) return t("cart.free");
    if (f.freeDeliveryFrom !== null) {
      return fill(t("cart.freeFrom"), { amount: price(f.freeDeliveryFrom) });
    }
    return price(f.deliveryFee);
  })();

  return (
    <section className="flex flex-col gap-3">
      <h2 className={checkoutTitle}>{t("cart.fulfillmentTitle")}</h2>

      {hasChoice ? (
        <div
          role="radiogroup"
          aria-label={t("cart.fulfillmentTitle")}
          className="grid grid-cols-2 gap-1 rounded-full bg-gray-900/[0.05] p-1 dark:bg-white/[0.06]"
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
        <div className={`flex items-center gap-3 p-3 ${panel}`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
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
          className={`rounded-2xl px-4 py-3 text-[14px] font-medium leading-5 ${
            model.blocked
              ? "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
              : "bg-gray-900/[0.035] text-gray-600 dark:bg-white/[0.04] dark:text-gray-300"
          }`}
        >
          {fill(t("cart.deliveryMin"), {
            min: price(f.minDeliveryAmount ?? 0),
            amount: price(model.minShortfall),
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
      className={`flex h-[52px] flex-col items-center justify-center rounded-full px-2 transition-[background-color,color,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
        active
          ? "bg-white text-gray-900 ring-1 ring-gray-900/[0.06] dark:bg-gray-800 dark:text-white/90 dark:ring-white/[0.08]"
          : disabled
            ? "cursor-not-allowed text-gray-400 dark:text-gray-500"
            : "text-gray-600 hover:text-gray-900 active:scale-[0.98] dark:text-gray-400 dark:hover:text-white/90"
      }`}
    >
      <span className="text-[14px] font-bold leading-tight">{label}</span>
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
    <div className={`flex items-start gap-3 p-3 ${panel}`}>
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="checkout-address"
          className="px-1 text-[13px] font-semibold text-gray-600 dark:text-gray-300"
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
          className={`${field(model.addressError)} resize-none py-3`}
          placeholder={t("cart.addressHint")}
        />
        {model.addressError && (
          <p id="checkout-address-error" className="px-1 text-[13px] font-semibold text-error-600 dark:text-error-400">
            {t("cart.addressRequired")}
          </p>
        )}
      </div>

      {location.status === "captured" ? (
        <div className={`flex items-center gap-3 p-3 ${panel}`}>
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
            className={`${pillSecondary} w-full disabled:opacity-60`}
          >
            <PinIcon className="h-[18px] w-[18px]" />
            {pending ? t("cart.locating") : t("cart.sendLocation")}
          </button>
          {failure ? (
            <p className="px-1 text-[13px] font-medium text-gray-500 dark:text-gray-400">
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
            <p className="px-1 text-[13px] font-medium text-gray-500 dark:text-gray-400">
              {t("cart.locationHelp")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
