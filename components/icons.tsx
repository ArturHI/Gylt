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
