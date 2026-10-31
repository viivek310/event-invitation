import { z } from "zod";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { db } from "@/server/db";
import { currentSession, newSession, hashPassword, verifyPassword, authDestination } from "@/server/auth";
import { passwordSchema, phoneSchema } from "@/server/validation";
import { AppError, sameOrigin, rateLimit, ipKey, digest, encrypt, decrypt, randomToken, errorResponse, readJson } from "@/server/security";

export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    await sameOrigin(request);
    const { action } = await params;
    await rateLimit(`auth-ip:${await ipKey()}`, 40, 900);
    const input = await readJson(request);
    if (action === "login") {
      const { phone, password } = z.object({ phone: phoneSchema, password: z.string().min(1).max(128) }).parse(input);
      await rateLimit(`login:${phone}`, 10, 900);
      const account = await db.account.findUnique({ where: { phone } });
      // Always perform an Argon2 operation, including for unknown accounts.
      const valid = account ? await verifyPassword(account.passwordHash, password) : (await hashPassword(password), false);
      if (!valid || !account || account.suspended) throw new AppError("Unable to sign in with those credentials.", 401);
      const kind = account.mustChangePassword ? "PASSWORD" : account.role === "ADMIN" ? account.mfaSecret ? "MFA" : "ENROLL" : "FULL";
      await newSession(account.id, kind);
      return Response.json({ redirect: authDestination(kind, account.role) });
    }
    const session = await currentSession();
    if (!session) throw new AppError("Please sign in again.", 401);
    if (action === "logout") {
      await db.session.deleteMany({ where: { hash: session.hash } });
      return Response.json({ redirect: "/login" });
    }
    if (action === "password") {
      const { current, password } = z.object({ current: z.string().max(128), password: passwordSchema }).parse(input);
      if (!await verifyPassword(session.account.passwordHash, current)) throw new AppError("Current password is incorrect.");
      if (current === password) throw new AppError("Choose a different password.");
      const passwordHash = await hashPassword(password);
      await db.$transaction(async tx => {
        await tx.account.update({ where: { id: session.accountId }, data: { passwordHash, mustChangePassword: false } });
        await tx.session.deleteMany({ where: { accountId: session.accountId } });
        await tx.auditEvent.create({ data: { actorId: session.accountId, action: "PASSWORD_CHANGED" } });
      });
      const kind = session.account.role === "ADMIN" ? session.account.mfaSecret ? "MFA" : "ENROLL" : "FULL";
      await newSession(session.accountId, kind);
      return Response.json({ redirect: authDestination(kind, session.account.role) });
    }
    if (session.account.mustChangePassword || session.account.role !== "ADMIN") throw new AppError("Access denied.", 403);
    if (action === "mfa-enroll") {
      if (session.kind !== "ENROLL" || session.account.mfaSecret) throw new AppError("Enrollment is unavailable.", 403);
      const secret = session.enrollmentSecret ? decrypt(session.enrollmentSecret) : authenticator.generateSecret();
      if (!session.enrollmentSecret) await db.session.update({ where: { hash: session.hash }, data: { enrollmentSecret: encrypt(secret) } });
      return Response.json({ secret, qr: await QRCode.toDataURL(authenticator.keyuri(session.account.phone, "Invitation Studio", secret)) });
    }
    if (action === "mfa-confirm" || action === "mfa-verify") {
      if (session.kind !== (action === "mfa-confirm" ? "ENROLL" : "MFA")) throw new AppError("Access denied.", 403);
      const code = z.object({ code: z.string().trim().min(6).max(80) }).parse(input).code;
      await rateLimit(`mfa:${session.accountId}`, 8, 900);
      const secret = action === "mfa-confirm" ? session.enrollmentSecret : session.account.mfaSecret;
      const delta = secret ? authenticator.checkDelta(code, decrypt(secret)) : null;
      const step = Math.floor(Date.now() / 30000) + (delta ?? 0);
      const recoveryCodes = action === "mfa-confirm" ? Array.from({ length: 10 }, () => randomToken().slice(0, 24)) : [];
      await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "Account" WHERE id = ${session.accountId} FOR UPDATE`;
        const account = await tx.account.findUniqueOrThrow({ where: { id: session.accountId } });
        if (delta !== null && step > account.mfaLastStep && secret) {
          await tx.account.update({ where: { id: account.id }, data: { mfaLastStep: step, ...(action === "mfa-confirm" ? { mfaSecret: secret } : {}) } });
        } else if (action === "mfa-verify" && (await tx.recoveryCode.deleteMany({ where: { accountId: account.id, hash: digest(code) } })).count === 1) {
          // Recovery codes are random, hashed, and consumed once atomically.
        } else throw new AppError("Invalid or already-used authenticator/recovery code.", 401);
        if (recoveryCodes.length) await tx.recoveryCode.createMany({ data: recoveryCodes.map(value => ({ accountId: account.id, hash: digest(value) })) });
        await tx.auditEvent.create({ data: { actorId: account.id, action: action === "mfa-confirm" ? "MFA_ENROLLED" : "ADMIN_SIGNED_IN" } });
      });
      await newSession(session.accountId, "FULL");
      return Response.json({ redirect: "/admin", recoveryCodes });
    }
    throw new AppError("Unknown action.", 404);
  } catch (error) { return errorResponse(error); }
}
