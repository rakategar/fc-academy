"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { getAgeGroups, groupForAge, syncSquads } from "@/lib/data";
import { ageFrom, todayISO } from "@/lib/format";
import { logActivity, requireStaff } from "@/lib/scope";
import type { PlayerStatus } from "@/lib/types";

export interface PlayerFormState { error?: string }

const admin = () => requireStaff("admin");
const refresh = () => revalidatePath("/", "layout");

export async function savePlayer(_prev: PlayerFormState | undefined, form: FormData): Promise<PlayerFormState> {
  const scope = await admin();
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
  const status = String(form.get("status") ?? "aktif") as PlayerStatus;
  const row = {
    full_name, birth_date, position, age_group_id,
    team: String(form.get("team") ?? "").trim() || "UNESA FC ACADEMY",
    phone: String(form.get("phone") ?? "").trim() || null,
    jersey_no: jersey ? Number(jersey) : null,
    status: ["aktif", "arsip", "pending"].includes(status) ? status : "aktif",
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
  await syncSquads({ playerId });
  await logActivity(scope, { action: id ? "mengubah data pemain" : "menambah pemain", entity: "pemain", entityId: playerId, playerId });
  refresh();
  redirect(`/admin/pemain/${playerId}`);
}

export async function setPlayerStatus(id: string, status: PlayerStatus) {
  const scope = await admin();
  await db().from("players").update({ status, reject_reason: null, updated_at: new Date().toISOString() }).eq("id", id);
  await syncSquads({ playerId: id });
  await logActivity(scope, { action: status === "aktif" ? "mengaktifkan / menyetujui pemain" : status === "arsip" ? "mengarsipkan pemain" : `mengubah status pemain → ${status}`, entity: "pemain", entityId: id, playerId: id });
  refresh();
}

/** Setujui pendaftar: tetapkan kelompok usia, aktifkan, lalu masukkan ke skuad sesuai aturan. */
export async function approvePlayer(id: string, groupId: number | null): Promise<{ error?: string }> {
  const scope = await admin();
  const { error } = await db().from("players").update({ status: "aktif", age_group_id: groupId, reject_reason: null, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
  if (error) return { error: "Gagal menyetujui." };
  await syncSquads({ playerId: id });
  const { data } = await db().from("coach_players").select("coaches(full_name)").eq("player_id", id).eq("excluded", false);
  const names = (data ?? []).map((r) => (r.coaches as unknown as { full_name: string } | null)?.full_name).filter(Boolean).join(", ");
  await logActivity(scope, { action: "menyetujui pendaftaran pemain", entity: "pemain", entityId: id, playerId: id, detail: names ? `Masuk skuad: ${names}` : "Belum ada coach yang cocok — tambahkan manual" });
  refresh();
  return {};
}

export async function rejectPlayer(id: string, reason: string): Promise<{ error?: string }> {
  const scope = await admin();
  if (reason.trim().length < 3) return { error: "Tulis alasan singkat agar pendaftar tahu apa yang perlu diperbaiki." };
  await db().from("players").update({ status: "ditolak", reject_reason: reason.trim(), updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
  await logActivity(scope, { action: "menolak pendaftaran pemain", entity: "pemain", entityId: id, playerId: id, detail: reason.trim() });
  refresh();
  return {};
}

/** Tautkan akun Google pendaftar ke data pemain yang sudah diinput admin, lalu hapus baris pendaftaran. */
export async function linkRegistration(pendingId: string, targetId: string): Promise<{ error?: string }> {
  const scope = await admin();
  const { data: pending } = await db().from("players").select("clerk_user_id, email, phone").eq("id", pendingId).eq("status", "pending").maybeSingle();
  if (!pending?.clerk_user_id) return { error: "Pendaftar tidak ditemukan." };
  const { data: target } = await db().from("players").select("clerk_user_id, phone, full_name").eq("id", targetId).maybeSingle();
  if (!target) return { error: "Data pemain tujuan tidak ditemukan." };
  if (target.clerk_user_id) return { error: "Pemain tujuan sudah punya akun." };
  await db().from("players").delete().eq("id", pendingId);
  const { error } = await db().from("players").update({
    clerk_user_id: pending.clerk_user_id, email: pending.email, phone: target.phone ?? pending.phone,
    status: "aktif", updated_at: new Date().toISOString(),
  }).eq("id", targetId);
  if (error) return { error: "Gagal menautkan akun." };
  await syncSquads({ playerId: targetId });
  await logActivity(scope, { action: "menautkan akun Google ke data pemain", entity: "pemain", entityId: targetId, playerId: targetId });
  refresh();
  return {};
}

/** Penugasan manual pemain ke coach. */
export async function assignPlayer(coachId: string, playerId: string): Promise<{ error?: string }> {
  const scope = await admin();
  const { error } = await db().from("coach_players").upsert({ coach_id: coachId, player_id: playerId, source: "manual", excluded: false }, { onConflict: "coach_id,player_id" });
  if (error) return { error: "Gagal menambahkan ke skuad." };
  await logActivity(scope, { action: "menambahkan pemain ke skuad (manual)", entity: "skuad", playerId, coachId });
  refresh();
  return {};
}

/** Keluarkan pemain dari skuad coach. Baris otomatis ditandai "dikecualikan" agar tidak ditambah ulang oleh aturan. */
export async function unassignPlayer(coachId: string, playerId: string): Promise<{ error?: string }> {
  const scope = await admin();
  const { data } = await db().from("coach_players").select("source").eq("coach_id", coachId).eq("player_id", playerId).maybeSingle();
  if (!data) return {};
  if (data.source === "manual") await db().from("coach_players").delete().eq("coach_id", coachId).eq("player_id", playerId);
  else await db().from("coach_players").update({ excluded: true }).eq("coach_id", coachId).eq("player_id", playerId);
  await logActivity(scope, { action: "mengeluarkan pemain dari skuad", entity: "skuad", playerId, coachId });
  refresh();
  return {};
}

/** Batalkan pengecualian: pemain kembali masuk skuad lewat aturan. */
export async function restorePlayer(coachId: string, playerId: string): Promise<{ error?: string }> {
  const scope = await admin();
  await db().from("coach_players").update({ excluded: false }).eq("coach_id", coachId).eq("player_id", playerId);
  await syncSquads({ coachId });
  await logActivity(scope, { action: "mengembalikan pemain ke skuad", entity: "skuad", playerId, coachId });
  refresh();
  return {};
}
