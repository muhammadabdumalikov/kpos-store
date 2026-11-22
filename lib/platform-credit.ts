// The "KPOS'da ishlaydi" credit at the foot of every storefront, and where it
// leads: the page that offers a seller a storefront of their own. The link
// names the shop it was followed from (`src=vitrina-<slug>`), so the platform
// can tell which storefronts bring new sellers — the dashboard's sign-up form
// keeps the value (pimpo-nextjs lib/signupSource.ts).

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "kpos.uz";

export function platformCreditUrl(slug: string | null | undefined): string {
  const src = slug ? `vitrina-${slug}` : "vitrina";
  return `https://${ROOT_DOMAIN}/onlayn?src=${encodeURIComponent(src)}`;
}
