import type {
  PaymentMode,
  StoreInfo,
  StoreOrderStatus,
  StorePaymentMethods,
} from "./store-api";

// Card-to-card payment on the storefront (KARTA-TOLOV.md). The money never
// passes through KPOS: the buyer transfers to the shop's own card, says
// "Toʼladim", and the shop confirms. These are the client's copies of the
// server's rules, so the checkout shows what the order will ask for.

/** What a backend without card transfer implies, and the unscoped storefront. */
export const ON_RECEIPT_ONLY: StorePaymentMethods = {
  onReceipt: true,
  cardTransfer: false,
  prepayPercent: 100,
};

const MIN_PERCENT = 10;
const MAX_PERCENT = 100;
/** A part payment is rounded up to this many soʼm. */
const PREPAY_STEP = 1000;

function clampPercent(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return MAX_PERCENT;
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, n));
}

/** Coerce the wire shape defensively; a shop with neither method on is
 *  impossible by contract (STORE_NO_PAYMENT_METHOD), so pay on receipt wins. */
export function normalizePayment(info: StoreInfo): StorePaymentMethods {
  const raw = info.payment;
  if (!raw) return ON_RECEIPT_ONLY;
  const cardTransfer = raw.cardTransfer === true;
  return {
    onReceipt: raw.onReceipt !== false || !cardTransfer,
    cardTransfer,
    prepayPercent: clampPercent(raw.prepayPercent),
  };
}

/** The mode the order is placed with: the only one on, or the buyer's choice
 *  (pay on receipt until they choose, as the server assumes too). */
export function pickPaymentMode(
  methods: StorePaymentMethods,
  chosen: PaymentMode | null
): PaymentMode {
  if (!methods.cardTransfer) return "on_receipt";
  if (!methods.onReceipt) return "card_transfer";
  return chosen ?? "on_receipt";
}

/**
 * Mirrors the server (card-transfer.ts `prepayAmountOf`): the whole payable at
 * 100%, otherwise the share rounded up to 1 000 soʼm and never above it.
 */
export function prepayAmountFor(payable: number, percent: number): number {
  const total = Math.max(0, payable);
  const pct = clampPercent(percent);
  if (pct >= MAX_PERCENT) return total;
  const share = Math.ceil((total * pct) / 100 / PREPAY_STEP) * PREPAY_STEP;
  return Math.min(total, share);
}

/** "8600123456789012" → "8600 1234 5678 9012". */
export function groupCardNumber(number: string): string {
  return number.replace(/\s+/g, "").replace(/(.{4})(?=.)/g, "$1 ");
}

/** The card's network where the first digits say so for certain. */
export function cardBrand(number: string): "Uzcard" | "Humo" | null {
  if (number.startsWith("8600")) return "Uzcard";
  if (number.startsWith("9860")) return "Humo";
  return null;
}

/**
 * What the buyer should see about a card-transfer order's money:
 * - "transfer": the cards and "Toʼladim" (awaiting, or after "Pul kelmadi");
 * - "claimed": the shop is checking;
 * - "confirmed": the shop got the money (kept on a closed order too);
 * - null: nothing to show (pay on receipt, an old order, or a closed order
 *   that was never paid).
 */
export type PaymentStage = "transfer" | "claimed" | "confirmed";

export function paymentStage(
  order: Pick<StoreOrderStatus, "status" | "payment">
): PaymentStage | null {
  const payment = order.payment;
  if (!payment || payment.mode !== "card_transfer" || !payment.state) return null;
  if (payment.state === "confirmed") return "confirmed";
  if (order.status === "Completed" || order.status === "Cancelled") return null;
  return payment.state === "claimed" ? "claimed" : "transfer";
}
