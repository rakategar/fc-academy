"use server";
import { db } from "@/lib/supabase";
import { requireActivePlayer } from "@/lib/auth/roles";
import { getOpenCheckIn } from "@/lib/checkin";
import { nowTimeWIB } from "@/lib/format";

/**
 * Pemain menandai dirinya hadir pada semua sesi yang sedang dibuka (mis. sesi kelompok usia dan sesi kiper bersamaan).
 * Catatan yang sudah diisi coach tidak ditimpa. Halaman di-refresh oleh klien setelah animasi selesai.
 */
export async function checkIn(sessionId: string): Promise<{ ok?: true; time?: string; error?: string }> {
  const player = await requireActivePlayer();
  const open = await getOpenCheckIn(player);
  if (!open || !open.all.some((s) => s.id === sessionId)) return { error: "Absen untuk sesi ini sudah ditutup atau sudah tercatat. Muat ulang halaman." };
  const time = nowTimeWIB();
  const { error } = await db().from("attendance").upsert(
    open.all.map((s) => ({ session_id: s.id, player_id: player.id, status: "hadir", note: `Absen mandiri ${time} WIB`, recorded_by: `${player.full_name} (pemain)` })),
    { onConflict: "session_id,player_id", ignoreDuplicates: true },
  );
  if (error) return { error: "Gagal menyimpan absen. Coba lagi." };
  return { ok: true, time };
}
