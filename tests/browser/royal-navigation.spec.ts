import { test, expect } from "@playwright/test";
import { scrollToSection } from "./royal-scroll-helpers";

for (const viewport of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }, { width: 588, height: 615 }]) {
  test(`native scrolling keeps sections reachable without Explore at ${viewport.width}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/templates/royal-wedding?canvas=1");
    const canvas = page.locator("[data-royal-scroll]");
    await expect(canvas.getByRole("button", { name: "Explore", exact: true })).toHaveCount(0);
    await canvas.getByRole("button", { name: "Skip introduction" }).click();
    await expect(canvas.locator("[data-explore-overlay]")).toHaveCount(0);
    await expect(canvas).toHaveCSS("scrollbar-width", "auto");
    await canvas.focus();
    await page.keyboard.press("PageDown");
    await expect.poll(() => canvas.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await scrollToSection(canvas, "events");
    const events = canvas.locator('[data-section="events"]');
    await events.getByRole("button", { name: "Go to Reception" }).focus();
    await page.keyboard.press("Enter");
    await expect(events.locator('[data-ceremony="reception"] h3')).toBeFocused();
    await expect(events.locator("[data-event-footer]")).toHaveCSS("opacity", "1");
    await scrollToSection(canvas, "rsvp");
    const name = canvas.getByLabel("Your name", { exact: true });
    await name.fill("Preview Guest");
    await expect(name).toHaveValue("Preview Guest");
    await expect(canvas.getByRole("button", { name: "Send RSVP" })).toBeDisabled();
    await scrollToSection(canvas, "invitee");
    await expect(canvas.getByRole("heading", { name: "Inviting You" })).toHaveCSS("opacity", "1");
    await expect(canvas.getByRole("button", { name: "Explore", exact: true })).toHaveCount(0);
    expect(await canvas.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

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
  await events.getByRole("button", { name: "Go to Reception" }).focus();
  await page.keyboard.press("Enter");
  await expect(events.locator('[data-ceremony="reception"] h3')).toBeFocused();
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
  const preferences = canvas.getByLabel("Dietary preferences (optional)");
  await preferences.focus();
  const group = canvas.locator('[data-rsvp-group]').filter({ has: preferences });
  await expect(group).toHaveCSS("visibility", "visible");
  await expect(group).toHaveCSS("opacity", "1");
  await preferences.fill("Vegetarian");
  await expect(preferences).toHaveValue("Vegetarian");
});
