"use client";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { motion } from "motion/react";
import { Crown, FileSpreadsheet, FileText, Medal, Star } from "lucide-react";
import { clearCandidates, toggleCandidate } from "./actions";
import { exportExcel, exportPdf } from "@/lib/export/client";
import type { Report } from "@/lib/export/types";
import { Button } from "@/components/ui/Button";
import { PositionTag, ScoreBadge } from "@/components/ui/Badge";
import { Avatar, EmptyState } from "@/components/ui/Panel";
import { Bar } from "@/components/motion/Reveal";

export interface RankRow { id: string; name: string; position: string; group: string; attendance: number | null; perf: number | null; score: number | null; candidate: boolean; eligible: boolean }

const fmt = (n: number | null, d = 1) => (n === null ? "—" : n.toLocaleString("id-ID", { maximumFractionDigits: d }));

export function SelectionBoard({ rows, meta }: { rows: RankRow[]; meta: { subtitle: string; minAtt: number; coach: string; generatedAt: string } }) {
  const [busy, start] = useTransition();
  const [opt, setOpt] = useOptimistic(rows, (state, u: { id: string; v: boolean } | "clear") =>
    u === "clear" ? state.map((r) => ({ ...r, candidate: false })) : state.map((r) => (r.id === u.id ? { ...r, candidate: u.v } : r)));
  const picked = opt.filter((r) => r.candidate);
  const podium = opt.filter((r) => r.eligible).slice(0, 3);

  const report = (): Report => ({
    title: "Daftar Kandidat Turnamen",
    subtitle: meta.subtitle,
    filename: `kandidat-turnamen_${new Date().toISOString().slice(0, 10)}`,
    generatedAt: meta.generatedAt,
    generatedBy: meta.coach,
    columns: [
      { key: "no", label: "No", align: "right" }, { key: "nama", label: "Nama pemain" }, { key: "posisi", label: "Posisi", align: "center" },
      { key: "kelompok", label: "Kelompok" }, { key: "hadir", label: "% Hadir", align: "right" }, { key: "perf", label: "Performa", align: "right" }, { key: "skor", label: "Skor", align: "right" },
    ],
    rows: picked.map((r, i) => ({ no: i + 1, nama: r.name, posisi: r.position, kelompok: r.group, hadir: r.attendance === null ? "—" : `${fmt(r.attendance)}%`, perf: fmt(r.perf), skor: fmt(r.score) })),
    summary: [
      { label: "Kandidat", value: String(picked.length) },
      { label: "GK / DF / MF / FW", value: ["GK", "DF", "MF", "FW"].map((p) => picked.filter((r) => r.position === p).length).join(" / ") },
      { label: "Syarat kehadiran", value: `≥ ${meta.minAtt}%` },
    ],
  });

  const medal = ["bg-gold text-nav", "bg-[#c9d1dc] text-ink", "bg-[#d79a62] text-white"];
  const order = [1, 0, 2];

  return (
    <div className="space-y-4">
      {podium.length >= 3 && (
        <div className="grid grid-cols-3 items-end gap-2 md:gap-4">
          {order.map((idx, col) => {
            const r = podium[idx];
            const h = [150, 190, 130][col];
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 * col, duration: 0.4 }} className="flex flex-col items-center text-center">
                {idx === 0 && <Crown className="mb-1 text-gold" size={26} />}
                <Avatar name={r.name} size={idx === 0 ? 56 : 46} tone={idx === 0 ? "gold" : "brand"} />
                <Link href={`/coach/pemain/${r.id}`} className="mt-1.5 line-clamp-2 text-[13px] font-semibold md:text-sm">{r.name}</Link>
                <p className="caption">{r.position} · {r.group}</p>
                <motion.div
                  className={`mt-2 flex w-full flex-col items-center justify-start rounded-t-[10px] pt-3 ${idx === 0 ? "bg-brand text-white" : "bg-brand-soft text-brand"}`}
                  initial={{ height: 0 }} whileInView={{ height: h * 0.6 }} viewport={{ once: true }} transition={{ delay: 0.2 + 0.15 * col, duration: 0.6, ease: [0.2, 0, 0, 1] }}
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${medal[idx]}`}>{idx + 1}</span>
                  <span className="num mt-1 text-lg font-semibold">{fmt(r.score)}</span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-gold/40 bg-gold-soft p-3">
        <Star size={18} className="text-gold-ink" />
        <p className="flex-1 text-sm text-gold-ink"><b className="num">{picked.length}</b> kandidat turnamen dipilih</p>
        <Button size="sm" variant="secondary" disabled={!picked.length} onClick={() => exportPdf(report())}><FileText size={15} /> PDF</Button>
        <Button size="sm" variant="secondary" disabled={!picked.length} onClick={() => exportExcel(report())}><FileSpreadsheet size={15} /> Excel</Button>
        <Button size="sm" variant="ghost" disabled={!picked.length || busy} onClick={() => start(async () => { setOpt("clear"); await clearCandidates(); })}>Kosongkan</Button>
      </div>

      {opt.length === 0 ? <EmptyState icon={Medal} title="Tidak ada pemain yang cocok dengan filter" /> : (
        <ol className="divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-panel">
          {opt.map((r, i) => (
            <li key={r.id} className={`flex items-center gap-3 px-3 py-2.5 md:px-4 ${!r.eligible ? "opacity-60" : ""} ${r.candidate ? "border-l-[3px] border-l-gold bg-gold-soft/40" : ""}`}>
              <span className={`num grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${i < 3 && r.eligible ? medal[i] : "bg-sunken"}`}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/coach/pemain/${r.id}`} className="flex items-center gap-2 font-medium hover:text-accent"><span className="truncate">{r.name}</span></Link>
                <p className="caption flex flex-wrap items-center gap-1.5"><PositionTag position={r.position} /> {r.group} · hadir <span className="num">{r.attendance === null ? "—" : `${Math.round(r.attendance)}%`}</span> · performa <span className="num">{fmt(r.perf)}</span>
                  {!r.eligible && <span className="text-alpa-ink">· di bawah syarat kehadiran</span>}</p>
              </div>
              <div className="hidden w-36 sm:block">
                <div className="flex items-center justify-between"><ScoreBadge score={r.score} /><span className="num font-semibold">{fmt(r.score)}</span></div>
                <Bar value={r.score ?? 0} className="mt-1 h-1.5" color={r.candidate ? "var(--gold)" : "var(--accent)"} />
              </div>
              <span className="num w-10 text-right font-semibold sm:hidden">{fmt(r.score, 0)}</span>
              <button
                onClick={() => start(async () => { setOpt({ id: r.id, v: !r.candidate }); await toggleCandidate(r.id, !r.candidate); })}
                aria-pressed={r.candidate}
                title={r.candidate ? "Hapus dari kandidat" : "Jadikan kandidat"}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border ${r.candidate ? "border-gold bg-gold text-nav" : "border-line-strong text-ink-faint hover:text-gold-ink"}`}
              >
                <Star size={18} fill={r.candidate ? "currentColor" : "none"} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
