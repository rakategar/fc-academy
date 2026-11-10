"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarCheck, FileSpreadsheet, FileText, ListOrdered, Activity, Table2, Eye } from "lucide-react";
import { buildReport, type ReportKind } from "./actions";
import { exportExcel, exportPdf } from "@/lib/export/client";
import type { Report } from "@/lib/export/types";
import { Button } from "@/components/ui/Button";
import { Field, inputCls } from "@/components/ui/Field";

const KINDS: { k: ReportKind; title: string; desc: string; icon: typeof FileText }[] = [
  { k: "absensi", title: "Rekap absensi", desc: "Jumlah hadir, izin, sakit, tanpa keterangan, dan persentase tiap pemain.", icon: CalendarCheck },
  { k: "performa", title: "Rekap performa", desc: "Rata-rata nilai teknik, fisik, taktik, mental, disiplin.", icon: Activity },
  { k: "skor", title: "Skor & peringkat", desc: "Skor total gabungan kehadiran dan performa, diurutkan.", icon: ListOrdered },
  { k: "detail", title: "Detail absensi per sesi", desc: "Setiap catatan absensi lengkap dengan pencatatnya.", icon: Table2 },
];

export function ReportBuilder({ groups, defaults }: { groups: { id: number; name: string }[]; defaults: { from: string; to: string; presets: { label: string; from: string; to: string }[] } }) {
  const [kind, setKind] = useState<ReportKind>("absensi");
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [group, setGroup] = useState("");
  const [preview, setPreview] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [working, setWorking] = useState<"pdf" | "xlsx" | null>(null);

  const get = async () => {
    const res = await buildReport(kind, from, to, group ? Number(group) : null);
    if ("error" in res) { setError(res.error); return null; }
    setError(null); return res;
  };
  const run = (fmt: "pdf" | "xlsx" | "preview") =>
    start(async () => {
      if (fmt !== "preview") setWorking(fmt);
      try {
        const r = await get();
        if (!r) return;
        setPreview(r);
        if (fmt === "pdf") await exportPdf(r);
        if (fmt === "xlsx") await exportExcel(r);
      } catch { setError("Laporan gagal dibuat. Coba lagi."); }
      finally { setWorking(null); }
    });

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Jenis laporan</legend>
          <div className="grid gap-2">
            {KINDS.map(({ k, title, desc, icon: Icon }) => (
              <label key={k} className={`flex cursor-pointer gap-3 rounded-[10px] border p-3 ${kind === k ? "border-accent bg-accent-soft" : "border-line bg-panel hover:bg-sunken"}`}>
                <input type="radio" name="kind" className="sr-only" checked={kind === k} onChange={() => { setKind(k); setPreview(null); }} />
                <Icon size={20} className={`mt-0.5 shrink-0 ${kind === k ? "text-accent" : "text-ink-muted"}`} />
                <span><span className="block text-sm font-semibold">{title}</span><span className="caption">{desc}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-1.5">
          {defaults.presets.map((p) => (
            <button key={p.label} type="button" onClick={() => { setFrom(p.from); setTo(p.to); setPreview(null); }}
              className={`h-8 rounded-full border px-3 text-xs font-medium ${from === p.from && to === p.to ? "border-brand bg-brand text-white" : "border-line-strong text-ink-muted hover:bg-sunken"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dari tanggal"><input type="date" value={from} max={to} onChange={(e) => { setFrom(e.target.value); setPreview(null); }} className={inputCls} /></Field>
          <Field label="Sampai tanggal"><input type="date" value={to} min={from} onChange={(e) => { setTo(e.target.value); setPreview(null); }} className={inputCls} /></Field>
        </div>
        <Field label="Kelompok usia">
          <select value={group} onChange={(e) => { setGroup(e.target.value); setPreview(null); }} className={inputCls}>
            <option value="">Semua kelompok</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>
        {error && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button size="lg" onClick={() => run("pdf")} disabled={busy}><FileText size={18} /> {working === "pdf" ? "Membuat…" : "Unduh PDF"}</Button>
          <Button size="lg" variant="accent" onClick={() => run("xlsx")} disabled={busy}><FileSpreadsheet size={18} /> {working === "xlsx" ? "Membuat…" : "Unduh Excel"}</Button>
          <Button variant="secondary" className="col-span-2" onClick={() => run("preview")} disabled={busy}><Eye size={17} /> Pratinjau di layar</Button>
        </div>
      </div>

      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div key={preview.title + preview.subtitle} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="overflow-hidden rounded-[10px] border border-line bg-panel">
              <div className="flex items-center gap-3 bg-nav px-4 py-3 text-white">
                <img src="/brand/logo-96.png" alt="" className="h-9 w-9" />
                <div><p className="font-bold">UNESA FC ACADEMY</p><p className="text-xs text-nav-ink">{preview.title}</p></div>
              </div>
              <div className="h-[3px] bg-gold" />
              <div className="p-4">
                <p className="caption">{preview.subtitle}</p>
                {preview.summary && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {preview.summary.map((s) => <div key={s.label} className="rounded-[8px] bg-sunken p-2.5"><p className="caption">{s.label}</p><p className="num text-sm font-semibold">{s.value}</p></div>)}
                  </div>
                )}
              </div>
              <div className="max-h-[480px] overflow-auto border-t border-line">
                <table className="w-full text-[12.5px]">
                  <thead className="sticky top-0 bg-sunken text-ink-muted">
                    <tr>{preview.columns.map((c) => <th key={c.key} scope="col" className={`px-2.5 py-2 font-medium whitespace-nowrap ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"}`}>{c.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 200).map((r, i) => (
                      <tr key={i} className="h-9 border-b border-line">
                        {preview.columns.map((c) => <td key={c.key} className={`px-2.5 whitespace-nowrap ${c.align === "right" ? "num text-right" : c.align === "center" ? "text-center" : ""}`}>{r[c.key] ?? "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 200 && <p className="caption p-3">Menampilkan 200 dari {preview.rows.length} baris. File unduhan berisi semuanya.</p>}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid h-full min-h-[260px] place-items-center rounded-[10px] border border-dashed border-line-strong p-8 text-center">
              <div>
                <FileText size={32} className="mx-auto text-ink-faint" />
                <p className="mt-2 font-semibold">Pilih jenis laporan dan periode</p>
                <p className="caption mt-1">Ketuk “Pratinjau di layar” untuk melihat isi sebelum mengunduh.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
