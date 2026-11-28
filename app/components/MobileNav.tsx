"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStoreTheme } from "@/context/StoreThemeContext";
import { useTranslations } from "@/hooks/useTranslations";
import { LoginButton } from "./LoginButton";
import { GridIcon, HomeIcon, ReceiptIcon, UserIcon } from "./icons/ShopIcons";

// Height and bottom inset live in globals.css (--nav-height / --nav-safe-bottom)
// because the cart and product pages and the cart bar stack on top of this
// bar: one source of truth keeps them from drifting apart.
//
// No cart tab: on the pages that sell, the cart bar above this nav is the way
// to the cart, and it carries the count and total a tab badge could not.

const itemClass = (active: boolean) =>
  `flex h-full min-h-11 w-full flex-col items-center justify-center gap-[3px] pt-1 text-[11px] leading-[13px] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40 active:opacity-60 motion-reduce:transition-none ${
    active
      ? "font-bold text-brand-500 dark:text-brand-400"
      : "font-medium text-gray-900/60 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
  } ${THEMED_ITEM} ${active ? THEMED_ACTIVE : THEMED_IDLE}`;

// Themes: Jurnal's letter-spaced caps in ink, Afisha's ruled mono cells with
// the current one inverted; Tungi keeps the default night bar.
const THEMED_ITEM =
  "jurnal:text-[10px] jurnal:uppercase jurnal:tracking-[0.14em] afisha:border-l afisha:border-gray-900 afisha:pt-0 afisha:text-[10px] afisha:uppercase afisha:tracking-[0.06em]";
const THEMED_ACTIVE = "jurnal:font-semibold jurnal:text-gray-900 afisha:bg-gray-900 afisha:text-white";
const THEMED_IDLE = "jurnal:text-gray-500 afisha:font-bold afisha:text-gray-900";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const theme = useStoreTheme();
  // Jurnal draws its icons in hairlines.
  const stroke = (active: boolean) => (theme === "jurnal" ? (active ? 1.7 : 1.3) : active ? 2 : 1.6);

  const links = [
    { href: "/", labelKey: "nav.home", active: pathname === "/", Icon: HomeIcon },
    { href: "/catalog", labelKey: "nav.catalog", active: pathname.startsWith("/catalog"), Icon: GridIcon },
    { href: "/orders", labelKey: "nav.orders", active: pathname.startsWith("/orders"), Icon: ReceiptIcon },
  ];

  return (
    <nav
      className="tab-bar fixed inset-x-0 bottom-0 z-20 border-t border-gray-900/[0.06] bg-white dark:border-white/[0.06] dark:bg-gray-900 lg:hidden jurnal:border-gray-200 afisha:border-gray-900"
      style={{ paddingBottom: "var(--nav-safe-bottom)" }}
      aria-label={t("nav.mainNav")}
    >
      <ul className="flex" style={{ height: "var(--nav-height)" }}>
        {links.map(({ href, labelKey, active, Icon }) => (
          <li key={href} className="min-w-0 flex-1">
            <Link href={href} aria-current={active ? "page" : undefined} className={itemClass(active)}>
              <Icon className="h-6 w-6" strokeWidth={stroke(active)} />
              <span className="max-w-full truncate px-1">{t(labelKey)}</span>
            </Link>
          </li>
        ))}
        <li className="min-w-0 flex-1">
          <LoginButton className={itemClass(false)}>
            <UserIcon className="h-6 w-6" strokeWidth={stroke(false)} />
            <span className="max-w-full truncate px-1">{t("nav.profile")}</span>
          </LoginButton>
        </li>
      </ul>
    </nav>
  );
}
