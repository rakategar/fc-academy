"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import { savePerformance } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, inputCls } from "@/components/ui/Field";

const ASPECTS = [
  { k: "teknik", label: "Teknik", help: "Kontrol, passing, dribel, finishing" },
  { k: "fisik", label: "Fisik", help: "Stamina, kecepatan, kekuatan" },
  { k: "taktik", label: "Taktik", help: "Posisi, membaca permainan, transisi" },
  { k: "mental", label: "Mental", help: "Fokus, percaya diri, kerja sama" },
  { k: "disiplin", label: "Disiplin", help: "Tepat waktu, sikap, ikut instruksi" },
] as const;

function tone(v: number) {
  return v >= 85 ? "text-hadir-ink bg-hadir-bg" : v >= 75 ? "text-izin-ink bg-izin-bg" : v >= 65 ? "text-sakit-ink bg-sakit-bg" : "text-alpa-ink bg-alpa-bg";
}

export function PerformanceForm({
  players, sessions, defaultPlayer, today,
}: {
  players: { id: string; name: string; group: string; last: Record<string, number> | null }[];
  sessions: { id: string; label: string; date: string }[];
  defaultPlayer?: string;
  today: string;
}) {
  const [state, action, pending] = useActionState(savePerformance, undefined);
  const [player, setPlayer] = useState(defaultPlayer ?? "");
  const last = players.find((p) => p.id === player)?.last ?? null;
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(ASPECTS.map((a) => [a.k, last?.[a.k] ?? 70])));
  const [date, setDate] = useState(today);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setVals(Object.fromEntries(ASPECTS.map((a) => [a.k, last?.[a.k] ?? 70])));
  }, [player]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state?.ok) { formRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.form?.reset(); setPlayer(""); }
  }, [state]);

  const avg = ASPECTS.reduce((s, a) => s + vals[a.k], 0) / ASPECTS.length;
  const groups = [...new Set(players.map((p) => p.group))];

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field label="Pemain" required>
        <select name="player_id" value={player} onChange={(e) => setPlayer(e.target.value)} className={inputCls} required>
          <option value="">Pilih pemain…</option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {players.filter((p) => p.group === g).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </optgroup>
          ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tanggal penilaian" required><input type="date" name="review_date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required /></Field>
        <Field label="Sesi latihan" help="Opsional">
          <select name="session_id" className={inputCls} defaultValue="">
            <option value="">Tanpa sesi tertentu</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
      </div>

      <fieldset className="space-y-4 rounded-[10px] border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Nilai 0–100 {last && <span className="caption font-normal">· diisi dari penilaian terakhir, geser untuk mengubah</span>}</legend>
        {ASPECTS.map((a) => (
          <div key={a.k}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <label htmlFor={`r-${a.k}`} className="text-sm font-medium">{a.label} <span className="caption">{a.help}</span></label>
              <input
                type="number" min={0} max={100} value={vals[a.k]} aria-label={`${a.label} angka`}
                onChange={(e) => setVals((v) => ({ ...v, [a.k]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                className={`num h-9 w-16 rounded-[6px] text-center text-[15px] font-semibold ${tone(vals[a.k])}`}
              />
            </div>
            <input id={`r-${a.k}`} type="range" name={a.k} min={0} max={100} value={vals[a.k]} onChange={(e) => setVals((v) => ({ ...v, [a.k]: Number(e.target.value) }))} className="h-8 w-full" />
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm text-ink-muted">Rata-rata penilaian</span>
          <span className={`num rounded-full px-3 py-1 text-lg font-semibold ${tone(avg)}`}>{avg.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</span>
        </div>
      </fieldset>

      <Field label="Catatan coach" help="Terlihat oleh pemain di halaman Performa Saya">
        <textarea name="notes" rows={3} className={`${inputCls} h-auto py-2`} placeholder="Mis. kontrol bola makin rapi, perlu tambah stamina." />
      </Field>
      {state?.error && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {state.error}</p>}
      {state?.ok && <p role="status" className="rounded-[6px] bg-hadir-bg px-3 py-2 text-sm text-hadir-ink">✓ {state.ok}</p>}
      <Button type="submit" size="lg" variant="accent" className="w-full" disabled={pending || !player}><Save size={18} /> {pending ? "Menyimpan…" : "Simpan penilaian"}</Button>
    </form>
  );
}
