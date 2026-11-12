import type React from "react";

/**
 * A calm "nothing here" / "could not load" block on a tinted panel: an icon
 * tile, one line, an optional reason and at most one action.
 */
export function StatePanel({
  icon,
  title,
  body,
  action,
  className = "",
  titleAs: Title = "p",
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** The title's element: "h1" when the panel is the whole page. */
  titleAs?: "p" | "h1" | "h2";
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-[28px] bg-gray-900/[0.035] px-6 py-12 text-center dark:bg-white/[0.04] ${className}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
        {icon}
      </span>
      <Title className="mt-4 text-[17px] font-bold text-gray-900 dark:text-white">{title}</Title>
      {body && (
        <p className="mt-1 max-w-[300px] text-[14px] font-medium leading-snug text-gray-500 dark:text-gray-400">
          {body}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** The secondary pill used for actions inside panels and under lists. */
export const pillSecondary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gray-900/[0.06] px-5 text-[14px] font-bold text-gray-900 transition-[background-color,transform] duration-100 hover:bg-gray-900/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 motion-safe:active:scale-[0.98] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]";
