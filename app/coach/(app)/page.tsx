import Link from "next/link";
import {
  Activity, AlertTriangle, BarChart3, CalendarClock, CalendarDays, CheckCircle2, ClipboardCheck, LayoutDashboard,
  PieChart, Target, TrendingUp, Trophy, UserPlus, Users,
} from "lucide-react";
import { PageHeader, Panel, EmptyState, Avatar } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { LinkButton } from "@/components/ui/Button";
import { PositionTag, ScoreBadge } from "@/components/ui/Badge";
import { Stagger, Item, Bar } from "@/components/motion/Reveal";
import { TrendChart } from "@/components/charts/TrendChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { getAgeGroups, getPerfWeekly, getPlayerStats, getPlayers, getSessionAgg, countPending } from "@/lib/data";
import { addDays, dayName, fmtDate, fmtDateShort, fmtNum, fmtPct, fmtTimeRange, periodRange, todayISO } from "@/lib/format";
import { scoreBand } from "@/lib/scoring";

export const metadata = { title: "Dashboard" };

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export default async function CoachDashboard({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const sp = await searchParams;
  const period = periodRange(sp.periode);
  const days = Math.round((Date.parse(period.to) - Date.parse(period.from)) / 86400000) + 1;
  const prevTo = addDays(period.from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  const today = todayISO();
  const trendFrom = addDays(today, -90);

  const [players, groups, stats, prevStats, sessions, upcoming, perfWeeks, pending] = await Promise.all([
    getPlayers({ status: "aktif" }),
    getAgeGroups(),
    getPlayerStats(period.from, period.to),
    getPlayerStats(prevFrom, prevTo),
    getSessionAgg(trendFrom < period.from ? trendFrom : period.from, period.to),
    getSessionAgg(today, addDays(today, 14)),
    getPerfWeekly(trendFrom, today),
    countPending(),
  ]);

  const byId = new Map(players.map((p) => [p.id, p]));
  const statsInPeriod = stats.filter((s) => s.sessions_total > 0 || s.perf_avg !== null);
  const attAvg = avg(stats.map((s) => s.attendance_pct));
  const prevAttAvg = avg(prevStats.map((s) => s.attendance_pct));
  const scoreAvg = avg(stats.map((s) => s.total_score));
  const prevScoreAvg = avg(prevStats.map((s) => s.total_score));
  const doneSessions = sessions.filter((s) => s.status === "selesai" && s.session_date >= period.from);
  const consistent = stats.filter((s) => (s.attendance_pct ?? 0) >= 90).length;

  const trend = sessions
    .filter((s) => s.status === "selesai" && s.total > 0)
    .map((s) => ({ label: fmtDateShort(s.session_date), hadir: Math.round((s.hadir / s.total) * 1000) / 10 }));

  const bands = { unggul: 0, baik: 0, cukup: 0, perhatian: 0 };
  for (const s of statsInPeriod) { const b = scoreBand(s.total_score); if (b) bands[b]++; }

  const groupBars = groups
    .map((g, i) => {
      const ids = players.filter((p) => p.age_group_id === g.id).map((p) => p.id);
      const v = avg(stats.filter((s) => ids.includes(s.player_id)).map((s) => s.total_score));
      return { label: g.name, value: v === null ? 0 : Math.round(v * 10) / 10, color: ["#1e6bff", "#1f9d55", "#f59e0b", "#8b5cf6", "#0b2a6f"][i % 5], n: ids.length };
    })
    .filter((g) => g.n > 0);

  const ranked = [...statsInPeriod].filter((s) => s.total_score !== null).sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));
  const top5 = ranked.slice(0, 5);
  const attention = [...stats].filter((s) => s.sessions_total > 0).sort((a, b) => (a.attendance_pct ?? 0) - (b.attendance_pct ?? 0)).slice(0, 5);
  const next = upcoming.find((s) => s.status === "terjadwal");

  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard Pelatih"
        subtitle={`Ringkasan ${period.label.toLowerCase()} · ${fmtDate(period.from)} – ${fmtDate(period.to)}`}
        actions={
          <>
            <PeriodTabs current={period.key} basePath="/coach" />
            <LinkButton href="/coach/absensi" variant="accent"><ClipboardCheck size={18} /> Isi absensi</LinkButton>
          </>
        }
      />

      {pending > 0 && (
        <Link href="/coach/pemain?tab=pending" className="mb-4 flex items-center gap-3 rounded-[10px] border border-gold/40 bg-gold-soft p-3.5 text-gold-ink">
          <UserPlus size={20} className="shrink-0" />
          <p className="flex-1 text-sm"><b className="num">{pending}</b> pendaftar baru menunggu verifikasi.</p>
          <span className="text-sm font-semibold">Periksa ▸</span>
        </Link>
      )}

      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Item><KpiCard icon={Users} tone="blue" value={players.length} label="Pemain aktif" caption={`${groups.filter((g) => players.some((p) => p.age_group_id === g.id)).length} kelompok usia`} /></Item>
        <Item><KpiCard icon={CheckCircle2} tone="green" value={attAvg} decimals={1} suffix="%" label="Rata-rata kehadiran" delta={attAvg !== null && prevAttAvg !== null ? { value: attAvg - prevAttAvg, unit: " poin" } : null} /></Item>
        <Item><KpiCard icon={BarChart3} tone="purple" value={consistent} label="Pemain konsisten" caption="Kehadiran ≥ 90%" /></Item>
        <Item><KpiCard icon={TrendingUp} tone="orange" value={scoreAvg} decimals={1} label="Rata-rata skor" delta={scoreAvg !== null && prevScoreAvg !== null ? { value: scoreAvg - prevScoreAvg, unit: "" } : null} /></Item>
        <Item className="col-span-2 lg:col-span-1"><KpiCard icon={CalendarDays} tone="sky" value={doneSessions.length} label="Sesi latihan" caption={`Terlaksana dalam ${period.label.toLowerCase()}`} /></Item>
      </Stagger>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" icon={TrendingUp} title="Tren kehadiran latihan" subtitle="Persentase pemain hadir per sesi, 90 hari terakhir">
          {trend.length ? <TrendChart data={trend} series={[{ key: "hadir", name: "Hadir", color: "var(--viz-1)" }]} unit="%" domain={[40, 100]} /> : <EmptyState title="Belum ada sesi yang diabsen">Isi absensi sesi pertama untuk melihat tren.</EmptyState>}
        </Panel>
        <Panel className="lg:col-span-5" icon={PieChart} title="Distribusi skor pemain" subtitle={`Berdasarkan skor total · ${period.label.toLowerCase()}`}>
          <DonutChart
            centerValue={statsInPeriod.length}
            centerLabel="Pemain"
            data={[
              { name: "Unggul", note: "Skor ≥ 85", value: bands.unggul, color: "#1f9d55" },
              { name: "Baik", note: "75 – 84", value: bands.baik, color: "#1e6bff" },
              { name: "Cukup", note: "65 – 74", value: bands.cukup, color: "#f59e0b" },
              { name: "Perlu perhatian", note: "< 65", value: bands.perhatian, color: "#ef4444" },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" icon={Activity} title="Tren performa (rata-rata tim)" subtitle="Penilaian coach per minggu, 90 hari terakhir">
          {perfWeeks.length ? (
            <TrendChart
              data={perfWeeks.map((w) => ({ label: fmtDateShort(w.week_start), teknik: w.teknik, fisik: w.fisik, taktik: w.taktik }))}
              series={[
                { key: "teknik", name: "Teknik", color: "var(--viz-1)" },
                { key: "fisik", name: "Fisik", color: "var(--viz-2)" },
                { key: "taktik", name: "Taktik", color: "var(--viz-3)" },
              ]}
              domain={["dataMin - 3", "dataMax + 3"]}
            />
          ) : <EmptyState title="Belum ada penilaian">Mulai dari menu Input Performa.</EmptyState>}
        </Panel>
        <Panel className="lg:col-span-5" icon={Users} title="Skor per kelompok usia" subtitle="Rata-rata skor total">
          {groupBars.length ? <BarsChart data={groupBars.map((g) => ({ ...g, label: `${g.label} (${g.n})` }))} max={100} /> : <EmptyState title="Belum ada pemain aktif" />}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" icon={Trophy} title="5 pemain dengan skor tertinggi" actions={<LinkButton href="/coach/seleksi" variant="ghost" size="sm">Lihat peringkat ▸</LinkButton>} bodyClassName="p-0 md:p-0">
          {top5.length ? (
            <ol className="divide-y divide-line">
              {top5.map((s, i) => {
                const p = byId.get(s.player_id)!;
                return (
                  <li key={s.player_id}>
                    <Link href={`/coach/pemain/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sunken md:px-5">
                      <span className={`num grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${i === 0 ? "bg-gold text-nav" : "bg-sunken"}`}>{i + 1}</span>
                      <Avatar name={p.full_name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.full_name}</p>
                        <p className="caption flex items-center gap-1.5"><PositionTag position={p.position} /> Kehadiran <span className="num">{fmtPct(s.attendance_pct)}</span></p>
                      </div>
                      <div className="w-24 text-right">
                        <p className="num text-lg font-semibold">{fmtNum(s.total_score)}</p>
                        <Bar value={s.total_score ?? 0} className="h-1.5" color={i === 0 ? "var(--gold)" : "var(--accent)"} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : <div className="p-5"><EmptyState title="Belum ada skor">Skor muncul setelah absensi atau penilaian performa diisi.</EmptyState></div>}
        </Panel>

        <div className="space-y-4 lg:col-span-5">
          <Panel icon={CalendarClock} title="Sesi berikutnya">
            {next ? (
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[10px] bg-brand text-center text-white">
                  <div><p className="text-[11px] uppercase">{dayName(next.session_date).slice(0, 3)}</p><p className="num text-xl font-semibold">{next.session_date.slice(8)}</p></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{next.kind}</p>
                  <p className="caption">{dayName(next.session_date)}, {fmtDate(next.session_date)} · <span className="num">{fmtTimeRange(next.start_time, next.end_time)}</span> WIB</p>
                </div>
                <LinkButton href={`/coach/absensi/${next.session_id}`} variant="secondary" size="sm">Absen</LinkButton>
              </div>
            ) : <EmptyState title="Belum ada jadwal 2 minggu ke depan" action={<LinkButton href="/coach/jadwal" size="sm">Tambah jadwal</LinkButton>} />}
          </Panel>
          <Panel icon={AlertTriangle} title="Perlu perhatian" subtitle="Kehadiran terendah dalam periode ini">
            {attention.length ? (
              <ul className="space-y-3">
                {attention.map((s) => {
                  const p = byId.get(s.player_id)!;
                  return (
                    <li key={s.player_id}>
                      <Link href={`/coach/pemain/${p.id}`} className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-sm font-medium">{p.full_name} <ScoreBadge score={s.total_score} /></p>
                          <Bar value={s.attendance_pct ?? 0} className="mt-1.5 h-1.5" color={(s.attendance_pct ?? 0) < 75 ? "var(--alpa)" : "var(--sakit)"} />
                        </div>
                        <p className="num w-14 text-right text-sm">{fmtPct(s.attendance_pct, 0)}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : <EmptyState icon={Target} title="Semua pemain rutin hadir">Tidak ada yang perlu dikejar periode ini — kabar baik.</EmptyState>}
          </Panel>
        </div>
      </div>
    </>
  );
}
