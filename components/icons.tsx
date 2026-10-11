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
