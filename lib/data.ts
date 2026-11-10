import "server-only";
import { db, selectAll } from "@/lib/supabase";
import { SCORE_WEIGHTS } from "@/lib/scoring";
import type {
  AgeGroup, Attendance, PerfWeek, PerformanceReview, Player, PlayerStat, PlayerStatus, SessionAgg, TrainingSession,
} from "@/lib/types";

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function getAgeGroups(): Promise<AgeGroup[]> {
  return check(await db().from("age_groups").select("*").order("min_age"));
}

export async function getPlayers(opts: { status?: PlayerStatus | PlayerStatus[] } = {}): Promise<Player[]> {
  let q = db().from("players").select("*").order("full_name");
  if (opts.status) q = Array.isArray(opts.status) ? q.in("status", opts.status) : q.eq("status", opts.status);
  return check(await q);
}

export async function getPlayer(id: string): Promise<Player | null> {
  return check(await db().from("players").select("*").eq("id", id).maybeSingle());
}

export async function countPending(): Promise<number> {
  const { count } = await db().from("players").select("id", { count: "exact", head: true }).eq("status", "pending");
  return count ?? 0;
}

export async function getSessions(from: string, to: string): Promise<TrainingSession[]> {
  return check(
    await db().from("training_sessions").select("*").gte("session_date", from).lte("session_date", to)
      .order("session_date").order("start_time"),
  );
}

export async function getSession(id: string): Promise<TrainingSession | null> {
  return check(await db().from("training_sessions").select("*").eq("id", id).maybeSingle());
}

export async function getSessionAttendance(sessionId: string): Promise<Attendance[]> {
  return check(await db().from("attendance").select("*").eq("session_id", sessionId));
}

export async function getSessionAgg(from: string, to: string): Promise<SessionAgg[]> {
  return check(await db().rpc("attendance_by_session", { p_from: from, p_to: to }));
}

export async function getPlayerStats(from: string, to: string): Promise<PlayerStat[]> {
  const rows: PlayerStat[] = check(
    await db().rpc("player_stats", { p_from: from, p_to: to, w_att: SCORE_WEIGHTS.attendance, w_perf: SCORE_WEIGHTS.performance }),
  );
  return rows.map((r) => ({
    ...r,
    attendance_pct: r.attendance_pct === null ? null : Number(r.attendance_pct),
    attendance_score: r.attendance_score === null ? null : Number(r.attendance_score),
    perf_avg: r.perf_avg === null ? null : Number(r.perf_avg),
    total_score: r.total_score === null ? null : Number(r.total_score),
  }));
}

export async function getPerfWeekly(from: string, to: string, playerId?: string): Promise<PerfWeek[]> {
  const rows: PerfWeek[] = check(await db().rpc("perf_weekly", { p_from: from, p_to: to, p_player: playerId ?? null }));
  return rows.map((r) => ({
    ...r,
    teknik: Number(r.teknik), fisik: Number(r.fisik), taktik: Number(r.taktik),
    mental: Number(r.mental), disiplin: Number(r.disiplin), overall: Number(r.overall),
  }));
}

/** Semua absensi dalam periode (untuk heatmap & laporan). */
export async function getAttendanceRange(from: string, to: string, playerId?: string) {
  return selectAll<Attendance & { training_sessions: { session_date: string; kind: string; start_time: string; status: string } }>(
    (a, b) => {
      let q = db().from("attendance")
        .select("*, training_sessions!inner(session_date, kind, start_time, status)")
        .gte("training_sessions.session_date", from).lte("training_sessions.session_date", to)
        .order("id").range(a, b);
      if (playerId) q = q.eq("player_id", playerId);
      return q;
    },
  );
}

export async function getReviews(opts: { playerId?: string; from?: string; to?: string; limit?: number } = {}): Promise<PerformanceReview[]> {
  let q = db().from("performance_reviews").select("*").order("review_date", { ascending: false }).order("created_at", { ascending: false });
  if (opts.playerId) q = q.eq("player_id", opts.playerId);
  if (opts.from) q = q.gte("review_date", opts.from);
  if (opts.to) q = q.lte("review_date", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  return (check(await q) as PerformanceReview[]).map((r) => ({ ...r, overall: Number(r.overall) }));
}

/** Pemain yang wajib ikut sesi: aktif dan (sesi untuk semua kelompok atau kelompoknya cocok). */
export function eligiblePlayers(players: Player[], session: Pick<TrainingSession, "age_group_id">) {
  return players.filter((p) => p.status === "aktif" && (session.age_group_id === null || p.age_group_id === session.age_group_id));
}

export function groupForAge(groups: AgeGroup[], age: number): AgeGroup | undefined {
  return groups.find((g) => age >= g.min_age && age <= g.max_age);
}
