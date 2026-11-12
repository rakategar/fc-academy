import Link from "next/link";
import {
  Activity, AlertTriangle, BarChart3, CalendarClock, CalendarDays, CheckCircle2, ClipboardCheck, LayoutDashboard,
  PieChart, ShieldCheck, Target, TrendingUp, Trophy, UserPlus, Users,
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
import {
  countPending, getAgeGroups, getAssessments, getCoaches, getMemberships, getPeriod, getPlayerStats, getPlayers, getSessionAgg,
} from "@/lib/data";
import { addDays, dayName, fmtDate, fmtDateShort, fmtNum, fmtPct, fmtScore, fmtTimeRange, todayISO } from "@/lib/format";
import { scoreBand, valueDomain } from "@/lib/scoring";
import { CATEGORIES } from "@/lib/types";
import type { Scope } from "@/lib/scope";

const avg = (xs: (number | null | undefined)[]) => {
  const v = xs.filter((x): x is number => x !== null && x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const COLORS = ["#1e6bff", "#1f9d55", "#f59e0b", "#8b5cf6", "#0b2a6f", "#0b84c6"];

export async function DashboardView({ scope, periode }: { scope: Scope; periode?: string }) {
  const period = await getPeriod(periode, "musim");
  const days = Math.round((Date.parse(period.to) - Date.parse(period.from)) / 86400000) + 1;
  const prevTo = addDays(period.from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  const today = todayISO();
  const trendFrom = addDays(today, -90);
  const isAdmin = scope.role === "admin";

  const [players, groups, stats, prevStats, sessions, upcoming, assessments, pending, coaches, memberships] = await Promise.all([
    getPlayers({ status: "aktif", ids: scope.ids }),
    getAgeGroups(),
    getPlayerStats(period.from, period.to, scope.ids),
    getPlayerStats(prevFrom, prevTo, scope.ids),
    getSessionAgg(trendFrom < period.from ? trendFrom : period.from, period.to, scope.coachId),
    getSessionAgg(today, addDays(today, 14), scope.coachId),
    getAssessments({ ids: scope.ids, from: trendFrom < period.from ? trendFrom : period.from, to: today }),
    isAdmin ? countPending() : Promise.resolve({ players: 0, coaches: 0 }),
    isAdmin ? getCoaches({ status: "aktif" }) : Promise.resolve([]),
    isAdmin ? getMemberships() : Promise.resolve([]),
  ]);

  const byId = new Map(players.map((p) => [p.id, p]));
  const statsInPeriod = stats.filter((s) => s.sessions_total > 0 || s.perf_avg !== null);
  const attAvg = avg(stats.map((s) => s.attendance_pct));
  const prevAttAvg = avg(prevStats.map((s) => s.attendance_pct));
  const valAvg = avg(stats.map((s) => s.perf_avg));
  const prevValAvg = avg(prevStats.map((s) => s.perf_avg));
  const doneSessions = sessions.filter((s) => s.status === "selesai" && s.session_date >= period.from);

  // persentase hadir per tanggal (gabungan semua sesi di hari itu)
  const perDay = new Map<string, { h: number; t: number }>();
  for (const s of sessions.filter((x) => x.status === "selesai" && x.total > 0)) {
    const d = perDay.get(s.session_date) ?? { h: 0, t: 0 };
    d.h += s.hadir; d.t += s.total; perDay.set(s.session_date, d);
  }
  const trend = [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ label: fmtDateShort(d), hadir: Math.round((v.h / v.t) * 1000) / 10 }));

  // Tren nilai per tanggal penilaian
  const byDate = new Map<string, { f: number[]; t: number[]; k: number[] }>();
  for (const a of assessments.filter((a) => a.assessed_on >= trendFrom)) {
    const d = byDate.get(a.assessed_on) ?? { f: [], t: [], k: [] };
    d.f.push(a.fisik); d.t.push(a.teknik); d.k.push(a.taktik); byDate.set(a.assessed_on, d);
  }
  const valueTrend = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([d, v]) => ({
    label: fmtDateShort(d), fisik: Math.round(avg(v.f)! * 10) / 10, teknik: Math.round(avg(v.t)! * 10) / 10, taktik: Math.round(avg(v.k)! * 10) / 10,
  }));

  const bands = { unggul: 0, baik: 0, cukup: 0, perhatian: 0 };
  for (const s of statsInPeriod) { const b = scoreBand(s.total_score); if (b) bands[b]++; }

  const groupBars = groups
    .map((g, i) => {
      const ids = players.filter((p) => p.age_group_id === g.id).map((p) => p.id);
      const v = avg(stats.filter((s) => ids.includes(s.player_id)).map((s) => s.perf_avg));
      return { label: g.name, value: v === null ? 0 : Math.round(v * 10) / 10, color: COLORS[i % COLORS.length], n: ids.length };
    })
    .filter((g) => g.n > 0);
  const catBars = CATEGORIES.map((c, i) => ({ label: c.label, value: Math.round((avg(stats.map((s) => s[c.key])) ?? 0) * 10) / 10, color: COLORS[i] }));

  const ranked = [...statsInPeriod].filter((s) => s.total_score !== null).sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));
  const top5 = ranked.slice(0, 5);
  const attention = [...stats].filter((s) => s.sessions_total > 0).sort((a, b) => (a.attendance_pct ?? 0) - (b.attendance_pct ?? 0)).slice(0, 5);
  const next = upcoming.find((s) => s.status === "terjadwal");

  const squadRows = coaches.map((c) => {
    const ids = memberships.filter((m) => m.coach_id === c.id && !m.excluded).map((m) => m.player_id);
    const st = stats.filter((s) => ids.includes(s.player_id));
    return { c, n: ids.length, att: avg(st.map((s) => s.attendance_pct)), val: avg(st.map((s) => s.perf_avg)) };
  });

  const base = scope.base;
  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title={isAdmin ? "Dashboard Akademi" : "Dashboard Skuad"}
        subtitle={`${period.label} · ${fmtDate(period.from)} – ${fmtDate(period.seasonEnd ?? period.to)}${period.key === "musim" ? " (diatur admin)" : ""}`}
        actions={
          <>
            <PeriodTabs current={period.key} basePath={`${base}/dashboard`} />
            {!isAdmin && <LinkButton href="/coach/absensi" variant="accent"><ClipboardCheck size={18} /> Isi absensi</LinkButton>}
          </>
        }
      />

      {isAdmin && pending.players + pending.coaches > 0 && (
        <Link href="/admin/verifikasi" className="mb-4 flex items-center gap-3 rounded-[10px] border border-gold/40 bg-gold-soft p-3.5 text-gold-ink">
          <UserPlus size={20} className="shrink-0" />
          <p className="flex-1 text-sm"><b className="num">{pending.coaches}</b> coach dan <b className="num">{pending.players}</b> pemain menunggu verifikasi.</p>
          <span className="text-sm font-semibold">Periksa ▸</span>
        </Link>
      )}
      {!isAdmin && players.length === 0 && (
        <div className="mb-4 rounded-[10px] border border-gold/40 bg-gold-soft p-3.5 text-sm text-gold-ink">Skuadmu belum berisi pemain. Admin akan menambahkan pemain sesuai kelompok usia yang kamu pegang.</div>
      )}

      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Item><KpiCard icon={Users} tone="blue" value={players.length} label={isAdmin ? "Pemain aktif" : "Pemain di skuad"} caption={isAdmin ? `${coaches.length} coach aktif` : `${groups.filter((g) => players.some((p) => p.age_group_id === g.id)).length} kelompok usia`} /></Item>
        <Item><KpiCard icon={CheckCircle2} tone="green" value={attAvg} decimals={1} suffix="%" label="Rata-rata kehadiran" delta={attAvg !== null && prevAttAvg !== null ? { value: attAvg - prevAttAvg, unit: " poin" } : null} /></Item>
        <Item><KpiCard icon={Activity} tone="purple" value={valAvg} decimals={1} label="Nilai rata-rata (1–10)" delta={valAvg !== null && prevValAvg !== null ? { value: valAvg - prevValAvg, unit: "" } : null} /></Item>
        <Item><KpiCard icon={TrendingUp} tone="orange" value={avg(stats.map((s) => s.total_score))} decimals={1} label="Rata-rata skor total" caption="40% hadir + 60% nilai" /></Item>
        <Item className="col-span-2 lg:col-span-1"><KpiCard icon={CalendarDays} tone="sky" value={doneSessions.length} label="Sesi latihan" caption={`Terlaksana · ${period.label.toLowerCase()}`} /></Item>
      </Stagger>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" icon={Activity} title="Tren nilai rata-rata" subtitle="Penilaian coach 1–10, 90 hari terakhir">
          {valueTrend.length ? (
            <TrendChart data={valueTrend} series={CATEGORIES.map((c) => ({ key: c.key, name: c.label, color: c.color }))} domain={valueDomain(valueTrend.flatMap((v) => [v.fisik, v.teknik, v.taktik]))} />
          ) : <EmptyState title="Belum ada penilaian">{isAdmin ? "Penilaian diisi coach dari menu Penilaian 1–10." : "Mulai dari menu Penilaian 1–10."}</EmptyState>}
        </Panel>
        <Panel className="lg:col-span-5" icon={PieChart} title="Distribusi skor pemain" subtitle={`Skor total · ${period.label.toLowerCase()}`}>
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
        <Panel className="lg:col-span-7" icon={CheckCircle2} title="Tren kehadiran latihan" subtitle="Persentase pemain hadir per hari latihan, 90 hari terakhir">
          {trend.length ? <TrendChart data={trend} series={[{ key: "hadir", name: "Hadir", color: "var(--viz-1)" }]} unit="%" domain={[40, 100]} /> : <EmptyState title="Belum ada sesi yang diabsen">Isi absensi sesi pertama untuk melihat tren.</EmptyState>}
        </Panel>
        <Panel className="lg:col-span-5" icon={BarChart3} title={isAdmin ? "Nilai per kelompok usia" : "Nilai per kategori"} subtitle="Rata-rata nilai 1–10">
          {isAdmin
            ? groupBars.length ? <BarsChart data={groupBars.map((g) => ({ ...g, label: `${g.label} (${g.n})` }))} max={10} /> : <EmptyState title="Belum ada pemain aktif" />
            : <BarsChart data={catBars} max={10} />}
        </Panel>
      </div>

      {isAdmin && (
        <Panel className="mt-4" icon={ShieldCheck} title="Ringkasan per coach" subtitle="Skuad aktif, rata-rata kehadiran, dan nilai" actions={<LinkButton href="/admin/coach" variant="ghost" size="sm">Kelola skuad ▸</LinkButton>} bodyClassName="p-0 md:p-0">
          {squadRows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead className="bg-sunken text-ink-muted"><tr>{["Coach", "Skuad", "Pemain", "Kehadiran", "Nilai"].map((h, i) => <th key={h} className={`px-3 py-2.5 font-medium ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
                <tbody>
                  {squadRows.map(({ c, n, att, val }) => (
                    <tr key={c.id} className="h-11 border-b border-line hover:bg-sunken">
                      <td className="px-3 font-medium"><Link href={`/admin/coach/${c.id}`} className="hover:text-accent">{c.full_name}</Link></td>
                      <td className="px-3 text-ink-muted">{c.focus === "kiper" ? "Kiper · " : ""}{groups.filter((g) => c.age_group_ids.includes(g.id)).map((g) => g.name).join(", ")}</td>
                      <td className="num px-3 text-right">{n}</td>
                      <td className="num px-3 text-right">{fmtPct(att)}</td>
                      <td className="num px-3 text-right font-semibold">{fmtScore(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="p-5"><EmptyState title="Belum ada coach aktif">Setujui pendaftaran coach di menu Verifikasi.</EmptyState></div>}
        </Panel>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" icon={Trophy} title="5 pemain dengan skor tertinggi" actions={<LinkButton href={`${base}/peringkat`} variant="ghost" size="sm">Lihat peringkat ▸</LinkButton>} bodyClassName="p-0 md:p-0">
          {top5.length ? (
            <ol className="divide-y divide-line">
              {top5.map((s, i) => {
                const p = byId.get(s.player_id)!;
                return (
                  <li key={s.player_id}>
                    <Link href={`${base}/pemain/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sunken md:px-5">
                      <span className={`num grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${i === 0 ? "bg-gold text-nav" : "bg-sunken"}`}>{i + 1}</span>
                      <Avatar name={p.full_name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.full_name}</p>
                        <p className="caption flex items-center gap-1.5"><PositionTag position={p.position} /> Hadir <span className="num">{fmtPct(s.attendance_pct, 0)}</span> · nilai <span className="num">{fmtScore(s.perf_avg)}</span></p>
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
          ) : <div className="p-5"><EmptyState title="Belum ada skor">Skor muncul setelah absensi atau penilaian diisi.</EmptyState></div>}
        </Panel>

        <div className="space-y-4 lg:col-span-5">
          <Panel icon={CalendarClock} title="Sesi berikutnya">
            {next ? (
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[10px] bg-brand text-center text-white">
                  <div><p className="text-[11px] uppercase">{dayName(next.session_date).slice(0, 3)}</p><p className="num text-xl font-semibold">{next.session_date.slice(8)}</p></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{next.kind}{next.gk_only ? " · Kiper" : ""}</p>
                  <p className="caption">{dayName(next.session_date)}, {fmtDate(next.session_date)} · <span className="num">{fmtTimeRange(next.start_time, next.end_time)}</span> WIB</p>
                </div>
                {!isAdmin && <LinkButton href={`/coach/absensi/${next.session_id}`} variant="secondary" size="sm">Absen</LinkButton>}
              </div>
            ) : <EmptyState title="Belum ada jadwal 2 minggu ke depan" action={!isAdmin ? <LinkButton href="/coach/jadwal" size="sm">Tambah jadwal</LinkButton> : undefined} />}
          </Panel>
          <Panel icon={AlertTriangle} title="Perlu perhatian" subtitle="Kehadiran terendah dalam periode ini">
            {attention.length ? (
              <ul className="space-y-3">
                {attention.map((s) => {
                  const p = byId.get(s.player_id)!;
                  return (
                    <li key={s.player_id}>
                      <Link href={`${base}/pemain/${p.id}`} className="flex items-center gap-3">
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
            ) : <EmptyState icon={Target} title="Semua pemain rutin hadir">Tidak ada yang perlu dikejar periode ini.</EmptyState>}
          </Panel>
        </div>
      </div>
    </>
  );
}
