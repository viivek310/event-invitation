import { test, expect } from "@playwright/test";
import { royalWeddingDemo } from "../../src/templates/royal-wedding/content";

for (const viewport of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }, { width: 588, height: 615 }, { width: 390, height: 460 }]) {
  test(`date reveal preserves card bounds and cue spacing at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.goto("/templates/royal-wedding?canvas=1");
    const canvas = page.locator("[data-royal-scroll]");
    await canvas.getByRole("button", { name: "Skip introduction" }).click();
    const panel = canvas.getByTestId("wedding-date-panel");
    await expect(panel).not.toHaveAttribute("data-date-mode", "pending");
    if (viewport.height >= 615) await expect(panel).toHaveAttribute("data-date-mode", "scroll");
    await expect(panel.getByRole("button")).toHaveCount(0);
    await expect(panel.locator('[class*="dateLocation"] p')).toHaveCount(1);
    await expect(panel.getByText(royalWeddingDemo.venue, { exact: true })).toHaveCount(0);
    const frames = await panel.evaluate(node => {
      const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
      const card = node.querySelector<HTMLElement>("[data-date-card]")!;
      const sticky = node.querySelector<HTMLElement>("[data-date-sticky]")!;
      const samples: { top: number; width: number; height: number }[] = [];
      const sample = () => {
        const bounds = card.getBoundingClientRect();
        samples.push({ top: bounds.top - sticky.getBoundingClientRect().top, width: bounds.width, height: bounds.height });
      };
      sample();
      const start = canvas.scrollTop + node.getBoundingClientRect().top - canvas.getBoundingClientRect().top;
      canvas.scrollTop = start + ((node as HTMLElement).dataset.dateMode === "scroll" ? parseFloat((node as HTMLElement).style.getPropertyValue("--scene-height")) : 0);
      return new Promise<typeof samples>(resolve => {
        const started = performance.now();
        let settledAt = 0;
        function tick(now: number) {
          sample();
          if ((node as HTMLElement).dataset.dateState === "settled") settledAt ||= now;
          if ((settledAt && now - settledAt > 1000) || now - started > 8000) resolve(samples);
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    });
    await expect(panel).toHaveAttribute("data-date-state", "settled");
    expect(frames.length).toBeGreaterThan(10);
    for (const key of ["top", "width", "height"] as const) {
      const values = frames.map(frame => frame[key]);
      expect(Math.max(...values) - Math.min(...values), key).toBeLessThanOrEqual(2);
    }
    const gap = await panel.evaluate(node => node.querySelector("[data-scroll-cue]")!.getBoundingClientRect().top - node.querySelector("[data-date-card]")!.getBoundingClientRect().bottom);
    expect(gap).toBeCloseTo(viewport.width <= 600 ? 24 : 32, 0);
    const clipped = await panel.evaluate(node => {
      const sticky = node.querySelector("[data-date-sticky]")!.getBoundingClientRect();
      return [...node.querySelectorAll("[data-date-card], [data-scroll-cue]")].some(child => {
        const box = child.getBoundingClientRect();
        return box.top < sticky.top - 1 || box.bottom > sticky.bottom + 1;
      });
    });
    expect(clipped).toBe(false);
    if (viewport.height >= 615) {
      const before = await panel.locator("[data-date-sticky]").evaluate(node => node.getBoundingClientRect().top);
      await panel.evaluate(node => {
        const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
        canvas.scrollTop += parseFloat((node as HTMLElement).style.getPropertyValue("--scene-height")) * 1.5;
      });
      await expect(panel).toHaveAttribute("data-date-state", "settled");
      const after = await panel.locator("[data-date-sticky]").evaluate(node => node.getBoundingClientRect().top);
      expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
    }
    await canvas.screenshot({ path: info.outputPath(`date-${viewport.width}x${viewport.height}.png`) });
  });
}

test("countdown completion retains its reserved height", async ({ page }) => {
  const startsAt = new Date(royalWeddingDemo.weddingStartsAt).getTime();
  await page.clock.install({ time: new Date(startsAt - 60000) });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/royal-wedding");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  const countdown = canvas.getByLabel("Time until the wedding");
  await countdown.scrollIntoViewIfNeeded();
  const initial = await countdown.evaluate(node => node.getBoundingClientRect().height);
  await page.clock.fastForward(61000);
  await expect(countdown.getByText("The celebration has begun")).toBeVisible();
  expect(await countdown.evaluate(node => node.getBoundingClientRect().height)).toBeCloseTo(initial, 0);
});
