import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import type { Coach, Player } from "@/lib/types";

/** Akun Google (Clerk) yang sedang login beserta perannya di database. 1 akun = 1 peran. */
export type Account =
  | { userId: null }
  | { userId: string; kind: "none" }
  | { userId: string; kind: "coach"; coach: Coach }
  | { userId: string; kind: "player"; player: Player };

export const getAccount = cache(async (): Promise<Account> => {
  const { userId } = await auth();
  if (!userId) return { userId: null };
  const [c, p] = await Promise.all([
    db().from("coaches").select("*").eq("clerk_user_id", userId).maybeSingle(),
    db().from("players").select("*").eq("clerk_user_id", userId).maybeSingle(),
  ]);
  if (c.data) return { userId, kind: "coach", coach: c.data as Coach };
  if (p.data) return { userId, kind: "player", player: p.data as Player };
  return { userId, kind: "none" };
});

/** Ke mana akun ini seharusnya pergi setelah login. */
export function homeFor(a: Account): string {
  if (!a.userId) return "/";
  if (a.kind === "coach") return a.coach.status === "aktif" ? "/coach/dashboard" : "/coach/menunggu";
  if (a.kind === "player") return a.player.status === "aktif" || a.player.status === "cuti" ? "/pemain" : "/menunggu";
  return "/";
}

export async function requireActiveCoach(): Promise<Coach> {
  const a = await getAccount();
  if (!a.userId) redirect("/coach");
  if (a.kind === "player") redirect("/coach?peran=pemain");
  if (a.kind === "none") redirect("/coach/daftar");
  if (a.coach.status !== "aktif") redirect("/coach/menunggu");
  return a.coach;
}

export async function requireActivePlayer(): Promise<Player> {
  const a = await getAccount();
  if (!a.userId) redirect("/");
  if (a.kind === "coach") redirect("/?peran=coach");
  if (a.kind === "none") redirect("/daftar");
  // pemain cuti tetap boleh masuk (melihat riwayatnya), tapi tidak bisa absen mandiri
  if (a.player.status !== "aktif" && a.player.status !== "cuti") redirect("/menunggu");
  return a.player;
}
