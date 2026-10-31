import "server-only";

export function config() {
  const url = process.env.APP_URL;
  const session = process.env.SESSION_SECRET;
  const encryption = process.env.MFA_ENCRYPTION_KEY;
  if (!url || !session || !encryption || !process.env.DATABASE_URL)
    throw new Error("Application configuration is missing. Follow OPERATIONS.md.");
  if (!/^[a-f0-9]{64}$/i.test(session) || !/^[a-f0-9]{64}$/i.test(encryption) || session === encryption)
    throw new Error("Use independent, randomly generated 32-byte session and MFA keys.");
  const parsed = new URL(url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && local))
    throw new Error("HTTPS is required outside local development.");
  return { origin: parsed.origin, secure: parsed.protocol === "https:", session, encryption };
}
