import { test, expect } from "@playwright/test";

test("mobile toolbar height changes preserve invitation artwork and ceremony position", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 760 }, isMobile: true, hasTouch: true,
    storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto("/templates/royal-wedding?canvas=1");
    const canvas = page.locator("[data-royal-scroll]");
    await canvas.getByRole("button", { name: "Skip introduction" }).click();
    const background = canvas.locator("[data-palace-backdrop]");
    await expect(background).toHaveCSS("opacity", "1");
    const initialHeight = await background.evaluate(node => node.getBoundingClientRect().height);
    await canvas.evaluate(node => { node.scrollTop = 320; });
    for (const height of [844, 760, 820, 760]) {
      await page.setViewportSize({ width: 390, height });
      await expect.poll(() => canvas.evaluate(node => node.scrollTop)).toBe(320);
      expect(await background.evaluate(node => node.getBoundingClientRect().height)).toBeCloseTo(initialHeight, 0);
    }
    const events = canvas.locator('[data-section="events"]');
    await expect(events).toHaveAttribute("data-events-pinned", "true");
    await events.getByRole("button", { name: /Go to Sangeet/ }).focus();
    await page.keyboard.press("Enter");
    await expect(events.locator('[data-ceremony="sangeet"] h3')).toBeFocused();
    const position = await canvas.evaluate(node => new Promise<number>(resolve => {
      let last = node.scrollTop;
      let unchangedSince = performance.now();
      function settled(now: number) {
        if (node.scrollTop !== last) { last = node.scrollTop; unchangedSince = now; }
        if (now - unchangedSince >= 200) resolve(node.scrollTop);
        else requestAnimationFrame(settled);
      }
      requestAnimationFrame(settled);
    }));
    for (const height of [844, 760]) {
      await page.setViewportSize({ width: 390, height });
      await expect(events).toHaveAttribute("data-current-ceremony", "sangeet");
      // Native smooth navigation can finish on an adjacent rounded CSS pixel.
      await expect.poll(async () => Math.abs(await canvas.evaluate(node => node.scrollTop) - position)).toBeLessThanOrEqual(2);
    }
    await page.setViewportSize({ width: 760, height: 390 });
    await expect.poll(() => canvas.evaluate(node => parseFloat((node as HTMLElement).style.getPropertyValue("--royal-layout-height")))).toBe(390);
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});
