"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getAssessmentItems, getPlayer } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { assertPlayer, logActivity, requireStaff, ScopeError } from "@/lib/scope";
import { itemsFor, type Category } from "@/lib/types";

export interface AssessState { error?: string; ok?: string; savedId?: string }

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function saveAssessment(_prev: AssessState | undefined, form: FormData): Promise<AssessState> {
  const scope = await requireStaff("coach");
  const id = String(form.get("id") ?? "");
  const player_id = String(form.get("player_id") ?? "");
  const assessed_on = String(form.get("assessed_on") ?? "");
  if (!player_id) return { error: "Pilih pemain yang dinilai." };
  try { assertPlayer(scope, player_id); } catch (e) { return { error: (e as ScopeError).message }; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(assessed_on) || assessed_on > todayISO()) return { error: "Tanggal penilaian tidak valid." };

  const [player, items] = await Promise.all([getPlayer(player_id), getAssessmentItems()]);
  if (!player) return { error: "Pemain tidak ditemukan." };
  const mine = itemsFor(items, player.position);
  const scores: { item_id: number; score: number; category: Category }[] = [];
  for (const it of mine) {
    const v = Number(form.get(`s_${it.id}`));
    if (!Number.isInteger(v) || v < 1 || v > 10) return { error: `Nilai “${it.name}” belum diisi (1–10).` };
    scores.push({ item_id: it.id, score: v, category: it.category });
  }
  const cat = (c: Category) => {
    const xs = scores.filter((s) => s.category === c).map((s) => s.score);
    return xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
  };
  const fisik = cat("fisik"), teknik = cat("teknik"), taktik = cat("taktik");
  const parts = [fisik, teknik, taktik].filter((x): x is number => x !== null);
  if (!parts.length) return { error: "Belum ada item tes aktif. Minta admin menambah kriteria penilaian." };
  const row = {
    player_id, assessed_on, coach_id: scope.coachId,
    session_id: String(form.get("session_id") ?? "") || null,
    notes: String(form.get("notes") ?? "").trim() || null,
    fisik: fisik ?? 0, teknik: teknik ?? 0, taktik: taktik ?? 0,
    overall: round1(parts.reduce((a, b) => a + b, 0) / parts.length),
    updated_at: new Date().toISOString(),
  };

  let assessmentId = id;
  if (id) {
    const { data: cur } = await db().from("assessments").select("coach_id").eq("id", id).maybeSingle();
    if (!cur) return { error: "Penilaian tidak ditemukan." };
    if (cur.coach_id !== scope.coachId) return { error: "Penilaian ini dibuat coach lain." };
    const { error } = await db().from("assessments").update(row).eq("id", id);
    if (error) return { error: "Penilaian gagal disimpan." };
    await db().from("assessment_scores").delete().eq("assessment_id", id);
  } else {
    const { data, error } = await db().from("assessments").insert(row).select("id").single();
    if (error || !data) return { error: "Penilaian gagal disimpan." };
    assessmentId = data.id;
  }
  const { error: e2 } = await db().from("assessment_scores").insert(scores.map((s) => ({ assessment_id: assessmentId, item_id: s.item_id, score: s.score })));
  if (e2) return { error: "Nilai per tes gagal disimpan. Coba lagi." };

  await logActivity(scope, { action: id ? "ubah penilaian" : "tambah penilaian", entity: "penilaian", entityId: assessmentId, playerId: player_id, coachId: scope.coachId ?? undefined, detail: `Nilai ${row.overall} (Fisik ${row.fisik} · Teknik ${row.teknik} · Taktik ${row.taktik})` });
  revalidatePath("/coach", "layout");
  return { ok: `Penilaian ${player.full_name} tersimpan · rata-rata ${String(row.overall).replace(".", ",")}`, savedId: assessmentId };
}

export async function deleteAssessment(id: string): Promise<{ error?: string }> {
  const scope = await requireStaff("coach");
  const { data } = await db().from("assessments").select("coach_id, player_id, overall").eq("id", id).maybeSingle();
  if (!data) return {};
  if (data.coach_id !== scope.coachId) return { error: "Hanya coach pembuat yang bisa menghapus penilaian ini." };
  await db().from("assessments").delete().eq("id", id);
  await logActivity(scope, { action: "hapus penilaian", entity: "penilaian", entityId: id, playerId: data.player_id, coachId: scope.coachId ?? undefined, detail: `Nilai ${data.overall}` });
  revalidatePath("/coach", "layout");
  return {};
}
