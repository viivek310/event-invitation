import "server-only";
import { db } from "./db";
import { royalWeddingDefinition } from "@/templates/royal-wedding/definition";
import { royalContentSchema } from "./validation";
import type { TemplateDefinition } from "@/templates/types";

export async function publicCatalog(): Promise<TemplateDefinition[]> {
  const rows = await db.catalogEntry.findMany({ where: { visible: true, id: "royal-wedding" } });
  return rows.map(row => ({ ...royalWeddingDefinition, name: row.title, description: row.description, thumbnail: row.thumbnail || undefined,
    status: "preview", demo: royalContentSchema.parse(row.demo) }));
}
export async function publicTemplate(id: string) {
  return (await publicCatalog()).find(row => row.id === id);
}
