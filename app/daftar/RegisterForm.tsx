"use client";
import { useActionState, useState } from "react";
import { Send } from "lucide-react";
import { registerPlayer } from "./actions";
import { Field, inputCls } from "@/components/ui/Field";
import { DateInput } from "@/components/ui/DateTimeInputs";
import { Button } from "@/components/ui/Button";
import { POSITIONS, type AgeGroup } from "@/lib/types";
import { ageFrom, todayISO } from "@/lib/format";

export function RegisterForm({ defaultName, groups, initial }: { defaultName: string; groups: AgeGroup[]; initial?: Record<string, string> }) {
  const [state, action, pending] = useActionState(registerPlayer, undefined);
  const f = state?.fields ?? initial;
  const [birth, setBirth] = useState(f?.birth_date ?? "");
  const [pos, setPos] = useState(f?.position ?? "");
  const age = /^\d{4}-\d{2}-\d{2}$/.test(birth) ? ageFrom(birth) : null;
  const group = age !== null ? groups.find((g) => age >= g.min_age && age <= g.max_age) : null;

  return (
    <form action={action} className="space-y-4">
      <Field label="Nama lengkap" required>
        <input name="full_name" defaultValue={f?.full_name ?? defaultName} className={inputCls} autoComplete="name" required />
      </Field>
      <Field label="Tanggal lahir" required help={age !== null && age >= 0 ? <>Umur <b className="num">{age}</b> tahun{group ? <> · kelompok <b>{group.name}</b></> : null} — terhitung otomatis</> : "Umur dan kelompok usia dihitung otomatis"}>
        <DateInput name="birth_date" max={todayISO()} value={birth} onChange={setBirth} required />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Posisi <span className="text-alpa">*</span></legend>
        <div className="grid grid-cols-2 gap-2">
          {POSITIONS.map((p) => (
            <label key={p.value} className={`flex h-12 cursor-pointer items-center gap-2 rounded-[6px] border px-3 text-sm ${pos === p.value ? "border-accent bg-accent-soft font-semibold text-accent" : "border-line-strong"}`}>
              <input type="radio" name="position" value={p.value} checked={pos === p.value} onChange={() => setPos(p.value)} className="sr-only" />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Tim" help="Bawaan: UNESA FC ACADEMY">
        <input name="team" defaultValue={f?.team ?? "UNESA FC ACADEMY"} className={`${inputCls} bg-brand-soft`} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="No. HP / WhatsApp">
          <input name="phone" inputMode="tel" defaultValue={f?.phone} className={inputCls} placeholder="08…" />
        </Field>
        <Field label="No. punggung">
          <input name="jersey_no" type="number" min={1} max={99} defaultValue={f?.jersey_no} className={inputCls} />
        </Field>
      </div>
      {state?.error && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {state.error}</p>}
      <Button type="submit" size="lg" variant="accent" className="w-full" disabled={pending}>
        <Send size={18} /> {pending ? "Mengirim…" : "Kirim pendaftaran"}
      </Button>
    </form>
  );
}
