import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { royalEvents as motion } from "../../src/templates/royal-wedding/design";

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page), "Event interactions must not throw browser runtime errors").toEqual([]);
});

async function scrollTime(canvas: Locator, time: number) {
  return canvas.evaluate((element, time) => {
    const section = element.querySelector<HTMLElement>('[data-section="events"]')!;
    const height = parseFloat(section.style.getPropertyValue("--event-height"));
    const start = element.scrollTop + section.getBoundingClientRect().top - element.getBoundingClientRect().top;
    const top = start + time * height;
    element.scrollTo({ top, behavior: "instant" });
    return { top, start, height };
  }, time);
}

test("canceling after a snap refresh and during cleanup handles a cleared tween", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/royal-wedding");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  const events = canvas.locator('[data-section="events"]');
  await expect(events).toHaveAttribute("data-events-pinned", "true");
  await page.waitForTimeout(1000);
  const { top } = await scrollTime(canvas, motion.holdScreens + .1);
  await expect.poll(() => canvas.evaluate(node => node.scrollTop)).toBeGreaterThan(top + 2);
  await events.locator('[data-event-heading]').evaluate(node => { (node as HTMLElement).style.paddingBottom = "1px"; });
  await page.waitForTimeout(800);
  await page.mouse.move(180, 400);
  await page.mouse.wheel(0, 12);
  await page.setViewportSize({ width: 588, height: 615 });
  await expect(events).toHaveAttribute("data-events-pinned", "true");
  await events.getByRole("button", { name: "Go to Haldi" }).focus();
  await page.keyboard.press("Enter");
  await expect(events.locator('[data-ceremony="haldi"] h3')).toBeFocused();
  await page.goto("/templates");
});

test("new input cancels a running snap and Explore can leave events", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/royal-wedding");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  await expect(canvas.locator('[data-section="events"]')).toHaveAttribute("data-events-pinned", "true");
  await page.waitForTimeout(1200);
  const { top } = await scrollTime(canvas, motion.holdScreens + motion.transitionScreens * .45);
  await expect.poll(() => canvas.evaluate(node => node.scrollTop)).toBeGreaterThan(top + 2);
  await canvas.dispatchEvent("pointerdown", { pointerId: 9, pointerType: "touch" });
  const interrupted = await canvas.evaluate(node => node.scrollTop);
  await page.waitForTimeout(800);
  expect(await canvas.evaluate(node => node.scrollTop)).toBe(interrupted);
  await canvas.dispatchEvent("pointerup", { pointerId: 9, pointerType: "touch", bubbles: true });
  await canvas.getByRole("button", { name: "Explore", exact: true }).click();
  await canvas.getByRole("navigation", { name: "Explore invitation" }).getByRole("button", { name: "RSVP" }).click();
  await expect(canvas.getByRole("heading", { name: "Kindly RSVP" })).toBeFocused();
  const destination = await canvas.evaluate(node => node.scrollTop);
  await page.waitForTimeout(1200);
  expect(await canvas.evaluate(node => node.scrollTop)).toBe(destination);
});

test("late image loads and layout refreshes never flash Welcome after a ceremony settles", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/royal-wedding");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  const events = canvas.locator('[data-section="events"]');
  await events.getByRole("button", { name: "Go to Sangeet" }).focus();
  await page.keyboard.press("Enter");
  await expect(events.locator('[data-ceremony="sangeet"] h3')).toBeFocused();
  await page.waitForTimeout(800);
  const frames = await events.evaluate(async section => {
    const panel = section.querySelector<HTMLElement>('[data-ceremony="sangeet"]')!;
    const image = panel.querySelector<HTMLElement>('[data-event-image]')!;
    const heading = section.querySelector<HTMLElement>('[data-event-heading]')!;
    const samples: { selected: string | undefined; opacity: number; x: number }[] = [];
    const began = performance.now();
    section.querySelectorAll("img").forEach(img => img.dispatchEvent(new Event("load")));
    // Trigger a real measurement refresh as well as unchanged image-load measurements.
    heading.style.paddingBottom = "1px";
    await new Promise<void>(resolve => {
      function sample(now: number) {
        samples.push({ selected: (section as HTMLElement).dataset.currentCeremony,
          opacity: Number(getComputedStyle(panel).opacity), x: new DOMMatrix(getComputedStyle(image).transform).m41 });
        if (now - began < 1600) requestAnimationFrame(sample);
        else resolve();
      }
      requestAnimationFrame(sample);
    });
    return samples;
  });
  expect(frames.length).toBeGreaterThan(10);
  expect(frames.every(frame => frame.selected === "sangeet" && frame.opacity > .99 && Math.abs(frame.x) < 1)).toBe(true);
});

test("continued wheel input is never accelerated by snapping", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/royal-wedding");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  await expect(canvas.locator('[data-section="events"]')).toHaveAttribute("data-events-pinned", "true");
  await page.waitForTimeout(1000);
  const { start, height } = await scrollTime(canvas, motion.holdScreens - .05);
  await page.waitForTimeout(400);
  await page.mouse.move(180, 400);
  for (let i = 0; i < 16; i++) {
    const before = await canvas.evaluate(node => node.scrollTop);
    await page.mouse.wheel(0, 12);
    await expect.poll(() => canvas.evaluate(node => node.scrollTop)).toBeGreaterThanOrEqual(before + 10);
    expect(await canvas.evaluate(node => node.scrollTop)).toBeLessThanOrEqual(before + 14);
    await page.waitForTimeout(60);
  }
  const next = start + height * (motion.holdScreens + motion.transitionScreens);
  await expect.poll(async () => Math.abs(await canvas.evaluate(node => node.scrollTop) - next), { timeout: 5000 }).toBeLessThanOrEqual(2);
  // Reverse gently into the transition: it must return to the previous ceremony,
  // rather than finishing the forward snap or performing a second fast jump.
  for (let i = 0; i < 8; i++) {
    const before = await canvas.evaluate(node => node.scrollTop);
    await page.mouse.wheel(0, -12);
    await expect.poll(() => canvas.evaluate(node => node.scrollTop)).toBeLessThanOrEqual(before - 10);
    expect(await canvas.evaluate(node => node.scrollTop)).toBeGreaterThanOrEqual(before - 14);
    await page.waitForTimeout(60);
  }
  const previous = start + height * motion.holdScreens;
  await expect.poll(async () => Math.abs(await canvas.evaluate(node => node.scrollTop) - previous), { timeout: 5000 }).toBeLessThanOrEqual(2);
});

test("reversing wheel input during a snap does not produce a second forward jump", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/royal-wedding");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  await expect(canvas.locator('[data-section="events"]')).toHaveAttribute("data-events-pinned", "true");
  await page.waitForTimeout(1000);
  await page.mouse.move(180, 400);
  const { top, start, height } = await scrollTime(canvas, motion.holdScreens + motion.transitionScreens * .25);
  await expect.poll(() => canvas.evaluate(node => node.scrollTop)).toBeGreaterThan(top + 2);
  const trace = canvas.evaluate(async node => {
    const positions: number[] = [];
    const start = performance.now();
    await new Promise<void>(resolve => {
      function frame(now: number) {
        positions.push(node.scrollTop);
        if (now - start < 1800) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
    return positions;
  });
  await page.mouse.wheel(0, -24);
  const positions = await trace;
  const reversed = positions.findIndex((value, index) => index > 0 && value < positions[index - 1] - 2);
  expect(reversed).toBeGreaterThan(0);
  for (let i = reversed + 1; i < positions.length; i++) expect(positions[i] - positions[i - 1]).toBeLessThanOrEqual(2);
  const previous = start + height * motion.holdScreens;
  await expect.poll(async () => Math.abs(await canvas.evaluate(node => node.scrollTop) - previous), { timeout: 5000 }).toBeLessThanOrEqual(2);
});

for (const size of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }, { width: 588, height: 615 }]) {
  test(`transitions follow scroll direction without moving reading holds at ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/preview/royal-wedding");
    const canvas = page.locator("[data-royal-scroll]");
    await canvas.getByRole("button", { name: "Skip introduction" }).click();
    const events = canvas.locator('[data-section="events"]');
    await expect(events).toHaveAttribute("data-events-pinned", "true");
    await expect(events.getByRole("heading", { level: 2 })).toHaveText("The Celebrations");
    await page.waitForTimeout(1200);
    const focus = await page.evaluate(() => document.activeElement?.tagName);
    for (const index of [1, 2, 3, 4, 5]) {
      const departure = (index - 1) * (motion.holdScreens + motion.transitionScreens) + motion.holdScreens;
      for (const fraction of [.25, .75]) {
        const forward = fraction === .25;
        await scrollTime(canvas, forward ? departure - .15 : departure + motion.transitionScreens + .15);
        await page.waitForTimeout(100);
        const { start, height } = await scrollTime(canvas, departure + motion.transitionScreens * fraction);
        const target = start + height * (departure + (forward ? motion.transitionScreens : 0));
        await expect.poll(async () => Math.abs(await canvas.evaluate(node => node.scrollTop) - target), { timeout: 4000 }).toBeLessThanOrEqual(2);
        await page.waitForTimeout(400);
        expect(Math.abs(await canvas.evaluate(node => node.scrollTop) - target)).toBeLessThanOrEqual(2);
      }
    }
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(focus);
    for (const time of [.3, 2.7, 6.9, 7.3]) {
      const { top } = await scrollTime(canvas, time);
      await page.waitForTimeout(1000);
      expect(Math.abs(await canvas.evaluate(node => node.scrollTop) - top)).toBeLessThanOrEqual(2);
    }
    // A held touch/pointer must prevent an automatic settle.
    await canvas.dispatchEvent("pointerdown", { pointerId: 7, pointerType: "touch" });
    const { top } = await scrollTime(canvas, motion.holdScreens + .2);
    await page.waitForTimeout(900);
    expect(Math.abs(await canvas.evaluate(node => node.scrollTop) - top)).toBeLessThanOrEqual(2);
    await canvas.dispatchEvent("pointerup", { pointerId: 7, pointerType: "touch", bubbles: true });
    await page.waitForTimeout(1100);
    expect(Math.abs(await canvas.evaluate(node => node.scrollTop) - top)).toBeGreaterThan(10);
  });
}
