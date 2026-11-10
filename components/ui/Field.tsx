export const inputCls =
  "h-11 md:h-10 w-full rounded-[6px] border border-line-strong bg-panel px-3 text-[15px] md:text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-sunken";

export function Field({
  label,
  required,
  help,
  error,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  help?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-alpa"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 flex items-center gap-1 text-xs text-alpa-ink" role="alert">⚠ {error}</span>
      ) : help ? (
        <span className="caption mt-1 block">{help}</span>
      ) : null}
    </label>
  );
}
