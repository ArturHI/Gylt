// Small outline icons, drawn as SVG so they stay sharp at any size and
// take their color from the surrounding text (stroke="currentColor").

type IconProps = { className?: string };

const outline = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      {/* Roof, with a chimney on the right slope */}
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M16.5 7.75V5h2v4.4" />
      {/* Walls and door */}
      <path d="M5.5 9.75V20h13V9.75" />
      <path d="M10 20v-5.5h4V20" />
    </svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      {/* Handle */}
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      {/* Body, the line across it, and the clasp */}
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M3 13h18" />
      <path d="M10.75 13v1.75h2.5V13" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** A flame. `lit` fills it in; otherwise it is only an outline. */
export function FlameIcon({ className, lit }: IconProps & { lit: boolean }) {
  return (
    <svg {...outline} fill={lit ? "currentColor" : "none"} className={className}>
      {/* Shape from the Lucide icon set (ISC license). */}
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

// --- Section icons, shown beside each card's title. ---------------------
// Shapes from the Lucide icon set (ISC license).

export function BookIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      <rect x="3" y="5" width="6" height="6" rx="1" />
      <path d="m3 17 2 2 4-4M13 6h8M13 12h8M13 18h8" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

/** The "translate" symbol (文 beside A), for the Duolingo section. */
export function LanguagesIcon({ className }: IconProps) {
  return (
    <svg {...outline} className={className}>
      {/* 文 on the left */}
      <path d="M2 5h12M7 2h1M4 14l6-6 2-3M5 8l6 6" />
      {/* A on the right */}
      <path d="m22 22-5-10-5 10M14 18h6" />
    </svg>
  );
}
