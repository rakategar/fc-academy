"use server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { getAgeGroups, groupForAge } from "@/lib/data";
import { ageFrom, todayISO } from "@/lib/format";
import type { Position } from "@/lib/types";

export interface RegisterState { error?: string; fields?: Record<string, string> }

export async function registerPlayer(_prev: RegisterState | undefined, form: FormData): Promise<RegisterState> {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const fields = Object.fromEntries(["full_name", "birth_date", "position", "team", "phone", "jersey_no"].map((k) => [k, String(form.get(k) ?? "").trim()]));
  if (fields.full_name.length < 3) return { error: "Nama lengkap minimal 3 huruf.", fields };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.birth_date)) return { error: "Tanggal lahir belum diisi.", fields };
  const age = ageFrom(fields.birth_date);
  if (age < 5 || age > 40 || fields.birth_date > todayISO()) return { error: "Tanggal lahir tidak valid. Periksa lagi tahunnya.", fields };
  if (!["GK", "DF", "MF", "FW"].includes(fields.position)) return { error: "Pilih posisi bermain.", fields };

  const [coach, existing] = await Promise.all([
    db().from("coaches").select("id").eq("clerk_user_id", userId).maybeSingle(),
    db().from("players").select("id, status").eq("clerk_user_id", userId).maybeSingle(),
  ]);
  if (coach.data) return { error: "Akun Google ini sudah terdaftar sebagai coach. Gunakan akun lain untuk mendaftar sebagai pemain.", fields };
  if (existing.data && existing.data.status !== "ditolak") redirect("/menunggu");

  const user = await currentUser();
  const groups = await getAgeGroups();
  const row = {
    clerk_user_id: userId,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    full_name: fields.full_name,
    birth_date: fields.birth_date,
    position: fields.position as Position,
    team: fields.team || "UNESA FC ACADEMY",
    phone: fields.phone || null,
    jersey_no: fields.jersey_no ? Number(fields.jersey_no) : null,
    age_group_id: groupForAge(groups, age)?.id ?? null,
    status: "pending" as const,
    reject_reason: null,
    updated_at: new Date().toISOString(),
  };
  const { error } = existing.data
    ? await db().from("players").update(row).eq("id", existing.data.id)
    : await db().from("players").insert(row);
  if (error) return { error: "Pendaftaran gagal disimpan. Coba lagi sebentar lagi.", fields };
  redirect("/menunggu");
}
