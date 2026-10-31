import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hash, verify } from "@node-rs/argon2";
import { db } from "./db";
import { config } from "./config";
import { AppError, digest, randomToken } from "./security";

export const hashPassword = (value: string) => hash(value, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
export const verifyPassword = (encoded: string, value: string) => verify(encoded, value);
const cookieName = () => config().secure ? "__Host-invitation-session" : "invitation-session";
export async function currentSession() {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token || token.length > 100) return null;
  const session = await db.session.findUnique({ where: { hash: digest(token) }, include: { account: true } });
  if (!session || session.expiresAt <= new Date() || session.account.suspended) return null;
  return session;
}
export async function newSession(accountId: string, kind: string) {
  const jar = await cookies();
  const existing = jar.get(cookieName())?.value;
  if (existing) await db.session.deleteMany({ where: { hash: digest(existing) } });
  const token = randomToken();
  const seconds = kind === "FULL" ? 60 * 60 * 12 : 60 * 10;
  await db.session.create({ data: { hash: digest(token), accountId, kind, expiresAt: new Date(Date.now() + seconds * 1000) } });
  jar.set(cookieName(), token, { httpOnly: true, secure: config().secure, sameSite: "lax", path: "/", maxAge: seconds });
}
export async function requireAccount(role?: "ADMIN" | "CUSTOMER") {
  const session = await currentSession();
  if (!session || session.kind !== "FULL" || session.account.mustChangePassword ||
    (session.account.role === "ADMIN" && !session.account.mfaSecret)) throw new AppError("Please sign in.", 401);
  if (role && session.account.role !== role) throw new AppError("Access denied.", 403);
  return session.account;
}
export async function requirePageAccount(role?: "ADMIN" | "CUSTOMER") {
  try { return await requireAccount(role); } catch { redirect("/login"); }
}
export function authDestination(kind: string, role: string) {
  return kind === "PASSWORD" ? "/account/password" : kind === "ENROLL" ? "/account/mfa/setup" : kind === "MFA" ? "/account/mfa" : role === "ADMIN" ? "/admin" : "/dashboard";
}
