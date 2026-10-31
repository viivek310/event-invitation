import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";
import { config } from "./config";

export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const randomToken = () => randomBytes(32).toString("base64url");
export function digest(value: string) {
  return createHmac("sha256", config().session).update(value).digest("hex");
}
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(config().encryption, "hex"), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(b => b.toString("base64url")).join(".");
}
export function decrypt(value: string) {
  const [iv, tag, data] = value.split(".").map(part => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(config().encryption, "hex"), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
export async function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== config().origin || request.headers.get("sec-fetch-site") === "cross-site")
    throw new AppError("This request is not permitted.", 403);
  if (request.headers.get("x-csrf-protection") !== "1") throw new AppError("Missing request protection.", 403);
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AppError("Expected a JSON request.", 415);
  const reader = request.body?.getReader(); if (!reader) throw new AppError("Missing request body.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const chunk = await reader.read(); if (chunk.done) break; length += chunk.value.byteLength;
    if (length > 128 * 1024) { await reader.cancel(); throw new AppError("Request is too large.", 413); } chunks.push(chunk.value); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new AppError("Invalid request body."); }
}
export async function ipKey() {
  const h = await headers();
  return digest(process.env.TRUST_PROXY === "true" ? (h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown") : "direct");
}
export async function rateLimit(key: string, limit: number, seconds: number) {
  const bucket = digest(key);
  const result = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateBucket" ("key", "count", "expiresAt") VALUES (${bucket}, 1, NOW() + ${seconds} * INTERVAL '1 second')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateBucket"."expiresAt" <= NOW() THEN 1 ELSE "RateBucket"."count" + 1 END,
      "expiresAt" = CASE WHEN "RateBucket"."expiresAt" <= NOW() THEN NOW() + ${seconds} * INTERVAL '1 second' ELSE "RateBucket"."expiresAt" END
    RETURNING "count"`;
  if (result[0].count > limit) throw new AppError("Too many attempts. Please try again later.", 429);
}
export function errorResponse(error: unknown) {
  if (error instanceof AppError) return Response.json({ error: error.message }, { status: error.status });
  if (error && typeof error === "object" && "issues" in error) return Response.json({ error: "Check the entered values and try again." }, { status: 400 });
  if (error && typeof error === "object" && "code" in error && error.code === "P2002")
    return Response.json({ error: "That value is already in use. Choose another or correct the existing record." }, { status: 409 });
  // No raw exceptions, SQL parameters, tokens, or personal data in application logs.
  console.error(JSON.stringify({ event: "request_failed", category: "internal" }));
  return Response.json({ error: "The request could not be completed. Please try again." }, { status: 500 });
}
