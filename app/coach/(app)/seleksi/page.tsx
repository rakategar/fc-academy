import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/Panel";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { requireCoach } from "@/lib/auth/coach";
import { getAgeGroups, getPlayerStats, getPlayers } from "@/lib/data";
import { fmtDate, fmtDateTime, periodRange } from "@/lib/format";
import { SELECTION_MIN_ATTENDANCE } from "@/lib/scoring";
import { SelectionBoard, type RankRow } from "./SelectionBoard";

export const metadata = { title: "Seleksi Pemain" };

export default async function SelectionPage({ searchParams }: { searchParams: Promise<{ periode?: string; kelompok?: string; posisi?: string; min?: string }> }) {
  const sp = await searchParams;
  const period = periodRange(sp.periode ?? "90");
  const coach = await requireCoach();
  const minAtt = Number(sp.min ?? SELECTION_MIN_ATTENDANCE);
  const [players, groups, stats] = await Promise.all([getPlayers({ status: "aktif" }), getAgeGroups(), getPlayerStats(period.from, period.to)]);
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const sMap = new Map(stats.map((s) => [s.player_id, s]));
  const rows: RankRow[] = players
    .filter((p) => (!sp.kelompok || p.age_group_id === Number(sp.kelompok)) && (!sp.posisi || p.position === sp.posisi))
    .map((p) => {
      const s = sMap.get(p.id);
      return {
        id: p.id, name: p.full_name, position: p.position, group: p.age_group_id ? gName.get(p.age_group_id) ?? "—" : "—",
        attendance: s?.attendance_pct ?? null, perf: s?.perf_avg ?? null, score: s?.total_score ?? null, candidate: p.is_candidate,
        eligible: (s?.attendance_pct ?? 0) >= minAtt,
      };
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || (b.score ?? -1) - (a.score ?? -1));

  return (
    <>
      <PageHeader
        icon={Trophy}
        title="Seleksi pemain"
        subtitle={`Peringkat pemain rajin berlatih dan berkembang untuk turnamen. Syarat kehadiran minimal ${minAtt}%.`}
        actions={
          <>
            <Suspense>
              <FilterSelect name="kelompok" label="Kelompok" options={[{ value: "", label: "Semua kelompok" }, ...groups.map((g) => ({ value: String(g.id), label: g.name }))]} />
              <FilterSelect name="posisi" label="Posisi" options={[{ value: "", label: "Semua posisi" }, { value: "GK", label: "GK" }, { value: "DF", label: "DF" }, { value: "MF", label: "MF" }, { value: "FW", label: "FW" }]} />
              <FilterSelect name="min" label="Syarat kehadiran" options={[{ value: "", label: `Hadir ≥ ${SELECTION_MIN_ATTENDANCE}%` }, { value: "60", label: "Hadir ≥ 60%" }, { value: "85", label: "Hadir ≥ 85%" }, { value: "90", label: "Hadir ≥ 90%" }]} />
            </Suspense>
            <PeriodTabs current={period.key} basePath="/coach/seleksi" extra={{ kelompok: sp.kelompok, posisi: sp.posisi, min: sp.min }} />
          </>
        }
      />
      <SelectionBoard rows={rows} meta={{ subtitle: `Periode penilaian ${fmtDate(period.from)} – ${fmtDate(period.to)}`, minAtt, coach: coach.name, generatedAt: fmtDateTime(new Date().toISOString()) }} />
    </>
  );
}
