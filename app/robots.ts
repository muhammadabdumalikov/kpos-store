import type { MetadataRoute } from "next";
import { getSiteOrigin } from "../lib/site-url";

/**
 * robots.txt per shop: salom.kpos.uz/robots.txt points at salom's own sitemap.
 * The cart, the shopper's orders and the Telegram entry are private or
 * transient, so they stay out of search. A host that is not a shop asks not
 * to be crawled at all.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getSiteOrigin();
  if (!origin) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // A theme preview is a picture of the home page, not a page of its own.
      disallow: ["/cart", "/orders", "/tg", "/*?preview_theme="],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
