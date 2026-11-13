import "server-only";
import { db } from "@/lib/supabase";
import { eligiblePlayers, getMemberships, getSessions } from "@/lib/data";
import { nowTimeWIB, todayISO } from "@/lib/format";
import type { Player, TrainingSession } from "@/lib/types";

/** Absen mandiri dibuka 30 menit sebelum latihan sampai latihan selesai. */
export const CHECKIN_OPEN_BEFORE_MIN = 30;

const toMin = (t: string) => { const [h, m] = t.slice(0, 5).split(":").map(Number); return h * 60 + m; };

export interface OpenSession { session: TrainingSession; coachName: string | null; now: string; all: TrainingSession[] }

/** Sesi milik coach pemain yang sedang berlangsung hari ini dan belum ada catatan kehadirannya. */
export async function getOpenCheckIn(player: Player): Promise<OpenSession | null> {
  if (player.status !== "aktif") return null; // pemain cuti tidak absen
  const today = todayISO();
  const now = nowTimeWIB();
  const nowMin = toMin(now);
  const [sessions, memberships] = await Promise.all([getSessions(today, today), getMemberships({ playerId: player.id })]);
  const myCoaches = new Set(memberships.filter((m) => !m.excluded).map((m) => m.coach_id));
  const open = sessions.filter((s) =>
    s.status === "terjadwal" && s.coach_id && myCoaches.has(s.coach_id) &&
    eligiblePlayers([player], s, null).length > 0 &&
    nowMin >= toMin(s.start_time) - CHECKIN_OPEN_BEFORE_MIN && nowMin <= toMin(s.end_time));
  if (!open.length) return null;
  const { data: done } = await db().from("attendance").select("session_id").eq("player_id", player.id).in("session_id", open.map((s) => s.id));
  const recorded = new Set((done ?? []).map((r) => r.session_id as string));
  const all = open.filter((s) => !recorded.has(s.id));
  const session = all[0];
  if (!session) return null;
  const { data: coach } = await db().from("coaches").select("full_name").eq("id", session.coach_id!).maybeSingle();
  return { session, coachName: coach?.full_name ?? null, now, all };
}
