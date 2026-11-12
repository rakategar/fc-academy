import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { LinkButton } from "@/components/ui/Button";
import { PlayersTable, type PlayerRow } from "@/components/views/PlayersTable";
import { getAgeGroups, getCoaches, getMemberships, getPeriod, getPlayerStats, getPlayers } from "@/lib/data";
import { ageFrom } from "@/lib/format";
import { requireStaff } from "@/lib/scope";

export const metadata = { title: "Data Pemain" };

const TABS = [
  { key: "aktif", label: "Aktif" },
  { key: "arsip", label: "Arsip" },
  { key: "ditolak", label: "Ditolak" },
] as const;

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [, sp] = await Promise.all([requireStaff("admin"), searchParams]);
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? "aktif";
  const period = await getPeriod("musim");
  const [players, groups, stats, coaches, memberships] = await Promise.all([getPlayers(), getAgeGroups(), getPlayerStats(period.from, period.to), getCoaches({ status: "aktif" }), getMemberships()]);
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const cName = new Map(coaches.map((c) => [c.id, c.full_name]));
  const sMap = new Map(stats.map((s) => [s.player_id, s]));
  const counts = { aktif: 0, pending: 0, arsip: 0, ditolak: 0 };
  players.forEach((p) => counts[p.status]++);

  const rows: PlayerRow[] = players.filter((p) => p.status === tab).map((p) => {
    const s = sMap.get(p.id);
    return {
      id: p.id, name: p.full_name, age: ageFrom(p.birth_date), position: p.position, group: p.age_group_id ? gName.get(p.age_group_id) ?? "—" : "—",
      jersey: p.jersey_no, status: p.status, linked: !!p.clerk_user_id,
      attendance: s?.attendance_pct ?? null, perf: s?.perf_avg ?? null, score: s?.total_score ?? null,
      coaches: memberships.filter((m) => m.player_id === p.id && !m.excluded && cName.has(m.coach_id)).map((m) => cName.get(m.coach_id)!.replace(/^Coach /, "")).join(", "),
    };
  });

  return (
    <>
      <PageHeader icon={Users} title="Data pemain" subtitle={`Kehadiran, nilai, dan skor dihitung dari ${period.label}.`} actions={<LinkButton href="/admin/pemain/baru"><UserPlus size={18} /> Tambah pemain</LinkButton>} />
      {counts.pending > 0 && (
        <Link href="/admin/verifikasi?tab=pemain" className="mb-3 flex items-center gap-3 rounded-[10px] border border-gold/40 bg-gold-soft p-3 text-sm text-gold-ink">
          <UserPlus size={18} /> <span className="flex-1"><b className="num">{counts.pending}</b> pendaftar pemain menunggu verifikasi.</span><b>Verifikasi ▸</b>
        </Link>
      )}
      <div className="mb-3 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/pemain?tab=${t.key}`} role="tab" aria-selected={tab === t.key}
            className={`-mb-px flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap ${tab === t.key ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"}`}>
            {t.label}
            <span className="num rounded-full bg-sunken px-1.5 text-xs">{counts[t.key]}</span>
          </Link>
        ))}
      </div>
      <Panel bodyClassName="p-0 md:p-0">
        <PlayersTable rows={rows} groups={groups.map((g) => g.name)} basePath="/admin/pemain" showCoaches />
      </Panel>
    </>
  );
}
