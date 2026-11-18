import type { StoreInfo } from "./store-api";

export type StoreContact = { key: "instagram" | "telegram" | "phone"; href: string };

const clean = (value: string | null | undefined) => value?.trim().replace(/^@/, "") || null;

/** The shop's contact links, in the order they are shown; only what is set. */
export function storeContacts(info: StoreInfo | null | undefined): StoreContact[] {
  const c = info?.contacts;
  if (!c) return [];
  const out: StoreContact[] = [];
  const instagram = clean(c.instagram);
  const telegram = clean(c.telegram);
  const phone = c.phone?.replace(/[^\d+]/g, "") || null;
  if (instagram) out.push({ key: "instagram", href: `https://instagram.com/${encodeURIComponent(instagram)}` });
  if (telegram) out.push({ key: "telegram", href: `https://t.me/${encodeURIComponent(telegram)}` });
  if (phone) out.push({ key: "phone", href: `tel:${phone}` });
  return out;
}

/**
 * Where "message the seller" leads: the shop's Telegram chat when it has one,
 * otherwise a direct message on Instagram. Null when the shop gave neither.
 */
export function sellerChatHref(info: StoreInfo | null | undefined): string | null {
  const telegram = clean(info?.contacts?.telegram);
  if (telegram) return `https://t.me/${encodeURIComponent(telegram)}`;
  const instagram = clean(info?.contacts?.instagram);
  if (instagram) return `https://ig.me/m/${encodeURIComponent(instagram)}`;
  return null;
}
