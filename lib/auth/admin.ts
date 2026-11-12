import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminToken, type AdminSession } from "./admin-token";

export async function getAdmin(): Promise<AdminSession | null> {
  const jar = await cookies();
  return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin(): Promise<AdminSession> {
  const a = await getAdmin();
  if (!a) redirect("/admin");
  return a;
}
