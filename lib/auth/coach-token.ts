// Aman untuk edge/proxy: hanya memakai jose.
import { SignJWT, jwtVerify } from "jose";

export const COACH_COOKIE = "ufa_coach";
export const COACH_SESSION_DAYS = 7;

export interface CoachSession { sub: string; username: string; name: string }

function secret() {
  const s = process.env.COACH_JWT_SECRET;
  if (!s) throw new Error("COACH_JWT_SECRET belum diisi");
  return new TextEncoder().encode(s);
}

export async function signCoachToken(s: CoachSession): Promise<string> {
  return new SignJWT({ username: s.username, name: s.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime(`${COACH_SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifyCoachToken(token: string | undefined): Promise<CoachSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return { sub: String(payload.sub), username: String(payload.username), name: String(payload.name) };
  } catch {
    return null;
  }
}
