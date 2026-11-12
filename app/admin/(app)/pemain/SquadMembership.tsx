"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, RotateCcw, UserMinus } from "lucide-react";
import { assignPlayer, restorePlayer, unassignPlayer } from "./actions";
import { Button } from "@/components/ui/Button";
import { SourceBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Panel";
import { inputCls } from "@/components/ui/Field";

export interface MemberRow { coachId: string; playerId: string; label: string; sub?: string; href: string; source: "aturan" | "manual"; excluded: boolean }

/** Kelola anggota skuad (dipakai dari sisi pemain maupun sisi coach). */
export function SquadMembership({ rows, addOptions, fixed, addLabel, emptyText }: {
  rows: MemberRow[];
  addOptions: { value: string; label: string }[];
  /** id yang tetap: coachId (halaman coach) atau playerId (halaman pemain) */
  fixed: { coachId?: string; playerId?: string };
  addLabel: string;
  emptyText: string;
}) {
  const [busy, start] = useTransition();
  const [pick, setPick] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const active = rows.filter((r) => !r.excluded);
  const excluded = rows.filter((r) => r.excluded);
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => { const r = await fn(); setMsg(r.error ?? null); });

  return (
    <div className="space-y-3">
      {active.length ? (
        <ul className="divide-y divide-line rounded-[8px] border border-line">
          {active.map((r) => (
            <li key={r.coachId + r.playerId} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <Link href={r.href} className="block truncate text-sm font-medium hover:text-accent">{r.label}</Link>
                {r.sub && <p className="caption truncate">{r.sub}</p>}
              </div>
              <SourceBadge source={r.source} />
              <button disabled={busy} onClick={() => run(() => unassignPlayer(r.coachId, r.playerId))} title="Keluarkan dari skuad" aria-label="Keluarkan dari skuad"
                className="grid h-9 w-9 place-items-center rounded-[6px] text-ink-faint hover:bg-alpa-bg hover:text-alpa"><UserMinus size={16} /></button>
            </li>
          ))}
        </ul>
      ) : <EmptyState title={emptyText} />}

      {excluded.length > 0 && (
        <div className="rounded-[8px] bg-sunken p-3">
          <p className="caption mb-2">Dikecualikan dari aturan otomatis (tidak akan ditambahkan ulang):</p>
          <ul className="flex flex-wrap gap-2">
            {excluded.map((r) => (
              <li key={r.coachId + r.playerId} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-panel py-1 pr-1 pl-3 text-[13px]">
                {r.label}
                <button disabled={busy} onClick={() => run(() => restorePlayer(r.coachId, r.playerId))} title="Kembalikan" aria-label={`Kembalikan ${r.label}`} className="grid h-6 w-6 place-items-center rounded-full hover:bg-sunken"><RotateCcw size={13} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {addOptions.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={pick} onChange={(e) => setPick(e.target.value)} className={`${inputCls} flex-1`} aria-label={addLabel}>
            <option value="">{addLabel}…</option>
            {addOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Button variant="secondary" disabled={!pick || busy} onClick={() => run(async () => {
            const res = await assignPlayer(fixed.coachId ?? pick, fixed.playerId ?? pick); setPick(""); return res;
          })}><Plus size={16} /> Tambah manual</Button>
        </div>
      )}
      {msg && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {msg}</p>}
    </div>
  );
}
