import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
if (existsSync(".env") || existsSync(".env.db")) throw new Error("Existing configuration found. Refusing to overwrite secrets.");
const migration = randomBytes(32).toString("hex");
const runtime = randomBytes(32).toString("hex");
writeFileSync(".env.db", `POSTGRES_PASSWORD=${migration}\nAPP_DB_PASSWORD=${runtime}\nPOSTGRES_PORT=5432\n`, { mode: 0o600 });
writeFileSync(".env", `APP_URL=http://127.0.0.1:3001\nDATABASE_URL=postgresql://invitation_app:${runtime}@127.0.0.1:5432/invitations\nMIGRATION_DATABASE_URL=postgresql://invitation_migrator:${migration}@127.0.0.1:5432/invitations\nSESSION_SECRET=${randomBytes(32).toString("hex")}\nMFA_ENCRYPTION_KEY=${randomBytes(32).toString("hex")}\nMEDIA_ROOT=./private-media\nTRUST_PROXY=false\n`, { mode: 0o600 });
console.log("Created ignored local configuration with independent generated secrets. No credentials were printed.");
