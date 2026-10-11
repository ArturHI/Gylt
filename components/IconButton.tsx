type IconButtonProps = {
  /** What the button does. Icons have no text, so this names it. */
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

/** A small round button holding just an icon, like a page arrow. */
export function IconButton({ label, disabled = false, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-full p-1 text-muted transition-colors hover:bg-line hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
    >
      {children}
    </button>
  );
}
