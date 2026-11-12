import "server-only";
import { requireAdmin } from "@/lib/auth/admin";
import { requireActiveCoach } from "@/lib/auth/roles";
import { getSquadIds, type Ids } from "@/lib/data";
import { db } from "@/lib/supabase";
import type { Coach } from "@/lib/types";

export type StaffRole = "admin" | "coach";

/** Lingkup data untuk halaman staf. Admin = semua; coach = skuadnya sendiri. */
export interface Scope {
  role: StaffRole;
  base: "/admin" | "/coach";
  actor: { id: string; name: string };
  coach: Coach | null;
  /** null = semua pemain */
  ids: Ids;
  /** null = semua sesi */
  coachId: string | null;
}

export async function requireStaff(role: StaffRole): Promise<Scope> {
  if (role === "admin") {
    const a = await requireAdmin();
    return { role, base: "/admin", actor: { id: a.sub, name: a.name }, coach: null, ids: null, coachId: null };
  }
  const c = await requireActiveCoach();
  return { role, base: "/coach", actor: { id: c.id, name: c.full_name }, coach: c, ids: await getSquadIds(c.id), coachId: c.id };
}

export function inScope(scope: Scope, playerId: string) {
  return scope.ids === null || scope.ids.includes(playerId);
}

export class ScopeError extends Error {}

export function assertPlayer(scope: Scope, playerId: string) {
  if (!inScope(scope, playerId)) throw new ScopeError("Pemain ini bukan anggota skuad Anda.");
}

/** Coach hanya boleh mengubah sesi miliknya. */
export async function assertSession(scope: Scope, sessionId: string) {
  const { data } = await db().from("training_sessions").select("id, coach_id").eq("id", sessionId).maybeSingle();
  if (!data) throw new ScopeError("Sesi tidak ditemukan.");
  if (scope.coachId && data.coach_id !== scope.coachId) throw new ScopeError("Sesi ini milik coach lain.");
  return data;
}

export async function logActivity(scope: Pick<Scope, "role" | "actor">, e: { action: string; entity: string; entityId?: string; playerId?: string; coachId?: string; detail?: string }) {
  await db().from("activity_log").insert({
    actor_role: scope.role, actor_name: scope.actor.name, action: e.action, entity: e.entity,
    entity_id: e.entityId ?? null, player_id: e.playerId ?? null, coach_id: e.coachId ?? null, detail: e.detail ?? null,
  });
}
