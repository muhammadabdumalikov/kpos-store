"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/hooks/useTranslations";
import { LoginButton } from "./LoginButton";

const NAV_HEIGHT = 56;

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.8}
      viewBox="0 0 24 24"
      aria-hidden
    >
      {active ? (
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 11-1.06 1.06l-.72-.72V19.5A2.25 2.25 0 0117.19 21.75h-2.44a.75.75 0 01-.75-.75v-4.5a1.5 1.5 0 00-1.5-1.5h-1a1.5 1.5 0 00-1.5 1.5V21a.75.75 0 01-.75.75H6.81A2.25 2.25 0 014.56 19.5v-6.63l-.72.72a.75.75 0 01-1.06-1.06l8.69-8.69z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6a2 2 0 014 0v6h4a1 1 0 001-1V10" />
      )}
    </svg>
  );
}

function CatalogIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24" aria-hidden>
      {active ? (
        <path d="M4 4.75A.75.75 0 014.75 4h5.5a.75.75 0 01.75.75v5.5a.75.75 0 01-.75.75h-5.5A.75.75 0 014 10.25v-5.5zm9 0a.75.75 0 01.75-.75h5.5a.75.75 0 01.75.75v5.5a.75.75 0 01-.75.75h-5.5a.75.75 0 01-.75-.75v-5.5zm-9 9a.75.75 0 01.75-.75h5.5a.75.75 0 01.75.75v5.5a.75.75 0 01-.75.75h-5.5a.75.75 0 01-.75-.75v-5.5zm9 0a.75.75 0 01.75-.75h5.5a.75.75 0 01.75.75v5.5a.75.75 0 01-.75.75h-5.5a.75.75 0 01-.75-.75v-5.5z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.75 4h5.5v6.75h-5.5V4zm9 0h5.5v6.75h-5.5V4zm-9 9.25h5.5V20h-5.5v-6.75zm9 0h5.5V20h-5.5v-6.75z" />
      )}
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 4h14a1 1 0 011 1v16l-3-2-2 2-3-2-3 2-2-2-3 2V5a1 1 0 011-1z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

const itemClass = (active: boolean) =>
  `flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
    active
      ? "text-brand-600 dark:text-brand-400"
      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
  }`;

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslations();

  const links = [
    { href: "/", labelKey: "nav.home", active: pathname === "/", icon: (a: boolean) => <HomeIcon active={a} /> },
    { href: "/catalog", labelKey: "nav.catalog", active: pathname.startsWith("/catalog"), icon: (a: boolean) => <CatalogIcon active={a} /> },
    { href: "/cart", labelKey: "nav.cart", active: pathname.startsWith("/cart"), icon: () => <CartIcon /> },
    { href: "/orders", labelKey: "nav.orders", active: pathname.startsWith("/orders"), icon: () => <OrdersIcon /> },
  ];

  return (
    <nav
      className="fixed left-0 right-0 z-10 flex items-center justify-around border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:hidden"
      style={{
        bottom: 0,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: NAV_HEIGHT,
      }}
      aria-label={t("nav.mainNav")}
    >
      {links.map(({ href, labelKey, active, icon }) => (
        <Link key={href} href={href} className={itemClass(active)}>
          {icon(active)}
          <span>{t(labelKey)}</span>
        </Link>
      ))}
      <LoginButton className={itemClass(false)} aria-label={t("nav.profile")}>
        <ProfileIcon />
        <span>{t("nav.profile")}</span>
      </LoginButton>
    </nav>
  );
}
