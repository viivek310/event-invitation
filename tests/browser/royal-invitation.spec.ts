import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const url = "/admin/templates/royal-wedding/preview";
test("date typography remains readable within the small full-page preview", async ({ page }, info) => {
  await page.setViewportSize({ width: 467, height: 599 });
  await page.goto("/preview/royal-wedding");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  const panel = canvas.getByTestId("wedding-date-panel");
  await panel.getByRole("button", { name: "Show wedding date" }).click();
  await expect(panel).toHaveAttribute("data-date-state", "settled");
  const sticky = panel.locator("[class*='dateSticky']");
  const bounds = (await sticky.boundingBox())!;
  for (const detail of await sticky.locator("h2, [class*='dateLocation'] p, [class*='countdown'] strong, [class*='countdown'] span").all()) {
    const box = (await detail.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(bounds.y);
    expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height);
  }
  await canvas.screenshot({ path: info.outputPath("date-typography-467.png") });
});
test("Ganeshji handoff has no visible-to-hidden flash, sideways jump, or scroll movement", async ({
  page,
}) => {
  await page.goto("/preview/royal-wedding");
  const stage = page.locator("[data-royal-scroll]");
  await expect(stage).toHaveAttribute("data-phase", "ready");
  const frames = await stage.evaluate(async (element) => {
    const root = element as HTMLElement;
    const folio = root.querySelector<HTMLElement>(
      '[data-section="invitation"] > div',
    )!;
    const backdrop = root.querySelector<HTMLElement>("[data-palace-backdrop]")!;
    const header = root.querySelector<HTMLElement>(
      '[data-testid="royal-invitation-header"]',
    )!;
    const frames: {
      folio: number;
      backdrop: number;
      headerX: number;
      scroll: number;
    }[] = [];
    let started = 0;
    return await new Promise<typeof frames>((resolve) => {
      function sample(time: number) {
        if (root.dataset.phase === "complete") {
          started ||= time;
          frames.push({
            folio: Number(getComputedStyle(folio).opacity),
            backdrop: Number(getComputedStyle(backdrop).opacity),
            headerX: header.getBoundingClientRect().x,
            scroll: root.scrollTop,
          });
          if (time - started > 1900) {
            resolve(frames);
            return;
          }
        }
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
      [...root.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.getAttribute("aria-label") === "Open invitation")!
        .click();
    });
  });
  expect(frames.length).toBeGreaterThan(10);
  expect(frames[0].folio).toBeLessThan(0.1);
  expect(frames.at(-1)!.folio).toBeGreaterThan(0.99);
  expect(frames.at(-1)!.backdrop).toBeGreaterThan(0.99);
  for (let i = 1; i < frames.length; i++) {
    expect(frames[i].folio + 0.01).toBeGreaterThanOrEqual(frames[i - 1].folio);
    expect(frames[i].backdrop + 0.01).toBeGreaterThanOrEqual(
      frames[i - 1].backdrop,
    );
    expect(Math.abs(frames[i].headerX - frames[0].headerX)).toBeLessThan(1);
    expect(frames[i].scroll).toBe(0);
  }
});
test("dedicated preview fills the viewport and keeps both names visible without admin chrome", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 588, height: 615 });
  await page.goto("/preview/royal-wedding");
  const stage = page.locator("[data-royal-scroll]");
  await stage.getByRole("button", { name: "Skip introduction" }).click();
  const names = stage.locator("[data-name]");
  await expect(names).toHaveCount(2);
  for (const name of await names.all())
    await expect(name).toHaveCSS("opacity", "1");
  const frame = (await stage.boundingBox())!;
  const heading = (await stage.locator("h1").boundingBox())!;
  expect(frame.width).toBe(588);
  expect(frame.height).toBe(615);
  expect(heading.y + heading.height).toBeLessThan(frame.y + frame.height);
  await expect(
    page.getByRole("navigation", { name: "Admin navigation" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "Review RSVP layout" }),
  ).toHaveCount(0);
  const rsvp = stage.locator('[data-section="rsvp"]');
  await expect(rsvp).toHaveCount(1);
  await expect(rsvp.getByRole("button")).toBeDisabled();
  await stage.screenshot({ path: testInfo.outputPath("full-page-588.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await stage.screenshot({ path: testInfo.outputPath("full-page-mobile.png") });
});
async function openInvitation(page: Page) {
  await page.goto(url);
  const stage = page.locator("[data-royal-scroll]");
  await stage.getByRole("button", { name: "Skip introduction" }).click();
  await expect(stage).toHaveAttribute("data-phase", "complete");
  return stage;
}

test("palace scenes have ordered content and RSVP remains a private disabled review", async ({
  page,
}, testInfo) => {
  const stage = await openInvitation(page);
  const body = stage.getByTestId("royal-body");
  expect(
    await body
      .locator("[data-section]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-section")),
      ),
  ).toEqual(["invitation", "date", "events", "rsvp", "invitee"]);
  await expect(
    body.getByRole("heading", { name: "Aarav & Meera" }),
  ).toBeVisible();
  await expect(body.getByRole("heading", { name: "Aarav & Meera" })).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(body.locator("article")).toHaveCount(6);
  expect(
    await stage
      .locator("[data-palace-backdrop]")
      .evaluate((node) => getComputedStyle(node).backgroundImage),
  ).toContain("hero.webp");
  await stage.screenshot({
    path: testInfo.outputPath("desktop-palace-invitation.png"),
  });
  const rsvp = body.locator('[data-section="rsvp"]');
  for (const field of await rsvp
    .locator("input, select, textarea, button")
    .all())
    await expect(field).toBeDisabled();
  await page.getByRole("checkbox", { name: "Review RSVP layout" }).uncheck();
  await expect(body.locator('[data-section="rsvp"]')).toHaveCount(0);
  await expect(body.locator("input, select, textarea")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Review RSVP layout" }).check();
  await expect(rsvp).toHaveCount(1);
});

test("scroll rolls the correct date, reverses the wheels, and celebrates only once", async ({
  page,
}, testInfo) => {
  const stage = await openInvitation(page);
  const panel = stage.getByTestId("wedding-date-panel");
  await expect(panel).toHaveAttribute("data-compact", "false");
  await panel.evaluate((node) => {
    node.setAttribute("data-test-celebrations", "0");
    new MutationObserver((records) => {
      for (const record of records)
        for (const added of record.addedNodes)
          if (
            added instanceof HTMLElement &&
            added.querySelector("[data-particle]")
          )
            node.setAttribute(
              "data-test-celebrations",
              String(Number(node.getAttribute("data-test-celebrations")) + 1),
            );
    }).observe(node, { childList: true, subtree: true });
  });
  async function scrollDate(fraction: number) {
    await panel.evaluate((node, fraction) => {
      const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
      const start =
        node.getBoundingClientRect().top -
        canvas.getBoundingClientRect().top +
        canvas.scrollTop;
      canvas.scrollTop = start + canvas.clientHeight * fraction;
    }, fraction);
  }
  await scrollDate(0.25);
  await expect(panel).toHaveAttribute("data-date-state", "rolling");
  await scrollDate(1);
  await expect(panel).toHaveAttribute("data-date-state", "settled");
  const values = await panel
    .locator("[data-wheel-track]")
    .evaluateAll((tracks) =>
      tracks.map((track) => track.lastElementChild?.textContent),
    );
  expect(values).toEqual(["21", "Feb", "2027"]);
  await expect(panel).toHaveAttribute("data-test-celebrations", "1");
  await expect(panel.getByTestId("date-confetti")).toHaveCount(0);
  // After the wheels finish, the scene stays pinned for reading the details.
  const pinnedTop = await panel
    .locator("[class*='dateSticky']")
    .evaluate((node) => node.getBoundingClientRect().top);
  await scrollDate(2);
  await expect(panel).toHaveAttribute("data-date-state", "settled");
  const heldTop = await panel
    .locator("[class*='dateSticky']")
    .evaluate((node) => node.getBoundingClientRect().top);
  expect(Math.abs(heldTop - pinnedTop)).toBeLessThan(2);
  expect(
    await panel.evaluate(
      (node) =>
        node.clientHeight /
        node.closest<HTMLElement>("[data-royal-scroll]")!.clientHeight,
    ),
  ).toBeCloseTo(3.4, 1);
  await stage.screenshot({
    path: testInfo.outputPath("desktop-rolling-date-settled.png"),
  });
  await scrollDate(0.1);
  await expect(panel).toHaveAttribute("data-date-state", "rolling");
  await scrollDate(1);
  await expect(panel).toHaveAttribute("data-date-state", "settled");
  await expect(panel).toHaveAttribute("data-test-celebrations", "1");
});

test("date keyboard shortcut settles the wheels and replay resets the experience", async ({
  page,
}) => {
  const stage = await openInvitation(page);
  const panel = stage.getByTestId("wedding-date-panel");
  const button = panel.getByRole("button", { name: "Show wedding date" });
  await button.scrollIntoViewIfNeeded();
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(panel).toHaveAttribute("data-date-state", "settled");
  await expect(
    panel.getByRole("heading", {
      name: /Save the Date.*Sunday, 21 February 2027/,
    }),
  ).toBeFocused();
  expect(
    await panel
      .locator("[data-wheel-track]")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent)),
  ).toEqual(["21", "Feb", "2027"]);
  await page.getByRole("button", { name: "Replay" }).click();
  await stage.getByRole("button", { name: "Skip introduction" }).click();
  await expect(panel).toHaveAttribute("data-date-state", "rolling");
  expect(await stage.evaluate((node) => node.scrollTop)).toBe(0);
});

test("short preview animates the wheels and keeps countdown hidden until settlement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 588, height: 615 });
  const stage = await openInvitation(page);
  const panel = stage.getByTestId("wedding-date-panel");
  await expect(panel).toHaveAttribute("data-date-mode", "auto");
  await expect(panel.locator("[data-date-details]")).toBeHidden();
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toHaveAttribute("data-date-state", "settled");
  await expect(panel.locator("[data-date-details]")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(panel.locator("[data-date-details]")).toHaveCSS("opacity", "1");
});

test("reduced motion and short canvases show an unpinned date without particles", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const stage = await openInvitation(page);
  const panel = stage.getByTestId("wedding-date-panel");
  await expect(panel).toHaveAttribute("data-compact", "true");
  await expect(panel).toHaveAttribute("data-date-state", "settled");
  await expect(panel.getByTestId("date-confetti")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 640 });
  await expect(panel).toHaveAttribute("data-compact", "true");
  const size = await panel.evaluate((node) => ({
    scene: node.clientHeight,
    canvas: node.closest<HTMLElement>("[data-royal-scroll]")!.clientHeight,
  }));
  expect(size.canvas).toBeLessThan(520);
  expect(size.scene).toBeLessThan(size.canvas * 1.5);
});

test("mobile imagery, ceremony navigation, and family folio fit and remain readable", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const stage = await openInvitation(page);
  await expect(stage.locator('[data-section="invitation"] h1')).toHaveCSS(
    "opacity",
    "1",
  );
  await stage.screenshot({
    path: testInfo.outputPath("mobile-palace-invitation.png"),
  });
  const nav = stage.getByRole("navigation", { name: "Wedding ceremonies" });
  await nav.getByRole("button", { name: /Wedding/ }).focus();
  await page.keyboard.press("Enter");
  const wedding = stage.locator('[data-ceremony="wedding"]');
  await expect(
    wedding.getByRole("heading", { name: "The Wedding" }),
  ).toBeFocused();
  await expect(wedding.getByRole("heading", { name: "The Wedding" })).toHaveCSS(
    "opacity",
    "1",
  );
  const festivities = stage.locator('[data-section="events"]');
  await expect(festivities).toHaveAttribute("data-events-pinned", "true");
  await expect(festivities).toHaveAttribute("data-current-ceremony", "wedding");
  const titleBounds = (await wedding.getByRole("heading").boundingBox())!;
  const canvasBounds = (await stage.boundingBox())!;
  expect(titleBounds.y).toBeGreaterThanOrEqual(canvasBounds.y);
  expect(titleBounds.y + titleBounds.height).toBeLessThan(
    canvasBounds.y + canvasBounds.height,
  );
  await stage.screenshot({
    path: testInfo.outputPath("mobile-wedding-scene.png"),
  });
  const closing = stage.locator('[data-section="invitee"]');
  await closing.scrollIntoViewIfNeeded();
  await expect(closing.getByRole("heading")).toHaveCSS("opacity", "1");
  await stage.screenshot({
    path: testInfo.outputPath("mobile-family-folio.png"),
  });
  expect(
    await stage.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("failed artwork retains invitation text and navigable ceremony details", async ({
  page,
}) => {
  await page.route("**/palace/*.webp", (route) => route.abort());
  const stage = await openInvitation(page);
  await expect(stage.getByRole("heading", { name: "Aarav & Meera" })).toHaveCSS(
    "opacity",
    "1",
  );
  await stage
    .getByRole("navigation", { name: "Wedding ceremonies" })
    .getByRole("button", { name: /Mehendi/ })
    .click();
  const ceremony = stage.locator('[data-ceremony="mehendi"]');
  await expect(
    ceremony.getByRole("heading", { name: "Mehendi" }),
  ).toBeVisible();
  await expect(ceremony.getByRole("link")).toHaveAttribute(
    "href",
    /google.com\/maps/,
  );
});

test("countdown stops at zero after the explicit India wedding timestamp", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2027-02-22T00:00:00Z") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const stage = await openInvitation(page);
  await expect(
    stage.getByText("The celebration has begun", { exact: true }),
  ).toHaveCount(1);
});

test("resizing and leaving a rolling date cleans animations without page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const stage = await openInvitation(page);
  const panel = stage.getByTestId("wedding-date-panel");
  await panel.getByRole("button", { name: "Show wedding date" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(panel.getByTestId("date-confetti")).toHaveCount(0);
  await page.setViewportSize({ width: 600, height: 900 });
  await expect(panel).toHaveAttribute("data-date-state", "settled");
  await page.getByRole("link", { name: "Royal Wedding details" }).click();
  await expect(stage).toHaveCount(0);
  expect(errors).toEqual([]);
});
