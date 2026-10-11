// The kinds of button used inside pop-ups, kept in one place so they match.

// active:scale gives a slight "press" when clicked.
const BASE =
  "rounded-full px-4 py-1.5 font-medium transition active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100";

/** The main action: filled purple. */
export const BUTTON_PRIMARY = `${BASE} bg-accent text-white hover:opacity-85`;
/** Anything that just backs out: outlined. */
export const BUTTON_SECONDARY = `${BASE} border border-line text-ink hover:border-muted`;
/** A destructive action: filled red. */
export const BUTTON_DANGER = `${BASE} bg-danger text-white hover:opacity-85`;
