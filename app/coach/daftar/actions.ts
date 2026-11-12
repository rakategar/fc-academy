"use server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";

export async function registerCoach(_prev: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) redirect("/coach");
  const full_name = String(form.get("full_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const age_group_ids = form.getAll("age_group_ids").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const focus = String(form.get("focus")) === "kiper" ? "kiper" : "semua";
  if (full_name.length < 3) return { error: "Nama minimal 3 huruf." };
  if (phone.length < 8) return { error: "Isi nomor HP yang bisa dihubungi admin." };
  if (!age_group_ids.length) return { error: "Pilih minimal satu kelompok usia." };

  const [player, existing] = await Promise.all([
    db().from("players").select("id").eq("clerk_user_id", userId).maybeSingle(),
    db().from("coaches").select("id, status").eq("clerk_user_id", userId).maybeSingle(),
  ]);
  if (player.data) return { error: "Akun Google ini sudah terdaftar sebagai pemain. Gunakan akun lain untuk mendaftar sebagai coach." };
  if (existing.data && existing.data.status !== "ditolak") redirect("/coach/masuk");

  const user = await currentUser();
  const row = {
    clerk_user_id: userId, email: user?.primaryEmailAddress?.emailAddress ?? null, full_name, phone, age_group_ids, focus,
    status: "pending", reject_reason: null, updated_at: new Date().toISOString(),
  };
  const { error } = existing.data ? await db().from("coaches").update(row).eq("id", existing.data.id) : await db().from("coaches").insert(row);
  if (error) return { error: "Pendaftaran gagal disimpan. Coba lagi." };
  redirect("/coach/menunggu");
}
