import { redirect } from "next/navigation";
import { getAccount } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

/** Titik balik setelah login Google di /coach: arahkan sesuai status akun. */
export default async function CoachRoute() {
  const a = await getAccount();
  if (!a.userId) redirect("/coach");
  if (a.kind === "player") redirect("/coach?peran=pemain");
  if (a.kind === "none") redirect("/coach/daftar");
  redirect(a.coach.status === "aktif" ? "/coach/dashboard" : "/coach/menunggu");
}
