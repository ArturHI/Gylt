type CardProps = {
  title: string;
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
export function Card({ title, actions, cornerAction, children }: CardProps) {
  return (
    <section className="relative flex h-full min-w-0 flex-col rounded-xl border border-line bg-surface p-5">
      {/* A fixed height keeps every title on the same line, with or without actions. */}
      <header className="flex h-6 items-center gap-3">
        <h2 className="card-handle flex-1 cursor-grab select-none text-xs font-medium uppercase tracking-wider text-muted active:cursor-grabbing">
          {title}
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

/** A quiet, centered line for cards with nothing to show (yet). */
export function CardMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-auto max-w-[28ch] text-center leading-relaxed text-muted">{children}</p>
  );
}
