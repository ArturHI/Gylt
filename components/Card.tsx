type CardProps = {
  title: string;
  children: React.ReactNode;
};

/** The shared frame for every section, so all six look and space the same. */
export function Card({ title, children }: CardProps) {
  return (
    <section className="flex min-h-48 min-w-0 flex-col rounded-xl border border-line bg-surface p-5">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted">{title}</h2>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

/** A quiet, centered line for cards with nothing to show (yet). */
export function CardMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-auto max-w-[28ch] text-center leading-relaxed text-muted">{children}</p>
  );
}
