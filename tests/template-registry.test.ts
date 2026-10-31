import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getPublicTemplate,
  getPublicTemplates,
  getTemplate,
  templateRegistry,
} from "../src/templates/registry.ts";

test("planned invitations are not accessible through public preview lookup", () => {
  assert.equal(getTemplate("royal-wedding")?.status, "planned");
  assert.equal(getPublicTemplate("royal-wedding"), undefined);
  assert.ok(
    !getPublicTemplates().some((template) => template.id === "royal-wedding"),
  );
});

test("unknown and crafted preview IDs never fall back to demo data", () => {
  for (const id of [
    "not-a-template",
    "aarav-weds-meera",
    "../foundation-preview",
    "__proto__",
    "constructor",
    "",
  ]) {
    assert.equal(getPublicTemplate(id), undefined);
  }
});

test("the public preview provides fictional invitation content", () => {
  const template = getPublicTemplate("foundation-preview");
  assert.ok(template);
  assert.equal(template.demo.partnerOne, "Aarav");
  assert.equal(template.demo.partnerTwo, "Meera");
  assert.ok(template.demo.weddingDate);
});

test("template IDs are unique, URL-safe and schemas are versioned", () => {
  assert.equal(
    new Set(templateRegistry.map((template) => template.id)).size,
    templateRegistry.length,
  );
  for (const template of templateRegistry) {
    assert.match(template.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(template.schemaVersion, 1);
    assert.ok(template.sections.length > 0);
  }
});
