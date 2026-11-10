"use server";
import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth/coach";
import { db } from "@/lib/supabase";
import { todayISO } from "@/lib/format";

export interface PerfState { error?: string; ok?: string }
const ASPECTS = ["teknik", "fisik", "taktik", "mental", "disiplin"] as const;

export async function savePerformance(_prev: PerfState | undefined, form: FormData): Promise<PerfState> {
  const coach = await requireCoach();
  const player_id = String(form.get("player_id") ?? "");
  const review_date = String(form.get("review_date") ?? "");
  if (!player_id) return { error: "Pilih pemain yang dinilai." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review_date) || review_date > todayISO()) return { error: "Tanggal penilaian tidak valid." };
  const scores: Record<string, number> = {};
  for (const a of ASPECTS) {
    const v = Number(form.get(a));
    if (!Number.isFinite(v) || v < 0 || v > 100) return { error: `Nilai ${a} harus 0–100.` };
    scores[a] = Math.round(v);
  }
  const session = String(form.get("session_id") ?? "");
  const { error } = await db().from("performance_reviews").insert({
    player_id, review_date, session_id: session || null, coach_id: coach.sub,
    notes: String(form.get("notes") ?? "").trim() || null, ...scores,
  });
  if (error) return { error: "Penilaian gagal disimpan." };
  revalidatePath("/coach", "layout");
  const { data: p } = await db().from("players").select("full_name").eq("id", player_id).maybeSingle();
  return { ok: `Penilaian ${p?.full_name ?? "pemain"} tersimpan` };
}

export async function deletePerformance(id: string) {
  await requireCoach();
  await db().from("performance_reviews").delete().eq("id", id);
  revalidatePath("/coach", "layout");
}
