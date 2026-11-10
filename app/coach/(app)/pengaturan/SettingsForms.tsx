"use client";
import { useActionState } from "react";
import { changePassword, saveGroups } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, inputCls } from "@/components/ui/Field";
import type { AgeGroup } from "@/lib/types";

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
      <p className="caption">Kelompok pemain baru ditentukan otomatis dari umurnya. Pemain lama tidak dipindahkan otomatis — ubah lewat Data Pemain bila perlu.</p>
      <Msg s={s} />
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan kelompok usia"}</Button>
    </form>
  );
}
