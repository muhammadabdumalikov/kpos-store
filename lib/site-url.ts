// `next/headers` is server-only by construction, like store-slug-server.
import { headers } from "next/headers";
import { slugFromHost } from "./store-slug";

/**
 * This storefront's own origin for the current request ("https://salom.kpos.uz"),
 * for the absolute addresses search engines need: canonical links, sitemap
 * entries, robots.txt, structured data.
 *
 * Only a tenant host has one: a bare host (localhost, an IP, a preview URL)
 * returns null, so nothing points crawlers at an address that is not a shop.
 * The scheme is https except on a local `*.localhost` / `.test` host.
 */
export async function getSiteOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("host")?.trim().toLowerCase() ?? "";
  if (!slugFromHost(host)) return null;
  const hostname = host.split(":")[0];
  const local = hostname.endsWith(".localhost") || hostname.endsWith(".test");
  return `${local ? "http" : "https"}://${host}`;
}

/**
 * A string made safe to sit inside `<script type="application/ld+json">`:
 * JSON.stringify leaves `<`, which could close the script tag early.
 */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
