"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getAgeGroups, syncSquads } from "@/lib/data";
import { logActivity, requireStaff } from "@/lib/scope";
import type { CoachFocus } from "@/lib/types";

const refresh = () => revalidatePath("/", "layout");

async function describe(groupIds: number[], focus: CoachFocus) {
  const groups = await getAgeGroups();
  return `${focus === "kiper" ? "Kiper · " : ""}${groups.filter((g) => groupIds.includes(g.id)).map((g) => g.name).join(", ")}`;
}

function clean(groupIds: number[], focus: string) {
  return { ids: [...new Set(groupIds.filter((n) => Number.isInteger(n) && n > 0))], focus: (focus === "kiper" ? "kiper" : "semua") as CoachFocus };
}

export async function approveCoach(id: string, groupIds: number[], focus: string): Promise<{ error?: string }> {
  const scope = await requireStaff("admin");
  const c = clean(groupIds, focus);
  if (!c.ids.length) return { error: "Pilih minimal satu kelompok usia untuk skuad coach ini." };
  const { error } = await db().from("coaches").update({ status: "aktif", age_group_ids: c.ids, focus: c.focus, reject_reason: null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: "Gagal menyetujui coach." };
  await syncSquads({ coachId: id });
  await logActivity(scope, { action: "menyetujui coach", entity: "coach", entityId: id, coachId: id, detail: `Skuad: ${await describe(c.ids, c.focus)}` });
  refresh();
  return {};
}

export async function rejectCoach(id: string, reason: string): Promise<{ error?: string }> {
  const scope = await requireStaff("admin");
  if (reason.trim().length < 3) return { error: "Tulis alasan singkat penolakan." };
  await db().from("coaches").update({ status: "ditolak", reject_reason: reason.trim(), updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
  await logActivity(scope, { action: "menolak pendaftaran coach", entity: "coach", entityId: id, coachId: id, detail: reason.trim() });
  refresh();
  return {};
}

export async function updateSquadRules(id: string, groupIds: number[], focus: string): Promise<{ error?: string }> {
  const scope = await requireStaff("admin");
  const c = clean(groupIds, focus);
  if (!c.ids.length) return { error: "Pilih minimal satu kelompok usia." };
  await db().from("coaches").update({ age_group_ids: c.ids, focus: c.focus, updated_at: new Date().toISOString() }).eq("id", id);
  await syncSquads({ coachId: id });
  await logActivity(scope, { action: "mengubah aturan skuad", entity: "coach", entityId: id, coachId: id, detail: await describe(c.ids, c.focus) });
  refresh();
  return {};
}

export async function setCoachStatus(id: string, status: "aktif" | "nonaktif"): Promise<{ error?: string }> {
  const scope = await requireStaff("admin");
  await db().from("coaches").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  await syncSquads({ coachId: id });
  await logActivity(scope, { action: status === "aktif" ? "mengaktifkan coach" : "menonaktifkan coach", entity: "coach", entityId: id, coachId: id });
  refresh();
  return {};
}
