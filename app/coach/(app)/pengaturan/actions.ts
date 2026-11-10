"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth/coach";
import { db } from "@/lib/supabase";

export interface SimpleState { error?: string; ok?: string }

export async function changePassword(_p: SimpleState | undefined, form: FormData): Promise<SimpleState> {
  const coach = await requireCoach();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (next.length < 8) return { error: "Password baru minimal 8 karakter." };
  if (next !== confirm) return { error: "Konfirmasi password tidak sama." };
  const { data } = await db().from("coaches").select("password_hash").eq("id", coach.sub).maybeSingle();
  if (!data || !(await bcrypt.compare(current, data.password_hash))) return { error: "Password saat ini salah." };
  await db().from("coaches").update({ password_hash: await bcrypt.hash(next, 10) }).eq("id", coach.sub);
  return { ok: "Password diperbarui." };
}

export async function saveGroups(_p: SimpleState | undefined, form: FormData): Promise<SimpleState> {
  await requireCoach();
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
  revalidatePath("/coach", "layout");
  return { ok: "Kelompok usia disimpan." };
}
