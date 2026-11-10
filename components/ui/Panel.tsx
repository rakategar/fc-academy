import type { LucideIcon } from "lucide-react";

export function Panel({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-[10px] border border-line bg-panel ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 md:px-5">
          <div className="flex min-w-0 items-start gap-2.5">
            {Icon && (
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-brand-soft text-brand">
                <Icon size={18} strokeWidth={2} />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="h2">{title}</h2>}
              {subtitle && <p className="caption mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`p-4 md:p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 md:mb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-brand text-white sm:grid">
            <Icon size={24} />
          </span>
        )}
        <div>
          <h1 className="h1">{title}</h1>
          <p className="text-[15px] font-semibold text-accent">UNESA FC ACADEMY</p>
          {subtitle && <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon?: LucideIcon; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[10px] border border-dashed border-line-strong px-6 py-10 text-center">
      {Icon && <Icon size={28} className="text-ink-faint" />}
      <p className="font-semibold">{title}</p>
      {children && <p className="max-w-[48ch] text-sm text-ink-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Avatar({ name, size = 36, tone = "brand" }: { name: string; size?: number; tone?: "brand" | "gold" }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold ${tone === "brand" ? "bg-brand-soft text-brand" : "bg-gold-soft text-gold-ink"}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {ini}
    </span>
  );
}
