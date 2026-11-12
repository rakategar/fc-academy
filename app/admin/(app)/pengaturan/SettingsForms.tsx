"use client";
import { useActionState } from "react";
import { changePassword, saveGroups, saveItems, saveSeasons } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, inputCls } from "@/components/ui/Field";
import { CATEGORIES, type AgeGroup, type AssessmentItem, type Season } from "@/lib/types";

function Msg({ s }: { s?: { error?: string; ok?: string } }) {
  if (s?.error) return <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {s.error}</p>;
  if (s?.ok) return <p role="status" className="rounded-[6px] bg-hadir-bg px-3 py-2 text-sm text-hadir-ink">✓ {s.ok}</p>;
  return null;
}

export function PasswordForm() {
  const [s, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label="Password saat ini" required><input type="password" name="current" autoComplete="current-password" className={inputCls} required /></Field>
      <Field label="Password baru" required help="Minimal 8 karakter"><input type="password" name="next" autoComplete="new-password" className={inputCls} required /></Field>
      <Field label="Ulangi password baru" required><input type="password" name="confirm" autoComplete="new-password" className={inputCls} required /></Field>
      <Msg s={s} />
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Ganti password"}</Button>
    </form>
  );
}

export function GroupsForm({ groups }: { groups: AgeGroup[] }) {
  const [s, action, pending] = useActionState(saveGroups, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-ink-muted"><tr><th className="pb-2 text-left font-medium">Nama</th><th className="pb-2 text-left font-medium">Umur min</th><th className="pb-2 text-left font-medium">Umur maks</th></tr></thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id}>
                <td className="py-1 pr-2"><input type="hidden" name="id" value={g.id} /><input name={`name_${g.id}`} defaultValue={g.name} className={inputCls} /></td>
                <td className="py-1 pr-2"><input type="number" name={`min_${g.id}`} defaultValue={g.min_age} className={`${inputCls} num w-24`} /></td>
                <td className="py-1"><input type="number" name={`max_${g.id}`} defaultValue={g.max_age} className={`${inputCls} num w-24`} /></td>
              </tr>
            ))}
            <tr>
              <td className="pt-3 pr-2"><input name="new_name" placeholder="Tambah, mis. KU-20" className={inputCls} /></td>
              <td className="pt-3 pr-2"><input type="number" name="new_min" className={`${inputCls} num w-24`} /></td>
              <td className="pt-3"><input type="number" name="new_max" className={`${inputCls} num w-24`} /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="caption">Kelompok pemain baru ditentukan otomatis dari umurnya. Pemain lama tidak dipindahkan otomatis — ubah lewat Data Pemain bila perlu. Skuad coach memakai kelompok ini.</p>
      <Msg s={s} />
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan kelompok usia"}</Button>
    </form>
  );
}

export function SeasonsForm({ seasons }: { seasons: Season[] }) {
  const [s, action, pending] = useActionState(saveSeasons, undefined);
  return (
    <form action={action} className="space-y-3">
      <ul className="space-y-2">
        {seasons.map((x) => (
          <li key={x.id} className={`grid grid-cols-2 gap-2 rounded-[8px] border p-2.5 sm:grid-cols-[auto_1fr_150px_150px] sm:items-center ${x.is_active ? "border-accent bg-accent-soft/40" : "border-line"}`}>
            <input type="hidden" name="id" value={x.id} />
            <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1"><input type="radio" name="active" value={x.id} defaultChecked={x.is_active} className="h-4 w-4" /> Aktif</label>
            <input name={`name_${x.id}`} defaultValue={x.name} className={`${inputCls} col-span-2 sm:col-span-1`} aria-label="Nama musim" />
            <input type="date" name={`start_${x.id}`} defaultValue={x.start_date} className={inputCls} aria-label="Mulai" />
            <input type="date" name={`end_${x.id}`} defaultValue={x.end_date} className={inputCls} aria-label="Selesai" />
          </li>
        ))}
        <li className="grid grid-cols-2 gap-2 rounded-[8px] border border-dashed border-line-strong p-2.5 sm:grid-cols-[auto_1fr_150px_150px] sm:items-center">
          <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1"><input type="radio" name="active" value="new" className="h-4 w-4" /> Aktif</label>
          <input name="new_name" placeholder="Musim baru, mis. Musim 2027/2028" className={`${inputCls} col-span-2 sm:col-span-1`} />
          <input type="date" name="new_start" className={inputCls} aria-label="Mulai musim baru" />
          <input type="date" name="new_end" className={inputCls} aria-label="Selesai musim baru" />
        </li>
      </ul>
      <p className="caption">“Musim ini” di dashboard, peringkat, laporan, dan halaman pemain memakai musim yang aktif. Hanya satu musim bisa aktif.</p>
      <Msg s={s} />
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan musim"}</Button>
    </form>
  );
}

const APPLIES = { semua: "Semua posisi", lapangan: "Pemain lapangan", kiper: "Kiper" } as const;

export function ItemsForm({ items }: { items: AssessmentItem[] }) {
  const [s, action, pending] = useActionState(saveItems, undefined);
  return (
    <form action={action} className="space-y-4">
      {CATEGORIES.map((c) => (
        <fieldset key={c.key}>
          <legend className="mb-1.5 text-sm font-semibold">{c.label}</legend>
          <ul className="divide-y divide-line rounded-[8px] border border-line">
            {items.filter((i) => i.category === c.key).map((i) => (
              <li key={i.id} className="grid grid-cols-[auto_1fr] items-center gap-2 p-2 sm:grid-cols-[auto_1fr_1.3fr_auto]">
                <input type="hidden" name="id" value={i.id} />
                <input type="checkbox" name={`active_${i.id}`} defaultChecked={i.active} className="h-4 w-4" aria-label={`Aktifkan ${i.name}`} />
                <input name={`name_${i.id}`} defaultValue={i.name} className={`${inputCls} h-9`} aria-label="Nama tes" />
                <input name={`hint_${i.id}`} defaultValue={i.test_hint ?? ""} placeholder="Petunjuk tes" className={`${inputCls} col-span-2 h-9 sm:col-span-1`} aria-label="Petunjuk tes" />
                <span className={`col-span-2 justify-self-start rounded-full px-2 py-0.5 text-xs sm:col-span-1 ${i.applies_to === "kiper" ? "bg-gold-soft text-gold-ink" : "bg-sunken text-ink-muted"}`}>{APPLIES[i.applies_to]}</span>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}
      <fieldset className="rounded-[8px] border border-dashed border-line-strong p-3">
        <legend className="px-1 text-sm font-semibold">Tambah tes</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="new_name" placeholder="Nama tes, mis. Lari 30 meter" className={inputCls} />
          <input name="new_hint" placeholder="Petunjuk tes (opsional)" className={inputCls} />
          <select name="new_category" className={inputCls} defaultValue="fisik">{CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
          <select name="new_applies" className={inputCls} defaultValue="semua">{Object.entries(APPLIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
      </fieldset>
      <p className="caption">Hilangkan centang untuk menonaktifkan tes (riwayat nilai lama tetap tersimpan). Kiper otomatis memakai tes “Kiper” + “Semua posisi”; pemain lapangan memakai “Pemain lapangan” + “Semua posisi”.</p>
      <Msg s={s} />
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan kriteria"}</Button>
    </form>
  );
}
