// Outline glyphs shared by checkout and order tracking. The storefront has no
// icon package; every page draws its few icons inline, so these follow suit
// (same 24-grid, 1.8 stroke) rather than pulling in a dependency for six marks.

type IconProps = { className?: string };

const base = {
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function StoreIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M3 9.5L4.5 4h15L21 9.5M3 9.5a2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0M5 11.5V20h14v-8.5M10 20v-5h4v5" />
    </svg>
  );
}

export function PinIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0113 0c0 5.3-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function TruckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M3 7h11v9H3zM14 10h3.5L20 13v3h-6M6.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 006.5 6.5L16 14l4 1.5V19a1 1 0 01-1 1A15 15 0 014 5a1 1 0 011-1z" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3 w-3" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 10.5l4 4 8-9"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossIcon({ className = "h-3 w-3" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </svg>
  );
}
