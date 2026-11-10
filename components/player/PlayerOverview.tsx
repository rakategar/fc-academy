import { Activity, CalendarCheck, ClipboardCheck, MessageSquareText, Radar, Trophy } from "lucide-react";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { AttendanceBadge } from "@/components/ui/Badge";
import { Ring, Stagger, Item } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { TrendChart } from "@/components/charts/TrendChart";
import { RadarPerf } from "@/components/charts/RadarPerf";
import { getAttendanceRange, getPerfWeekly, getPlayerStats, getReviews } from "@/lib/data";
import { dayName, fmtDate, fmtDateShort, fmtNum, fmtPct } from "@/lib/format";
import { BAND_LABEL, SCORE_WEIGHTS, scoreBand } from "@/lib/scoring";
import type { AttendanceStatus } from "@/lib/types";

const DOT: Record<AttendanceStatus, string> = { hadir: "bg-hadir", izin: "bg-izin", sakit: "bg-sakit", alpa: "bg-alpa" };

type Section = "summary" | "pattern" | "charts" | "history" | "reviews";
const ALL: Section[] = ["summary", "pattern", "charts", "history", "reviews"];

export async function PlayerOverview({ playerId, from, to, periodLabel, self = false, show = ALL }: { playerId: string; from: string; to: string; periodLabel: string; self?: boolean; show?: Section[] }) {
  const has = (s: Section) => show.includes(s);
  const [stats, weeks, teamWeeks, reviews, attendance] = await Promise.all([
    getPlayerStats(from, to),
    getPerfWeekly(from, to, playerId),
    getPerfWeekly(from, to),
    getReviews({ playerId, from, to }),
    getAttendanceRange(from, to, playerId),
  ]);
  const me = stats.find((s) => s.player_id === playerId);
  const ranked = stats.filter((s) => s.total_score !== null).sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));
  const rank = ranked.findIndex((s) => s.player_id === playerId) + 1;
  const band = scoreBand(me?.total_score);

  const avgOf = (rows: { teknik: number; fisik: number; taktik: number; mental: number; disiplin: number; n?: number }[], k: "teknik" | "fisik" | "taktik" | "mental" | "disiplin") =>
    rows.length ? rows.reduce((s, r) => s + r[k], 0) / rows.length : 0;
  const radar = (["teknik", "fisik", "taktik", "mental", "disiplin"] as const).map((k) => ({
    aspect: k[0].toUpperCase() + k.slice(1),
    value: Math.round(avgOf(reviews, k) * 10) / 10,
    compare: Math.round(avgOf(teamWeeks, k) * 10) / 10,
  }));

  const history = [...attendance].sort((a, b) => b.training_sessions.session_date.localeCompare(a.training_sessions.session_date));
  const strip = [...history].slice(0, 24).reverse();
  const ringColor = band === "unggul" ? "var(--hadir)" : band === "baik" ? "var(--accent)" : band === "cukup" ? "var(--sakit)" : "var(--alpa)";

  return (
    <div className="space-y-4">
      {has("summary") && <Stagger className="grid gap-3 md:grid-cols-12">
        <Item className="md:col-span-5">
          <div className="flex h-full items-center gap-5 rounded-[10px] border border-line bg-panel p-4 md:p-5">
            <Ring value={me?.total_score ?? 0} size={124} color={ringColor}>
              <div>
                <p className="num text-[30px] leading-8 font-semibold">{me?.total_score == null ? "—" : <CountUp value={me.total_score} decimals={1} />}</p>
                <p className="text-[11px] text-ink-muted">Skor total</p>
              </div>
            </Ring>
            <div className="min-w-0">
              <p className="caption">{periodLabel}</p>
              <p className="mt-1 text-lg font-semibold">{band ? BAND_LABEL[band] : "Belum ada data"}</p>
              {rank > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                  <Trophy size={15} className="text-gold" /> Peringkat <b className="num text-ink">{rank}</b> dari <span className="num">{ranked.length}</span>
                </p>
              )}
              <p className="caption mt-2">{Math.round(SCORE_WEIGHTS.attendance * 100)}% kehadiran + {Math.round(SCORE_WEIGHTS.performance * 100)}% performa</p>
            </div>
          </div>
        </Item>
        <Item className="md:col-span-4">
          <div className="h-full rounded-[10px] bg-tint-green p-4 md:p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><CalendarCheck size={18} className="text-[#1f9d55]" /> Kehadiran</p>
            <p className="num mt-1 text-[30px] leading-9 font-semibold">{me?.attendance_pct == null ? "—" : <><CountUp value={me.attendance_pct} decimals={1} />%</>}</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-xs">
              {(["hadir", "izin", "sakit", "alpa"] as const).map((k) => (
                <div key={k} className="rounded-[6px] bg-panel/70 py-1.5">
                  <p className="num text-base font-semibold">{me?.[k] ?? 0}</p>
                  <p className="text-ink-muted">{k === "alpa" ? "Alpa" : k[0].toUpperCase() + k.slice(1)}</p>
                </div>
              ))}
            </div>
          </div>
        </Item>
        <Item className="md:col-span-3">
          <div className="h-full rounded-[10px] bg-tint-purple p-4 md:p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><Activity size={18} className="text-[#7c4ddb]" /> Rata-rata performa</p>
            <p className="num mt-1 text-[30px] leading-9 font-semibold">{me?.perf_avg == null ? "—" : <CountUp value={me.perf_avg} decimals={1} />}</p>
            <p className="caption">{reviews.length} penilaian coach</p>
            {weeks.length >= 2 && (
              <p className={`num mt-1 text-xs font-medium ${weeks.at(-1)!.overall >= weeks[0].overall ? "text-gain" : "text-loss"}`}>
                {weeks.at(-1)!.overall >= weeks[0].overall ? "↑" : "↓"} {fmtNum(Math.abs(weeks.at(-1)!.overall - weeks[0].overall))} sejak {fmtDateShort(weeks[0].week_start)}
              </p>
            )}
          </div>
        </Item>
      </Stagger>}

      {has("pattern") && <Panel icon={ClipboardCheck} title="Pola kehadiran" subtitle={`${strip.length} sesi terakhir · kiri = paling lama`}>
        {strip.length ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {strip.map((a) => (
                <span key={a.id} title={`${fmtDate(a.training_sessions.session_date)}: ${a.status}`} className={`h-7 w-7 rounded-[6px] ${DOT[a.status]}`} />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              {(["hadir", "izin", "sakit", "alpa"] as const).map((k) => <li key={k} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-[3px] ${DOT[k]}`} />{k === "alpa" ? "Tanpa keterangan" : k[0].toUpperCase() + k.slice(1)}</li>)}
            </ul>
          </>
        ) : <EmptyState title="Belum ada catatan absensi">Absensi muncul setelah coach mencatat sesi latihan.</EmptyState>}
      </Panel>}

      {has("charts") && <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" icon={Activity} title="Perkembangan performa" subtitle="Rata-rata penilaian per minggu">
          {weeks.length ? (
            <TrendChart
              data={weeks.map((w) => ({ label: fmtDateShort(w.week_start), skor: w.overall, teknik: w.teknik, fisik: w.fisik, taktik: w.taktik }))}
              series={[
                { key: "skor", name: "Rata-rata", color: "var(--viz-5)" },
                { key: "teknik", name: "Teknik", color: "var(--viz-1)" },
                { key: "fisik", name: "Fisik", color: "var(--viz-2)" },
                { key: "taktik", name: "Taktik", color: "var(--viz-3)" },
              ]}
              domain={["dataMin - 3", "dataMax + 3"]}
            />
          ) : <EmptyState title="Belum ada penilaian performa">{self ? "Coach belum menilai performamu di periode ini." : "Isi penilaian dari menu Input Performa."}</EmptyState>}
        </Panel>
        <Panel className="lg:col-span-5" icon={Radar} title="Profil kemampuan" subtitle="Dibanding rata-rata tim">
          {reviews.length ? <RadarPerf data={radar} /> : <EmptyState title="Belum ada data" />}
        </Panel>
      </div>}

      {(has("history") || has("reviews")) && <div className={`grid gap-4 ${has("history") && has("reviews") ? "lg:grid-cols-2" : ""}`}>
        {has("history") && <Panel icon={CalendarCheck} title="Riwayat absensi" subtitle={`${history.length} sesi`} bodyClassName="p-0 md:p-0">
          {history.length ? (
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {history.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{dayName(a.training_sessions.session_date)}, {fmtDate(a.training_sessions.session_date)}</p>
                    <p className="caption">{a.training_sessions.kind}{a.note ? ` · ${a.note}` : ""}</p>
                  </div>
                  <AttendanceBadge status={a.status} />
                </li>
              ))}
            </ul>
          ) : <div className="p-5"><EmptyState title="Belum ada riwayat" /></div>}
        </Panel>}
        {has("reviews") && <Panel icon={MessageSquareText} title="Catatan & penilaian coach" subtitle={`${reviews.length} penilaian`} bodyClassName="p-0 md:p-0">
          {reviews.length ? (
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {reviews.map((r) => (
                <li key={r.id} className="px-4 py-3 md:px-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{fmtDate(r.review_date)}</p>
                    <p className="num text-sm font-semibold">{fmtNum(r.overall)}</p>
                  </div>
                  <p className="num caption mt-0.5">Tek {r.teknik} · Fis {r.fisik} · Tak {r.taktik} · Men {r.mental} · Dis {r.disiplin}</p>
                  {r.notes && <p className="mt-1.5 rounded-[6px] bg-sunken px-2.5 py-1.5 text-sm">“{r.notes}”</p>}
                </li>
              ))}
            </ul>
          ) : <div className="p-5"><EmptyState title="Belum ada penilaian" /></div>}
        </Panel>}
      </div>}
      <p className="caption">Kehadiran {fmtPct(me?.attendance_pct)} dihitung dari sesi yang tercatat dalam periode ini. Izin dan sakit dihitung setengah poin pada skor kehadiran.</p>
    </div>
  );
}
