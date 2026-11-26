"use client";

import { useEffect, useId, useRef, useState } from "react";
import type React from "react";
import { storeErrorMessage } from "@/lib/api-errors";
import { copyText } from "@/lib/clipboard";
import { fillTemplate, formatPrice, toAmount } from "@/lib/format";
import { cardBrand, groupCardNumber } from "@/lib/payment";
import { StoreApiError, type StoreOrderPayment } from "@/lib/store-api";
import type { StoreContact } from "@/lib/store-contacts";
import { haptic } from "@/lib/telegram";
import { useTranslations } from "@/hooks/useTranslations";
import { ClockIcon, PhoneIcon } from "../icons/DeliveryIcons";
import { CheckLineIcon, CopyIcon, InstagramIcon, TelegramIcon } from "../icons/ShopIcons";
import { pillSecondary } from "../StatePanel";
import { Money, checkoutTitle, field, pillPrimary } from "../checkout/styles";

/**
 * Where the panel sits: "page" is the cart right after checkout (checkout
 * sizes, pill button); "card" is inside a white order card on the orders page
 * (that card's smaller type and corners).
 */
export type CardTransferTone = "page" | "card";

const TONES: Record<
  CardTransferTone,
  {
    gap: string;
    title: string;
    lead: string;
    tile: string;
    amount: string;
    number: string;
    notice: string;
    field: string;
    button: string;
    error: string;
    statusTitle: string;
    statusBody: string;
  }
> = {
  page: {
    gap: "gap-4",
    title: checkoutTitle,
    lead: "mt-1 text-[14px] font-medium leading-5 text-gray-600 dark:text-gray-300",
    tile: "rounded-2xl bg-gray-900/[0.035] px-4 py-3.5 dark:bg-white/[0.04]",
    amount: "text-[28px] leading-9",
    number: "text-[20px] leading-7",
    notice: "rounded-2xl px-4 py-3.5",
    field: "h-[52px]",
    button: `${pillPrimary} h-14 w-full text-[16px] disabled:opacity-60`,
    error:
      "rounded-2xl bg-error-50 px-4 py-3 text-[14px] font-semibold leading-5 text-error-700 dark:bg-error-500/10 dark:text-error-400",
    statusTitle: "text-[16px] font-bold leading-6 text-gray-900 dark:text-white/90",
    statusBody: "mt-0.5 text-[14px] font-medium leading-5 text-gray-600 dark:text-gray-300",
  },
  card: {
    gap: "gap-3",
    title: "text-sm font-bold text-gray-900 dark:text-white/90",
    lead: "mt-0.5 text-sm font-medium leading-snug text-gray-600 dark:text-gray-300",
    tile: "rounded-xl bg-gray-50 px-3.5 py-3 dark:bg-white/[0.04]",
    amount: "text-[24px] leading-8",
    number: "text-[19px] leading-7",
    notice: "rounded-xl px-3.5 py-2.5",
    field: "h-12",
    button:
      "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-on-primary transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 active:scale-[0.98] disabled:opacity-60",
    error: "text-sm font-medium text-error-600 dark:text-error-400",
    statusTitle: "text-sm font-semibold text-gray-900 dark:text-white/90",
    statusBody: "mt-0.5 text-sm font-medium leading-snug text-gray-600 dark:text-gray-300",
  },
};

/** What a card-transfer order asks for now; the whole payable when the
 *  server sent no amount. */
function prepayOf(payment: StoreOrderPayment, payable: number): number {
  return payment.prepayAmount === null || payment.prepayAmount === undefined
    ? payable
    : toAmount(payment.prepayAmount);
}

/**
 * The words for a payment the buyer no longer has to act on: the shop is
 * checking ("claimed") or took the money ("confirmed"). Null in every other
 * state. Shared by the panel's own status row and the cart's "done" panel.
 */
export function paymentStatusText(
  payment: StoreOrderPayment,
  payable: number,
  t: (key: string) => string
): { title: string; body: string } | null {
  const prepay = prepayOf(payment, payable);
  const amount = formatPrice(prepay, t("common.currency"));
  if (payment.state === "claimed") {
    return {
      title: t("payment.claimedTitle"),
      body: fillTemplate(t("payment.claimedBody"), { amount }),
    };
  }
  if (payment.state === "confirmed") {
    return {
      title: t("payment.confirmedTitle"),
      body: prepay < payable ? fillTemplate(t("payment.confirmedPart"), { amount }) : amount,
    };
  }
  return null;
}

export interface CardTransferPanelProps {
  /** The order's `payment` block; the panel is for card-transfer orders. */
  payment: StoreOrderPayment;
  /** The order's whole payable, to say what is left for the handover. */
  payable: number;
  /**
   * "Toʼladim". Resolves once the server took it (the parent then passes the
   * updated `payment`); throws a StoreApiError otherwise. Without it the
   * panel is read-only.
   */
  onClaim?: (note?: string) => Promise<void>;
  /** The shop's contacts, offered when the buyer has to call the shop. */
  contacts?: StoreContact[];
  tone?: CardTransferTone;
  /** Short order number: the first line then says the order was sent. */
  orderRef?: string;
  /**
   * Phones: pin "Toʼladim" above the tab bar instead of leaving it in the
   * flow. The page must leave 88px of room under its content.
   */
  pinAction?: boolean;
  /** Preview only: start in a given look. `copied` is "amount" or a card's index. */
  preview?: { note?: string; error?: string; copied?: string };
}

/**
 * Paying a storefront order by a transfer to the shop's card (KARTA-TOLOV.md
 * §2). While the money is due: the amount and the shop's cards, each with a
 * copy button, an optional "whose card" note and "Toʼladim". After a "Pul
 * kelmadi" the same again under a notice, until the tries run out and only
 * the shop's contacts are left. Then one row: the shop is checking, or the
 * payment is in.
 *
 * Presentational: the order comes in as props and "Toʼladim" goes out as a
 * callback, so the cart and the orders page share it.
 */
export function CardTransferPanel({
  payment,
  payable,
  onClaim,
  contacts = [],
  tone = "page",
  orderRef,
  pinAction = false,
  preview,
}: CardTransferPanelProps) {
  const { t } = useTranslations();
  const look = TONES[tone];
  const currency = t("common.currency");
  const noteId = useId();
  const hintId = useId();

  const [note, setNote] = useState(preview?.note ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(preview?.error ?? null);
  const [copy, setCopy] = useState<{ key: string; ok: boolean } | null>(
    preview?.copied ? { key: preview.copied, ok: true } : null
  );
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  // The button may be pinned to the bottom while the message is further up.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [error]);

  if (payment.mode !== "card_transfer" || !payment.state) return null;

  const status = paymentStatusText(payment, payable, t);
  if (status) {
    return (
      <div className={`flex items-start gap-3 ${look.tile}`}>
        {payment.state === "confirmed" ? (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-600 text-white">
            <CheckLineIcon className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        ) : (
          <span className="mt-0.5 shrink-0 text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <p className={look.statusTitle}>{status.title}</p>
          <p className={look.statusBody}>{status.body}</p>
        </div>
      </div>
    );
  }

  const prepay = prepayOf(payment, payable);
  const rest = Math.max(0, payable - prepay);
  const cards = payment.cards ?? [];
  const rejected = payment.state === "rejected";
  const outOfTries = payment.claimsLeft <= 0;
  const canClaim = Boolean(onClaim) && !outOfTries && cards.length > 0;
  const Title = tone === "page" ? "h2" : "h3";

  const copyValue = async (key: string, text: string) => {
    const ok = await copyText(text);
    if (ok) haptic("light");
    setCopy({ key, ok });
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopy(null), 2000);
  };

  const claim = async () => {
    if (!onClaim || pending) return;
    setPending(true);
    setError(null);
    try {
      await onClaim(note.trim() || undefined);
      haptic("medium");
    } catch (err) {
      // A network failure carries the browser's own English text; say ours.
      setError(
        err instanceof StoreApiError
          ? storeErrorMessage(err, t, t("payment.claimFailed"))
          : t("payment.claimFailed")
      );
    } finally {
      setPending(false);
    }
  };

  const contactRow = contacts.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {contacts.map((contact) => (
        <ContactLink key={contact.key} contact={contact} />
      ))}
    </div>
  );

  const claimLabel = pending ? t("common.sending") : t("payment.claim");

  return (
    <div className={`flex flex-col ${look.gap}`}>
      {rejected ? (
        // Amber, not the shop's colour: it has to read as "look at this" in
        // a red shop and a blue one alike.
        <div
          className={`bg-warning-50 text-warning-800 dark:bg-warning-500/10 dark:text-warning-300 ${look.notice}`}
        >
          <Title className="text-[15px] font-bold leading-5">{t("payment.rejectedTitle")}</Title>
          <p className="mt-1 text-[14px] font-medium leading-5">
            {outOfTries ? t("payment.limitBody") : t("payment.rejectedBody")}
          </p>
        </div>
      ) : (
        <div>
          <Title className={look.title}>{t("payment.transferTitle")}</Title>
          <p className={look.lead}>
            {orderRef && <>{fillTemplate(t("payment.orderSent"), { id: orderRef })} </>}
            {outOfTries ? t("payment.limitBody") : t("payment.transferHint")}
          </p>
        </div>
      )}

      {outOfTries && contactRow}

      <div className="flex flex-col gap-2">
        <CopyTile
          className={look.tile}
          caption={t("payment.amountLabel")}
          spoken={formatPrice(prepay, currency)}
          state={copy?.key === "amount" ? copy.ok : null}
          onCopy={() => copyValue("amount", String(prepay))}
        >
          <p className="mt-1">
            <Money
              value={prepay}
              currency={currency}
              className={`select-all font-bold tracking-[-0.02em] text-gray-900 dark:text-white ${look.amount}`}
            />
          </p>
          {rest > 0 && (
            <p className="mt-0.5 text-[13px] font-medium leading-[18px] text-gray-500 dark:text-gray-400">
              {fillTemplate(t("payment.restOnReceipt"), {
                amount: formatPrice(rest, currency),
              })}
            </p>
          )}
        </CopyTile>

        {cards.length > 1 && (
          <p className="px-1 pt-1.5 text-[13px] font-semibold text-gray-600 dark:text-gray-300">
            {t("payment.anyCard")}
          </p>
        )}

        {cards.map((card, i) => {
          const brand = cardBrand(card.number);
          const grouped = groupCardNumber(card.number);
          return (
            <CopyTile
              key={`${card.number}-${i}`}
              className={look.tile}
              caption={brand ? `${t("payment.cardLabel")} · ${brand}` : t("payment.cardLabel")}
              spoken={grouped}
              state={copy?.key === String(i) ? copy.ok : null}
              onCopy={() => copyValue(String(i), card.number.replace(/\s+/g, ""))}
            >
              <p
                className={`mt-1 select-all whitespace-nowrap font-bold tabular-nums tracking-[0.01em] text-gray-900 dark:text-white ${look.number}`}
              >
                {grouped}
              </p>
              {card.holder && (
                <p className="mt-0.5 break-words text-[14px] font-semibold leading-5 text-gray-600 dark:text-gray-300">
                  {card.holder}
                </p>
              )}
            </CopyTile>
          );
        })}

        {cards.length === 0 && (
          <p
            className={`text-[14px] font-medium leading-5 text-gray-600 dark:text-gray-300 ${look.tile}`}
          >
            {t("payment.noCards")}
          </p>
        )}
      </div>

      {cards.length === 0 && !outOfTries && contactRow}

      {canClaim && (
        <>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={noteId}
              className="px-1 text-[13px] font-semibold text-gray-600 dark:text-gray-300"
            >
              {t("payment.noteLabel")}{" "}
              <span className="font-medium text-gray-500 dark:text-gray-400">
                ({t("payment.optional")})
              </span>
            </label>
            <input
              id={noteId}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={60}
              autoComplete="off"
              enterKeyHint="done"
              aria-describedby={hintId}
              className={`${field()} ${look.field}`}
              placeholder={t("payment.notePlaceholder")}
            />
            <p id={hintId} className="px-1 text-[13px] font-medium text-gray-500 dark:text-gray-400">
              {t("payment.noteHint")}
            </p>
          </div>

          {error && (
            <p ref={errorRef} role="alert" className={look.error}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={claim}
            disabled={pending}
            className={`${look.button} ${pinAction ? "max-lg:hidden" : ""}`}
          >
            {claimLabel}
          </button>

          {pinAction && (
            <div
              className="fixed inset-x-0 z-20 bg-gradient-to-t from-white from-70% to-transparent px-4 pb-3 pt-4 dark:from-gray-900 lg:hidden"
              style={{ bottom: "var(--nav-total)" }}
            >
              <button type="button" onClick={claim} disabled={pending} className={look.button}>
                {claimLabel}
              </button>
            </div>
          )}
        </>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {copy ? t(copy.ok ? "payment.copied" : "payment.copyFailed") : ""}
      </span>
    </div>
  );
}

/**
 * A value the buyer carries to their bank app: the amount, a card number.
 * The button copies it and says so in place; a tap anywhere on the tile does
 * the same, and the value itself stays selectable for a long press.
 */
function CopyTile({
  className,
  caption,
  spoken,
  state,
  onCopy,
  children,
}: {
  className: string;
  caption: string;
  /** The value as a screen reader should name it on the button. */
  spoken: string;
  /** Just copied (true), just failed (false), or idle (null). */
  state: boolean | null;
  onCopy: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslations();
  return (
    <div className={`cursor-pointer ${className}`} onClick={onCopy}>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-[13px] font-medium text-gray-500 dark:text-gray-400">
          {caption}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className={`-my-2 -mr-2 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-[13px] font-bold transition-colors duration-100 hover:bg-gray-900/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:hover:bg-white/[0.08] ${
            state === true
              ? "text-success-600 dark:text-success-400"
              : state === false
                ? "text-error-600 dark:text-error-400"
                : "text-gray-900 dark:text-white/90"
          }`}
        >
          {state === true ? (
            <CheckLineIcon className="h-4 w-4" strokeWidth={2.6} />
          ) : (
            state === null && <CopyIcon className="h-4 w-4" />
          )}
          {state === true
            ? t("payment.copied")
            : state === false
              ? t("payment.copyFailed")
              : t("payment.copy")}
          <span className="sr-only">: {spoken}</span>
        </button>
      </div>
      {children}
    </div>
  );
}

/** One way to reach the shop when only the shop can settle the payment. */
function ContactLink({ contact }: { contact: StoreContact }) {
  const { t } = useTranslations();
  const external = contact.key !== "phone";
  const name =
    contact.key === "instagram"
      ? "Instagram"
      : contact.key === "telegram"
        ? "Telegram"
        : t("home.call");
  return (
    <a
      href={contact.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={pillSecondary}
    >
      {contact.key === "instagram" ? (
        <InstagramIcon className="h-[18px] w-[18px]" />
      ) : contact.key === "telegram" ? (
        <TelegramIcon className="h-[18px] w-[18px]" />
      ) : (
        <PhoneIcon className="h-[18px] w-[18px]" />
      )}
      {name}
    </a>
  );
}
