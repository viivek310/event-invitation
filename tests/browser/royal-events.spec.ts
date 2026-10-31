import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto("/preview/royal-wedding");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  return { canvas, events: canvas.locator('[data-section="events"]') };
}

for (const size of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }, { width: 588, height: 615 }]) {
  test(`all ceremonies have readable pinned resting states at ${size.width}x${size.height}`, async ({ page }, info) => {
    await page.setViewportSize(size);
    const { canvas, events } = await open(page);
    await expect(events).toHaveAttribute("data-events-pinned", "true");
    const navigation = events.getByRole("navigation", { name: "Wedding ceremonies" });
    const ids = ["welcome", "mehendi", "haldi", "sangeet", "wedding", "reception"];
    for (let i = 0; i < ids.length; i++) {
      const button = navigation.getByRole("button").nth(i);
      await button.focus();
      await page.keyboard.press(i % 2 ? "Space" : "Enter");
      const panel = events.locator(`[data-ceremony="${ids[i]}"]`);
      await expect(panel.getByRole("heading")).toBeFocused();
      await expect(events).toHaveAttribute("data-current-ceremony", ids[i]);
      await expect(button).toHaveAttribute("aria-current", "step");
      await expect(panel).toHaveCSS("opacity", "1");
      const bounds = await canvas.boundingBox();
      for (const detail of await panel.locator("h3, time, [data-event-text] p, a").all()) {
        const box = (await detail.boundingBox())!;
        expect(box.y).toBeGreaterThanOrEqual(bounds!.y - 1);
        expect(box.y + box.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
      }
      const image = (await panel.locator("[data-event-image]").boundingBox())!;
      expect(image.height).toBeGreaterThanOrEqual(120);
      await expect(panel.getByRole("link")).toHaveCSS("font-size", "14px");
      const hit = (await button.boundingBox())!;
      expect(hit.width).toBeGreaterThanOrEqual(44);
      expect(hit.height).toBeGreaterThanOrEqual(44);
      expect(await canvas.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      if (i === 0 || i === 4) await canvas.screenshot({ path: info.outputPath(`${ids[i]}-${size.width}.png`) });
    }
    // Reverse navigation must restore a fully settled earlier scene.
    await navigation.getByRole("button").nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(events).toHaveAttribute("data-current-ceremony", "mehendi");
    await expect(events.locator('[data-ceremony="mehendi"] h3')).toBeFocused();
  });
}

test("reduced motion and insufficient height keep every detail in natural flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { events } = await open(page);
  await expect(events).toHaveAttribute("data-events-pinned", "false");
  await expect(events.getByRole("heading", { level: 3 })).toHaveCount(6);
  await expect(events.locator("[inert]")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 588, height: 400 });
  await expect(events).toHaveAttribute("data-events-pinned", "false");
  await expect(events.getByRole("link")).toHaveCount(6);
});

test("resizing preserves the active ceremony and replay resets it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { canvas, events } = await open(page);
  await page.setViewportSize({ width: 588, height: 615 });
  await expect.poll(() => canvas.evaluate(node => node.scrollTop)).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => canvas.evaluate(node => node.scrollTop)).toBe(0);
  const navigation = events.getByRole("navigation", { name: "Wedding ceremonies" });
  await navigation.getByRole("button", { name: /Sangeet/ }).focus();
  await page.keyboard.press("Enter");
  await expect(events.locator('[data-ceremony="sangeet"] h3')).toBeFocused();
  await page.setViewportSize({ width: 588, height: 615 });
  await expect(events).toHaveAttribute("data-events-pinned", "true");
  await expect(events).toHaveAttribute("data-current-ceremony", "sangeet");
  const panel = events.locator('[data-ceremony="sangeet"]');
  await expect(panel).toHaveCSS("opacity", "1");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/admin/templates/royal-wedding/preview");
  await page.getByRole("button", { name: "Skip introduction" }).click();
  await page.getByRole("button", { name: "Replay" }).click();
  await page.getByRole("button", { name: "Skip introduction" }).click();
  await expect(page.locator('[data-section="events"]')).toHaveAttribute("data-current-ceremony", "welcome");
  expect(await canvas.evaluate(node => node.scrollTop)).toBe(0);
  expect(errors).toEqual([]);
});
