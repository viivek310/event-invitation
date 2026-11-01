import { test, expect } from "@playwright/test";
import { scrollToSection } from "./royal-scroll-helpers";

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
      await expect.poll(() => events.locator("[data-event-stage]").evaluate(node => Math.abs(node.getBoundingClientRect().height - node.closest<HTMLElement>("[data-royal-scroll]")!.clientHeight))).toBeLessThanOrEqual(2);
      await expect(events).toHaveAttribute("data-current-ceremony", "sangeet");
      // Native smooth navigation can finish on an adjacent rounded CSS pixel.
      await expect.poll(async () => Math.abs(await canvas.evaluate(node => node.scrollTop) - position)).toBeLessThanOrEqual(2);
    }
    const artworkSize = await events.locator('[data-ceremony="sangeet"] [data-event-image]').evaluate(node => node.getBoundingClientRect().height);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => events.locator("[data-event-stage]").evaluate(node => node.getBoundingClientRect().height)).toBe(844);
    expect(await events.locator('[data-ceremony="sangeet"] [data-event-image]').evaluate(node => node.getBoundingClientRect().height)).toBeCloseTo(artworkSize, 0);
    await scrollToSection(canvas, "date");
    const date = canvas.locator('[data-section="date"]');
    await date.evaluate(node => {
      const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
      canvas.scrollTop += parseFloat((node as HTMLElement).style.getPropertyValue("--scene-height"));
      node.setAttribute("data-party-count", "0");
      new MutationObserver(records => {
        for (const record of records) for (const added of record.addedNodes)
          if (added instanceof HTMLElement && added.matches('[data-testid="date-confetti"]'))
            node.setAttribute("data-party-count", String(Number(node.getAttribute("data-party-count")) + 1));
      }).observe(node, { subtree: true, childList: true });
    });
    await expect(date).toHaveAttribute("data-date-state", "settled");
    await expect(date.getByTestId("date-confetti")).toHaveCount(0);
    const datePosition = await canvas.evaluate(node => node.scrollTop);
    const count = await date.getAttribute("data-party-count");
    for (const height of [760, 844, 780, 760]) {
      await page.setViewportSize({ width: 390, height });
      await expect.poll(() => date.locator("[data-date-sticky]").evaluate(node => node.getBoundingClientRect().height)).toBe(height);
      expect(await canvas.evaluate(node => node.scrollTop)).toBeCloseTo(datePosition, 0);
      await expect(date).toHaveAttribute("data-date-state", "settled");
      await expect(date).toHaveAttribute("data-party-count", count!);
    }
    // A keyboard must not become a new scene baseline.
    await scrollToSection(canvas, "rsvp");
    const name = canvas.getByLabel("Your name", { exact: true });
    await name.fill("Mobile Guest");
    await page.setViewportSize({ width: 390, height: 400 });
    await expect(canvas).toHaveCSS("--royal-visual-height", "760px");
    await name.scrollIntoViewIfNeeded();
    await expect(name).toBeFocused();
    await name.blur();
    await page.setViewportSize({ width: 390, height: 760 });
    await expect(canvas).toHaveCSS("--royal-visual-height", "760px");
    await page.setViewportSize({ width: 760, height: 390 });
    await expect.poll(() => canvas.evaluate(node => parseFloat((node as HTMLElement).style.getPropertyValue("--royal-layout-height")))).toBe(390);
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});

test("embedded preview resizing updates both scene heights and retains the ceremony", async ({ page }) => {
  await page.goto("/admin/templates/royal-wedding/preview");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  const events = canvas.locator('[data-section="events"]');
  await events.getByRole("button", { name: "Go to Sangeet" }).focus();
  await page.keyboard.press("Enter");
  await expect(events.locator('[data-ceremony="sangeet"] h3')).toBeFocused();
  await canvas.evaluate(node => { node.parentElement!.style.height = "680px"; });
  await expect.poll(() => canvas.evaluate(node => node.clientHeight)).toBe(680);
  await expect(canvas).toHaveCSS("--royal-layout-height", "680px");
  await expect(events).toHaveAttribute("data-current-ceremony", "sangeet");
  await expect.poll(() => events.locator("[data-event-stage]").evaluate(node => node.getBoundingClientRect().height)).toBe(680);
});
