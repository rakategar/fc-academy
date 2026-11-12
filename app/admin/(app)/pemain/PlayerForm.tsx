"use client";
import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { savePlayer } from "./actions";
import { Field, inputCls } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import { POSITIONS, type AgeGroup, type Player } from "@/lib/types";
import { ageFrom, todayISO } from "@/lib/format";

export function PlayerForm({ player, groups }: { player?: Player; groups: AgeGroup[] }) {
  const [state, action, pending] = useActionState(savePlayer, undefined);
  const [birth, setBirth] = useState(player?.birth_date ?? "");
  const age = /^\d{4}-\d{2}-\d{2}$/.test(birth) ? ageFrom(birth) : null;
  const auto = age !== null ? groups.find((g) => age >= g.min_age && age <= g.max_age) : undefined;

  return (
    <form action={action} className="space-y-5">
      {player && <input type="hidden" name="id" value={player.id} />}
      <fieldset className="space-y-4">
        <legend className="mb-1 text-[15px] font-semibold">Identitas</legend>
        <Field label="Nama lengkap" required>
          <input name="full_name" defaultValue={player?.full_name} className={inputCls} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal lahir" required help={age !== null ? <>Umur <b className="num">{age}</b> tahun — terhitung otomatis</> : undefined}>
            <input name="birth_date" type="date" max={todayISO()} value={birth} onChange={(e) => setBirth(e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Posisi" required>
            <select name="position" defaultValue={player?.position ?? ""} className={inputCls} required>
              <option value="" disabled>Pilih posisi</option>
              {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
        </div>
      </fieldset>
      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="mb-1 text-[15px] font-semibold">Tim & kontak</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kelompok usia" help="Otomatis mengikuti umur, bisa diubah">
            <select name="age_group_id" defaultValue={player?.age_group_id && player.age_group_id !== auto?.id ? String(player.age_group_id) : "auto"} className={`${inputCls} bg-brand-soft`}>
              <option value="auto">Otomatis{auto ? ` (${auto.name})` : ""}</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
          <Field label="Tim">
            <input name="team" defaultValue={player?.team ?? "UNESA FC ACADEMY"} className={inputCls} />
          </Field>
          <Field label="No. HP / WhatsApp">
            <input name="phone" inputMode="tel" defaultValue={player?.phone ?? ""} className={inputCls} />
          </Field>
          <Field label="No. punggung">
            <input name="jersey_no" type="number" min={1} max={99} defaultValue={player?.jersey_no ?? ""} className={inputCls} />
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={player?.status ?? "aktif"} className={inputCls}>
              <option value="aktif">Aktif</option>
              <option value="arsip">Diarsipkan</option>
            </select>
          </Field>
        </div>
      </fieldset>
      {state?.error && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {state.error}</p>}
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <LinkButton href={player ? `/admin/pemain/${player.id}` : "/admin/pemain"} variant="secondary">Batal</LinkButton>
        <Button type="submit" disabled={pending}><Save size={18} /> {pending ? "Menyimpan…" : player ? "Simpan perubahan" : "Tambah pemain"}</Button>
      </div>
    </form>
  );
}
