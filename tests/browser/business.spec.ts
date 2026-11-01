import "dotenv/config";
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { authenticator } from "otplib";
import { createHmac } from "node:crypto";
import sharp from "sharp";

const origin = "http://127.0.0.1:3001";
const headers = { Origin: origin, "X-CSRF-Protection": "1" };
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
test.afterAll(async () => { await db.$disconnect(); });

test("admin password login requires MFA, refuses CSRF, and consumes recovery codes once", async ({ browser }) => {
  const operator = JSON.parse(await readFile("work/browser-operator.json","utf8"));
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  try {
    const login = await context.request.post(`${origin}/api/auth/login`,{headers,data:{phone:operator.phone,password:operator.password}});
    expect(login.status()).toBe(200); expect((await login.json()).redirect).toBe("/account/mfa");
    expect((await context.request.get(`${origin}/api/studio/overview`)).status()).toBe(401);
    const recovery = `recovery-${crypto.randomUUID()}`;
    await db.recoveryCode.create({data:{accountId:operator.id,hash:createHmac("sha256",process.env.SESSION_SECRET!).update(recovery).digest("hex")}});
    await context.request.post(`${origin}/api/auth/login`,{headers,data:{phone:operator.phone,password:operator.password}});
    expect((await context.request.post(`${origin}/api/auth/mfa-verify`,{headers,data:{code:recovery}})).status()).toBe(200);
    await context.request.post(`${origin}/api/auth/logout`,{headers,data:{}});
    await context.request.post(`${origin}/api/auth/login`,{headers,data:{phone:operator.phone,password:operator.password}});
    expect((await context.request.post(`${origin}/api/auth/mfa-verify`,{headers,data:{code:recovery}})).status()).toBe(401);
    const verify = await context.request.post(`${origin}/api/auth/mfa-verify`,{headers,data:{code:authenticator.generate(operator.secret)}});
    expect(verify.status()).toBe(200);
    expect((await context.request.get(`${origin}/api/studio/overview`)).status()).toBe(200);
    expect((await context.request.post(`${origin}/api/studio/settings`,{headers:{Origin:"https://untrusted.example","X-CSRF-Protection":"1"},data:{}})).status()).toBe(403);
    expect((await context.request.post(`${origin}/api/studio/settings`,{headers:{Origin:origin},data:{}})).status()).toBe(403);
    await context.request.post(`${origin}/api/auth/logout`,{headers,data:{}});
    expect((await context.request.get(`${origin}/api/studio/overview`)).status()).toBe(401);
  } finally { await context.close(); }
});

test("cash sale, coupons, publishing, live RSVP, isolation, expiry, and feature access", async ({ page, browser }) => {
  test.setTimeout(120000);
  const stamp = Date.now().toString().slice(-8);
  const customerIds: string[] = []; const invitationIds: string[] = [];
  const couponCode = `TEST-${stamp}`;
  const context = await browser.newContext({storageState:{cookies:[],origins:[]}});
  const call = (path:string,data:unknown) => page.request.post(`${origin}/api/studio/${path}`,{headers,data});
  try {
    const first = await call("customers",{name:"Integration customer A",phone:`+9191${stamp}`});
    expect(first.status()).toBe(200); const a = await first.json(); customerIds.push(a.id);
    const second = await call("customers",{name:"Integration customer B",phone:`+9192${stamp}`});
    expect(second.status()).toBe(200); const b = await second.json(); customerIds.push(b.id);
    const snapshot = await (await page.request.get(`${origin}/api/studio/overview`)).json();
    const content = {...snapshot.catalog[0].demo,partnerOne:"Arjun",partnerTwo:"Diya",message:"Our personalized wedding invitation."};
    for (const [index,ownerId] of [a.id,b.id].entries()) {
      const response = await call("invitations",{ownerId,templateId:"royal-wedding",slug:`integration-${stamp}-${index}`,content});
      expect(response.status()).toBe(200); invitationIds.push((await response.json()).id);
    }
    const id = invitationIds[0]; const slug = `integration-${stamp}-0`;
    let invitation = (await (await page.request.get(`${origin}/api/studio/invitations/${id}`)).json()).invitation;
    expect((await page.request.get(`${origin}/invite/${slug}`)).status()).toBe(404);
    const features = {sections:["opening","ganesha","invitation","date","events","rsvp","invitee"],rsvpEnabled:true,partyLimit:4,rsvpDeadline:"",dietaryEnabled:true,accommodationEnabled:true};
    expect((await call(`invitations/${id}/draft`,{revision:invitation.revision,content,slug,features})).status()).toBe(200);
    expect((await call("coupons",{code:couponCode,kind:"PERCENT",value:10,active:true,limit:1,startsAt:"",endsAt:""})).status()).toBe(200);
    const requestKey = crypto.randomUUID(); const sale = {requestKey,originalPrice:100000,cash:90000,couponCode,complimentary:false,cashConfirmed:true,paidAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000*30).toISOString(),notes:"Integration test"};
    const activation = await call(`invitations/${id}/activate`,sale); expect(activation.status()).toBe(200);
    expect((await call(`invitations/${id}/activate`,sale)).status()).toBe(200);
    expect(await db.sale.count({where:{invitationId:id}})).toBe(1);
    expect((await db.coupon.findUniqueOrThrow({where:{code:couponCode}})).used).toBe(1);
    expect((await call(`invitations/${invitationIds[1]}/activate`,{...sale,requestKey:crypto.randomUUID()})).status()).toBe(400);
    expect((await call(`invitations/${invitationIds[1]}/activate`,{...sale,requestKey:crypto.randomUUID(),couponCode:"",cash:1})).status()).toBe(400);
    // Compile the guest endpoint before UI timing assertions on a cold dev server.
    const invalidRsvp = await page.request.post(`${origin}/api/rsvp/${slug}`, { headers, data: {}, timeout: 90000 });
    expect(invalidRsvp.status()).toBe(400);
    const live = await page.goto(`/invite/${slug}`); expect(live?.status()).toBe(200);
    const canvas = page.locator("[data-royal-scroll]"); await canvas.getByRole("button",{name:"Skip introduction"}).click();
    await expect(canvas.getByRole("button", { name: "Explore", exact: true })).toHaveCount(0);
    const form = canvas.locator('[data-section="rsvp"]');
    await form.getByLabel("Your name",{exact:true}).fill("Guest One");
    await form.getByLabel("Phone number").fill(`+9193${stamp}`);
    await form.getByText("Joyfully accept",{exact:true}).click();
    await form.getByLabel("Number of guests").fill("3");
    await form.getByRole("checkbox",{name:"The Wedding",exact:true}).check();
    await expect(form.locator('label:has(input[type="radio"][value="attending"])')).toHaveCSS("border-color", "rgb(214, 188, 131)");
    await form.getByLabel("Phone number").focus();
    await expect(form.getByLabel("Phone number")).toHaveCSS("outline-style", "solid");
    await page.route(`**/api/rsvp/${slug}`, route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Please try again shortly." }) }));
    await form.getByRole("button",{name:"Send RSVP"}).click();
    await expect(form.getByRole("alert")).toHaveText("Please try again shortly.");
    expect(await db.rsvp.count({where:{invitationId:id}})).toBe(0);
    await expect(form.getByLabel("Your name",{exact:true})).toHaveValue("Guest One");
    await page.unroute(`**/api/rsvp/${slug}`);
    const [submitted] = await Promise.all([
      page.waitForResponse(response => response.url().endsWith(`/api/rsvp/${slug}`) && response.request().method() === "POST", { timeout: 60000 }),
      form.getByRole("button",{name:"Send RSVP"}).click(),
    ]);
    expect(submitted.status()).toBe(201);
    await expect(form.getByRole("heading",{name:"Thank you for your reply"})).toBeVisible();
    expect(await db.rsvp.count({where:{invitationId:id}})).toBe(1);
    const duplicate = await page.request.post(`${origin}/api/rsvp/${slug}`,{headers,data:{name:"Duplicate",phone:`+9193${stamp}`,email:"",attending:true,partySize:1,ceremonies:[]}});
    expect(duplicate.status()).toBe(409); expect(JSON.stringify(await duplicate.json())).not.toContain("Guest One");
    expect((await context.request.post(`${origin}/api/auth/login`,{headers,data:{phone:`+9191${stamp}`,password:a.temporaryPassword}})).status()).toBe(200);
    expect((await context.request.get(`${origin}/api/studio/overview`)).status()).toBe(401);
    const newPassword = `Customer-${crypto.randomUUID()}`;
    expect((await context.request.post(`${origin}/api/auth/password`,{headers,data:{current:a.temporaryPassword,password:newPassword}})).status()).toBe(200);
    expect((await context.request.get(`${origin}/api/studio/invitations/${invitationIds[1]}`)).status()).toBe(404);
    const owned = await (await context.request.get(`${origin}/api/studio/invitations/${id}`)).json();
    expect(owned.sales).toBeUndefined();
    const edited = {...content,partnerOne:"Unauthorized name",message:"Published by the customer."};
    const saved = await context.request.post(`${origin}/api/studio/invitations/${id}/draft`,{headers,data:{revision:owned.invitation.revision,content:edited}});
    expect(saved.status()).toBe(200); const revision=(await saved.json()).revision;
    expect((await context.request.post(`${origin}/api/studio/invitations/${id}/draft`,{headers,data:{revision:owned.invitation.revision,content:edited}})).status()).toBe(409);
    expect((await context.request.post(`${origin}/api/studio/invitations/${id}/publish`,{headers,data:{revision}})).status()).toBe(200);
    const published = await db.invitation.findUniqueOrThrow({where:{id}}); expect((published.published as {partnerOne:string}).partnerOne).toBe("Arjun");
    expect((published.published as {message:string}).message).toBe("Published by the customer.");
    const formula = {name:"=SUM(1,2)",phone:`+9194${stamp}`,email:"",attending:true,partySize:2,ceremonies:["wedding"]};
    expect((await context.request.post(`${origin}/api/studio/invitations/${id}/responses`,{headers,data:formula})).status()).toBe(200);
    const csv = await context.request.get(`${origin}/api/studio/invitations/${id}/responses?export=csv`);
    expect(csv.status()).toBe(200); expect(await csv.text()).toContain("'=SUM(1,2)");
    await db.invitation.update({where:{id},data:{expiresAt:new Date(Date.now()-1000)}});
    expect((await context.request.get(`${origin}/api/studio/invitations/${id}/responses`)).status()).toBe(200);
    expect((await page.request.get(`${origin}/invite/${slug}`)).status()).toBe(404);
    expect((await page.request.post(`${origin}/api/rsvp/${slug}`,{headers,data:{...formula,phone:`+9195${stamp}`}})).status()).toBe(403);
    await db.invitation.update({where:{id},data:{rsvpEnabled:false}});
    expect((await context.request.get(`${origin}/api/studio/invitations/${id}/responses?export=csv`)).status()).toBe(403);
    expect(await db.rsvp.count({where:{invitationId:id}})).toBe(2);
    const svg = await page.request.post(`${origin}/api/media`,{headers,multipart:{file:{name:"malicious.svg",mimeType:"image/svg+xml",buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')},invitationId:id}});
    expect(svg.status()).toBe(400);
    const png = await sharp({create:{width:2,height:2,channels:3,background:"#501b2b"}}).png().toBuffer();
    const upload = await page.request.post(`${origin}/api/media`,{headers,multipart:{file:{name:"valid.png",mimeType:"image/png",buffer:png},invitationId:id}});
    expect(upload.status()).toBe(200); const media=await upload.json();
    const guest=await browser.newContext({storageState:{cookies:[],origins:[]}});
    expect((await guest.request.get(`${origin}${media.url}`)).status()).not.toBe(200);await guest.close();
    expect((await call(`customers/${a.id}/reset`,{identityVerified:true})).status()).toBe(200);
    expect((await context.request.get(`${origin}/api/studio/overview`)).status()).toBe(401);
  } finally {
    await context.close();
    await db.rsvp.deleteMany({where:{invitationId:{in:invitationIds}}});
    await db.media.deleteMany({where:{invitationId:{in:invitationIds}}});
    await db.sale.deleteMany({where:{invitationId:{in:invitationIds}}});
    await db.contentRevision.deleteMany({where:{invitationId:{in:invitationIds}}});
    await db.invitation.deleteMany({where:{id:{in:invitationIds}}});
    await db.account.deleteMany({where:{id:{in:customerIds}}});
    await db.coupon.deleteMany({where:{code:couponCode}});
  }
});
