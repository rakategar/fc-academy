import Link from "next/link";

/** Kerangka halaman masuk/daftar: panel brand navy + area formulir. */
const RAIL = { gold: "bg-gold", accent: "bg-accent", sky: "bg-[#38bdf8]" } as const;

export function AuthLayout({ title, subtitle, children, badge, rail = "gold", aside }: { title: string; subtitle?: string; children: React.ReactNode; badge?: string; rail?: keyof typeof RAIL; aside?: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative overflow-hidden bg-nav px-6 pt-8 pb-10 text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12">
        <span className={`absolute inset-y-0 left-0 w-[3px] ${RAIL[rail]}`} aria-hidden />
        <Link href="/" className="flex items-center gap-3">
          <img src="/brand/logo-96.png" alt="" className="h-12 w-12" />
          <span className="text-lg leading-5 font-extrabold">UNESA FC<br /><span className="text-sm tracking-[0.2em] text-gold">ACADEMY</span></span>
        </Link>
        <div className="mt-8 lg:mt-0">
          <img src="/brand/logo-256.png" alt="Logo UNESA FC Academy" className="mb-8 hidden h-48 w-auto lg:block" />
          {badge && <p className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-gold">{badge}</p>}
          <h1 className="text-[26px] leading-8 font-bold tracking-tight lg:text-[34px] lg:leading-[42px]">{title}</h1>
          {subtitle && <p className="mt-2 max-w-[44ch] text-[15px] text-nav-ink">{subtitle}</p>}
          {aside}
        </div>
        <p className="mt-10 hidden text-xs text-nav-ink/70 lg:block">© {new Date().getFullYear()} UNESA FC Academy · Sinergi Academy</p>
      </aside>
      <main className="flex items-start justify-center px-4 py-8 lg:items-center lg:px-10">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
