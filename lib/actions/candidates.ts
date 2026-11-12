"use server";
import { revalidatePath } from "next/cache";
import { assertPlayer, logActivity, requireStaff, type StaffRole } from "@/lib/scope";
import { db } from "@/lib/supabase";

export async function toggleCandidate(role: StaffRole, id: string, value: boolean) {
  const scope = await requireStaff(role);
  assertPlayer(scope, id);
  await db().from("players").update({ is_candidate: value }).eq("id", id);
  await logActivity(scope, { action: value ? "tandai kandidat" : "hapus kandidat", entity: "pemain", entityId: id, playerId: id });
  revalidatePath(`${scope.base}/peringkat`);
}

export async function clearCandidates(role: StaffRole) {
  const scope = await requireStaff(role);
  let q = db().from("players").update({ is_candidate: false }).eq("is_candidate", true);
  if (scope.ids) q = q.in("id", scope.ids.length ? scope.ids : ["00000000-0000-0000-0000-000000000000"]);
  await q;
  revalidatePath(`${scope.base}/peringkat`);
}
