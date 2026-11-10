import Link from "next/link";
import { Suspense } from "react";
import { Activity, BarChart3, CalendarCheck, CheckCircle2, Grid3x3, Link2, ListChecks, Repeat, Stethoscope, UserX } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { ScoreBadge } from "@/components/ui/Badge";
import { Stagger, Item } from "@/components/motion/Reveal";
import { StackedBars } from "@/components/charts/BarsChart";
import { ScatterPlot } from "@/components/charts/ScatterPlot";
import { Heatmap } from "@/components/charts/Heatmap";
import { getAgeGroups, getAttendanceRange, getPlayerStats, getPlayers, getSessionAgg } from "@/lib/data";
import { fmtDate, fmtDateShort, fmtNum, fmtPct, periodRange, dayName } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/types";

export const metadata = { title: "Rekap & Monitoring" };

function pearson(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
  return dx && dy ? num / Math.sqrt(dx * dy) : null;
}

export default async function RecapPage({ searchParams }: { searchParams: Promise<{ periode?: string; kelompok?: string }> }) {
  const sp = await searchParams;
  const period = periodRange(sp.periode);
  const [players, groups, stats, sessionsAll, attendance] = await Promise.all([
    getPlayers({ status: "aktif" }), getAgeGroups(), getPlayerStats(period.from, period.to), getSessionAgg(period.from, period.to), getAttendanceRange(period.from, period.to),
  ]);
  const groupId = sp.kelompok ? Number(sp.kelompok) : null;
  const inGroup = players.filter((p) => groupId === null || p.age_group_id === groupId);
  const ids = new Set(inGroup.map((p) => p.id));
  const st = stats.filter((s) => ids.has(s.player_id));
  const att = attendance.filter((a) => ids.has(a.player_id));
  const sessions = sessionsAll.filter((s) => s.status === "selesai" && (groupId === null || s.age_group_id === null || s.age_group_id === groupId));

  // agregasi status per sesi untuk pemain dalam filter
  const perSession = new Map<string, Record<AttendanceStatus, number>>();
  for (const a of att) {
    const m = perSession.get(a.session_id) ?? { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    m[a.status]++; perSession.set(a.session_id, m);
  }
  const recorded = sessions.filter((s) => perSession.has(s.session_id));
  const totals = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  att.forEach((a) => totals[a.status]++);
  const totalRec = att.length;
  const consistent = st.filter((s) => (s.attendance_pct ?? 0) >= 90).length;

  const barData = recorded.map((s) => ({ label: fmtDateShort(s.session_date), ...perSession.get(s.session_id)! }));
  const cols = recorded.map((s) => ({ id: s.session_id, label: fmtDateShort(s.session_date), title: `${dayName(s.session_date)}, ${fmtDate(s.session_date)} · ${s.kind}` }));
  const lookup = new Map(att.map((a) => [`${a.player_id}|${a.session_id}`, a.status]));
  const sMap = new Map(st.map((s) => [s.player_id, s]));
  const heatRows = [...inGroup]
    .sort((a, b) => (sMap.get(b.id)?.attendance_pct ?? -1) - (sMap.get(a.id)?.attendance_pct ?? -1))
    .map((p) => ({ id: p.id, name: p.full_name, pct: sMap.get(p.id)?.attendance_pct ?? null, cells: cols.map((c) => lookup.get(`${p.id}|${c.id}`) ?? null) }));

  const points = st.filter((s) => s.attendance_pct !== null && s.perf_avg !== null).map((s) => ({ x: s.attendance_pct!, y: s.perf_avg!, name: inGroup.find((p) => p.id === s.player_id)!.full_name }));
  const r = pearson(points.map((p) => p.x), points.map((p) => p.y));
  const rLabel = r === null ? "" : Math.abs(r) >= 0.7 ? "korelasi kuat" : Math.abs(r) >= 0.4 ? "korelasi sedang" : "korelasi lemah";
  const gName = new Map(groups.map((g) => [g.id, g.name]));

  return (
    <>
      <PageHeader
        icon={BarChart3}
        title="Rekap & monitoring"
        subtitle={`${period.label} · ${fmtDate(period.from)} – ${fmtDate(period.to)}${groupId ? ` · ${gName.get(groupId)}` : ""}`}
        actions={
          <>
            <Suspense>
              <FilterSelect name="kelompok" label="Kelompok usia" options={[{ value: "", label: "Semua kelompok" }, ...groups.map((g) => ({ value: String(g.id), label: g.name }))]} />
            </Suspense>
            <PeriodTabs current={period.key} basePath="/coach/rekap" extra={{ kelompok: sp.kelompok }} />
          </>
        }
      />

      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Item><KpiCard icon={CheckCircle2} tone="green" value={totalRec ? (totals.hadir / totalRec) * 100 : null} decimals={1} suffix="%" label="Rata-rata hadir" caption={`${totals.hadir} dari ${totalRec} catatan`} /></Item>
        <Item><KpiCard icon={Repeat} tone="purple" value={consistent} label="Pemain konsisten" caption={`Kehadiran ≥ 90% · dari ${inGroup.length}`} /></Item>
        <Item><KpiCard icon={CalendarCheck} tone="blue" value={recorded.length} label="Sesi tercatat" /></Item>
        <Item><KpiCard icon={Stethoscope} tone="orange" value={totals.izin + totals.sakit} label="Izin & sakit" caption={`Izin ${totals.izin} · Sakit ${totals.sakit}`} /></Item>
        <Item className="col-span-2 lg:col-span-1"><KpiCard icon={UserX} tone="sky" value={totals.alpa} label="Tanpa keterangan" caption={totalRec ? `${fmtPct((totals.alpa / totalRec) * 100)} dari catatan` : undefined} /></Item>
      </Stagger>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" icon={ListChecks} title="Kehadiran per sesi" subtitle="Jumlah pemain menurut status">
          {barData.length ? (
            <StackedBars data={barData} series={[
              { key: "hadir", name: "Hadir", color: "var(--hadir)" },
              { key: "izin", name: "Izin", color: "var(--izin)" },
              { key: "sakit", name: "Sakit", color: "var(--sakit)" },
              { key: "alpa", name: "Tanpa keterangan", color: "var(--alpa)" },
            ]} />
          ) : <EmptyState title="Belum ada absensi di periode ini">Pilih periode lebih panjang atau isi absensi sesi terbaru.</EmptyState>}
        </Panel>
        <Panel className="lg:col-span-5" icon={Link2} title="Korelasi kehadiran & performa" subtitle={r !== null ? `r = ${fmtNum(r, 2)} (${rLabel})` : "Butuh minimal 3 pemain dengan data lengkap"}>
          {points.length >= 3 ? <ScatterPlot points={points} xLabel="Kehadiran (%)" yLabel="Rata-rata performa" /> : <EmptyState title="Data belum cukup" />}
          {r !== null && r > 0.4 && <p className="caption mt-2">Pemain yang lebih rajin hadir cenderung punya nilai performa lebih tinggi.</p>}
        </Panel>
      </div>

      <Panel className="mt-4" icon={Grid3x3} title="Pola konsistensi kehadiran" subtitle="Setiap kotak = satu sesi. Urut dari kehadiran tertinggi. Huruf: I izin · S sakit · A tanpa keterangan.">
        {heatRows.length && cols.length ? <Heatmap rows={heatRows} cols={cols} /> : <EmptyState title="Belum ada data untuk ditampilkan" />}
      </Panel>

      <Panel className="mt-4" icon={Activity} title="Rekap per pemain" bodyClassName="p-0 md:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="bg-sunken text-ink-muted">
              <tr>
                {["Pemain", "Kelompok", "Sesi", "Hadir", "Izin", "Sakit", "Alpa", "% hadir", "Performa", "Skor", ""].map((h, i) => (
                  <th key={i} scope="col" className={`px-3 py-2.5 font-medium ${i >= 2 && i <= 9 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...inGroup].sort((a, b) => (sMap.get(b.id)?.total_score ?? -1) - (sMap.get(a.id)?.total_score ?? -1)).map((p) => {
                const s = sMap.get(p.id);
                return (
                  <tr key={p.id} className="h-10 border-b border-line hover:bg-sunken">
                    <td className="sticky left-0 bg-panel px-3 font-medium"><Link href={`/coach/pemain/${p.id}`} className="hover:text-accent">{p.full_name}</Link></td>
                    <td className="px-3">{p.age_group_id ? gName.get(p.age_group_id) : "—"}</td>
                    <td className="num px-3 text-right">{s?.sessions_total ?? 0}</td>
                    <td className="num px-3 text-right text-hadir-ink">{s?.hadir ?? 0}</td>
                    <td className="num px-3 text-right">{s?.izin ?? 0}</td>
                    <td className="num px-3 text-right">{s?.sakit ?? 0}</td>
                    <td className={`num px-3 text-right ${(s?.alpa ?? 0) > 0 ? "text-alpa-ink" : ""}`}>{s?.alpa ?? 0}</td>
                    <td className="num px-3 text-right">{fmtPct(s?.attendance_pct)}</td>
                    <td className="num px-3 text-right">{fmtNum(s?.perf_avg)}</td>
                    <td className="num px-3 text-right font-semibold">{fmtNum(s?.total_score)}</td>
                    <td className="px-3"><ScoreBadge score={s?.total_score} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
