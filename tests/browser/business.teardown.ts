import "dotenv/config";
import { readFile, unlink } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
export default async function teardown() {
  const db = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try { const operator=JSON.parse(await readFile("work/browser-operator.json","utf8"));
    await db.account.deleteMany({where:{id:operator.id,name:"Browser test operator"}});
  } finally { await db.$disconnect(); await unlink("work/browser-auth.json").catch(()=>{}); await unlink("work/browser-operator.json").catch(()=>{}); }
}
