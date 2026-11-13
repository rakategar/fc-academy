import { Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { PlayersTable, type PlayerRow } from "@/components/views/PlayersTable";
import { getAgeGroups, getPeriod, getPlayerStats, getPlayers } from "@/lib/data";
import { ageFrom } from "@/lib/format";
import { requireStaff } from "@/lib/scope";

export const metadata = { title: "Pemain Saya" };

export default async function MyPlayers() {
  const scope = await requireStaff("coach");
  const period = await getPeriod("musim");
  const [players, groups, stats] = await Promise.all([getPlayers({ status: ["aktif", "cuti"], ids: scope.ids }), getAgeGroups(), getPlayerStats(period.from, period.to, scope.ids)]);
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const sMap = new Map(stats.map((s) => [s.player_id, s]));
  const rows: PlayerRow[] = players.map((p) => {
    const s = sMap.get(p.id);
    return {
      id: p.id, name: p.full_name, age: ageFrom(p.birth_date), position: p.position, group: p.age_group_id ? gName.get(p.age_group_id) ?? "—" : "—",
      jersey: p.jersey_no, status: p.status, linked: !!p.clerk_user_id, attendance: s?.attendance_pct ?? null, perf: s?.perf_avg ?? null, score: s?.total_score ?? null,
    };
  });
  const onLeave = players.filter((p) => p.status === "cuti").length;
  return (
    <>
      <PageHeader icon={Users} title="Pemain saya" subtitle={`${players.length - onLeave} pemain aktif${onLeave ? ` + ${onLeave} cuti` : ""} di skuadmu · ${period.label}. Penambahan atau perubahan data pemain dilakukan admin.`} />
      <Panel bodyClassName="p-0 md:p-0">
        <PlayersTable rows={rows} groups={groups.filter((g) => players.some((p) => p.age_group_id === g.id)).map((g) => g.name)} basePath="/coach/pemain" />
      </Panel>
    </>
  );
}
