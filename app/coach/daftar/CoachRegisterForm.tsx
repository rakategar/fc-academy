"use client";
import { useActionState, useState } from "react";
import { Send } from "lucide-react";
import { registerCoach } from "./actions";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function CoachRegisterForm({ groups, initial }: { groups: { id: number; name: string; range: string }[]; initial: { full_name: string; phone: string; groups: number[]; focus: string } }) {
  const [state, action, pending] = useActionState(registerCoach, undefined);
  const [sel, setSel] = useState<number[]>(initial.groups);
  const [focus, setFocus] = useState(initial.focus);
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <form action={action} className="space-y-4">
      <Field label="Nama lengkap" required>
        <input name="full_name" defaultValue={initial.full_name} className={inputCls} autoComplete="name" required />
      </Field>
      <Field label="No. HP / WhatsApp" required>
        <input name="phone" inputMode="tel" defaultValue={initial.phone} className={inputCls} placeholder="08…" required />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Kelompok usia yang dipegang <span className="text-alpa">*</span></legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {groups.map((g) => (
            <label key={g.id} className={`flex h-14 cursor-pointer flex-col justify-center rounded-[6px] border px-3 text-sm ${sel.includes(g.id) ? "border-accent bg-accent-soft font-semibold text-accent" : "border-line-strong"}`}>
              <input type="checkbox" name="age_group_ids" value={g.id} checked={sel.includes(g.id)} onChange={() => toggle(g.id)} className="sr-only" />
              {g.name}<span className="caption font-normal">{g.range}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Fokus melatih</legend>
        <div className="grid grid-cols-2 gap-2">
          {[{ v: "semua", l: "Semua posisi", d: "Pelatih kelompok usia" }, { v: "kiper", l: "Khusus kiper", d: "Pelatih penjaga gawang" }].map((o) => (
            <label key={o.v} className={`flex cursor-pointer flex-col rounded-[6px] border px-3 py-2.5 text-sm ${focus === o.v ? "border-accent bg-accent-soft font-semibold text-accent" : "border-line-strong"}`}>
              <input type="radio" name="focus" value={o.v} checked={focus === o.v} onChange={() => setFocus(o.v)} className="sr-only" />
              {o.l}<span className="caption font-normal">{o.d}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {state?.error && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending || !sel.length}>
        <Send size={18} /> {pending ? "Mengirim…" : "Kirim pendaftaran"}
      </Button>
      <p className="caption text-center">Ini usulan. Admin yang menetapkan skuad akhirmu.</p>
    </form>
  );
}
