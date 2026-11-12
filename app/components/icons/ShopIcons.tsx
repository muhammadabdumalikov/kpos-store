// Line glyphs for the storefront shell, cards and catalogue. Same grid and
// stroke as DeliveryIcons (24px, 1.8) so every icon on a screen reads as one set.

type IconProps = { className?: string; strokeWidth?: number };

const base = (strokeWidth = 1.8) => ({
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function SearchIcon({ className = "h-5 w-5", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

export function PlusIcon({ className = "h-5 w-5", strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ className = "h-5 w-5", strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function BagIcon({ className = "h-5 w-5", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M5.5 8h13l-1 12.5h-11L5.5 8z" />
      <path d="M9 10.5V7a3 3 0 016 0v3.5" />
    </svg>
  );
}

export function HomeIcon({ className = "h-6 w-6", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M4 10.5L12 4l8 6.5" />
      <path d="M6 9v11h4.5v-6h3v6H18V9" />
    </svg>
  );
}

export function GridIcon({ className = "h-6 w-6", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.75" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.75" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.75" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.75" />
    </svg>
  );
}

export function ReceiptIcon({ className = "h-6 w-6", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.2-1.5 1.2-2-1.5L6 20.5v-17z" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
    </svg>
  );
}

export function UserIcon({ className = "h-6 w-6", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20a7.5 7.5 0 0115 0" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "h-5 w-5", strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M9.5 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = "h-5 w-5", strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M14.5 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "h-4 w-4", strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M6 9.5l6 6 6-6" />
    </svg>
  );
}

export function CheckLineIcon({ className = "h-4 w-4", strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function SortIcon({ className = "h-4 w-4", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M7 5v14M4 16l3 3 3-3M17 19V5M14 8l3-3 3 3" />
    </svg>
  );
}

export function CloseIcon({ className = "h-4 w-4", strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/** No-photo placeholder: a closed box, drawn light so it reads as "no image",
 *  not as a broken one. */
export function BoxIcon({ className = "h-8 w-8", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M12 3.5l7.5 4v9L12 20.5l-7.5-4v-9L12 3.5z" />
      <path d="M4.5 7.5L12 11.5l7.5-4M12 11.5v9" />
    </svg>
  );
}

export function CloudOffIcon({ className = "h-6 w-6", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M7 18.5h10.5a3.5 3.5 0 00.9-6.9A5.5 5.5 0 008.2 9.3 4.6 4.6 0 007 18.5z" />
      <path d="M4 4l16 16" />
    </svg>
  );
}

export function SunIcon({ className = "h-5 w-5", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.5M12 19.5V21M4.6 4.6l1.1 1.1M18.3 18.3l1.1 1.1M3 12h1.5M19.5 12H21M4.6 19.4l1.1-1.1M18.3 5.7l1.1-1.1" />
    </svg>
  );
}

export function MoonIcon({ className = "h-5 w-5", strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M19.5 14.5A7.5 7.5 0 019.5 4.5a7.5 7.5 0 1010 10z" />
    </svg>
  );
}
