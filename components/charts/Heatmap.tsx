"use client";
import { motion, useReducedMotion } from "motion/react";
import type { AttendanceStatus } from "@/lib/types";

const COLOR: Record<AttendanceStatus, string> = {
  hadir: "var(--hadir)",
  izin: "var(--izin)",
  sakit: "var(--sakit)",
  alpa: "var(--alpa)",
};
const SHORT: Record<AttendanceStatus, string> = { hadir: "H", izin: "I", sakit: "S", alpa: "A" };

/** Pola konsistensi: pemain × sesi. Kolom muncul berurutan dari kiri. */
export function Heatmap({
  rows,
  cols,
}: {
  rows: { id: string; name: string; pct: number | null; cells: (AttendanceStatus | null)[] }[];
  cols: { id: string; label: string; title: string }[];
}) {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-[3px] text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-panel pr-2 text-left font-medium text-ink-muted">Pemain</th>
            {cols.map((c) => (
              <th key={c.id} title={c.title} className="num h-10 w-6 align-bottom font-normal text-ink-faint">
                <span className="inline-block origin-bottom-left -rotate-60 translate-x-2 whitespace-nowrap">{c.label}</span>
              </th>
            ))}
            <th className="pl-2 text-right font-medium text-ink-muted">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="sticky left-0 z-10 max-w-[150px] truncate bg-panel pr-2 text-left font-medium">{r.name}</th>
              {r.cells.map((s, i) => (
                <td key={i} className="p-0">
                  <motion.div
                    title={s ? `${cols[i].title}: ${s}` : `${cols[i].title}: tidak tercatat`}
                    className="grid h-6 w-6 place-items-center rounded-[4px] text-[10px] font-semibold text-white"
                    style={{ background: s ? COLOR[s] : "var(--panel-sunken)" }}
                    initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: reduce ? 0 : i * 0.025, duration: 0.25 }}
                  >
                    {s && s !== "hadir" ? SHORT[s] : ""}
                  </motion.div>
                </td>
              ))}
              <td className="num pl-2 text-right font-medium">{r.pct === null ? "—" : `${Math.round(r.pct)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
