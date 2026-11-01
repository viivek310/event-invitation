import { test, expect } from "@playwright/test";

const url = "/admin/templates/royal-wedding/preview";
const stageSelector = '[aria-label="Royal Wedding opening animation"]';

for (const viewport of [
  { width: 1440, height: 1050 },
  { width: 390, height: 844 },
]) {
  test(`Ganeshji holds at the exact center before rising; glow disappears at the top (${viewport.width}px)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(url);
    const stage = page.locator(stageSelector);
    await expect(stage).toHaveAttribute("data-phase", "ready");
    // Sample each rendered frame in Chrome, avoiding round-trip polling that
    // can miss the short center hold on a busy development machine.
    const recording = await stage.evaluate(async (element) => {
      const root = element as HTMLElement;
      const image = root.querySelector<HTMLImageElement>(
        'img[alt="Lord Ganesha"]',
      )!;
      const samples: { time: number; dx: number; dy: number }[] = [];
      const steps: string[] = [];
      let scrolled = false;
      return await new Promise<{ samples: typeof samples; steps: string[] }>(
        (resolve) => {
          const sample = () => {
            const step = root.dataset.ganeshStep!;
            if (steps.at(-1) !== step) steps.push(step);
            if (!scrolled && root.dataset.phase === "emerging") {
              window.scrollBy(0, 120);
              scrolled = true;
            }
            if (
              step === "center" &&
              getComputedStyle(image.parentElement!).opacity === "1"
            ) {
              const frame = root.getBoundingClientRect();
              const bounds = image.getBoundingClientRect();
              samples.push({
                time: performance.now(),
                dx: bounds.x + bounds.width / 2 - frame.x - frame.width / 2,
                dy: bounds.y + bounds.height / 2 - frame.y - frame.height / 2,
              });
            }
            if (root.dataset.phase === "complete") resolve({ samples, steps });
            else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
          [...root.querySelectorAll<HTMLButtonElement>("button")]
            .find((button) =>
              button.getAttribute("aria-label") === "Open invitation",
            )!
            .click();
        },
      );
    });
    expect(recording.steps).toContain("center");
    expect(recording.steps).toContain("rising");
    expect(recording.samples.length).toBeGreaterThan(1);
    expect(
      recording.samples.at(-1)!.time - recording.samples[0].time,
    ).toBeGreaterThan(300);
    for (const sample of recording.samples) {
      expect(Math.abs(sample.dx)).toBeLessThan(2);
      expect(Math.abs(sample.dy)).toBeLessThan(2);
    }
    const aura = stage.getByTestId("ganesh-aura");
    await expect(aura).toHaveCSS("border-top-width", "0px");
    await expect(aura.locator(":scope > *")).toHaveCount(0);
    await expect(stage).toHaveAttribute("data-phase", "complete");
    await expect(aura).toBeHidden();
    const frame = (await stage.boundingBox())!;
    const image = (await stage.getByAltText("Lord Ganesha").boundingBox())!;
    expect(image.y + image.height / 2).toBeLessThan(
      frame.y + frame.height * 0.25,
    );
    await stage.screenshot({
      path: testInfo.outputPath("header-without-aura.png"),
    });
  });
}

test("image envelope opens into a burgundy card and Ganeshji in sequence", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const stage = page.locator(stageSelector);
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await stage.screenshot({
    path: testInfo.outputPath("01-closed-envelope.png"),
  });
  await expect(stage).toHaveCSS("--royal-background", "#501B2B");
  await stage.getByRole("button", { name: "Open invitation" }).click();
  await expect(stage).toHaveAttribute("data-phase", "flap");
  await expect(
    stage.getByRole("button", { name: "Open invitation" }),
  ).toBeDisabled();
  await expect(stage).toHaveAttribute("data-phase", "emerging");
  await stage.screenshot({ path: testInfo.outputPath("02-card-emerging.png") });
  await expect(stage).toHaveAttribute("data-phase", "expanding");
  await expect(stage).toHaveAttribute("data-phase", "ganesh");
  await expect
    .poll(
      async () =>
        (await stage.getByAltText("Lord Ganesha").boundingBox())?.width ?? 0,
    )
    .toBeGreaterThan(200);
  await stage.screenshot({
    path: testInfo.outputPath("03-central-ganeshji.png"),
  });
  await expect(stage).toHaveAttribute("data-phase", "complete");
  await expect(stage).toHaveAttribute("aria-busy", "false");
  await expect(stage.getByAltText("Lord Ganesha")).toBeVisible();
  await expect(stage.locator('p[lang="gu"]')).toHaveText("॥ શ્રી ગણેશાય નમઃ ॥");
  await expect(stage.locator('p[lang="gu"] > span')).toHaveCount(5);
  for (const word of await stage.locator('p[lang="gu"] > span').all()) {
    await expect(word).toHaveCSS("opacity", "1");
    await expect(word).toHaveCSS("filter", "none");
  }
  await expect(
    stage.getByRole("button", { name: "Open invitation" }),
  ).toBeHidden();
  await stage.screenshot({
    path: testInfo.outputPath("04-ganeshji-header.png"),
  });
  expect(errors).toEqual([]);
});

test("Gujarati blessing uses a loaded local font and whole-word glyph groups", async ({
  page,
}) => {
  const externalFonts: string[] = [];
  page.on("request", (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url()))
      externalFonts.push(request.url());
  });
  await page.goto(url);
  const stage = page.locator(stageSelector);
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await stage.getByRole("button", { name: "Skip introduction" }).click();
  const blessing = stage.locator('p[lang="gu"]');
  await expect(blessing).toHaveText("॥ શ્રી ગણેશાય નમઃ ॥");
  await expect(blessing.locator("span")).toHaveText(
    ["॥ ", "શ્રી ", "ગણેશાય ", "નમઃ ", "॥"],
    { useInnerText: false },
  );
  expect(
    await blessing.evaluate((node) => {
      const style = getComputedStyle(node);
      const family = style.fontFamily.split(",")[0].trim().replaceAll('"', "");
      return (
        [...document.fonts].some(
          (face) =>
            face.family.replaceAll('"', "") === family &&
            face.status === "loaded",
        ) &&
        document.fonts.check(
          `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
          node.textContent ?? "",
        )
      );
    }),
  ).toBe(true);
  expect(externalFonts).toEqual([]);
});

test("the final header is normal flow and following content scrolls naturally", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  const stage = page.locator(stageSelector);
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await stage.getByRole("button", { name: "Skip introduction" }).click();
  await expect(stage).toHaveAttribute("data-phase", "complete");
  const header = stage.getByTestId("royal-invitation-header");
  const slot = stage.getByTestId("royal-invitation-content");
  const headerBox = (await header.boundingBox())!;
  const imageBox = (await stage.getByAltText("Lord Ganesha").boundingBox())!;
  expect(headerBox.height).toBeLessThan(240);
  expect(imageBox.width).toBeLessThanOrEqual(100);
  expect(await header.evaluate((node) => getComputedStyle(node).position)).toBe(
    "relative",
  );
  await stage.screenshot({
    path: testInfo.outputPath("mobile-gujarati-header.png"),
  });
  await expect(slot.locator('[data-section="invitation"] h1')).toContainText(
    "Aarav",
  );
  // Screenshot capture can scroll the outer admin page. Compare both elements
  // in the same viewport after screenshot capture.
  const stableHeaderBox = (await header.boundingBox())!;
  const slotBox = (await slot.boundingBox())!;
  expect(
    Math.abs(slotBox.y - (stableHeaderBox.y + stableHeaderBox.height)),
  ).toBeLessThan(2);
  await stage.evaluate((node) => {
    node.scrollTop = 150;
  });
  await expect
    .poll(async () => (await header.boundingBox())!.y)
    .toBeCloseTo(stableHeaderBox.y - 150, 0);
  expect(await stage.evaluate((node) => node.scrollTop)).toBe(150);
});

test("skip cancels an active sequence, and replay starts cleanly", async ({
  page,
}) => {
  await page.goto(url);
  const stage = page.locator(stageSelector);
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await stage.getByRole("button", { name: "Open invitation" }).click();
  await expect(stage).toHaveAttribute("data-phase", "emerging");
  await stage.getByRole("button", { name: "Skip introduction" }).click();
  await expect(stage).toHaveAttribute("data-phase", "complete");
  await page.getByRole("button", { name: "Replay" }).click();
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await stage.getByRole("button", { name: "Skip introduction" }).click();
  await expect(stage).toHaveAttribute("data-phase", "complete");
});

test("reduced motion skips large movements and works with the keyboard", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  const stage = page.locator(stageSelector);
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await stage.getByRole("button", { name: "Open invitation" }).focus();
  await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-phase", "complete", {
    timeout: 1000,
  });
  await expect(stage.locator("p[tabindex='-1']")).toBeFocused();
});

test("mobile layer alignment and resize do not strand the animation", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  const stage = page.locator(stageSelector);
  await expect(stage).toHaveAttribute("data-phase", "ready");
  const [flap, pocket] = await Promise.all([
    stage.locator('img[src$="envelope-flap-burgundy-v1.png"]').boundingBox(),
    stage.locator('img[src$="envelope-pocket-burgundy-v1.png"]').boundingBox(),
  ]);
  expect(flap).not.toBeNull();
  expect(pocket).not.toBeNull();
  expect(flap!.x).toBeCloseTo(pocket!.x, 1);
  expect(flap!.y).toBeCloseTo(pocket!.y, 1);
  expect(flap!.height).toBeCloseTo(pocket!.height, 1);
  expect(flap!.width).toBeCloseTo(pocket!.width, 1);
  const seal = stage.getByRole("button", { name: "Open invitation" });
  const sealBox = (await seal.boundingBox())!;
  expect(sealBox.width).toBeGreaterThanOrEqual(44);
  expect(sealBox.height).toBeGreaterThanOrEqual(44);
  expect(sealBox.x + sealBox.width / 2).toBeCloseTo(flap!.x + flap!.width / 2, 0);
  expect(sealBox.y + sealBox.height / 2).toBeCloseTo(flap!.y + flap!.height * 0.515, 0);
  await expect(stage.getByText("Tap the seal to open your invitation", { exact: true })).toBeVisible();
  await stage.screenshot({ path: testInfo.outputPath("mobile-envelope.png") });
  await stage.getByRole("button", { name: "Open invitation" }).click();
  await expect(stage).toHaveAttribute("data-phase", "emerging");
  await page.setViewportSize({ width: 560, height: 900 });
  await expect(stage).toHaveAttribute("data-phase", "complete");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("image failure allows retry and a readable fallback", async ({ page }) => {
  await page.route("**/ganeshji.png", (route) => route.abort());
  await page.goto(url);
  const stage = page.locator(stageSelector);
  await expect(stage).toHaveAttribute("data-phase", "error");
  await expect(stage.getByRole("alert")).toBeVisible();
  await stage
    .getByRole("button", { name: "Continue without animation" })
    .click();
  await expect(stage).toHaveAttribute("data-phase", "complete");
  await expect(stage.getByText("Ganesha", { exact: true })).toBeVisible();
  await page.unroute("**/ganeshji.png");
  await page.getByRole("button", { name: "Replay" }).click();
  await expect(stage).toHaveAttribute("data-phase", "ready");
});

test("leaving during opening cancels work without changing document scroll", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const initial = await page.locator("body").getAttribute("style");
  const stage = page.locator(stageSelector);
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await stage.getByRole("button", { name: "Open invitation" }).click();
  await page.getByRole("link", { name: "Royal Wedding details" }).click();
  await expect(page).toHaveURL(/\/admin\/templates\/royal-wedding$/);
  await expect(stage).toHaveCount(0);
  expect(await page.locator("body").getAttribute("style")).toBe(initial);
  expect(errors).toEqual([]);
});
