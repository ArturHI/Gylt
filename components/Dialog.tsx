"use client";

import { useEffect, useRef } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

/**
 * A small window in the middle of the screen, over a dimmed page.
 *
 * It uses the browser's own <dialog> element, which handles the hard parts
 * for free: centering above everything else, closing on Escape, and keeping
 * keyboard focus inside while it is open.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // <dialog> is opened and closed by calling methods on it, not by a prop,
  // so this keeps the element in step with `open`.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Escape asks the dialog to "cancel". We stop the browser closing it
      // by itself and go through onClose instead, so there is exactly one
      // way a dialog closes: `open` becoming false. (Listening for the
      // browser's own "close" event caused a bug: it arrives late, and
      // could shut a dialog that had just been opened again.)
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A click on the dimmed area lands on the <dialog> itself, while a
      // click inside lands on the inner <div>. Only the first one closes.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl shadow-black/60 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-5">
        <h3 className="text-sm font-medium">{title}</h3>
        {/* Rendered only while open, so a form inside starts fresh each time. */}
        {open && <div className="mt-4">{children}</div>}
      </div>
    </dialog>
  );
}
