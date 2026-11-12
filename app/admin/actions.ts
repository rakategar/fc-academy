"use server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { ADMIN_COOKIE, ADMIN_SESSION_DAYS, signAdminToken } from "@/lib/auth/admin-token";

export async function loginAdmin(_prev: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { error: "Isi username dan password." };

  const { data } = await db().from("admins").select("id, username, full_name, password_hash").eq("username", username).maybeSingle();
  const ok = data ? await bcrypt.compare(password, data.password_hash) : false;
  if (!data || !ok) return { error: "Username atau password salah." };

  const token = await signAdminToken({ sub: data.id, username: data.username, name: data.full_name });
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_DAYS * 86400,
  });
  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin");
}
