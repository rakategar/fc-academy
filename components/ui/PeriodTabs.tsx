import Link from "next/link";
import { PERIODS } from "@/lib/format";

/** Pemilih periode berbasis tautan (tetap jalan tanpa JS). */
export function PeriodTabs({ current, basePath, extra = {} }: { current: string; basePath: string; extra?: Record<string, string | undefined> }) {
  return (
    <div className="inline-flex rounded-[8px] border border-line bg-panel p-1" role="tablist" aria-label="Periode">
      {PERIODS.map((p) => {
        const params = new URLSearchParams(Object.entries({ ...extra, periode: p.key }).filter(([, v]) => v) as [string, string][]);
        const active = p.key === current;
        return (
          <Link
            key={p.key}
            href={`${basePath}?${params}`}
            role="tab"
            aria-selected={active}
            className={`h-9 rounded-[6px] px-3 text-[13px] leading-9 font-medium whitespace-nowrap ${active ? "bg-brand text-white" : "text-ink-muted hover:text-ink"}`}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
