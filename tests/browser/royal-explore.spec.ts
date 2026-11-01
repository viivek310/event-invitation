import { test, expect } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }, { width: 588, height: 615 }]) {
test(`Explore navigates enabled sections and hides while editing at ${viewport.width}px`, async ({ page }, info) => {
  await page.setViewportSize(viewport);
  await page.goto("/templates/royal-wedding?canvas=1");
  const canvas = page.locator("[data-royal-scroll]");
  const explore = canvas.getByRole("button", { name: "Explore", exact: true });
  await expect(explore).toHaveCount(0);
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  await expect(explore).toBeVisible();
  const button = (await explore.boundingBox())!;
  expect(button.height).toBeGreaterThanOrEqual(44);
  await explore.focus();
  await page.keyboard.press("Enter");
  const menu = canvas.getByRole("navigation", { name: "Explore invitation" });
  await expect(menu.getByRole("button")).toHaveText(["Invitation", "Date", "Events", "RSVP", "Family"]);
  await page.keyboard.press("Escape");
  await expect(explore).toBeFocused();
  await expect(menu).toHaveCount(0);
  for (const [name, heading] of [["Date", "Save the Date"], ["Events", "The Celebrations"], ["RSVP", "Kindly RSVP"], ["Family", "Inviting You"], ["Invitation", "Aarav & Meera"]]) {
    await explore.click();
    await menu.getByRole("button", { name, exact: false }).click();
    const destination = canvas.getByRole("heading", { name: new RegExp(heading) }).first();
    await expect(destination).toBeFocused();
    await expect(menu).toHaveCount(0);
    expect((await explore.boundingBox())!.y).toBeCloseTo(button.y, 0);
  }
  await explore.click();
  await menu.getByRole("button", { name: "RSVP" }).click();
  const name = canvas.getByLabel("Your name", { exact: true });
  await name.fill("Preview Guest");
  await expect(explore).toHaveCount(0);
  await expect(canvas.getByRole("button", { name: "Send RSVP" })).toBeDisabled();
  await canvas.focus();
  await expect(explore).toBeVisible();
  await explore.click();
  await canvas.screenshot({ path: info.outputPath(`explore-${viewport.width}.png`) });
});
}

test("Explore reflects hidden review sections, closes outside, and permits manual interruption", async ({ page }) => {
  await page.goto("/admin/templates/royal-wedding/preview");
  await page.getByRole("checkbox", { name: "Review RSVP layout" }).uncheck();
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  const explore = canvas.getByRole("button", { name: "Explore", exact: true });
  await explore.click();
  const menu = canvas.getByRole("navigation", { name: "Explore invitation" });
  await expect(menu.getByRole("button", { name: "RSVP" })).toHaveCount(0);
  await canvas.getByRole("heading", { name: "Aarav & Meera" }).click();
  await expect(menu).toHaveCount(0);
  await explore.click();
  await menu.getByRole("button", { name: "Family" }).click();
  await explore.click();
  await menu.getByRole("button", { name: "Invitation", exact: false }).click();
  await canvas.hover();
  await page.mouse.wheel(0, 250);
  await expect(menu).toHaveCount(0);
  expect(await canvas.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
});

test("reduced motion tracks the visible ceremony and preserves final scene contrast", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/royal-wedding");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  const events = canvas.locator('[data-section="events"]');
  await events.locator('[data-ceremony="reception"]').scrollIntoViewIfNeeded();
  await expect(events).toHaveAttribute("data-current-ceremony", "reception");
  await expect(events.getByRole("button", { name: "Go to Reception" })).toHaveAttribute("aria-current", "step");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(events).toHaveAttribute("data-events-pinned", "true");
  await events.evaluate(node => {
    const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
    canvas.scrollTop += node.getBoundingClientRect().top - canvas.getBoundingClientRect().top + node.clientHeight - canvas.clientHeight - 2;
  });
  await expect(events).toHaveAttribute("data-current-ceremony", "reception");
  await expect(events.locator('[data-ceremony="reception"]')).toHaveCSS("opacity", "1");
  await expect(events.locator("[data-event-footer]")).toHaveCSS("opacity", "1");
});

test("pinned artwork preparation stays bounded and focused RSVP groups reveal immediately", async ({ page }) => {
  await page.goto("/templates/royal-wedding?canvas=1");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  const events = canvas.locator('[data-section="events"]');
  await expect(events).toHaveAttribute("data-events-pinned", "true");
  await expect(events.locator("img[src]")).toHaveCount(2);
  await canvas.getByRole("button", { name: "Explore", exact: true }).click();
  await canvas.getByRole("navigation", { name: "Explore invitation" }).getByRole("button", { name: "RSVP" }).click();
  const preferences = canvas.getByLabel("Dietary preferences (optional)");
  await preferences.focus();
  const group = canvas.locator('[data-rsvp-group]').filter({ has: page.getByLabel("Dietary preferences (optional)") });
  await expect(group).toHaveCSS("visibility", "visible");
  await expect(group).toHaveCSS("opacity", "1");
  await preferences.fill("Vegetarian");
  await expect(preferences).toHaveValue("Vegetarian");
});
