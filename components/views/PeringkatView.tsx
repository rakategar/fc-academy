import Link from "next/link";
import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/Panel";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { getAgeGroups, getPeriod, getPlayerStats, getPlayers } from "@/lib/data";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { SELECTION_MIN_ATTENDANCE } from "@/lib/scoring";
import type { PlayerStat } from "@/lib/types";
import type { Scope } from "@/lib/scope";
import { RankingBoard, type RankRow } from "./RankingBoard";

const METRICS: { key: string; label: string; short: string; max: number; unit: string; get: (s: PlayerStat | undefined) => number | null }[] = [
  { key: "total", label: "Skor total", short: "Skor", max: 100, unit: "", get: (s) => s?.total_score ?? null },
  { key: "nilai", label: "Nilai rata-rata", short: "Nilai", max: 10, unit: "", get: (s) => s?.perf_avg ?? null },
  { key: "fisik", label: "Fisik", short: "Fisik", max: 10, unit: "", get: (s) => s?.fisik ?? null },
  { key: "teknik", label: "Teknik", short: "Teknik", max: 10, unit: "", get: (s) => s?.teknik ?? null },
  { key: "taktik", label: "Taktik", short: "Taktik", max: 10, unit: "", get: (s) => s?.taktik ?? null },
  { key: "naik", label: "Paling meningkat", short: "Naik", max: 3, unit: "", get: (s) => (s && s.n_assess >= 2 && s.perf_first !== null && s.perf_last !== null ? Math.round((s.perf_last - s.perf_first) * 10) / 10 : null) },
  { key: "hadir", label: "Kehadiran", short: "Hadir", max: 100, unit: "%", get: (s) => s?.attendance_pct ?? null },
];

/** Peringkat / leaderboard pemain. */
export async function PeringkatView({ scope, sp }: { scope: Scope; sp: { periode?: string; kelompok?: string; posisi?: string; urut?: string; min?: string } }) {
  const period = await getPeriod(sp.periode, "musim");
  const metric = METRICS.find((m) => m.key === sp.urut) ?? METRICS[0];
  const minAtt = Number(sp.min ?? SELECTION_MIN_ATTENDANCE);
  const base = `${scope.base}/peringkat`;
  const [players, groupsAll, stats] = await Promise.all([getPlayers({ status: "aktif", ids: scope.ids }), getAgeGroups(), getPlayerStats(period.from, period.to, scope.ids)]);
  const groups = groupsAll.filter((g) => players.some((p) => p.age_group_id === g.id));
  const gName = new Map(groupsAll.map((g) => [g.id, g.name]));
  const sMap = new Map(stats.map((s) => [s.player_id, s]));
  const rows: RankRow[] = players
    .filter((p) => (!sp.kelompok || p.age_group_id === Number(sp.kelompok)) && (!sp.posisi || p.position === sp.posisi))
    .map((p) => {
      const s = sMap.get(p.id);
      return {
        id: p.id, name: p.full_name, position: p.position, group: p.age_group_id ? gName.get(p.age_group_id) ?? "—" : "—",
        attendance: s?.attendance_pct ?? null, perf: s?.perf_avg ?? null, score: s?.total_score ?? null, value: metric.get(s),
        delta: METRICS[5].get(s), nAssess: s?.n_assess ?? 0, candidate: p.is_candidate, eligible: (s?.attendance_pct ?? 0) >= minAtt,
      };
    })
    .sort((a, b) => (b.value ?? -999) - (a.value ?? -999) || a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        icon={Trophy}
        title="Peringkat pemain"
        subtitle={`Diurutkan menurut ${metric.label.toLowerCase()} · ${period.label} (${fmtDate(period.from)} – ${fmtDate(period.to)})`}
        actions={
          <>
            <Suspense>
              <FilterSelect name="kelompok" label="Kelompok" options={[{ value: "", label: "Semua kelompok" }, ...groups.map((g) => ({ value: String(g.id), label: g.name }))]} />
              <FilterSelect name="posisi" label="Posisi" options={[{ value: "", label: "Semua posisi" }, { value: "GK", label: "Kiper (GK)" }, { value: "DF", label: "Bek (DF)" }, { value: "MF", label: "Gelandang (MF)" }, { value: "FW", label: "Penyerang (FW)" }]} />
            </Suspense>
            <PeriodTabs current={period.key} basePath={base} extra={{ kelompok: sp.kelompok, posisi: sp.posisi, urut: sp.urut, min: sp.min }} />
          </>
        }
      />
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Urutkan menurut">
        {METRICS.map((m) => {
          const q = new URLSearchParams(Object.entries({ ...sp, urut: m.key === "total" ? undefined : m.key }).filter(([, v]) => v) as [string, string][]);
          const active = m.key === metric.key;
          return (
            <Link key={m.key} href={`${base}?${q}`} role="tab" aria-selected={active}
              className={`h-9 shrink-0 rounded-full border px-3.5 text-[13px] leading-[34px] font-medium ${active ? "border-brand bg-brand text-white" : "border-line-strong bg-panel text-ink-muted hover:text-ink"}`}>
              {m.label}
            </Link>
          );
        })}
      </div>
      <RankingBoard
        rows={rows}
        meta={{ subtitle: `Periode ${fmtDate(period.from)} – ${fmtDate(period.to)}`, minAtt, by: metric.key, metric: metric.short, max: metric.max, unit: metric.unit, role: scope.role, base: scope.base, generatedAt: fmtDateTime(new Date().toISOString()) }}
      />
      <p className="caption mt-3">Skor total = 40% kehadiran + 60% nilai coach (1–10 ×10). “Paling meningkat” = nilai penilaian terakhir dikurangi penilaian pertama di periode ini. Tanda ☆ menandai kandidat turnamen (syarat hadir ≥ {minAtt}%).</p>
    </>
  );
}
