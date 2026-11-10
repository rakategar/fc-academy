import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { LinkButton } from "@/components/ui/Button";
import { getAgeGroups, getPlayerStats, getPlayers } from "@/lib/data";
import { ageFrom, fmtDate, periodRange } from "@/lib/format";
import { PlayersTable, type PlayerRow } from "./PlayersTable";
import { PendingList } from "./PendingList";

export const metadata = { title: "Data Pemain" };

const TABS = [
  { key: "aktif", label: "Aktif" },
  { key: "pending", label: "Menunggu verifikasi" },
  { key: "arsip", label: "Arsip" },
] as const;

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams;
  const tab = TABS.find((t) => t.key === rawTab)?.key ?? "aktif";
  const period = periodRange("30");
  const [players, groups, stats] = await Promise.all([getPlayers(), getAgeGroups(), getPlayerStats(period.from, period.to)]);
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const sMap = new Map(stats.map((s) => [s.player_id, s]));
  const counts = { aktif: 0, pending: 0, arsip: 0 };
  players.forEach((p) => counts[p.status]++);

  const rows: PlayerRow[] = players.filter((p) => p.status === tab).map((p) => {
    const s = sMap.get(p.id);
    return {
      id: p.id, name: p.full_name, age: ageFrom(p.birth_date), position: p.position, group: p.age_group_id ? gName.get(p.age_group_id) ?? "—" : "—",
      jersey: p.jersey_no, status: p.status, linked: !!p.clerk_user_id,
      attendance: s?.attendance_pct ?? null, perf: s?.perf_avg ?? null, score: s?.total_score ?? null,
    };
  });

  return (
    <>
      <PageHeader icon={Users} title="Data pemain" subtitle="Kehadiran, performa, dan skor dihitung dari 30 hari terakhir." actions={<LinkButton href="/coach/pemain/baru"><UserPlus size={18} /> Tambah pemain</LinkButton>} />
      <div className="mb-3 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <Link key={t.key} href={`/coach/pemain?tab=${t.key}`} role="tab" aria-selected={tab === t.key}
            className={`-mb-px flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap ${tab === t.key ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"}`}>
            {t.label}
            <span className={`num rounded-full px-1.5 text-xs ${t.key === "pending" && counts.pending ? "bg-gold text-nav" : "bg-sunken"}`}>{counts[t.key]}</span>
          </Link>
        ))}
      </div>
      <Panel bodyClassName="p-0 md:p-0">
        {tab === "pending" ? (
          <PendingList
            rows={players.filter((p) => p.status === "pending").map((p) => ({
              id: p.id, name: p.full_name, email: p.email, phone: p.phone, age: ageFrom(p.birth_date), position: p.position,
              group: p.age_group_id ? gName.get(p.age_group_id) ?? "—" : "—", registered: fmtDate(p.created_at.slice(0, 10)),
            }))}
            unlinked={players.filter((p) => p.status !== "pending" && !p.clerk_user_id).map((p) => ({ id: p.id, name: p.full_name }))}
          />
        ) : (
          <PlayersTable rows={rows} groups={groups.map((g) => g.name)} />
        )}
      </Panel>
    </>
  );
}
