"use client";
/* eslint-disable @next/next/no-img-element -- shop pictures come from whatever host the shop's storage uses */

import Link from "next/link";
import { useState } from "react";
import { useSohaLook } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import type { StoreInfo } from "@/lib/store-api";
import { storeContacts, type StoreContact } from "@/lib/store-contacts";
import { onOrderLabel } from "@/lib/stock";
import { useFulfilmentLines, type FulfilmentLine } from "../StoreIntro";
import { ClockIcon, PhoneIcon } from "../icons/DeliveryIcons";
import { ArrowRightIcon, InstagramIcon, TelegramIcon } from "../icons/ShopIcons";

// The top of the home page in a trade theme (lib/soha-looks): the shop's face,
// from the shop's own data only. Every block hides when its data is missing.

type Props = {
  info: StoreInfo | null;
  /** Set when everything on sale comes on order with this one lead time. */
  orderLead?: string | null;
};

/** How the shop hands orders over, plus the one lead time everything on sale shares. */
function useStoreFacts(info: StoreInfo | null, orderLead: string | null): FulfilmentLine[] {
  const { t } = useTranslations();
  const handover = useFulfilmentLines(info);
  if (orderLead === null) return handover;
  return [
    ...handover,
    {
      key: "on-order",
      icon: <ClockIcon className="h-[18px] w-[18px]" />,
      label: onOrderLabel(t("preorder.label"), orderLead),
      detail: null,
    },
  ];
}

/** A shop picture that may fail to load; a broken one renders nothing. */
function useShopImage(src: string | null | undefined) {
  const [broken, setBroken] = useState(false);
  return { url: src && !broken ? src : null, onError: () => setBroken(true) };
}

const focus = "outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-page";

/** Where to reach the shop, as round icon buttons in the given colours. */
function Contacts({ contacts, tone, className = "" }: { contacts: StoreContact[]; tone: string; className?: string }) {
  const { t } = useTranslations();
  if (contacts.length === 0) return null;
  return (
    <ul aria-label={t("home.contactsAria")} className={`flex shrink-0 gap-2 ${className}`}>
      {contacts.map((c) => {
        const name = c.key === "instagram" ? "Instagram" : c.key === "telegram" ? "Telegram" : t("home.call");
        return (
          <li key={c.key}>
            <a
              href={c.href}
              {...(c.key !== "phone" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={name}
              className={`r-ctl flex h-11 w-11 items-center justify-center transition-[filter,transform] duration-100 hover:brightness-95 motion-safe:active:scale-95 ${tone} ${focus}`}
            >
              {c.key === "instagram" ? (
                <InstagramIcon className="h-5 w-5" />
              ) : c.key === "telegram" ? (
                <TelegramIcon className="h-5 w-5" />
              ) : (
                <PhoneIcon className="h-5 w-5" />
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** The handover facts as small labelled pills. */
function Facts({ facts, className = "" }: { facts: FulfilmentLine[]; className?: string }) {
  const { t } = useTranslations();
  if (facts.length === 0) return null;
  return (
    <ul aria-label={t("home.fulfilmentAria")} className={`flex gap-2 ${className}`}>
      {facts.map((l) => (
        <li
          key={l.key}
          className="soha-fact r-ctl flex min-h-10 max-w-full shrink-0 items-center gap-2 border border-line bg-card px-3 py-1.5 text-[13px] font-medium leading-[1.25] text-ink"
        >
          <span className="shrink-0 opacity-70">{l.icon}</span>
          <span className="min-w-0 text-left">
            <span className="font-bold">{l.label}</span>
            {l.detail && <span className="tabular-nums"> · {l.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A headline is set larger the shorter it is. */
function headlineSize(text: string) {
  if (text.length <= 28) return "text-[38px] leading-[1.04] lg:text-[68px]";
  if (text.length <= 64) return "text-[30px] leading-[1.08] lg:text-[52px]";
  return "text-[24px] leading-[1.15] lg:text-[38px]";
}

/**
 * The part of the intro above the phone's search bar.
 * - band: a full-width block in the theme's band colour: logo, the name as
 *   the page title, the tagline, the contacts. The search bar under it takes
 *   the same colour (app/globals.css), and `SohaAfterBar` carries the rest.
 * - center: logo, name and tagline centred, contacts and handover facts under
 *   them, then the cover as a card.
 * - cover: the cover first (Guldasta arches it), the logo over its lower
 *   edge, then the name, the tagline and the facts, centred.
 * - split: a panel with the tagline as a large headline and the way to the
 *   catalogue, beside the cover.
 */
export function SohaIntro({ info, orderLead = null }: Props) {
  const { t } = useTranslations();
  const look = useSohaLook();
  const facts = useStoreFacts(info, orderLead);
  const cover = useShopImage(info?.cover);
  const logo = useShopImage(info?.logo);
  if (!look || !info?.name) return null;

  const tagline = info.tagline?.trim() || null;
  const contacts = storeContacts(info);

  if (look.intro === "band") {
    return (
      <section aria-labelledby="store-title" className="soha-band bg-band text-on-band">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pb-2 pt-4 lg:gap-6 lg:pb-9 lg:pt-9">
          {logo.url && (
            <img
              src={logo.url}
              alt=""
              decoding="async"
              onError={logo.onError}
              className="r-tile h-12 w-12 shrink-0 bg-white object-cover lg:h-[84px] lg:w-[84px]"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 id="store-title" className="soha-title line-clamp-2 break-words font-head text-[25px] font-extrabold leading-[1.1] tracking-[-0.01em] lg:text-[48px]">
              {info.name}
            </h1>
            {tagline && (
              <p className="mt-1 line-clamp-2 break-words text-[13px] font-medium leading-[18px] opacity-80 lg:mt-2 lg:text-[17px] lg:leading-6">
                {tagline}
              </p>
            )}
          </div>
          <Contacts contacts={contacts} tone="bg-on-band/15 text-on-band" className="max-sm:hidden" />
        </div>
      </section>
    );
  }

  if (look.intro === "split") {
    const headline = tagline ?? info.name;
    return (
      <section aria-labelledby="store-title" className="mx-auto max-w-7xl px-4 pt-3 lg:pt-8">
        <div className={`grid gap-3 lg:gap-6 ${cover.url ? "lg:grid-cols-2" : ""}`}>
          <div className="r-card flex flex-col justify-center bg-panel px-5 py-6 lg:px-12 lg:py-14">
            <div className="flex items-center gap-2.5">
              {logo.url && (
                <img src={logo.url} alt="" decoding="async" onError={logo.onError} className="keep-round h-8 w-8 shrink-0 rounded-full bg-white object-cover" />
              )}
              {/* The headline is the tagline; the name is the page's title. */}
              <h1 id="store-title" className={`min-w-0 truncate ${tagline ? "text-[14px] font-bold uppercase tracking-[0.08em] text-muted" : "sr-only"}`} style={{ fontFamily: "var(--font-outfit)" }}>
                {info.name}
              </h1>
            </div>
            <p aria-hidden={!tagline || undefined} className={`soha-headline mt-3 max-w-[18ch] break-words font-head font-extrabold tracking-[-0.02em] text-ink ${headlineSize(headline)}`}>
              {headline}
            </p>
            <Link
              href="/catalog"
              className={`r-ctl mt-5 inline-flex h-12 items-center gap-2 self-start bg-primary px-6 text-[15px] font-bold text-on-primary transition-colors hover:bg-primary-hover lg:mt-8 ${focus}`}
            >
              {t("home.heroCta")}
              <ArrowRightIcon className="h-[18px] w-[18px]" strokeWidth={2} />
            </Link>
            {(facts.length > 0 || contacts.length > 0) && (
              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4 lg:mt-10 lg:pt-6">
                <Facts facts={facts} className="flex-wrap" />
                <Contacts contacts={contacts} tone="border border-line bg-card text-ink" />
              </div>
            )}
          </div>
          {cover.url && (
            <img
              src={cover.url}
              alt=""
              decoding="async"
              fetchPriority="high"
              onError={cover.onError}
              className="r-card aspect-[3/2] w-full bg-panel object-cover lg:aspect-auto lg:h-full lg:min-h-[440px]"
            />
          )}
        </div>
      </section>
    );
  }

  if (look.intro === "cover") {
    return (
      <section aria-labelledby="store-title" className="mx-auto max-w-7xl px-4 pt-3 text-center lg:pt-8">
        {cover.url && (
          <img
            src={cover.url}
            alt=""
            decoding="async"
            fetchPriority="high"
            onError={cover.onError}
            className="soha-arch r-card mx-auto aspect-[4/3] w-full max-w-[720px] bg-panel object-cover sm:aspect-[16/10]"
          />
        )}
        {logo.url && (
          <img
            src={logo.url}
            alt=""
            decoding="async"
            onError={logo.onError}
            className={`keep-round relative mx-auto h-20 w-20 rounded-full bg-white object-cover ring-4 ring-page lg:h-24 lg:w-24 ${cover.url ? "-mt-10 lg:-mt-12" : "mt-3"}`}
          />
        )}
        <h1 id="store-title" className="soha-title mx-auto mt-3 max-w-[20ch] break-words font-head text-[34px] font-medium leading-[1.08] text-ink lg:mt-5 lg:text-[56px]">
          {info.name}
        </h1>
        {tagline && <p className="mx-auto mt-2 max-w-[46ch] break-words text-[15px] font-medium leading-[22px] text-muted lg:text-[17px] lg:leading-7">{tagline}</p>}
        <Contacts contacts={contacts} tone="border border-line bg-card text-ink" className="mt-4 justify-center" />
        <Facts facts={facts} className="mt-3 flex-wrap justify-center" />
      </section>
    );
  }

  // center
  return (
    <section aria-labelledby="store-title" className="soha-center mx-auto max-w-7xl px-4 pt-6 text-center lg:pt-10">
      {logo.url && (
        <img
          src={logo.url}
          alt=""
          decoding="async"
          onError={logo.onError}
          className="soha-logo r-card mx-auto h-[76px] w-[76px] bg-white object-cover ring-4 ring-card lg:h-24 lg:w-24"
        />
      )}
      <div className={logo.url ? "mt-3" : ""}>
        <h1 id="store-title" className="soha-title break-words font-head text-[30px] font-extrabold leading-[1.12] tracking-[-0.01em] text-ink lg:text-[48px]">
          {info.name}
        </h1>
      </div>
      {tagline && <p className="mx-auto mt-2 max-w-[46ch] break-words text-[15px] font-medium leading-[22px] text-muted lg:text-[17px] lg:leading-7">{tagline}</p>}
      <Contacts contacts={contacts} tone="border border-line bg-card text-ink" className="mt-4 justify-center" />
      <Facts facts={facts} className="mt-3 flex-wrap justify-center" />
      {cover.url && (
        <img
          src={cover.url}
          alt=""
          decoding="async"
          fetchPriority="high"
          onError={cover.onError}
          className="r-card mt-5 aspect-[2/1] w-full bg-panel object-cover lg:mt-8 lg:aspect-[3/1]"
        />
      )}
    </section>
  );
}

/**
 * A band theme's intro under the phone's search bar: the handover facts as a
 * row to swipe, the contacts (on a phone, where the band has no room for
 * them), and the cover as a banner. Other intros render nothing here.
 */
export function SohaAfterBar({ info, orderLead = null }: Props) {
  const look = useSohaLook();
  const facts = useStoreFacts(info, orderLead);
  const cover = useShopImage(info?.cover);
  if (!look || look.intro !== "band" || !info?.name) return null;
  const contacts = storeContacts(info);
  if (facts.length === 0 && contacts.length === 0 && !cover.url) return null;

  return (
    <div className="pt-3 lg:pt-5">
      {(facts.length > 0 || contacts.length > 0) && (
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          <Facts facts={facts} className="shrink-0" />
          <Contacts contacts={contacts} tone="border border-line bg-card text-ink" className="sm:hidden" />
        </div>
      )}
      {cover.url && (
        <img
          src={cover.url}
          alt=""
          decoding="async"
          fetchPriority="high"
          onError={cover.onError}
          className="r-card mt-3 aspect-[5/2] w-full bg-panel object-cover lg:mt-4 lg:aspect-[4/1]"
        />
      )}
    </div>
  );
}
