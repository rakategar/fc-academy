import "server-only";
import { cache } from "react";
import { db, selectAll } from "@/lib/supabase";
import { SCORE_WEIGHTS } from "@/lib/scoring";
import { addDays, PERIODS, todayISO, type Period, type PeriodKey } from "@/lib/format";
import type {
  AgeGroup, Assessment, AssessmentItem, AssessmentMonth, Attendance, Coach, CoachPlayer, ItemAvg, Player, PlayerStat,
  PlayerStatus, Season, SessionAgg, TrainingSession,
} from "@/lib/types";

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** `ids` = null berarti semua pemain (admin). Array kosong berarti tidak ada. */
export type Ids = string[] | null;

// ---------- Referensi ----------
export const getAgeGroups = cache(async (): Promise<AgeGroup[]> => check(await db().from("age_groups").select("*").order("min_age")));

export const getSeasons = cache(async (): Promise<Season[]> => check(await db().from("seasons").select("*").order("start_date", { ascending: false })));

export const getActiveSeason = cache(async (): Promise<Season | null> => (await getSeasons()).find((s) => s.is_active) ?? null);

export const getAssessmentItems = cache(async (all = false): Promise<AssessmentItem[]> => {
  let q = db().from("assessment_items").select("*").order("category").order("applies_to").order("sort");
  if (!all) q = q.eq("active", true);
  return check(await q);
});

/** Rentang periode. "musim" mengikuti musim aktif yang diatur admin. */
export async function getPeriod(key: string | undefined, fallback: PeriodKey = "30"): Promise<Period> {
  const to = todayISO();
  const k = (PERIODS.find((p) => p.key === key)?.key ?? fallback) as PeriodKey;
  if (k === "musim") {
    const s = await getActiveSeason();
    if (s) return { from: s.start_date, to: s.end_date < to ? s.end_date : to, key: k, label: s.name, seasonEnd: s.end_date };
    const { y, m } = { y: Number(to.slice(0, 4)), m: Number(to.slice(5, 7)) };
    const startYear = m >= 7 ? y : y - 1;
    return { from: `${startYear}-07-01`, to, key: k, label: `Musim ${startYear}/${startYear + 1}`, seasonEnd: `${startYear + 1}-06-30` };
  }
  return { from: addDays(to, -(Number(k) - 1)), to, key: k, label: `${PERIODS.find((p) => p.key === k)!.label} terakhir` };
}

// ---------- Pemain ----------
export async function getPlayers(opts: { status?: PlayerStatus | PlayerStatus[]; ids?: Ids } = {}): Promise<Player[]> {
  if (opts.ids && !opts.ids.length) return [];
  let q = db().from("players").select("*").order("full_name");
  if (opts.status) q = Array.isArray(opts.status) ? q.in("status", opts.status) : q.eq("status", opts.status);
  if (opts.ids) q = q.in("id", opts.ids);
  return check(await q);
}

export async function getPlayer(id: string): Promise<Player | null> {
  return check(await db().from("players").select("*").eq("id", id).maybeSingle());
}

export async function countPending(): Promise<{ players: number; coaches: number }> {
  const [p, c] = await Promise.all([
    db().from("players").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db().from("coaches").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return { players: p.count ?? 0, coaches: c.count ?? 0 };
}

// ---------- Coach & skuad ----------
export async function getCoaches(opts: { status?: Coach["status"] | Coach["status"][] } = {}): Promise<Coach[]> {
  let q = db().from("coaches").select("*").order("full_name");
  if (opts.status) q = Array.isArray(opts.status) ? q.in("status", opts.status) : q.eq("status", opts.status);
  return check(await q);
}

export async function getCoach(id: string): Promise<Coach | null> {
  return check(await db().from("coaches").select("*").eq("id", id).maybeSingle());
}

export async function getMemberships(opts: { coachId?: string; playerId?: string } = {}): Promise<CoachPlayer[]> {
  let q = db().from("coach_players").select("coach_id, player_id, source, excluded");
  if (opts.coachId) q = q.eq("coach_id", opts.coachId);
  if (opts.playerId) q = q.eq("player_id", opts.playerId);
  return check(await q);
}

/** ID pemain anggota skuad coach (tanpa yang dikeluarkan). */
export async function getSquadIds(coachId: string): Promise<string[]> {
  return (await getMemberships({ coachId })).filter((m) => !m.excluded).map((m) => m.player_id);
}

export async function syncSquads(opts: { coachId?: string; playerId?: string } = {}) {
  const { error } = await db().rpc("sync_coach_players", { p_coach: opts.coachId ?? null, p_player: opts.playerId ?? null });
  if (error) throw new Error(error.message);
}

// ---------- Sesi & absensi ----------
export async function getSessions(from: string, to: string, coachId?: string | null): Promise<TrainingSession[]> {
  let q = db().from("training_sessions").select("*").gte("session_date", from).lte("session_date", to).order("session_date").order("start_time");
  if (coachId) q = q.eq("coach_id", coachId);
  return check(await q);
}

export async function getSession(id: string): Promise<TrainingSession | null> {
  return check(await db().from("training_sessions").select("*").eq("id", id).maybeSingle());
}

export async function getSessionAttendance(sessionId: string): Promise<Attendance[]> {
  return check(await db().from("attendance").select("*").eq("session_id", sessionId));
}

export async function getSessionAgg(from: string, to: string, coachId?: string | null): Promise<SessionAgg[]> {
  return check(await db().rpc("attendance_by_session", { p_from: from, p_to: to, p_coach: coachId ?? null }));
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Default hanya pemain aktif. `allStatus` ikut menyertakan pemain cuti/arsip (laporan historis, profil pemain itu sendiri). */
export async function getPlayerStats(from: string, to: string, ids: Ids = null, allStatus = false): Promise<PlayerStat[]> {
  if (ids && !ids.length) return [];
  const rows: PlayerStat[] = check(
    await db().rpc("player_stats", { p_from: from, p_to: to, w_att: SCORE_WEIGHTS.attendance, w_perf: SCORE_WEIGHTS.performance, p_player_ids: ids, p_all_status: allStatus }),
  );
  return rows.map((r) => ({
    ...r,
    attendance_pct: num(r.attendance_pct), attendance_score: num(r.attendance_score), perf_avg: num(r.perf_avg),
    fisik: num(r.fisik), teknik: num(r.teknik), taktik: num(r.taktik),
    perf_first: num(r.perf_first), perf_last: num(r.perf_last), total_score: num(r.total_score),
  }));
}

/** Semua absensi dalam periode (untuk heatmap & laporan). */
export async function getAttendanceRange(from: string, to: string, opts: { playerId?: string; ids?: Ids } = {}) {
  if (opts.ids && !opts.ids.length) return [];
  return selectAll<Attendance & { training_sessions: { session_date: string; kind: string; start_time: string; status: string; coach_id: string | null } }>(
    (a, b) => {
      let q = db().from("attendance")
        .select("*, training_sessions!inner(session_date, kind, start_time, status, coach_id)")
        .gte("training_sessions.session_date", from).lte("training_sessions.session_date", to)
        .order("id").range(a, b);
      if (opts.playerId) q = q.eq("player_id", opts.playerId);
      else if (opts.ids && opts.ids.length <= 200) q = q.in("player_id", opts.ids);
      return q;
    },
  ).then((rows) => (opts.ids && !opts.playerId ? rows.filter((r) => opts.ids!.includes(r.player_id)) : rows));
}

/** Pemain yang wajib ikut sesi: anggota skuad coach pemilik sesi, cocok kelompok, dan kiper bila sesi khusus kiper. */
export function eligiblePlayers(players: Player[], session: Pick<TrainingSession, "age_group_id" | "gk_only">, squad: Set<string> | null) {
  return players.filter((p) =>
    p.status === "aktif" && (!squad || squad.has(p.id)) &&
    (session.age_group_id === null || p.age_group_id === session.age_group_id) &&
    (!session.gk_only || p.position === "GK"));
}

export function groupForAge(groups: AgeGroup[], age: number): AgeGroup | undefined {
  return groups.find((g) => age >= g.min_age && age <= g.max_age);
}

// ---------- Penilaian ----------
const toAssessment = (r: Assessment): Assessment => ({ ...r, fisik: Number(r.fisik), teknik: Number(r.teknik), taktik: Number(r.taktik), overall: Number(r.overall) });

export async function getAssessments(opts: { playerId?: string; ids?: Ids; coachId?: string; from?: string; to?: string; limit?: number } = {}): Promise<Assessment[]> {
  if (opts.ids && !opts.ids.length) return [];
  const build = () => {
    let q = db().from("assessments").select("*").order("assessed_on", { ascending: false }).order("created_at", { ascending: false });
    if (opts.playerId) q = q.eq("player_id", opts.playerId);
    else if (opts.ids && opts.ids.length <= 200) q = q.in("player_id", opts.ids);
    if (opts.coachId) q = q.eq("coach_id", opts.coachId);
    if (opts.from) q = q.gte("assessed_on", opts.from);
    if (opts.to) q = q.lte("assessed_on", opts.to);
    return q;
  };
  const rows: Assessment[] = opts.limit ? check(await build().limit(opts.limit * 4)) : await selectAll<Assessment>((a, b) => build().range(a, b));
  return rows.filter((r) => !opts.ids || opts.ids.includes(r.player_id)).slice(0, opts.limit ?? Infinity).map(toAssessment);
}

export async function getAssessment(id: string): Promise<(Assessment & { scores: Record<number, number> }) | null> {
  const { data } = await db().from("assessments").select("*, assessment_scores(item_id, score)").eq("id", id).maybeSingle();
  if (!data) return null;
  const { assessment_scores, ...rest } = data as Assessment & { assessment_scores: { item_id: number; score: number }[] };
  return { ...toAssessment(rest as Assessment), scores: Object.fromEntries(assessment_scores.map((s) => [s.item_id, s.score])) };
}

/** Nilai per item untuk sekumpulan penilaian. */
export async function getScores(assessmentIds: string[]): Promise<{ assessment_id: string; item_id: number; score: number }[]> {
  if (!assessmentIds.length) return [];
  const out: { assessment_id: string; item_id: number; score: number }[] = [];
  for (let i = 0; i < assessmentIds.length; i += 150) {
    out.push(...check(await db().from("assessment_scores").select("assessment_id, item_id, score").in("assessment_id", assessmentIds.slice(i, i + 150))) as typeof out);
  }
  return out;
}

export async function getAssessmentMonthly(from: string, to: string, ids: Ids = null): Promise<AssessmentMonth[]> {
  if (ids && !ids.length) return [];
  const rows: AssessmentMonth[] = check(await db().rpc("assessment_monthly", { p_from: from, p_to: to, p_player_ids: ids }));
  return rows.map((r) => ({ ...r, fisik: Number(r.fisik), teknik: Number(r.teknik), taktik: Number(r.taktik), overall: Number(r.overall) }));
}

export async function getItemAverages(from: string, to: string, ids: Ids = null): Promise<ItemAvg[]> {
  if (ids && !ids.length) return [];
  const rows: ItemAvg[] = check(await db().rpc("item_averages", { p_from: from, p_to: to, p_player_ids: ids }));
  return rows.map((r) => ({ ...r, avg_score: Number(r.avg_score) }));
}
