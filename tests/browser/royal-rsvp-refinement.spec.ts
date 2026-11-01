import { test, expect } from "@playwright/test";

test("public full-page preview shows static RSVP without submitting responses", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const submissions: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/rsvp/")) submissions.push(request.url()); });
  try {
    await page.goto("/templates/royal-wedding?canvas=1");
    const canvas = page.locator("[data-royal-scroll]");
    const skip = canvas.getByRole("button", { name: "Skip introduction" });
    if (await skip.isVisible()) await skip.click();
    const rsvp = canvas.locator('[data-section="rsvp"]');
    await expect(rsvp).toBeAttached();
    await rsvp.scrollIntoViewIfNeeded();
    await expect(rsvp.getByRole("heading", { name: "Kindly RSVP" })).toBeVisible();
    await expect(rsvp.getByText("Preview only — responses cannot be sent.")).toBeVisible();
    for (const field of await rsvp.locator("input,select,textarea").all()) await expect(field).toBeEnabled();
    await expect(rsvp.getByRole("button", { name: "Send RSVP" })).toBeDisabled();
    await rsvp.getByLabel("Your name", { exact: true }).fill("Preview Guest");
    await rsvp.getByRole("radio", { name: "Joyfully accept" }).check();
    await rsvp.getByRole("checkbox").first().check();
    await expect(rsvp.getByLabel("Your name", { exact: true })).toHaveValue("Preview Guest");
    await rsvp.locator("form").evaluate(form => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(submissions).toEqual([]);
    await expect(rsvp.getByText("Your response has been received by the hosts.")).toHaveCount(0);
  } finally { await context.close(); }
});

for (const viewport of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }, { width: 588, height: 615 }]) {
  test(`RSVP glass matches burgundy surroundings and readable details at ${viewport.width}px`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.goto("/preview/royal-wedding");
    const canvas = page.locator("[data-royal-scroll]");
    await canvas.getByRole("button", { name: "Skip introduction" }).click();
    const body = canvas.getByTestId("royal-body");
    await expect(canvas).toHaveCSS("background-color", "rgb(80, 27, 43)");
    const rsvp = body.locator('[data-section="rsvp"]');
    await rsvp.evaluate(node => {
      const scroller = node.closest<HTMLElement>("[data-royal-scroll]")!;
      scroller.scrollTop += node.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12;
    });
    await expect(rsvp).toHaveCSS("opacity", "1");
    await expect(rsvp.getByRole("heading", { name: "Kindly RSVP" })).toBeVisible();
    await expect(rsvp.locator('[class*="rsvpSurface"]')).toHaveCSS("backdrop-filter", "blur(10px)");
    await expect(rsvp).toHaveCSS("color", "rgb(247, 240, 226)");
    await expect(rsvp.getByRole("radio")).toHaveCount(2);
    await expect(rsvp.getByRole("checkbox")).toHaveCount(6);
    for (const field of await rsvp.locator("input,select,textarea,button").all()) {
      await expect(field).toHaveCSS("font-size", "16px");
    }
    for (const field of await rsvp.locator("input,select,textarea").all()) await expect(field).toBeEnabled();
    await expect(rsvp.getByRole("button", { name: "Send RSVP" })).toBeDisabled();
    const actionSpacing = await rsvp.getByRole("button", { name: "Send RSVP" }).evaluate(button => {
      const panel = button.closest('[data-section="rsvp"]')!.getBoundingClientRect();
      const bounds = button.getBoundingClientRect();
      return panel.bottom - bounds.bottom;
    });
    expect(actionSpacing).toBeGreaterThanOrEqual(48);
    const action = rsvp.getByRole("button", { name: "Send RSVP", exact: true });
    await expect(action.locator("svg")).toHaveCount(0);
    expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(56);
    await expect(rsvp.getByLabel("Your name")).toHaveAttribute("autocomplete", "name");
    await canvas.screenshot({ path: info.outputPath(`rsvp-${viewport.width}.png`) });
    await rsvp.getByText("Guest preferences", { exact: true }).scrollIntoViewIfNeeded();
    await canvas.screenshot({ path: info.outputPath(`preferences-${viewport.width}.png`) });
    await action.scrollIntoViewIfNeeded();
    await canvas.screenshot({ path: info.outputPath(`rsvp-action-${viewport.width}.png`) });
    const closing = body.locator('[data-section="invitee"]');
    await closing.scrollIntoViewIfNeeded();
    await expect(closing).toHaveCSS("background-color", "rgb(45, 14, 25)");
    const card = closing.locator("[class*='closingCard']");
    await expect(card).toHaveCSS("opacity", "1");
    await expect(card).toHaveCSS("backdrop-filter", "blur(10px)");
    await expect(card).toHaveCSS("color", "rgb(247, 240, 226)");
    await expect(closing.getByText("Mrs. Savitri Devi Sharma")).toBeVisible();
    await expect(closing.getByText("Kavita & Rajesh Sharma")).toBeVisible();
    await expect(closing.locator("picture, img")).toHaveCount(0);
    expect(await canvas.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await canvas.screenshot({ path: info.outputPath(`invitee-${viewport.width}.png`) });
  });
}
