import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/ui/Panel";
import { AttendanceBadge, Badge } from "@/components/ui/Badge";
import { db } from "@/lib/supabase";
import { dayName, fmtDate, fmtDateTime } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/types";
import type { Scope } from "@/lib/scope";

interface LogRow { id: number; actor_role: string; actor_name: string; action: string; entity: string; player_id: string | null; coach_id: string | null; detail: string | null; at: string }
interface AuditRow { id: number; action: string; old_status: AttendanceStatus | null; new_status: AttendanceStatus | null; changed_by: string; changed_at: string; player_id: string; session_id: string }

export async function JejakView({ scope, sp }: { scope: Scope; sp: { semua?: string; hal?: string; tab?: string } }) {
  const tab = sp.tab === "absensi" ? "absensi" : "aktivitas";
  const all = sp.semua === "1";
  const page = Math.max(1, Number(sp.hal ?? 1));
  const size = 50;
  const base = `${scope.base}/jejak`;
  const tabs = (
    <div className="mb-3 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
      {[{ k: "aktivitas", l: "Aktivitas (verifikasi, skuad, penilaian)" }, { k: "absensi", l: "Perubahan absensi" }].map((t) => (
        <Link key={t.k} href={`${base}?tab=${t.k}`} role="tab" aria-selected={tab === t.k}
          className={`-mb-px flex h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap ${tab === t.k ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"}`}>{t.l}</Link>
      ))}
    </div>
  );

  if (tab === "aktivitas") {
    let lq = db().from("activity_log").select("*", { count: "exact" }).order("at", { ascending: false }).range((page - 1) * size, page * size - 1);
    if (scope.coachId) lq = lq.eq("coach_id", scope.coachId);
    const { data: logs, count: lcount } = await lq;
    const lrows = (logs ?? []) as LogRow[];
    const pids = [...new Set(lrows.map((r) => r.player_id).filter(Boolean))] as string[];
    const { data: pl } = pids.length ? await db().from("players").select("id, full_name").in("id", pids) : { data: [] };
    const pn = new Map((pl ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));
    const lpages = Math.max(1, Math.ceil((lcount ?? 0) / size));
    return (
      <>
        <PageHeader icon={History} title="Jejak perubahan" subtitle="Siapa melakukan apa dan kapan. Catatan ini tidak bisa diedit." />
        {tabs}
        <Panel bodyClassName="p-0 md:p-0">
          {lrows.length === 0 ? <div className="p-5"><EmptyState icon={History} title="Belum ada aktivitas">Verifikasi, perubahan skuad, dan penilaian akan tercatat di sini.</EmptyState></div> : (
            <ol className="divide-y divide-line">
              {lrows.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><b>{r.actor_name}</b> <span className="caption">({r.actor_role})</span> {r.action}
                      {r.player_id && <> · <Link href={`${scope.base}/pemain/${r.player_id}`} className="font-semibold text-accent">{pn.get(r.player_id) ?? "pemain"}</Link></>}</p>
                    {r.detail && <p className="caption">{r.detail}</p>}
                  </div>
                  <p className="caption shrink-0">{fmtDateTime(r.at)}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        {lpages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <p className="caption">Halaman {page} dari {lpages}</p>
            <div className="flex gap-2">
              {page > 1 && <Link className="rounded-[6px] border border-line-strong px-3 py-1.5" href={`${base}?tab=aktivitas&hal=${page - 1}`}>‹ Sebelumnya</Link>}
              {page < lpages && <Link className="rounded-[6px] border border-line-strong px-3 py-1.5" href={`${base}?tab=aktivitas&hal=${page + 1}`}>Berikutnya ›</Link>}
            </div>
          </div>
        )}
      </>
    );
  }

  let q = db().from("attendance_audit").select("*", { count: "exact" }).order("changed_at", { ascending: false }).range((page - 1) * size, page * size - 1);
  if (!all) q = q.neq("action", "catat");
  if (scope.coachId) {
    const { data: ss } = await db().from("training_sessions").select("id").eq("coach_id", scope.coachId);
    q = q.in("session_id", (ss ?? []).map((s: { id: string }) => s.id).concat("00000000-0000-0000-0000-000000000000"));
  }
  const { data, count } = await q;
  const rows = (data ?? []) as AuditRow[];
  const [players, sessions] = await Promise.all([
    rows.length ? db().from("players").select("id, full_name").in("id", [...new Set(rows.map((r) => r.player_id))]) : Promise.resolve({ data: [] }),
    rows.length ? db().from("training_sessions").select("id, session_date, kind").in("id", [...new Set(rows.map((r) => r.session_id))]) : Promise.resolve({ data: [] }),
  ]);
  const pName = new Map((players.data ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));
  const sInfo = new Map((sessions.data ?? []).map((s: { id: string; session_date: string; kind: string }) => [s.id, s]));
  const pages = Math.max(1, Math.ceil((count ?? 0) / size));
  const link = (o: Record<string, string>) => `${base}?${new URLSearchParams({ tab: "absensi", ...(all ? { semua: "1" } : {}), ...o })}`;

  return (
    <>
      <PageHeader icon={History} title="Jejak perubahan" subtitle="Siapa mengubah absensi, kapan, dan dari status apa ke apa. Catatan ini tidak bisa diedit." />
      {tabs}
      <div className="mb-3 inline-flex rounded-[8px] border border-line bg-panel p-1">
        <Link href={`${base}?tab=absensi`} className={`h-9 rounded-[6px] px-3 text-[13px] leading-9 font-medium ${!all ? "bg-brand text-white" : "text-ink-muted"}`}>Perubahan saja</Link>
        <Link href={`${base}?tab=absensi&semua=1`} className={`h-9 rounded-[6px] px-3 text-[13px] leading-9 font-medium ${all ? "bg-brand text-white" : "text-ink-muted"}`}>Termasuk pencatatan awal</Link>
      </div>
      <Panel bodyClassName="p-0 md:p-0">
        {rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={History} title="Belum ada perubahan absensi">Setiap kali absensi yang sudah tersimpan diperbaiki, catatannya muncul di sini.</EmptyState></div>
        ) : (
          <ol className="divide-y divide-line">
            {rows.map((r) => {
              const s = sInfo.get(r.session_id);
              return (
                <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <b>{r.changed_by}</b>{" "}
                      {r.action === "ubah" ? "mengubah" : r.action === "catat" ? "mencatat" : "menghapus"} absensi{" "}
                      <Link href={`${scope.base}/pemain/${r.player_id}`} className="font-semibold text-accent">{pName.get(r.player_id) ?? "pemain terhapus"}</Link>
                    </p>
                    <p className="caption">
                      {s ? <Link href={scope.role === "coach" ? `/coach/absensi/${r.session_id}` : "#"} className="hover:underline">{dayName(s.session_date)}, {fmtDate(s.session_date)} · {s.kind}</Link> : "Sesi terhapus"} · {fmtDateTime(r.changed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.old_status && <AttendanceBadge status={r.old_status} />}
                    {r.old_status && r.new_status && <ArrowRight size={14} className="text-ink-faint" />}
                    {r.new_status ? <AttendanceBadge status={r.new_status} /> : <Badge tone="neutral">Dihapus</Badge>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <p className="caption">Halaman {page} dari {pages} · {count} catatan</p>
          <div className="flex gap-2">
            {page > 1 && <Link className="rounded-[6px] border border-line-strong px-3 py-1.5" href={link({ hal: String(page - 1) })}>‹ Sebelumnya</Link>}
            {page < pages && <Link className="rounded-[6px] border border-line-strong px-3 py-1.5" href={link({ hal: String(page + 1) })}>Berikutnya ›</Link>}
          </div>
        </div>
      )}
    </>
  );
}
