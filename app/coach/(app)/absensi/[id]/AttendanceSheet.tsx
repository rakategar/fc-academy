"use client";
import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCheck, MessageSquarePlus, Save, Search } from "lucide-react";
import { saveAttendance } from "../actions";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/Field";
import { PositionTag } from "@/components/ui/Badge";
import type { AttendanceStatus } from "@/lib/types";

export interface SheetRow { id: string; name: string; position: string; group: string; status: AttendanceStatus | null; note: string | null }

const OPTIONS: { v: AttendanceStatus; short: string; label: string; on: string }[] = [
  { v: "hadir", short: "H", label: "Hadir", on: "bg-hadir text-white border-hadir" },
  { v: "izin", short: "I", label: "Izin", on: "bg-izin text-white border-izin" },
  { v: "sakit", short: "S", label: "Sakit", on: "bg-sakit text-white border-sakit" },
  { v: "alpa", short: "A", label: "Tanpa keterangan", on: "bg-alpa text-white border-alpa" },
];

export function AttendanceSheet({ sessionId, rows, disabled }: { sessionId: string; rows: SheetRow[]; disabled?: string }) {
  const initial = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, { status: r.status ?? "hadir", note: r.note ?? "" }])), [rows]);
  const [state, setState] = useState<Record<string, { status: AttendanceStatus; note: string }>>(initial);
  const [saved, setSaved] = useState(() => Object.fromEntries(rows.map((r) => [r.id, r.status ? { status: r.status, note: r.note ?? "" } : null])));
  const [noteOpen, setNoteOpen] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();

  const counts = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  Object.values(state).forEach((s) => counts[s.status]++);
  const dirty = rows.filter((r) => { const s = saved[r.id]; return !s || s.status !== state[r.id].status || s.note !== state[r.id].note; });
  const visible = rows.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()));

  const set = (id: string, status: AttendanceStatus) => setState((s) => ({ ...s, [id]: { ...s[id], status } }));
  const save = () =>
    start(async () => {
      const res = await saveAttendance(sessionId, dirty.map((r) => ({ player_id: r.id, status: state[r.id].status, note: state[r.id].note || null })));
      if (res.error) { setMsg({ ok: false, text: res.error }); return; }
      setSaved(Object.fromEntries(rows.map((r) => [r.id, { ...state[r.id] }])));
      setMsg({ ok: true, text: `${res.saved} absensi tersimpan` });
      setTimeout(() => setMsg(null), 3000);
    });

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur md:top-0 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {OPTIONS.map((o) => (
            <span key={o.v} className={`num inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold bg-${o.v}-bg text-${o.v}-ink`}>
              <span className={`h-2 w-2 rounded-full bg-${o.v}`} />{o.v === "alpa" ? "Alpa" : o.label} {counts[o.v]}
            </span>
          ))}
          <Button size="sm" variant="secondary" className="ml-auto" disabled={!!disabled} onClick={() => setState((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { ...v, status: "hadir" }])))}>
            <CheckCheck size={16} /> Semua hadir
          </Button>
        </div>
        <div className="relative mt-2.5">
          <Search size={17} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Cari di ${rows.length} pemain…`} className={`${inputCls} pl-9`} aria-label="Cari pemain" />
        </div>
      </div>

      {disabled && <p className="mt-3 rounded-[6px] bg-sakit-bg px-3 py-2 text-sm text-sakit-ink">{disabled}</p>}

      <ul className="mt-3 space-y-2">
        {visible.map((r) => {
          const cur = state[r.id];
          const changed = !saved[r.id] || saved[r.id]!.status !== cur.status || saved[r.id]!.note !== cur.note;
          return (
            <li key={r.id} className={`rounded-[10px] border bg-panel p-3 ${changed && saved[r.id] ? "border-gold" : "border-line"}`}>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <PositionTag position={r.position} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="caption">{r.group}{!saved[r.id] && <span className="text-gold-ink"> · belum tersimpan</span>}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNoteOpen((n) => ({ ...n, [r.id]: !n[r.id] }))}
                    className={`ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-[6px] sm:hidden ${cur.note ? "text-accent" : "text-ink-faint"}`}
                    aria-label="Catatan"
                  ><MessageSquarePlus size={18} /></button>
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:w-[280px]" role="radiogroup" aria-label={`Kehadiran ${r.name}`}>
                  {OPTIONS.map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      role="radio"
                      aria-checked={cur.status === o.v}
                      title={o.label}
                      disabled={!!disabled}
                      onClick={() => set(r.id, o.v)}
                      className={`h-11 rounded-[6px] border text-[15px] font-bold transition-colors ${cur.status === o.v ? o.on : "border-line-strong bg-panel text-ink-muted hover:bg-sunken"}`}
                    >
                      {o.short}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setNoteOpen((n) => ({ ...n, [r.id]: !n[r.id] }))}
                  className={`hidden h-10 w-10 shrink-0 place-items-center rounded-[6px] hover:bg-sunken sm:grid ${cur.note ? "text-accent" : "text-ink-faint"}`}
                  aria-label="Catatan" title="Catatan"
                ><MessageSquarePlus size={18} /></button>
              </div>
              {(noteOpen[r.id] || (cur.status !== "hadir" && cur.status !== saved[r.id]?.status)) && (
                <input
                  value={cur.note}
                  onChange={(e) => setState((s) => ({ ...s, [r.id]: { ...s[r.id], note: e.target.value } }))}
                  placeholder="Catatan (mis. surat izin, cedera ringan)"
                  className={`${inputCls} mt-2`}
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] z-20 mt-4 md:bottom-4">
        <div className="flex items-center gap-3 rounded-[10px] border border-line bg-panel p-3 shadow-[var(--shadow-dropdown)]">
          <AnimatePresence mode="wait">
            {msg ? (
              <motion.p key="msg" role="status" aria-live="polite" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex-1 text-sm font-medium ${msg.ok ? "text-hadir-ink" : "text-alpa-ink"}`}>
                {msg.ok ? "✓" : "⚠"} {msg.text}
              </motion.p>
            ) : (
              <motion.p key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="caption flex-1">
                {dirty.length ? <><b className="num text-ink">{dirty.length}</b> perubahan belum disimpan</> : "Semua tersimpan"}
              </motion.p>
            )}
          </AnimatePresence>
          <Button variant="accent" size="lg" disabled={busy || !dirty.length || !!disabled} onClick={save}>
            <Save size={18} /> {busy ? "Menyimpan…" : `Simpan ${dirty.length || ""} absensi`}
          </Button>
        </div>
      </div>
    </div>
  );
}
