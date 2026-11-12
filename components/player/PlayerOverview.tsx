import { Activity, CalendarCheck, ClipboardCheck, ListChecks, MessageSquareText, Radar, Trophy } from "lucide-react";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { AttendanceBadge } from "@/components/ui/Badge";
import { Ring, Stagger, Item, Bar } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { TrendChart } from "@/components/charts/TrendChart";
import { RadarPerf } from "@/components/charts/RadarPerf";
import { getAgeGroups, getAssessmentItems, getAssessments, getAttendanceRange, getCoaches, getPlayer, getPlayerStats, getPlayers, getScores } from "@/lib/data";
import { dayName, fmtDate, fmtDateShort, fmtNum, fmtPct, fmtScore } from "@/lib/format";
import { BAND_LABEL, SCORE_WEIGHTS, scoreBand, valueDomain, valueTone } from "@/lib/scoring";
import { CATEGORIES, itemsFor, type AttendanceStatus } from "@/lib/types";

const DOT: Record<AttendanceStatus, string> = { hadir: "bg-hadir", izin: "bg-izin", sakit: "bg-sakit", alpa: "bg-alpa" };

type Section = "summary" | "pattern" | "charts" | "items" | "history" | "reviews";
const ALL: Section[] = ["summary", "pattern", "charts", "items", "history", "reviews"];

/** Ringkasan pemain: skor, kehadiran, nilai 1–10, perkembangan, dan peringkat di kelompok usianya. */
export async function PlayerOverview({ playerId, from, to, periodLabel, self = false, show = ALL }: { playerId: string; from: string; to: string; periodLabel: string; self?: boolean; show?: Section[] }) {
  const has = (s: Section) => show.includes(s);
  const player = await getPlayer(playerId);
  if (!player) return null;
  const [groups, peers, assessments, attendance, items, coaches] = await Promise.all([
    getAgeGroups(),
    getPlayers({ status: "aktif" }),
    getAssessments({ playerId, from, to }),
    getAttendanceRange(from, to, { playerId }),
    getAssessmentItems(true),
    getCoaches(),
  ]);
  const group = groups.find((g) => g.id === player.age_group_id);
  const peerIds = peers.filter((p) => p.age_group_id === player.age_group_id).map((p) => p.id);
  const stats = await getPlayerStats(from, to, peerIds.length ? peerIds : [playerId]);
  const me = stats.find((s) => s.player_id === playerId);
  const ranked = stats.filter((s) => s.total_score !== null).sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));
  const rank = ranked.findIndex((s) => s.player_id === playerId) + 1;
  const band = scoreBand(me?.total_score);
  const coachName = new Map(coaches.map((c) => [c.id, c.full_name]));

  const chrono = [...assessments].reverse();
  const first = chrono[0], last = chrono.at(-1);
  const scores = await getScores([first?.id, last?.id].filter((x): x is string => !!x));
  const firstScores = new Map(scores.filter((s) => s.assessment_id === first?.id).map((s) => [s.item_id, s.score]));
  const lastScores = new Map(scores.filter((s) => s.assessment_id === last?.id).map((s) => [s.item_id, s.score]));
  const myItems = itemsFor(items, player.position).filter((i) => lastScores.has(i.id) || firstScores.has(i.id));
  const radar = myItems.map((i) => ({ aspect: i.name, value: lastScores.get(i.id) ?? 0, compare: chrono.length > 1 ? firstScores.get(i.id) ?? 0 : undefined }));
  const delta = first && last && first.id !== last.id ? last.overall - first.overall : null;

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
                <p className="mt-1 text-sm text-ink-muted">
                  <Trophy size={15} className="mr-1 inline align-[-2px] text-gold" />Peringkat <b className="num text-ink">#{rank}</b> dari <span className="num">{ranked.length}</span> di {group?.name ?? "kelompok"}
                </p>
              )}
              <p className="caption mt-2">{Math.round(SCORE_WEIGHTS.attendance * 100)}% kehadiran + {Math.round(SCORE_WEIGHTS.performance * 100)}% nilai coach</p>
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
            <p className="flex items-center gap-2 text-sm font-medium"><Activity size={18} className="text-[#7c4ddb]" /> Nilai rata-rata</p>
            <p className="num mt-1 text-[30px] leading-9 font-semibold">{me?.perf_avg == null ? "—" : <><CountUp value={me.perf_avg} decimals={1} /><span className="text-base text-ink-muted"> /10</span></>}</p>
            <p className="caption">{assessments.length} penilaian coach</p>
            {delta !== null && (
              <p className={`num mt-1 text-xs font-medium ${delta >= 0 ? "text-gain" : "text-loss"}`}>
                {delta >= 0 ? "▲" : "▼"} {fmtNum(Math.abs(delta))} sejak {fmtDateShort(first!.assessed_on)}
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
        <Panel className="lg:col-span-7" icon={Activity} title="Grafik peningkatan" subtitle="Nilai 1–10 per penilaian coach">
          {chrono.length ? (
            <TrendChart
              data={chrono.map((a) => ({ label: fmtDateShort(a.assessed_on), rata: a.overall, fisik: a.fisik, teknik: a.teknik, taktik: a.taktik }))}
              series={[{ key: "rata", name: "Rata-rata", color: "var(--viz-5)" }, ...CATEGORIES.map((c) => ({ key: c.key, name: c.label, color: c.color }))]}
              domain={valueDomain(chrono.flatMap((a) => [a.fisik, a.teknik, a.taktik]))}
            />
          ) : <EmptyState title="Belum ada penilaian">{self ? "Coach belum menilaimu di periode ini." : "Isi penilaian dari menu Penilaian 1–10."}</EmptyState>}
        </Panel>
        <Panel className="lg:col-span-5" icon={Radar} title="Profil kemampuan" subtitle={chrono.length > 1 ? `Terakhir (${fmtDateShort(last!.assessed_on)}) vs pertama (${fmtDateShort(first!.assessed_on)})` : "Penilaian terakhir"}>
          {radar.length ? <RadarPerf data={radar} max={10} valueLabel="Terakhir" compareLabel="Pertama" height={300} /> : <EmptyState title="Belum ada data" />}
        </Panel>
      </div>}

      {has("items") && myItems.length > 0 && <Panel icon={ListChecks} title="Nilai per tes" subtitle="Penilaian terakhir dibanding penilaian pertama di periode ini" bodyClassName="p-0 md:p-0">
        <div className="grid md:grid-cols-3 md:divide-x md:divide-line">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="border-t border-line p-4 md:border-t-0 md:p-5">
              <p className="mb-2 flex items-center justify-between text-sm font-semibold">{c.label}<span className={`num rounded-full px-2 py-0.5 text-xs ${valueTone(last?.[c.key])}`}>{fmtScore(last?.[c.key])}</span></p>
              <ul className="space-y-2.5">
                {myItems.filter((i) => i.category === c.key).map((i) => {
                  const v = lastScores.get(i.id), f = firstScores.get(i.id);
                  const d = v !== undefined && f !== undefined && chrono.length > 1 ? v - f : null;
                  return (
                    <li key={i.id}>
                      <div className="flex items-baseline justify-between gap-2 text-[13px]">
                        <span className="truncate">{i.name}</span>
                        <span className="num shrink-0 font-semibold">{v ?? "—"}{d !== null && d !== 0 && <span className={`ml-1.5 text-[11px] ${d > 0 ? "text-gain" : "text-loss"}`}>{d > 0 ? "▲" : "▼"}{Math.abs(d)}</span>}</span>
                      </div>
                      <Bar value={v ?? 0} max={10} className="mt-1 h-1.5" color={c.color} />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Panel>}

      {(has("history") || has("reviews")) && <div className={`grid gap-4 ${has("history") && has("reviews") ? "lg:grid-cols-2" : ""}`}>
        {has("history") && <Panel icon={CalendarCheck} title="Riwayat absensi" subtitle={`${history.length} sesi`} bodyClassName="p-0 md:p-0">
          {history.length ? (
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {history.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{dayName(a.training_sessions.session_date)}, {fmtDate(a.training_sessions.session_date)}</p>
                    <p className="caption">{a.training_sessions.kind}{a.training_sessions.coach_id ? ` · ${coachName.get(a.training_sessions.coach_id) ?? ""}` : ""}{a.note ? ` · ${a.note}` : ""}</p>
                  </div>
                  <AttendanceBadge status={a.status} />
                </li>
              ))}
            </ul>
          ) : <div className="p-5"><EmptyState title="Belum ada riwayat" /></div>}
        </Panel>}
        {has("reviews") && <Panel icon={MessageSquareText} title="Catatan & penilaian coach" subtitle={`${assessments.length} penilaian`} bodyClassName="p-0 md:p-0">
          {assessments.length ? (
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {assessments.map((r) => (
                <li key={r.id} className="px-4 py-3 md:px-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{fmtDate(r.assessed_on)} <span className="caption font-normal">· {r.coach_id ? coachName.get(r.coach_id) ?? "Coach" : "Coach"}</span></p>
                    <p className={`num rounded-full px-2 py-0.5 text-sm font-semibold ${valueTone(r.overall)}`}>{fmtScore(r.overall)}</p>
                  </div>
                  <p className="num caption mt-0.5">Fisik {fmtScore(r.fisik)} · Teknik {fmtScore(r.teknik)} · Taktik {fmtScore(r.taktik)}</p>
                  {r.notes && <p className="mt-1.5 rounded-[6px] bg-sunken px-2.5 py-1.5 text-sm">“{r.notes}”</p>}
                </li>
              ))}
            </ul>
          ) : <div className="p-5"><EmptyState title="Belum ada penilaian" /></div>}
        </Panel>}
      </div>}
      <p className="caption">Kehadiran {fmtPct(me?.attendance_pct)} dihitung dari sesi yang tercatat dalam periode ini. Izin dan sakit dihitung setengah poin pada skor kehadiran. Nilai coach (1–10) dikali 10 sebelum digabung ke skor total.</p>
    </div>
  );
}
