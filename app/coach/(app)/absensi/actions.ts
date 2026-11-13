"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertSession, requireStaff, ScopeError } from "@/lib/scope";
import { db } from "@/lib/supabase";
import { todayISO } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/types";

const VALID = new Set(["hadir", "izin", "sakit", "alpa"]);

export async function saveAttendance(
  sessionId: string,
  entries: { player_id: string; status: AttendanceStatus; note: string | null }[],
): Promise<{ error?: string; saved?: number }> {
  const scope = await requireStaff("coach");
  try { await assertSession(scope, sessionId); } catch (e) { return { error: (e as ScopeError).message }; }
  const { data: existing } = await db().from("attendance").select("player_id").eq("session_id", sessionId);
  // catatan baru hanya untuk pemain aktif di skuad; catatan lama (mis. pemain yang kini cuti) tetap boleh diperbaiki
  const { data: activeRows } = scope.ids?.length ? await db().from("players").select("id").in("id", scope.ids).eq("status", "aktif") : { data: [] };
  const allowed = new Set([...(activeRows ?? []).map((r: { id: string }) => r.id), ...(existing ?? []).map((r: { player_id: string }) => r.player_id)]);
  const clean = entries.filter((e) => VALID.has(e.status) && allowed.has(e.player_id));
  if (!clean.length) return { saved: 0 };
  const { data: session } = await db().from("training_sessions").select("session_date, status").eq("id", sessionId).maybeSingle();
  if (!session) return { error: "Sesi tidak ditemukan." };
  if (session.status === "batal") return { error: "Sesi ini dibatalkan. Ubah statusnya dulu di Jadwal." };

  const { error } = await db().from("attendance").upsert(
    clean.map((e) => ({ session_id: sessionId, player_id: e.player_id, status: e.status, note: e.note?.trim() || null, recorded_by: scope.actor.name })),
    { onConflict: "session_id,player_id" },
  );
  if (error) return { error: "Absensi gagal disimpan. Periksa koneksi lalu coba lagi." };
  if (session.session_date <= todayISO() && session.status === "terjadwal") {
    await db().from("training_sessions").update({ status: "selesai" }).eq("id", sessionId);
  }
  revalidatePath("/coach", "layout");
  return { saved: clean.length };
}

export async function quickSessionToday(form: FormData) {
  const scope = await requireStaff("coach");
  const start = String(form.get("start_time") || "15:30");
  const end = String(form.get("end_time") || "17:00");
  const kind = String(form.get("kind") || "Latihan Rutin");
  const { data, error } = await db().from("training_sessions").insert({
    session_date: todayISO(), start_time: start, end_time: end > start ? end : start, kind, coach_id: scope.coachId, location: "Lapangan UNESA",
    age_group_id: scope.coach!.age_group_ids.length === 1 ? scope.coach!.age_group_ids[0] : null, gk_only: scope.coach!.focus === "kiper",
  }).select("id").single();
  if (error || !data) throw new Error("Gagal membuat sesi");
  revalidatePath("/coach", "layout");
  redirect(`/coach/absensi/${data.id}`);
}
