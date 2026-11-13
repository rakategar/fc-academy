"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { syncSquads } from "@/lib/data";
import { fmtDate, todayISO } from "@/lib/format";
import { assertPlayer, logActivity, requireStaff, ScopeError, type StaffRole } from "@/lib/scope";

export interface LeaveResult { error?: string }

/**
 * Cutikan pemain aktif (aktif → cuti). Boleh dilakukan admin (semua pemain) atau coach (pemain di skuadnya).
 * Pemain cuti tetap di skuad coach, tapi tidak masuk daftar absensi, absen mandiri, penilaian baru, maupun peringkat.
 */
export async function startLeave(role: StaffRole, playerId: string, input: { reason: string; until: string | null }): Promise<LeaveResult> {
  const scope = await requireStaff(role);
  try { assertPlayer(scope, playerId); } catch (e) { return { error: (e as ScopeError).message }; }
  const reason = input.reason.trim().slice(0, 200);
  if (reason.length < 3) return { error: "Tulis alasan cuti (mis. cedera, ujian sekolah)." };
  const until = input.until || null;
  if (until && (!/^\d{4}-\d{2}-\d{2}$/.test(until) || until < todayISO())) return { error: "Perkiraan kembali harus hari ini atau setelahnya." };

  // bersyarat status = 'aktif' agar tidak menimpa perubahan lain (mis. admin baru saja mengarsipkan)
  const { data, error } = await db().from("players")
    .update({ status: "cuti", leave_reason: reason, leave_since: todayISO(), leave_until: until, leave_by: scope.actor.name, updated_at: new Date().toISOString() })
    .eq("id", playerId).eq("status", "aktif").select("id");
  if (error) return { error: "Gagal menyimpan status cuti." };
  if (!data?.length) return { error: "Status pemain sudah berubah. Muat ulang halaman." };
  await syncSquads({ playerId });
  await logActivity(scope, { action: "mencutikan pemain", entity: "pemain", entityId: playerId, playerId, detail: `${reason}${until ? ` · perkiraan kembali ${fmtDate(until)}` : ""}` });
  revalidatePath("/", "layout");
  return {};
}

/** Akhiri cuti (cuti → aktif). */
export async function endLeave(role: StaffRole, playerId: string): Promise<LeaveResult> {
  const scope = await requireStaff(role);
  try { assertPlayer(scope, playerId); } catch (e) { return { error: (e as ScopeError).message }; }
  const { data, error } = await db().from("players")
    .update({ status: "aktif", updated_at: new Date().toISOString() })
    .eq("id", playerId).eq("status", "cuti").select("id");
  if (error) return { error: "Gagal mengaktifkan pemain." };
  if (!data?.length) return { error: "Pemain ini sudah tidak berstatus cuti. Muat ulang halaman." };
  await syncSquads({ playerId });
  await logActivity(scope, { action: "mengakhiri cuti pemain", entity: "pemain", entityId: playerId, playerId });
  revalidatePath("/", "layout");
  return {};
}
