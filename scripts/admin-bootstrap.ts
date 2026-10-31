import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { createInterface } from "node:readline/promises";
nextEnv.loadEnvConfig(process.cwd());
const cli = createInterface({ input: process.stdin, output: process.stdout });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  if (await db.account.count({ where: { role: "ADMIN" } })) throw new Error("An admin already exists. Use the existing account's recovery codes.");
  const name = await cli.question("Admin name: ");
  const phone = parsePhoneNumberFromString(await cli.question("Admin mobile number (with country code): "), "IN");
  if (!phone?.isValid()) throw new Error("Invalid mobile number.");
  // Password input is masked in a TTY; never accept it through command-line arguments.
  cli.close();
  if (!process.stdin.isTTY) throw new Error("Run bootstrap in an interactive terminal.");
  process.stdout.write("Admin password (12–128 characters): ");
  process.stdin.setRawMode(true); process.stdin.resume();
  const password = await new Promise<string>((resolve, reject) => {
    let value = "";
    const listener = (chunk: Buffer) => {
      for (const char of chunk.toString()) {
        if (char === "\u0003") { process.stdin.off("data", listener); reject(new Error("Cancelled")); return; }
        if (char === "\r" || char === "\n") { process.stdin.off("data", listener); resolve(value); return; }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " " && value.length < 129) value += char;
      }
    };
    process.stdin.on("data", listener);
  });
  process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write("\n");
  if (password.length < 12 || password.length > 128) throw new Error("Password must be 12–128 characters.");
  await db.account.create({ data: { name: name.trim().slice(0, 100), phone: phone.number, role: "ADMIN", mustChangePassword: false,
    passwordHash: await hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 }) } });
  console.log("Admin created. Sign in and enroll your authenticator before accessing admin pages.");
} finally {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  cli.close(); process.stdin.pause(); await db.$disconnect();
}
