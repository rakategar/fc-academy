import Link from "next/link";
import { Suspense } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Dumbbell, LineChart, Lightbulb, Target, TrendingUp } from "lucide-react";
import { PageHeader, Panel, EmptyState, Avatar } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { PositionTag } from "@/components/ui/Badge";
import { Stagger, Item, Bar } from "@/components/motion/Reveal";
import { TrendChart } from "@/components/charts/TrendChart";
import { PlayerOverview } from "@/components/player/PlayerOverview";
import { getAgeGroups, getAssessmentItems, getAssessments, getItemAverages, getPeriod, getPlayerStats, getPlayers } from "@/lib/data";
import { fmtDate, fmtDateShort, fmtNum, fmtScore } from "@/lib/format";
import { valueDomain, valueTone } from "@/lib/scoring";
import { CATEGORIES } from "@/lib/types";
import { inScope, type Scope } from "@/lib/scope";

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

/** Analisis nilai 1–10: tren, kekuatan/kelemahan per tes, dan pemain paling berkembang. */
export async function AnalisisView({ scope, sp }: { scope: Scope; sp: { periode?: string; kelompok?: string; posisi?: string; pemain?: string } }) {
  const period = await getPeriod(sp.periode, "musim");
  const base = `${scope.base}/analisis`;
  const [allPlayers, groupsAll] = await Promise.all([getPlayers({ status: "aktif", ids: scope.ids }), getAgeGroups()]);
  const groups = groupsAll.filter((g) => allPlayers.some((p) => p.age_group_id === g.id));
  const players = allPlayers.filter((p) => (!sp.kelompok || p.age_group_id === Number(sp.kelompok)) && (!sp.posisi || (sp.posisi === "GK" ? p.position === "GK" : p.position !== "GK")));
  const ids = players.map((p) => p.id);
  const selected = sp.pemain && inScope(scope, sp.pemain) ? allPlayers.find((p) => p.id === sp.pemain) : undefined;

  const [assessments, items, itemAvg, stats] = await Promise.all([
    getAssessments({ ids, from: period.from, to: period.to }),
    getAssessmentItems(true),
    getItemAverages(period.from, period.to, ids),
    getPlayerStats(period.from, period.to, ids),
  ]);

  // tren per tanggal penilaian
  const byDate = new Map<string, { fisik: number[]; teknik: number[]; taktik: number[]; overall: number[] }>();
  for (const a of assessments) {
    const d = byDate.get(a.assessed_on) ?? { fisik: [], teknik: [], taktik: [], overall: [] };
    d.fisik.push(a.fisik); d.teknik.push(a.teknik); d.taktik.push(a.taktik); d.overall.push(a.overall);
    byDate.set(a.assessed_on, d);
  }
  const dates = [...byDate.keys()].sort();
  const trend = dates.map((d) => {
    const v = byDate.get(d)!;
    return { label: fmtDateShort(d), rata: r1(mean(v.overall)), fisik: r1(mean(v.fisik)), teknik: r1(mean(v.teknik)), taktik: r1(mean(v.taktik)) };
  });
  const firstT = trend[0], lastT = trend.at(-1);

  const itemMap = new Map(items.map((i) => [i.id, i]));
  const itemRows = itemAvg.map((r) => ({ ...r, item: itemMap.get(r.item_id)! })).filter((r) => r.item);
  const weakest = [...itemRows].sort((a, b) => a.avg_score - b.avg_score).slice(0, 5);
  const strongest = [...itemRows].sort((a, b) => b.avg_score - a.avg_score).slice(0, 3);

  const pMap = new Map(players.map((p) => [p.id, p]));
  const improvers = stats.filter((s) => s.n_assess >= 2 && s.perf_first !== null && s.perf_last !== null)
    .map((s) => ({ s, d: s.perf_last! - s.perf_first! })).sort((a, b) => b.d - a.d);
  const top = improvers.slice(0, 6);
  const down = improvers.filter((x) => x.d < 0).slice(-4).reverse();

  const scopeLabel = scope.role === "admin" ? "seluruh akademi" : "skuadmu";
  const playerOptions = [{ value: "", label: "Semua pemain (skuad)" }, ...allPlayers.map((p) => ({ value: p.id, label: p.full_name }))];

  return (
    <>
      <PageHeader
        icon={LineChart}
        title="Analisis nilai"
        subtitle={`Penilaian coach 1–10 untuk ${scopeLabel} · ${period.label} (${fmtDate(period.from)} – ${fmtDate(period.to)})`}
        actions={
          <>
            <Suspense>
              <FilterSelect name="pemain" label="Pemain" options={playerOptions} />
              {!selected && <FilterSelect name="kelompok" label="Kelompok" options={[{ value: "", label: "Semua kelompok" }, ...groups.map((g) => ({ value: String(g.id), label: g.name }))]} />}
              {!selected && <FilterSelect name="posisi" label="Posisi" options={[{ value: "", label: "Semua posisi" }, { value: "lapangan", label: "Pemain lapangan" }, { value: "GK", label: "Kiper" }]} />}
            </Suspense>
            <PeriodTabs current={period.key} basePath={base} extra={{ kelompok: sp.kelompok, posisi: sp.posisi, pemain: sp.pemain }} />
          </>
        }
      />

      {selected ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-panel p-4">
            <Avatar name={selected.full_name} size={44} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{selected.full_name}</p>
              <p className="caption flex items-center gap-1.5"><PositionTag position={selected.position} /> {groupsAll.find((g) => g.id === selected.age_group_id)?.name}</p>
            </div>
            <Link href={`${scope.base}/pemain/${selected.id}`} className="text-sm font-semibold text-accent">Profil lengkap ▸</Link>
          </div>
          <PlayerOverview playerId={selected.id} from={period.from} to={period.to} periodLabel={period.label} show={["summary", "charts", "items", "reviews"]} />
        </>
      ) : (
        <>
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Item><KpiCard icon={Activity} tone="purple" value={lastT?.rata ?? null} decimals={1} label="Rata-rata terakhir" delta={firstT && lastT && dates.length > 1 ? { value: (lastT.rata ?? 0) - (firstT.rata ?? 0), unit: "" } : null} caption={lastT ? `Penilaian ${lastT.label}` : undefined} /></Item>
            {CATEGORIES.map((c, i) => (
              <Item key={c.key}><KpiCard icon={[Dumbbell, Target, Lightbulb][i]} tone={(["green", "blue", "orange"] as const)[i]} value={lastT?.[c.key] ?? null} decimals={1} label={c.label}
                delta={firstT && lastT && dates.length > 1 ? { value: (lastT[c.key] ?? 0) - (firstT[c.key] ?? 0), unit: "" } : null} /></Item>
            ))}
          </Stagger>

          <Panel className="mt-4" icon={TrendingUp} title="Grafik peningkatan" subtitle={`Rata-rata nilai per sesi penilaian · ${ids.length} pemain`}>
            {trend.length ? (
              <TrendChart data={trend} series={[{ key: "rata", name: "Rata-rata", color: "var(--viz-5)" }, ...CATEGORIES.map((c) => ({ key: c.key, name: c.label, color: c.color }))]}
                domain={valueDomain(trend.flatMap((t) => [t.fisik ?? 5, t.teknik ?? 5, t.taktik ?? 5]))} />
            ) : <EmptyState title="Belum ada penilaian di periode ini" />}
          </Panel>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel icon={ArrowDownRight} title="Tes dengan nilai terendah" subtitle="Saran fokus latihan berikutnya">
              {weakest.length ? (
                <ul className="space-y-3">
                  {weakest.map((r) => (
                    <li key={r.item_id}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0"><b className="font-medium">{r.item.name}</b> <span className="caption">· {CATEGORIES.find((c) => c.key === r.item.category)?.label}{r.item.applies_to === "kiper" ? " kiper" : ""}{r.item.test_hint ? ` · ${r.item.test_hint}` : ""}</span></span>
                        <span className={`num shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${valueTone(r.avg_score)}`}>{fmtScore(r.avg_score)}</span>
                      </div>
                      <Bar value={r.avg_score} max={10} className="mt-1.5 h-1.5" color="var(--alpa)" />
                    </li>
                  ))}
                </ul>
              ) : <EmptyState title="Belum ada data" />}
              {strongest.length > 0 && (
                <p className="caption mt-4 border-t border-line pt-3">Paling kuat: {strongest.map((r) => `${r.item.name} (${fmtScore(r.avg_score)})`).join(", ")}.</p>
              )}
            </Panel>

            <Panel icon={ArrowUpRight} title="Paling meningkat" subtitle="Selisih penilaian terakhir dan pertama di periode ini" bodyClassName="p-0 md:p-0">
              {top.length ? (
                <ol className="divide-y divide-line">
                  {top.map(({ s, d }, i) => {
                    const p = pMap.get(s.player_id)!;
                    return (
                      <li key={s.player_id}>
                        <Link href={`${base}?${new URLSearchParams({ pemain: p.id, ...(sp.periode ? { periode: sp.periode } : {}) })}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sunken md:px-5">
                          <span className={`num grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${i === 0 ? "bg-gold text-nav" : "bg-sunken"}`}>{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{p.full_name}</p>
                            <p className="caption num">{fmtScore(s.perf_first)} → {fmtScore(s.perf_last)} · {s.n_assess} penilaian</p>
                          </div>
                          <span className={`num text-sm font-semibold ${d >= 0 ? "text-gain" : "text-loss"}`}>{d >= 0 ? "▲" : "▼"} {fmtNum(Math.abs(d))}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              ) : <div className="p-5"><EmptyState title="Butuh minimal 2 penilaian per pemain" /></div>}
              {down.length > 0 && (
                <p className="caption border-t border-line px-4 py-3 md:px-5">Menurun: {down.map(({ s, d }) => `${pMap.get(s.player_id)?.full_name} (${fmtNum(d)})`).join(", ")}. Perlu dicek penyebabnya.</p>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
