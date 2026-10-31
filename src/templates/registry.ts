import { foundationDefinition } from "./foundation/definition.ts";
import { royalWeddingDefinition } from "./royal-wedding/definition.ts";
import type { TemplateDefinition } from "./types.ts";

export const templateRegistry: readonly TemplateDefinition[] = [
  foundationDefinition,
  royalWeddingDefinition,
];

export function getTemplate(id: string) {
  return templateRegistry.find((template) => template.id === id);
}

export function getPublicTemplates() {
  return templateRegistry.filter((template) => template.status === "preview");
}

export function getPublicTemplate(id: string) {
  return getPublicTemplates().find((template) => template.id === id);
}
