"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { CopyCheck, Eraser, Save } from "lucide-react";
import { saveAssessment } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, inputCls } from "@/components/ui/Field";
import { PositionTag } from "@/components/ui/Badge";
import { valueTone } from "@/lib/scoring";
import { CATEGORIES, type AssessmentItem, type Position } from "@/lib/types";

export interface FormPlayer { id: string; name: string; group: string; position: Position; last: Record<number, number> | null }
export interface EditTarget { id: string; player_id: string; assessed_on: string; session_id: string | null; notes: string | null; scores: Record<number, number> }

const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("id-ID", { maximumFractionDigits: 1 }));

export function AssessmentForm({ players, items, sessions, today, defaultPlayer, edit }: {
  players: FormPlayer[]; items: AssessmentItem[]; sessions: { id: string; label: string }[]; today: string; defaultPlayer?: string; edit?: EditTarget;
}) {
  const [state, action, pending] = useActionState(saveAssessment, undefined);
  const [player, setPlayer] = useState(edit?.player_id ?? defaultPlayer ?? "");
  const [vals, setVals] = useState<Record<number, number>>(edit?.scores ?? {});
  const [formKey, setFormKey] = useState(0);
  const p = players.find((x) => x.id === player);
  const mine = useMemo(() => (p ? items.filter((i) => i.applies_to === "semua" || (i.applies_to === "kiper") === (p.position === "GK")) : []), [p, items]);

  useEffect(() => { if (!edit) setVals({}); }, [player, edit]);
  useEffect(() => {
    if (state?.ok && !edit) { setVals({}); setPlayer(""); setFormKey((k) => k + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }, [state, edit]);

  const catAvg = (c: string) => {
    const xs = mine.filter((i) => i.category === c && vals[i.id]).map((i) => vals[i.id]);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const avgs = CATEGORIES.map((c) => catAvg(c.key)).filter((x): x is number => x !== null);
  const overall = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
  const filled = mine.filter((i) => vals[i.id]).length;
  const groups = [...new Set(players.map((x) => x.group))];

  return (
    <form key={formKey} action={action} className="space-y-4">
      {edit && <input type="hidden" name="id" value={edit.id} />}
      <Field label="Pemain" required>
        <select name="player_id" value={player} onChange={(e) => setPlayer(e.target.value)} className={inputCls} required disabled={!!edit}>
          <option value="">Pilih pemain dari skuadmu…</option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {players.filter((x) => x.group === g).map((x) => <option key={x.id} value={x.id}>{x.name}{x.position === "GK" ? " (Kiper)" : ""}</option>)}
            </optgroup>
          ))}
        </select>
        {edit && <input type="hidden" name="player_id" value={player} />}
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tanggal tes" required><input type="date" name="assessed_on" max={today} defaultValue={edit?.assessed_on ?? today} className={inputCls} required /></Field>
        <Field label="Sesi latihan" help="Opsional">
          <select name="session_id" className={inputCls} defaultValue={edit?.session_id ?? ""}>
            <option value="">Tanpa sesi tertentu</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
      </div>

      {p && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-[8px] bg-sunken px-3 py-2 text-sm">
            <PositionTag position={p.position} />
            <span className="flex-1">{p.position === "GK" ? "Item tes kiper" : "Item tes pemain lapangan"} · <b className="num">{filled}/{mine.length}</b> terisi</span>
            {p.last && !edit && <Button type="button" size="sm" variant="secondary" onClick={() => setVals({ ...p.last! })}><CopyCheck size={15} /> Sama dengan terakhir</Button>}
            {filled > 0 && <Button type="button" size="sm" variant="ghost" onClick={() => setVals({})}><Eraser size={15} /> Kosongkan</Button>}
          </div>

          {CATEGORIES.map((c) => {
            const list = mine.filter((i) => i.category === c.key);
            if (!list.length) return null;
            const a = catAvg(c.key);
            return (
              <fieldset key={c.key} className="rounded-[10px] border border-line">
                <legend className="ml-3 px-1.5 text-sm font-semibold">{c.label}</legend>
                <div className="-mt-1 flex justify-end px-4"><span className={`num rounded-full px-2.5 py-0.5 text-xs font-semibold ${valueTone(a)}`}>Rata-rata {fmt(a)}</span></div>
                <ul className="divide-y divide-line">
                  {list.map((it) => (
                    <li key={it.id} className="px-3 py-3 md:px-4">
                      <div className="mb-2 flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{it.name} {it.test_hint && <span className="caption font-normal">· {it.test_hint}</span>}</p>
                        <span className={`num shrink-0 rounded-[6px] px-2 py-0.5 text-sm font-semibold ${valueTone(vals[it.id] ?? null)}`}>{vals[it.id] ?? "–"}</span>
                      </div>
                      <input type="hidden" name={`s_${it.id}`} value={vals[it.id] ?? ""} />
                      <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label={`Nilai ${it.name}`}>
                        {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => {
                          const on = vals[it.id] === n;
                          const below = vals[it.id] !== undefined && n < vals[it.id];
                          return (
                            <button
                              key={n} type="button" role="radio" aria-checked={on}
                              onClick={() => setVals((v) => ({ ...v, [it.id]: n }))}
                              className={`num h-10 rounded-[6px] text-sm font-semibold transition-colors md:h-9 ${on ? "bg-brand text-white" : below ? "bg-brand-soft text-brand" : "border border-line-strong text-ink-muted hover:bg-sunken"}`}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              </fieldset>
            );
          })}

          <div className="sticky bottom-[72px] z-10 flex items-center justify-between rounded-[10px] border border-line bg-panel/95 px-4 py-3 backdrop-blur md:bottom-3">
            <div className="text-sm">
              <p className="text-ink-muted">Nilai rata-rata</p>
              <p className="num caption">{CATEGORIES.map((c) => `${c.label} ${fmt(catAvg(c.key))}`).join(" · ")}</p>
            </div>
            <span className={`num rounded-full px-3 py-1 text-xl font-semibold ${valueTone(overall)}`}>{fmt(overall)}</span>
          </div>

          <Field label="Catatan coach" help="Terlihat oleh pemain di halaman Nilai & Peringkat">
            <textarea name="notes" rows={3} defaultValue={edit?.notes ?? ""} className={`${inputCls} h-auto py-2`} placeholder="Mis. refleks makin cepat, perlu latihan distribusi bola." />
          </Field>
        </>
      )}
      {state?.error && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {state.error}</p>}
      {state?.ok && <p role="status" className="rounded-[6px] bg-hadir-bg px-3 py-2 text-sm text-hadir-ink">✓ {state.ok}</p>}
      <Button type="submit" size="lg" variant="accent" className="w-full" disabled={pending || !p || filled < mine.length}>
        <Save size={18} /> {pending ? "Menyimpan…" : !p ? "Pilih pemain dulu" : filled < mine.length ? `Isi ${mine.length - filled} tes lagi` : edit ? "Simpan perubahan" : "Simpan penilaian"}
      </Button>
    </form>
  );
}
