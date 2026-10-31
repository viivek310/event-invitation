import { test, expect } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }, { width: 588, height: 615 }]) {
  test(`RSVP refinement retains burgundy surroundings and readable details at ${viewport.width}px`, async ({ page }, info) => {
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
    await expect(rsvp.getByRole("radio")).toHaveCount(2);
    await expect(rsvp.getByRole("checkbox")).toHaveCount(6);
    for (const field of await rsvp.locator("input,select,textarea,button").all()) {
      await expect(field).toBeDisabled();
      await expect(field).toHaveCSS("font-size", "16px");
    }
    await expect(rsvp.getByLabel("Your name")).toHaveAttribute("autocomplete", "name");
    await canvas.screenshot({ path: info.outputPath(`rsvp-${viewport.width}.png`) });
    await rsvp.getByText("Guest preferences", { exact: true }).scrollIntoViewIfNeeded();
    await canvas.screenshot({ path: info.outputPath(`preferences-${viewport.width}.png`) });
    const closing = body.locator('[data-section="invitee"]');
    await closing.scrollIntoViewIfNeeded();
    await expect(closing).toHaveCSS("background-color", "rgb(45, 14, 25)");
    const card = closing.locator("[class*='closingCard']");
    await expect(card).toHaveCSS("opacity", "1");
    await expect(card).toHaveCSS("backdrop-filter", "blur(10px)");
    await expect(card).toHaveCSS("color", "rgb(247, 240, 226)");
    await expect(closing.getByText("Mrs. Savitri Devi Sharma")).toBeVisible();
    await expect(closing.getByText("Kavita & Rajesh Sharma")).toBeVisible();
    await expect(closing.locator("picture")).toHaveCount(1);
    expect(await canvas.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await canvas.screenshot({ path: info.outputPath(`invitee-${viewport.width}.png`) });
  });
}
