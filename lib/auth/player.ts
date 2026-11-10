import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import type { Player } from "@/lib/types";

export async function getPlayerForUser(): Promise<{ userId: string | null; player: Player | null }> {
  const { userId } = await auth();
  if (!userId) return { userId: null, player: null };
  const { data } = await db().from("players").select("*").eq("clerk_user_id", userId).maybeSingle();
  return { userId, player: (data as Player) ?? null };
}

/** Pemain yang sudah diverifikasi coach. Selain itu diarahkan ke langkah yang sesuai. */
export async function requireActivePlayer(): Promise<Player> {
  const { userId, player } = await getPlayerForUser();
  if (!userId) redirect("/login");
  if (!player) redirect("/lengkapi-data");
  if (player.status !== "aktif") redirect("/menunggu");
  return player;
}
