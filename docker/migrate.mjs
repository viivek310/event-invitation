import pg from "pg";
import { spawn } from "node:child_process";

const client = new pg.Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
let child;
try {
  await client.connect();
  const result = await client.query("SELECT pg_try_advisory_lock(941872631) AS locked");
  if (!result.rows[0].locked) throw new Error("Another deployment holds the migration lock.");
  const code = await new Promise((resolve, reject) => {
    child = spawn(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
    for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => child.kill(signal));
    client.once("error", () => child.kill("SIGTERM"));
  });
  if (code !== 0) throw new Error("Migration failed; deployment must stop.");
  console.log("Migrations completed.");
} catch {
  console.error("Migration job failed. Check database readiness, deployment lock, and migration status.");
  process.exitCode = 1;
} finally { await client.end().catch(() => {}); }
