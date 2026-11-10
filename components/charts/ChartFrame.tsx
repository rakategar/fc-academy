"use client";
import { useInView } from "motion/react";
import { useRef } from "react";

/** Grafik baru dirender saat masuk layar, sehingga animasinya tampil progresif ketika digulir. */
export function ChartFrame({ height = 260, children, className = "" }: { height?: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} className={`w-full ${className}`} style={{ height }}>
      {inView ? children : <div className="skeleton h-full w-full" />}
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: string; note?: string }[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
          <span className="font-medium text-ink">{i.name}</span>
          {i.note && <span className="num">{i.note}</span>}
        </li>
      ))}
    </ul>
  );
}

export const axisProps = {
  tick: { fontSize: 11, fill: "var(--ink-muted)" },
  tickLine: false,
  axisLine: false,
} as const;

export function TooltipBox({ active, payload, label, unit = "" }: { active?: boolean; payload?: { name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }[]; label?: string | number; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-line bg-panel px-3 py-2 text-xs shadow-[var(--shadow-dropdown)]">
      {label !== undefined && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-muted">{p.name}</span>
          <span className="num ml-auto font-medium">
            {typeof p.value === "number" ? p.value.toLocaleString("id-ID", { maximumFractionDigits: 1 }) : p.value}
            {unit}
          </span>
        </p>
      ))}
    </div>
  );
}
