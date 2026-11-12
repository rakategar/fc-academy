// Aman untuk edge/proxy: hanya memakai jose.
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "ufa_admin";
export const ADMIN_SESSION_DAYS = 7;

export interface AdminSession { sub: string; username: string; name: string }

function secret() {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s) throw new Error("ADMIN_JWT_SECRET belum diisi");
  return new TextEncoder().encode(s);
}

export async function signAdminToken(s: AdminSession): Promise<string> {
  return new SignJWT({ username: s.username, name: s.name, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifyAdminToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.role !== "admin") return null;
    return { sub: String(payload.sub), username: String(payload.username), name: String(payload.name) };
  } catch {
    return null;
  }
}
