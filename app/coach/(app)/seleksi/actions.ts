"use server";
import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth/coach";
import { db } from "@/lib/supabase";

export async function toggleCandidate(id: string, value: boolean) {
  await requireCoach();
  await db().from("players").update({ is_candidate: value }).eq("id", id);
  revalidatePath("/coach/seleksi");
}

export async function clearCandidates() {
  await requireCoach();
  await db().from("players").update({ is_candidate: false }).eq("is_candidate", true);
  revalidatePath("/coach/seleksi");
}
