"use client";
import { useState, useTransition } from "react";
import { Check, Save, X } from "lucide-react";
import { approveCoach, rejectCoach, updateSquadRules } from "./actions";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/Field";

export interface GroupOpt { id: number; name: string; range: string }

/** Pilih kelompok usia + fokus coach. Mode "approve" untuk verifikasi, "edit" untuk mengubah aturan skuad. */
export function SquadRulesForm({ coachId, groups, initial, mode }: { coachId: string; groups: GroupOpt[]; initial: { groups: number[]; focus: string }; mode: "approve" | "edit" }) {
  const [sel, setSel] = useState(initial.groups);
  const [focus, setFocus] = useState(initial.focus);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [busy, start] = useTransition();
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const run = (fn: () => Promise<{ error?: string }>, ok: string) => start(async () => { const r = await fn(); setMsg(r.error ? { error: r.error } : { ok }); });

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-sm font-medium">Kelompok usia skuad</p>
        <div className="flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <button key={g.id} type="button" onClick={() => toggle(g.id)} aria-pressed={sel.includes(g.id)}
              className={`h-9 rounded-full border px-3 text-[13px] font-medium ${sel.includes(g.id) ? "border-accent bg-accent-soft text-accent" : "border-line-strong text-ink-muted"}`}>
              {g.name} <span className="caption">{g.range}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium">Fokus</p>
        <div className="inline-flex rounded-[8px] border border-line bg-panel p-1">
          {[{ v: "semua", l: "Semua posisi" }, { v: "kiper", l: "Khusus kiper" }].map((o) => (
            <button key={o.v} type="button" onClick={() => setFocus(o.v)} className={`h-8 rounded-[6px] px-3 text-[13px] font-medium ${focus === o.v ? "bg-brand text-white" : "text-ink-muted"}`}>{o.l}</button>
          ))}
        </div>
        <p className="caption mt-1">{focus === "kiper" ? "Hanya kiper (GK) dari kelompok terpilih yang otomatis masuk skuad." : "Semua pemain dari kelompok terpilih otomatis masuk skuad, termasuk kiper."}</p>
      </div>
      {msg?.error && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {msg.error}</p>}
      {msg?.ok && <p role="status" className="rounded-[6px] bg-hadir-bg px-3 py-2 text-sm text-hadir-ink">✓ {msg.ok}</p>}
      {mode === "edit" ? (
        <Button size="sm" disabled={busy || !sel.length} onClick={() => run(() => updateSquadRules(coachId, sel, focus), "Aturan skuad disimpan & anggota diperbarui.")}><Save size={15} /> Simpan aturan skuad</Button>
      ) : rejecting ? (
        <div className="space-y-2 rounded-[8px] bg-sunken p-3">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan (terlihat oleh pendaftar)" className={inputCls} />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setRejecting(false)}>Batal</Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => run(() => rejectCoach(coachId, reason), "Pendaftaran ditolak.")}><X size={15} /> Tolak pendaftaran</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="accent" disabled={busy || !sel.length} onClick={() => run(() => approveCoach(coachId, sel, focus), "Coach disetujui.")}><Check size={15} /> Setujui & tetapkan skuad</Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={() => setRejecting(true)}><X size={15} /> Tolak</Button>
        </div>
      )}
    </div>
  );
}
