"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  EMPTY_DELIVERY_PREFS,
  getDeliveryPrefs,
  getServerDeliveryPrefs,
  saveDeliveryPrefs,
  subscribeDeliveryPrefs,
} from "@/lib/delivery-prefs";
import {
  deliveryAllowed,
  deliveryFeeFor,
  freeDeliveryShortfall,
  minDeliveryShortfall,
  pickDefaultType,
} from "@/lib/fulfillment";
import {
  captureLocation,
  type GeoPoint,
  type LocationFailure,
} from "@/lib/geolocation";
import type {
  CreateStoreOrderInput,
  DeliveryType,
  StoreFulfillment,
} from "@/lib/store-api";

export type LocationState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "captured"; point: GeoPoint }
  | { status: LocationFailure };

export interface CheckoutFulfillmentOptions {
  /** Lab/preview: start from these instead of localStorage and never persist. */
  seed?: {
    type?: DeliveryType;
    address?: string;
    location?: GeoPoint;
  };
}

export interface CheckoutFulfillment {
  fulfillment: StoreFulfillment;
  /** Both methods offered: render the choice. */
  hasChoice: boolean;
  type: DeliveryType;
  setType: (type: DeliveryType) => void;
  deliveryAllowed: boolean;
  /** Delivery is the only method and the basket is under its minimum. */
  blocked: boolean;
  address: string;
  setAddress: (value: string) => void;
  addressError: boolean;
  location: LocationState;
  requestLocation: () => void;
  clearLocation: () => void;
  fee: number;
  payable: number;
  freeShortfall: number;
  minShortfall: number;
  /** Marks fields touched; true when the order can be sent. */
  validate: () => boolean;
  /** The delivery part of the POST /store/orders body. */
  payload: () => Pick<CreateStoreOrderInput, "deliveryType" | "address" | "lat" | "lng">;
  /** Persist the choice, address and location for the next order. */
  remember: () => void;
}

const IDLE: LocationState = { status: "idle" };

/**
 * Checkout-side state for pickup vs delivery. Pure of network: the caller
 * hands in the store's fulfillment settings and the selected subtotal, the
 * hook owns the method, address and location, and derives fee and payable
 * with the same rule the server applies.
 *
 * Fields the customer has not touched fall back to what they chose last time
 * (localStorage), so the prefill needs no effect and survives hydration.
 */
export function useCheckoutFulfillment(
  fulfillment: StoreFulfillment,
  subtotal: number,
  options?: CheckoutFulfillmentOptions
): CheckoutFulfillment {
  const seed = options?.seed;
  const persist = !seed;

  const stored = useSyncExternalStore(
    subscribeDeliveryPrefs,
    getDeliveryPrefs,
    getServerDeliveryPrefs
  );
  const prefs = persist ? stored : EMPTY_DELIVERY_PREFS;

  // `null` = untouched this session; the saved preference (or the shop's
  // default) applies until the customer changes it.
  const [chosen, setChosen] = useState<DeliveryType | null>(seed?.type ?? null);
  const [typedAddress, setTypedAddress] = useState<string | null>(seed?.address ?? null);
  const [ownLocation, setOwnLocation] = useState<LocationState | null>(
    seed?.location ? { status: "captured", point: seed.location } : null
  );
  const [addressTouched, setAddressTouched] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const address = typedAddress ?? prefs.address ?? "";
  const location = useMemo<LocationState>(
    () =>
      ownLocation ??
      (prefs.lat !== undefined && prefs.lng !== undefined
        ? { status: "captured", point: { lat: prefs.lat, lng: prefs.lng } }
        : IDLE),
    [ownLocation, prefs.lat, prefs.lng]
  );

  // Derived on every render so a basket edit that crosses the minimum moves
  // the customer back to pickup (and forward again) without extra state.
  const type = pickDefaultType(fulfillment, subtotal, chosen ?? prefs.type ?? null);
  const allowed = deliveryAllowed(fulfillment, subtotal);
  const hasChoice = fulfillment.pickupEnabled && fulfillment.deliveryEnabled;
  const blocked = !fulfillment.pickupEnabled && !allowed;
  const isDelivery = type === "delivery";

  const fee = isDelivery ? deliveryFeeFor(fulfillment, subtotal) : 0;
  const payable = subtotal + fee;
  const freeShortfall = isDelivery ? freeDeliveryShortfall(fulfillment, subtotal) : 0;
  const minShortfall = minDeliveryShortfall(fulfillment, subtotal);
  const addressError = isDelivery && addressTouched && address.trim().length === 0;

  const setType = useCallback(
    (next: DeliveryType) => {
      if (next === "delivery" && !allowed) return;
      if (next === "pickup" && !fulfillment.pickupEnabled) return;
      setChosen(next);
    },
    [allowed, fulfillment.pickupEnabled]
  );

  const setAddress = useCallback((value: string) => setTypedAddress(value), []);

  const requestLocation = useCallback(() => {
    setOwnLocation({ status: "pending" });
    captureLocation().then((result) => {
      if (!mounted.current) return;
      setOwnLocation(
        result.ok
          ? { status: "captured", point: { lat: result.lat, lng: result.lng } }
          : { status: result.reason }
      );
    });
  }, []);

  const clearLocation = useCallback(() => setOwnLocation(IDLE), []);

  const validate = useCallback(() => {
    if (blocked) return false;
    if (isDelivery) {
      setAddressTouched(true);
      if (address.trim().length === 0) return false;
    }
    return true;
  }, [blocked, isDelivery, address]);

  const payload = useCallback(() => {
    if (!isDelivery) return { deliveryType: "pickup" as const };
    const point = location.status === "captured" ? location.point : null;
    return {
      deliveryType: "delivery" as const,
      address: address.trim().slice(0, 500),
      ...(point ? { lat: point.lat, lng: point.lng } : {}),
    };
  }, [isDelivery, address, location]);

  const remember = useCallback(() => {
    if (!persist) return;
    const point = location.status === "captured" ? location.point : undefined;
    saveDeliveryPrefs({
      type,
      ...(isDelivery
        ? { address: address.trim(), lat: point?.lat, lng: point?.lng }
        : {}),
    });
  }, [persist, type, isDelivery, address, location]);

  return {
    fulfillment,
    hasChoice,
    type,
    setType,
    deliveryAllowed: allowed,
    blocked,
    address,
    setAddress,
    addressError,
    location,
    requestLocation,
    clearLocation,
    fee,
    payable,
    freeShortfall,
    minShortfall,
    validate,
    payload,
    remember,
  };
}
