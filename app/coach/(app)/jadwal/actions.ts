"use server";
import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth/coach";
import { db } from "@/lib/supabase";
import { addDays } from "@/lib/format";
import type { SessionStatus } from "@/lib/types";

export interface SessionFormState { error?: string; ok?: number }

export async function saveSession(_prev: SessionFormState | undefined, form: FormData): Promise<SessionFormState> {
  const coach = await requireCoach();
  const id = String(form.get("id") ?? "");
  const session_date = String(form.get("session_date") ?? "");
  const start_time = String(form.get("start_time") ?? "");
  const end_time = String(form.get("end_time") ?? "");
  const kind = String(form.get("kind") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(session_date)) return { error: "Tanggal belum diisi." };
  if (!start_time || !end_time || end_time <= start_time) return { error: "Jam selesai harus setelah jam mulai." };
  if (!kind) return { error: "Pilih jenis latihan." };
  const group = String(form.get("age_group_id") ?? "");
  const base = {
    start_time, end_time, kind,
    focus: String(form.get("focus") ?? "").trim() || null,
    age_group_id: group ? Number(group) : null,
    location: String(form.get("location") ?? "").trim() || "Lapangan UNESA",
    status: (String(form.get("status") ?? "terjadwal") as SessionStatus),
  };

  if (id) {
    const { error } = await db().from("training_sessions").update({ ...base, session_date }).eq("id", id);
    if (error) return { error: "Gagal menyimpan jadwal." };
    revalidatePath("/coach", "layout");
    return { ok: 1 };
  }
  const repeat = Math.min(12, Math.max(1, Number(form.get("repeat") ?? 1) || 1));
  const rows = Array.from({ length: repeat }, (_, i) => ({ ...base, session_date: addDays(session_date, i * 7), coach_id: coach.sub }));
  const { error } = await db().from("training_sessions").insert(rows);
  if (error) return { error: "Gagal menambah jadwal." };
  revalidatePath("/coach", "layout");
  return { ok: repeat };
}

export async function setSessionStatus(id: string, status: SessionStatus) {
  await requireCoach();
  await db().from("training_sessions").update({ status }).eq("id", id);
  revalidatePath("/coach", "layout");
}

export async function deleteSession(id: string) {
  await requireCoach();
  await db().from("training_sessions").delete().eq("id", id);
  revalidatePath("/coach", "layout");
}
