type CardProps = {
  title: string;
  /** A small icon shown before the title. */
  icon?: React.ReactNode;
  /** Optional controls shown in the top-right corner, like a toggle. */
  actions?: React.ReactNode;
  /** Optional button pinned to the bottom-right corner, above the content. */
  cornerAction?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * The shared frame for every section, so all six look and space the same.
 *
 * The title doubles as the handle for moving the section: DashboardGrid
 * only starts a drag from an element with the "card-handle" class, which
 * leaves links, buttons and text inside the card free to behave normally.
 */
export function Card({ title, icon, actions, cornerAction, children }: CardProps) {
  return (
    // The inset shadow is a faint highlight along the top edge.
    <section className="relative flex h-full min-w-0 flex-col rounded-2xl border border-line bg-surface p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      {/* A fixed height keeps every title on the same line, with or without actions. */}
      <header className="flex h-6 items-center gap-3">
        <h2 className="card-handle flex min-w-0 flex-1 cursor-grab select-none items-center gap-2 text-sm font-medium active:cursor-grabbing">
          {icon && <span className="shrink-0 text-muted">{icon}</span>}
          <span className="truncate">{title}</span>
        </h2>
        {actions}
      </header>
      {/* min-h-0 lets this area shrink and scroll when the card is made small. */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      {/* Sits just inside the corner so it does not cover the resize grip. */}
      {cornerAction && <div className="absolute bottom-5 right-5">{cornerAction}</div>}
    </section>
  );
}

/** Pulsing bars shown while a card's data is on its way. */
export function CardSkeleton() {
  return (
    // motion-safe: the pulse is skipped for people who ask for less motion.
    <div role="status" aria-label="Loading" className="flex flex-col gap-3.5 motion-safe:animate-pulse">
      <div className="h-3 w-3/4 rounded-full bg-line" />
      <div className="h-3 w-1/2 rounded-full bg-line" />
      <div className="h-3 w-2/3 rounded-full bg-line" />
    </div>
  );
}

/** A quiet, centered line for cards with nothing to show (yet). */
export function CardMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-auto max-w-[28ch] text-center leading-relaxed text-muted">{children}</p>
  );
}
