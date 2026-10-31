import { mkdirSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";

const directory = resolve(process.argv[2] || "secrets/production");
const names = ["db_bootstrap_password", "db_migration_password", "db_app_password", "session_secret", "mfa_encryption_key"];
if (names.some(name => existsSync(resolve(directory, name)))) throw new Error("Secret files already exist. Refusing to overwrite; use the documented rotation procedure.");
mkdirSync(directory, { recursive: true, mode: 0o700 });
chmodSync(directory, 0o700);
// Compose file mounts retain host ownership. UID 1000 is the unprivileged app
// user in the image; provision these on Linux as UID 1000 (documented).
for (const name of names) writeFileSync(resolve(directory, name), `${randomBytes(32).toString("hex")}\n`, { flag: "wx", mode: 0o400 });
console.log("Generated independent secrets without printing them. Keep an encrypted offline recovery copy.");
