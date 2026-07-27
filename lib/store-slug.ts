// The storefront is multi-tenant by subdomain: salom.kpos.uz serves the store
// whose slug is "salom". The slug is derived from the request Host — read from
// `headers()` in Server Components and from `window.location` on the client —
// and forwarded to the backend as ?store=<slug> on every /store call.

import { getStartParam } from "./telegram";

// Root domain the storefront runs under. Anything at the apex (kpos.uz),
// `www`, or a bare host (localhost, an IP, a Coolify preview URL) has no tenant
// slug and falls back to the backend's STORE_BUSINESS_ID.
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "kpos.uz";

const NON_TENANT_LABELS = new Set(["www", "kpos"]);

/**
 * Extract the tenant slug from a Host header value (may include a port).
 * Returns null when the host is the apex, www, or not under ROOT_DOMAIN.
 */
export function slugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname) return null;

  // Only hosts that actually sit under the configured root domain carry a slug.
  const suffix = "." + ROOT_DOMAIN;
  if (!hostname.endsWith(suffix)) return null;

  const label = hostname.slice(0, -suffix.length);
  // Guard against apex (empty) and multi-level labels like "a.b.kpos.uz".
  if (!label || label.includes(".")) return null;
  if (NON_TENANT_LABELS.has(label)) return null;
  return label;
}

/**
 * Client-side slug. Null during SSR.
 *
 * Normally the host carries it. Inside the Telegram mini app the launch host
 * can be the bot's fixed entry URL, so the `startapp` payload is the fallback
 * (TelegramProvider redirects to the tenant subdomain, but this keeps calls
 * scoped correctly in the window before that lands, and in local dev where the
 * host has no slug at all).
 */
export function getStoreSlugClient(): string | null {
  if (typeof window === "undefined") return null;
  return slugFromHost(window.location.host) ?? getStartParam();
}
