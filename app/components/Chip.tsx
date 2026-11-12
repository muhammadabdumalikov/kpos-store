import Link from "next/link";
import type React from "react";

/**
 * Filter chip, same clothes as the dashboard's: solid ink when active, a
 * tinted pill otherwise. The outer element is the 44px hit area, the pill
 * inside is what you see.
 */
export function chipClass(active: boolean) {
  return `flex h-9 items-center whitespace-nowrap rounded-full px-4 text-[14px] leading-none transition-[background-color,color] duration-100 motion-reduce:transition-none ${
    active
      ? "bg-gray-900 font-bold text-white dark:bg-white dark:text-gray-900"
      : "bg-gray-900/[0.05] font-medium text-gray-700 group-hover:bg-gray-900/[0.08] group-hover:text-gray-900 dark:bg-white/[0.06] dark:text-gray-300 dark:group-hover:bg-white/10 dark:group-hover:text-white"
  }`;
}

const hitArea =
  "group flex h-11 max-w-[260px] shrink-0 items-center rounded-full outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-brand-500/60 focus-visible:[&>span]:ring-offset-2 focus-visible:[&>span]:ring-offset-white dark:focus-visible:[&>span]:ring-offset-gray-900";

export function ChipLink({
  href,
  active = false,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={hitArea}>
      <span className={`${chipClass(active)} min-w-0`}>
        <span className="truncate">{children}</span>
      </span>
    </Link>
  );
}

export function ChipButton({
  active,
  onClick,
  children,
  ...rest
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children">) {
  return (
    <button type="button" onClick={onClick} className={hitArea} {...rest}>
      <span className={`${chipClass(active)} min-w-0`}>
        <span className="truncate">{children}</span>
      </span>
    </button>
  );
}
