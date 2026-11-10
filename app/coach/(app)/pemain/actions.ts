"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/auth/coach";
import { db } from "@/lib/supabase";
import { getAgeGroups, groupForAge } from "@/lib/data";
import { ageFrom, todayISO } from "@/lib/format";
import type { PlayerStatus } from "@/lib/types";

export interface PlayerFormState { error?: string }

export async function savePlayer(_prev: PlayerFormState | undefined, form: FormData): Promise<PlayerFormState> {
  await requireCoach();
  const id = String(form.get("id") ?? "");
  const full_name = String(form.get("full_name") ?? "").trim();
  const birth_date = String(form.get("birth_date") ?? "");
  const position = String(form.get("position") ?? "");
  const groupRaw = String(form.get("age_group_id") ?? "auto");
  if (full_name.length < 3) return { error: "Nama minimal 3 huruf." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date) || birth_date > todayISO()) return { error: "Tanggal lahir tidak valid." };
  if (!["GK", "DF", "MF", "FW"].includes(position)) return { error: "Pilih posisi." };

  const groups = await getAgeGroups();
  const age_group_id = groupRaw === "auto" ? groupForAge(groups, ageFrom(birth_date))?.id ?? null : Number(groupRaw);
  const jersey = String(form.get("jersey_no") ?? "").trim();
  const row = {
    full_name,
    birth_date,
    position,
    age_group_id,
    team: String(form.get("team") ?? "").trim() || "UNESA FC ACADEMY",
    phone: String(form.get("phone") ?? "").trim() || null,
    jersey_no: jersey ? Number(jersey) : null,
    status: (String(form.get("status") ?? "aktif") as PlayerStatus),
    updated_at: new Date().toISOString(),
  };

  let playerId = id;
  if (id) {
    const { error } = await db().from("players").update(row).eq("id", id);
    if (error) return { error: "Gagal menyimpan perubahan." };
  } else {
    const { data, error } = await db().from("players").insert(row).select("id").single();
    if (error || !data) return { error: "Gagal menambah pemain." };
    playerId = data.id;
  }
  revalidatePath("/coach", "layout");
  redirect(`/coach/pemain/${playerId}`);
}

export async function setPlayerStatus(id: string, status: PlayerStatus) {
  await requireCoach();
  await db().from("players").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/coach", "layout");
}

export async function rejectRegistration(id: string) {
  await requireCoach();
  await db().from("players").delete().eq("id", id).eq("status", "pending");
  revalidatePath("/coach", "layout");
}

/** Tautkan akun Google pendaftar ke data pemain yang sudah diinput coach, lalu hapus baris pendaftaran. */
export async function linkRegistration(pendingId: string, targetId: string): Promise<{ error?: string }> {
  await requireCoach();
  const { data: pending } = await db().from("players").select("clerk_user_id, email, phone").eq("id", pendingId).eq("status", "pending").maybeSingle();
  if (!pending?.clerk_user_id) return { error: "Pendaftar tidak ditemukan." };
  const { data: target } = await db().from("players").select("clerk_user_id, phone").eq("id", targetId).maybeSingle();
  if (!target) return { error: "Data pemain tujuan tidak ditemukan." };
  if (target.clerk_user_id) return { error: "Pemain tujuan sudah punya akun." };
  await db().from("players").delete().eq("id", pendingId);
  const { error } = await db().from("players").update({
    clerk_user_id: pending.clerk_user_id,
    email: pending.email,
    phone: target.phone ?? pending.phone,
    status: "aktif",
    updated_at: new Date().toISOString(),
  }).eq("id", targetId);
  if (error) return { error: "Gagal menautkan akun." };
  revalidatePath("/coach", "layout");
  return {};
}
