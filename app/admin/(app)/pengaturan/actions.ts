"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logActivity, requireStaff } from "@/lib/scope";
import { db } from "@/lib/supabase";

export interface SimpleState { error?: string; ok?: string }

export async function changePassword(_p: SimpleState | undefined, form: FormData): Promise<SimpleState> {
  const scope = await requireStaff("admin");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (next.length < 8) return { error: "Password baru minimal 8 karakter." };
  if (next !== confirm) return { error: "Konfirmasi password tidak sama." };
  const { data } = await db().from("admins").select("password_hash").eq("id", scope.actor.id).maybeSingle();
  if (!data || !(await bcrypt.compare(current, data.password_hash))) return { error: "Password saat ini salah." };
  await db().from("admins").update({ password_hash: await bcrypt.hash(next, 10) }).eq("id", scope.actor.id);
  await logActivity(scope, { action: "mengganti password admin", entity: "admin" });
  return { ok: "Password diperbarui." };
}

export async function saveGroups(_p: SimpleState | undefined, form: FormData): Promise<SimpleState> {
  const scope = await requireStaff("admin");
  const ids = form.getAll("id").map(String);
  for (const id of ids) {
    const name = String(form.get(`name_${id}`) ?? "").trim();
    const min = Number(form.get(`min_${id}`));
    const max = Number(form.get(`max_${id}`));
    if (!name || !Number.isFinite(min) || !Number.isFinite(max) || min > max) return { error: `Rentang umur ${name || "kelompok"} tidak valid.` };
    const { error } = await db().from("age_groups").update({ name, min_age: min, max_age: max }).eq("id", Number(id));
    if (error) return { error: `Gagal menyimpan ${name}. Nama kelompok harus unik.` };
  }
  const newName = String(form.get("new_name") ?? "").trim();
  if (newName) {
    const min = Number(form.get("new_min")), max = Number(form.get("new_max"));
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return { error: "Rentang umur kelompok baru tidak valid." };
    const { error } = await db().from("age_groups").insert({ name: newName, min_age: min, max_age: max });
    if (error) return { error: "Gagal menambah kelompok. Nama harus unik." };
  }
  await logActivity(scope, { action: "mengubah kelompok usia", entity: "pengaturan" });
  revalidatePath("/", "layout");
  return { ok: "Kelompok usia disimpan." };
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function saveSeasons(_p: SimpleState | undefined, form: FormData): Promise<SimpleState> {
  const scope = await requireStaff("admin");
  const ids = form.getAll("id").map(String);
  const activeId = String(form.get("active") ?? "");
  for (const id of ids) {
    const name = String(form.get(`name_${id}`) ?? "").trim();
    const start = String(form.get(`start_${id}`) ?? ""), end = String(form.get(`end_${id}`) ?? "");
    if (!name || !ISO.test(start) || !ISO.test(end) || end <= start) return { error: `Tanggal musim ${name || ""} tidak valid.` };
    await db().from("seasons").update({ name, start_date: start, end_date: end }).eq("id", Number(id));
  }
  let newActive = activeId;
  const newName = String(form.get("new_name") ?? "").trim();
  if (newName) {
    const start = String(form.get("new_start") ?? ""), end = String(form.get("new_end") ?? "");
    if (!ISO.test(start) || !ISO.test(end) || end <= start) return { error: "Tanggal musim baru tidak valid." };
    const { data, error } = await db().from("seasons").insert({ name: newName, start_date: start, end_date: end }).select("id").single();
    if (error || !data) return { error: "Gagal menambah musim." };
    if (activeId === "new") newActive = String(data.id);
  }
  if (newActive && newActive !== "new") {
    await db().from("seasons").update({ is_active: false }).eq("is_active", true);
    await db().from("seasons").update({ is_active: true }).eq("id", Number(newActive));
  }
  await logActivity(scope, { action: "mengubah pengaturan musim", entity: "pengaturan" });
  revalidatePath("/", "layout");
  return { ok: "Musim disimpan. Semua dashboard memakai musim aktif." };
}

export async function saveItems(_p: SimpleState | undefined, form: FormData): Promise<SimpleState> {
  const scope = await requireStaff("admin");
  const ids = form.getAll("id").map(String);
  for (const id of ids) {
    const name = String(form.get(`name_${id}`) ?? "").trim();
    if (!name) return { error: "Nama tes tidak boleh kosong." };
    await db().from("assessment_items").update({
      name, test_hint: String(form.get(`hint_${id}`) ?? "").trim() || null, active: form.get(`active_${id}`) === "on",
    }).eq("id", Number(id));
  }
  const newName = String(form.get("new_name") ?? "").trim();
  if (newName) {
    const category = String(form.get("new_category"));
    const applies = String(form.get("new_applies"));
    if (!["fisik", "teknik", "taktik"].includes(category) || !["semua", "lapangan", "kiper"].includes(applies)) return { error: "Kategori atau sasaran tes tidak valid." };
    const { error } = await db().from("assessment_items").insert({ name: newName, test_hint: String(form.get("new_hint") ?? "").trim() || null, category, applies_to: applies, sort: 99 });
    if (error) return { error: "Gagal menambah tes." };
  }
  await logActivity(scope, { action: "mengubah kriteria penilaian", entity: "pengaturan" });
  revalidatePath("/", "layout");
  return { ok: "Kriteria penilaian disimpan. Berlaku untuk penilaian berikutnya." };
}
