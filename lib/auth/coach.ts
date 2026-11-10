import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COACH_COOKIE, verifyCoachToken, type CoachSession } from "./coach-token";

export async function getCoach(): Promise<CoachSession | null> {
  const jar = await cookies();
  return verifyCoachToken(jar.get(COACH_COOKIE)?.value);
}

export async function requireCoach(): Promise<CoachSession> {
  const c = await getCoach();
  if (!c) redirect("/coach/login");
  return c;
}
