import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { royalWeddingDemo } from "../src/templates/royal-wedding/content.ts";
nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  await db.catalogEntry.upsert({ where: { id: "royal-wedding" }, update: {}, create: {
    id: "royal-wedding", title: "Royal Wedding", description: "A cinematic palace invitation in burgundy and champagne gold.",
    thumbnail: "/templates/royal-wedding/palace/hero-mobile.webp", visible: true, demo: royalWeddingDemo,
  } });
  await db.settings.upsert({ where: { id: "studio" }, update: {}, create: { id: "studio" } });
  console.log("Catalog registered. Existing admin edits were preserved. No customers or paid orders were seeded.");
} finally { await db.$disconnect(); }
