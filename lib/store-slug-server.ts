// `next/headers` is server-only by construction — importing it in a client
// bundle is a build error — so no extra `server-only` guard is needed here.
import { headers } from "next/headers";
import { slugFromHost } from "./store-slug";

/**
 * Tenant slug for the current request, read from the Host header. Calling this
 * in a Server Component opts the route into dynamic rendering, which is exactly
 * what we want: each subdomain renders its own store's catalog.
 */
export async function getStoreSlugServer(): Promise<string | null> {
  const h = await headers();
  return slugFromHost(h.get("host"));
}
