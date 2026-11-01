import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { royalWeddingDemo } from "../../src/templates/royal-wedding/content";
import { scrollToSection } from "./royal-scroll-helpers";

for (const size of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }, { width: 588, height: 615 }]) {
  test(`family closing follows the formal hierarchy without repeated artwork at ${size.width}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize(size);
    await page.goto("/preview/royal-wedding");
    const canvas = page.locator("[data-royal-scroll]");
    await canvas.getByRole("button", { name: "Skip introduction" }).click();
    await scrollToSection(canvas, "invitee");
    const family = canvas.locator('[data-section="invitee"]');
    const heading = family.getByRole("heading", { name: "Inviting You" });
    await expect(heading).toHaveCSS("opacity", "1");
    await expect(family.locator("picture, img")).toHaveCount(0);
    await expect(family).not.toContainText("our greatest joy");
    await expect(family).not.toContainText("loving hosts");
    const card = family.locator('[class*="closingCard"]');
    const expected = [royalWeddingDemo.invitee.introduction, royalWeddingDemo.invitee.elder,
      ...royalWeddingDemo.invitee.hosts, royalWeddingDemo.invitee.signOff];
    const bounds = (await card.boundingBox())!;
    let previousBottom = bounds.y;
    for (const text of expected) {
      const node = card.getByText(text, { exact: true });
      await expect(node).toHaveCSS("opacity", "1");
      const box = (await node.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(previousBottom);
      expect(box.x).toBeGreaterThanOrEqual(bounds.x + 24);
      expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width - 24);
      previousBottom = box.y + box.height;
    }
    await expect(card).toHaveCSS("backdrop-filter", "blur(10px)");
    await expect(family.getByRole("link", { name: "+91 9106974854" })).toHaveAttribute("href", "tel:+919106974854");
    expect(await canvas.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await canvas.screenshot({ path: info.outputPath(`family-${size.width}.png`) });
    expect(errors).toEqual([]);
  });
}

test("family closing is immediately readable under reduced motion and resets on replay", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin/templates/royal-wedding/preview");
  const canvas = page.locator("[data-royal-scroll]");
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  const family = canvas.locator('[data-section="invitee"]');
  await family.scrollIntoViewIfNeeded();
  await expect(family.getByRole("heading")).toHaveCSS("opacity", "1");
  await expect(family.getByText(royalWeddingDemo.invitee.elder)).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  await canvas.getByRole("button", { name: "Skip introduction" }).click();
  expect(await canvas.evaluate(node => node.scrollTop)).toBe(0);
  await family.scrollIntoViewIfNeeded();
  await expect(family.getByRole("heading")).toBeVisible();
  expect(errors).toEqual([]);
});

test("admin family fields preserve saved content and preview long names with six hosts", async ({ page }, info) => {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const headers = { Origin: "http://127.0.0.1:3001", "X-CSRF-Protection": "1" };
  const stamp = Date.now().toString().slice(-8);
  let ownerId = "";
  let invitationId = "";
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    const customer = await page.request.post("/api/studio/customers", { headers, data: { name: "Family closing test", phone: `+9198${stamp}` } });
    expect(customer.ok()).toBe(true);
    ownerId = (await customer.json()).id;
    const content = { ...royalWeddingDemo, invitee: { ...royalWeddingDemo.invitee, introduction: "Previously saved family invitation wording." } };
    const created = await page.request.post("/api/studio/invitations", { headers, data: { ownerId, templateId: "royal-wedding", slug: `family-test-${stamp}`, content } });
    expect(created.ok()).toBe(true);
    invitationId = (await created.json()).id;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/admin/invitations/${invitationId}`);
    await expect(page.getByRole("textbox", { name: "Formal lead-in", exact: true })).toHaveValue(content.invitee.introduction);
    const introduction = "With warm wishes and blessings, our family cordially invites you to celebrate this special occasion.";
    const elder = "Mrs. Savitri Devi Chandrakantlal Sharma";
    const hosts = Array.from({ length: 6 }, (_, i) => `Dr. Chandrakant & Mrs. Rajeshwari Family ${i + 1}`);
    await page.getByRole("textbox", { name: "Formal lead-in", exact: true }).fill(introduction);
    await page.getByRole("textbox", { name: "Elder name", exact: true }).fill(elder);
    await page.getByRole("textbox", { name: "Family sign-off", exact: true }).fill("And all our loved ones from the Sharma and Kapoor families");
    await page.getByRole("textbox", { name: "Hosts (one name or couple per line, up to six)", exact: true }).fill(hosts.join("\n"));
    const saved = page.waitForResponse(response => response.url().endsWith(`/invitations/${invitationId}/draft`) && response.request().method() === "POST");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    expect((await saved).ok()).toBe(true);
    await page.goto(`/admin/invitations/${invitationId}/preview`);
    const canvas = page.locator("[data-royal-scroll]");
    await canvas.getByRole("button", { name: "Skip introduction" }).click();
    await scrollToSection(canvas, "invitee");
    const family = canvas.locator('[data-section="invitee"]');
    await expect(family.getByRole("heading")).toHaveCSS("opacity", "1");
    await expect(family).toContainText(introduction);
    await expect(family).toContainText(elder);
    for (const host of hosts) await expect(family.getByText(host, { exact: true })).toBeVisible();
    expect(await canvas.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await canvas.screenshot({ path: info.outputPath("long-family-names.png") });
    await family.getByRole("link").scrollIntoViewIfNeeded();
    await family.getByRole("link").focus();
    await expect(family.getByRole("link")).toBeFocused();
    // Disable only the family section through the existing admin setting.
    await page.goto(`/admin/invitations/${invitationId}`);
    await page.getByLabel("Family closing", { exact: true }).uncheck();
    const disabled = page.waitForResponse(response => response.url().endsWith(`/invitations/${invitationId}/draft`) && response.request().method() === "POST");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    expect((await disabled).ok()).toBe(true);
    await page.goto(`/admin/invitations/${invitationId}/preview`);
    await expect(page.locator('[data-section="invitee"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    if (invitationId) {
      await db.contentRevision.deleteMany({ where: { invitationId } });
      await db.invitation.delete({ where: { id: invitationId } });
    }
    if (ownerId) await db.account.delete({ where: { id: ownerId } });
    await db.$disconnect();
  }
});
