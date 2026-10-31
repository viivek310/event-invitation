import assert from "node:assert/strict";
import http from "node:http";

const base = new URL(process.env.TEST_BASE_URL || "http://127.0.0.1:3001");
const production = process.env.TEST_MODE === "production";
const publicPaths = [
  "/",
  "/templates",
  "/templates/foundation-preview",
  "/templates/foundation-preview?canvas=1",
];
const adminPaths = [
  "/admin",
  "/admin/templates",
  "/admin/templates/foundation-preview",
  "/admin/templates/foundation-preview/sandbox",
  "/admin/invitations",
  "/admin/setup",
  "/admin/templates/royal-wedding/preview",
  "/preview/royal-wedding",
];

for (const path of publicPaths) {
  const response = await fetch(new URL(path, base));
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff", path);
  if (path.endsWith("?canvas=1")) {
    assert.match(html, /Aarav/);
    assert.match(html, /Meera/);
    assert.ok(
      !/<form\b/i.test(html),
      "Invitation preview must not contain an RSVP form",
    );
    assert.ok(
      !/rsvp/i.test(html),
      "Invitation preview must not contain an RSVP simulation",
    );
  }
  if (path === "/templates/foundation-preview") assert.match(html, /<iframe\b/);
  console.log("PASS public route", path);
}

for (const path of adminPaths) {
  assert.equal(
    (await fetch(new URL(path, base))).status,
    production ? 404 : 200,
    path,
  );
  console.log(
    production ? "PASS production admin disabled" : "PASS local workspace",
    path,
  );
}

for (const path of [
  "/templates/royal-wedding",
  "/templates/unknown",
  "/invite/aarav-weds-meera",
  "/invite/unknown",
  "/v/aarav-weds-meera",
]) {
  assert.equal((await fetch(new URL(path, base))).status, 404, path);
  console.log("PASS unavailable route returns 404", path);
}

// Node fetch may replace Host; use a raw HTTP request for the actual host check.
if (base.protocol === "http:") {
  const status = await new Promise((resolve, reject) => {
    http
      .get(
        {
          hostname: base.hostname,
          port: base.port || 80,
          path: "/admin",
          headers: { Host: "external.example" },
        },
        (response) => {
          response.resume();
          response.on("end", () => resolve(response.statusCode));
        },
      )
      .on("error", reject);
  });
  assert.equal(
    status,
    404,
    "External Host must not access local development workspace",
  );
  console.log("PASS external Host cannot access development workspace");
}
