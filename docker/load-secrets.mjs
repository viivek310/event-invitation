import { readFileSync } from "node:fs";

// Runs before any application/Prisma imports. Values remain server-side and
// never become Docker build args, browser configuration, or log messages.
function secret(variable) {
  const path = process.env[`${variable}_FILE`];
  if (!path) throw new Error(`Missing ${variable}_FILE secret mount.`);
  let value;
  try { value = readFileSync(path, "utf8").trim(); }
  catch { throw new Error(`Cannot read ${variable}_FILE secret mount.`); }
  if (!/^[a-f0-9]{64}$/i.test(value) || new Set(value.toLowerCase()).size < 8)
    throw new Error(`${variable} must contain a randomly generated 32-byte hex secret.`);
  return value;
}
const password = secret("APP_DB_PASSWORD");
const credentials = [password];
if (process.env.SECRET_MODE !== "database") {
  const session = secret("SESSION_SECRET");
  const mfa = secret("MFA_ENCRYPTION_KEY");
  credentials.push(session, mfa);
  if (new Set(credentials).size !== credentials.length) throw new Error("Production secrets must be independent.");
  process.env.SESSION_SECRET = session;
  process.env.MFA_ENCRYPTION_KEY = mfa;
}
const origin = new URL(process.env.APP_URL || "");
if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash)
  throw new Error("APP_URL must be the canonical HTTPS origin without a path.");
if (!/^[a-z][a-z0-9_-]{0,62}$/.test(process.env.DB_NAME || "")) throw new Error("Invalid DB_NAME.");
for (const key of ["DB_APP_USER", "DB_MIGRATION_USER"]) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(process.env[key] || "")) throw new Error(`Invalid ${key}.`);
}
const dbUrl = (user, pass) => `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@postgres:5432/${process.env.DB_NAME}?schema=public`;
process.env.DATABASE_URL = dbUrl(process.env.DB_APP_USER, password);
if (process.env.DB_MIGRATION_PASSWORD_FILE) {
  const migration = secret("DB_MIGRATION_PASSWORD");
  if (credentials.includes(migration)) throw new Error("Production secrets must be independent.");
  process.env.MIGRATION_DATABASE_URL = dbUrl(process.env.DB_MIGRATION_USER, migration);
}
