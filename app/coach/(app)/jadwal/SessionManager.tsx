"use client";
import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Ban, CalendarPlus, ClipboardCheck, Clock, MapPin, Pencil, Trash2, Users } from "lucide-react";
import { deleteSession, saveSession, setSessionStatus } from "./actions";
import { Modal } from "@/components/ui/Modal";
import { Button, btn } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, inputCls } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Panel";
import { SESSION_KINDS, type AgeGroup, type SessionStatus } from "@/lib/types";

export interface SessionRow {
  id: string; date: string; dateLabel: string; day: string; start: string; end: string; kind: string; focus: string | null;
  groupId: number | null; group: string; location: string; status: SessionStatus; recorded: number;
}

const DAY_TONE: Record<string, string> = {
  Senin: "bg-tint-sky text-[#0b84c6]", Selasa: "bg-tint-blue text-accent", Rabu: "bg-tint-sky text-[#0b84c6]", Kamis: "bg-tint-sky text-[#0b84c6]",
  Jumat: "bg-tint-green text-[#1f9d55]", Sabtu: "bg-tint-orange text-[#ea8a0c]", Minggu: "bg-tint-purple text-[#7c4ddb]",
};
export { DAY_TONE };

function StatusBadge({ s }: { s: SessionStatus }) {
  return s === "selesai" ? <Badge tone="hadir">Selesai</Badge> : s === "batal" ? <Badge tone="alpa">Batal</Badge> : <Badge tone="izin">Terjadwal</Badge>;
}

function SessionForm({ row, groups, today, onDone }: { row: SessionRow | null; groups: AgeGroup[]; today: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveSession, undefined);
  useEffect(() => { if (state?.ok) onDone(); }, [state, onDone]);
  return (
    <form action={action} className="space-y-4">
      {row && <input type="hidden" name="id" value={row.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" required className="col-span-2 sm:col-span-1"><input type="date" name="session_date" defaultValue={row?.date ?? today} className={inputCls} required /></Field>
        <Field label="Jenis latihan" required className="col-span-2 sm:col-span-1">
          <select name="kind" defaultValue={row?.kind ?? "Latihan Rutin"} className={inputCls}>{SESSION_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
        </Field>
        <Field label="Mulai" required><input type="time" name="start_time" defaultValue={row?.start ?? "15:30"} className={inputCls} required /></Field>
        <Field label="Selesai" required><input type="time" name="end_time" defaultValue={row?.end ?? "17:00"} className={inputCls} required /></Field>
      </div>
      <Field label="Fokus materi" help="Mis. fisik, teknik, taktik"><input name="focus" defaultValue={row?.focus ?? ""} className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kelompok usia">
          <select name="age_group_id" defaultValue={row?.groupId ?? ""} className={inputCls}>
            <option value="">Semua kelompok</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>
        <Field label="Lokasi"><input name="location" defaultValue={row?.location ?? "Lapangan UNESA"} className={inputCls} /></Field>
        {row ? (
          <Field label="Status">
            <select name="status" defaultValue={row.status} className={inputCls}>
              <option value="terjadwal">Terjadwal</option><option value="selesai">Selesai</option><option value="batal">Batal</option>
            </select>
          </Field>
        ) : (
          <Field label="Ulangi tiap minggu" help="Jumlah minggu, termasuk minggu ini">
            <input type="number" name="repeat" min={1} max={12} defaultValue={1} className={inputCls} />
          </Field>
        )}
      </div>
      {state?.error && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {state.error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>Batal</Button>
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : row ? "Simpan jadwal" : "Tambah jadwal"}</Button>
      </div>
    </form>
  );
}

export function SessionManager({ rows, groups, today, scope }: { rows: SessionRow[]; groups: AgeGroup[]; today: string; scope: string }) {
  const [editing, setEditing] = useState<SessionRow | null | "new">(null);
  const [busy, start] = useTransition();
  const close = () => setEditing(null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 md:px-5">
        <div className="inline-flex rounded-[8px] border border-line p-1">
          {[{ k: "mendatang", l: "Mendatang" }, { k: "lalu", l: "Sudah lewat" }].map((t) => (
            <Link key={t.k} href={`/coach/jadwal?lihat=${t.k}`} className={`h-9 rounded-[6px] px-3 text-[13px] leading-9 font-medium ${scope === t.k ? "bg-brand text-white" : "text-ink-muted"}`}>{t.l}</Link>
          ))}
        </div>
        <Button variant="accent" onClick={() => setEditing("new")}><CalendarPlus size={18} /> Tambah jadwal</Button>
      </div>

      {rows.length === 0 ? (
        <div className="p-4 md:p-5"><EmptyState icon={CalendarPlus} title={scope === "lalu" ? "Belum ada sesi yang lewat" : "Belum ada jadwal mendatang"} action={<Button size="sm" onClick={() => setEditing("new")}>Tambah jadwal</Button>}>Tambahkan sesi latihan; pakai “Ulangi tiap minggu” untuk jadwal rutin.</EmptyState></div>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-line border-t border-line md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[8px] text-center text-[11px] font-semibold ${DAY_TONE[r.day] ?? "bg-sunken"}`}>{r.day.slice(0, 3)}<br />{r.date.slice(8)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">{r.kind} <StatusBadge s={r.status} /></p>
                    <p className="caption mt-0.5">{r.dateLabel} · <span className="num">{r.start}–{r.end}</span> · {r.group}</p>
                    {r.focus && <p className="caption">{r.focus}</p>}
                  </div>
                </div>
                <div className="mt-2 flex gap-2 pl-15">
                  {r.status !== "batal" && <Link href={`/coach/absensi/${r.id}`} className={btn("secondary", "sm")}><ClipboardCheck size={15} /> {r.recorded ? "Lihat absensi" : "Absen"}</Link>}
                  <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil size={15} /> Ubah</Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 hidden overflow-x-auto border-t border-line md:block">
            <table className="w-full text-[13px]">
              <thead className="bg-sunken text-ink-muted">
                <tr>
                  {["Hari", "Tanggal", "Waktu", "Jenis latihan", "Kelompok", "Lokasi", "Absensi", "Status", ""].map((h, i) => (
                    <th key={i} scope="col" className={`px-3 py-2.5 font-medium ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={`h-12 border-b border-line hover:bg-sunken ${r.status === "batal" ? "text-ink-faint" : ""}`}>
                    <td className="px-3"><span className={`inline-flex h-7 items-center rounded-[6px] px-2.5 text-xs font-semibold ${DAY_TONE[r.day] ?? "bg-sunken"}`}>{r.day}</span></td>
                    <td className="px-3 whitespace-nowrap">{r.dateLabel}</td>
                    <td className="num px-3 whitespace-nowrap"><Clock size={13} className="mr-1 inline text-ink-faint" />{r.start} – {r.end}</td>
                    <td className="px-3"><p className="font-medium">{r.kind}</p>{r.focus && <p className="caption">{r.focus}</p>}</td>
                    <td className="px-3 whitespace-nowrap"><Users size={13} className="mr-1 inline text-ink-faint" />{r.group}</td>
                    <td className="px-3 whitespace-nowrap"><MapPin size={13} className="mr-1 inline text-ink-faint" />{r.location}</td>
                    <td className="num px-3 text-right">{r.recorded || "—"}</td>
                    <td className="px-3"><StatusBadge s={r.status} /></td>
                    <td className="px-3">
                      <div className="flex justify-end gap-1">
                        {r.status !== "batal" && <Link href={`/coach/absensi/${r.id}`} title="Absensi" className="grid h-9 w-9 place-items-center rounded-[6px] text-accent hover:bg-accent-soft"><ClipboardCheck size={17} /></Link>}
                        <button title="Ubah" onClick={() => setEditing(r)} className="grid h-9 w-9 place-items-center rounded-[6px] text-ink-muted hover:bg-panel hover:text-ink"><Pencil size={16} /></button>
                        {r.status === "terjadwal" && <button title="Batalkan sesi" disabled={busy} onClick={() => start(() => setSessionStatus(r.id, "batal"))} className="grid h-9 w-9 place-items-center rounded-[6px] text-sakit-ink hover:bg-sakit-bg"><Ban size={16} /></button>}
                        <button
                          title="Hapus"
                          disabled={busy}
                          onClick={() => { if (window.confirm(`Hapus sesi ${r.dateLabel}?${r.recorded ? ` ${r.recorded} catatan absensinya ikut terhapus.` : ""}`)) start(() => deleteSession(r.id)); }}
                          className="grid h-9 w-9 place-items-center rounded-[6px] text-alpa hover:bg-alpa-bg"
                        ><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={editing !== null} onClose={close} title={editing === "new" ? "Tambah jadwal latihan" : "Ubah jadwal latihan"}>
        {editing !== null && <SessionForm row={editing === "new" ? null : editing} groups={groups} today={today} onDone={close} />}
      </Modal>
    </>
  );
}
