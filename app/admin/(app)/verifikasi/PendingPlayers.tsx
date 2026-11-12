"use client";
import { useState, useTransition } from "react";
import { Check, Link2, Mail, Phone, X } from "lucide-react";
import { approvePlayer, linkRegistration, rejectPlayer } from "../pemain/actions";
import { Button } from "@/components/ui/Button";
import { PositionTag } from "@/components/ui/Badge";
import { Avatar, EmptyState } from "@/components/ui/Panel";
import { inputCls } from "@/components/ui/Field";

export interface PendingRow { id: string; name: string; email: string | null; phone: string | null; age: number; position: string; groupId: number | null; group: string; registered: string }

export function PendingPlayers({ rows, unlinked, groups, coachRules }: { rows: PendingRow[]; unlinked: { id: string; name: string }[]; groups: { id: number; name: string }[]; coachRules: { name: string; groups: number[]; focus: string }[] }) {
  const coachesFor = (groupId: string, position: string) => coachRules.filter((c) => groupId && c.groups.includes(Number(groupId)) && (c.focus === "semua" || position === "GK")).map((c) => c.name);
  const [busy, start] = useTransition();
  const [linking, setLinking] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [grp, setGrp] = useState<Record<string, string>>({});

  if (!rows.length) return <div className="p-4 md:p-5"><EmptyState icon={Check} title="Tidak ada pendaftar yang menunggu">Pemain yang mendaftar lewat Google akan muncul di sini.</EmptyState></div>;

  return (
    <ul className="grid gap-3 p-4 md:grid-cols-2 md:p-5" aria-live="polite">
      {msg && <li className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink md:col-span-2">⚠ {msg}</li>}
      {rows.map((r) => (
        <li key={r.id} className="rounded-[10px] border border-line border-l-[3px] border-l-gold p-4">
          <div className="flex items-start gap-3">
            <Avatar name={r.name} size={42} tone="gold" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.name}</p>
              <p className="caption mt-0.5 flex flex-wrap items-center gap-1.5"><PositionTag position={r.position} /> {r.group} · <span className="num">{r.age}</span> tahun · daftar {r.registered}</p>
              <p className="caption mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                {r.email && <span className="inline-flex items-center gap-1"><Mail size={13} />{r.email}</span>}
                {r.phone && <span className="num inline-flex items-center gap-1"><Phone size={13} />{r.phone}</span>}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <label className="caption" htmlFor={`g-${r.id}`}>Kelompok usia</label>
            <select id={`g-${r.id}`} value={grp[r.id] ?? String(r.groupId ?? "")} onChange={(e) => setGrp((g) => ({ ...g, [r.id]: e.target.value }))} className={`${inputCls} h-9 w-auto`}>
              <option value="">Tanpa kelompok</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {(() => { const cs = coachesFor(grp[r.id] ?? String(r.groupId ?? ""), r.position); return <span className="caption">{cs.length ? `→ otomatis masuk skuad ${cs.join(", ")}` : "→ belum ada coach yang cocok (bisa ditambah manual)"}</span>; })()}
          </div>
          {rejecting === r.id ? (
            <div className="mt-3 space-y-2 rounded-[8px] bg-sunken p-3">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan (terlihat oleh pendaftar), mis. tanggal lahir keliru" className={inputCls} />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setRejecting(null)}>Batal</Button>
                <Button size="sm" variant="danger" disabled={busy} onClick={() => start(async () => { const res = await rejectPlayer(r.id, reason); setMsg(res.error ?? null); if (!res.error) setRejecting(null); })}><X size={15} /> Tolak</Button>
              </div>
            </div>
          ) : linking === r.id ? (
            <div className="mt-3 space-y-2 rounded-[8px] bg-sunken p-3">
              <p className="text-sm">Tautkan akun ini ke data pemain yang sudah ada (riwayat absensinya ikut terhubung):</p>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls}>
                <option value="">Pilih pemain…</option>
                {unlinked.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setLinking(null)}>Batal</Button>
                <Button size="sm" disabled={!target || busy} onClick={() => start(async () => { const res = await linkRegistration(r.id, target); setMsg(res.error ?? null); setLinking(null); })}>
                  <Link2 size={15} /> Tautkan & aktifkan
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="accent" disabled={busy} onClick={() => start(async () => { const g = grp[r.id] ?? String(r.groupId ?? ""); const res = await approvePlayer(r.id, g ? Number(g) : null); setMsg(res.error ?? null); })}><Check size={15} /> Setujui</Button>
              <Button size="sm" variant="secondary" disabled={busy || !unlinked.length} onClick={() => { setLinking(r.id); setTarget(""); }}><Link2 size={15} /> Tautkan ke data lama</Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={() => { setRejecting(r.id); setReason(""); }}><X size={15} /> Tolak</Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
