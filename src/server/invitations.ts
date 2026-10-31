import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { AppError } from "./security";
import { calculateDiscount, normalizeSlug, phoneSchema, royalContentSchema, rsvpSchema, sectionsSchema, text } from "./validation";
import { hashPassword } from "./auth";
import { randomToken } from "./security";

type Actor = { id: string; role: "ADMIN" | "CUSTOMER" };
export async function validateArtwork(content: { artworkOverrides?: Partial<Record<string,string>> }, invitationId?: string) {
  const references = Object.values(content.artworkOverrides || {}).filter((value): value is string => !!value);
  if (!references.length) return;
  const ids = references.map(reference => reference.split("/").at(-1)!);
  const media = await db.media.findMany({ where: { id: { in: ids } } });
  if (media.length !== new Set(ids).size || media.some(row => !row.mime.startsWith("image/") || (row.invitationId !== null && row.invitationId !== invitationId)))
    throw new AppError("Choose image uploads belonging to this invitation or the catalog.");
}
export const isAvailable = (invitation: { state: string; expiresAt: Date | null; published: unknown }) =>
  invitation.state === "ACTIVE" && !!invitation.published && !!invitation.expiresAt && invitation.expiresAt > new Date();
export async function ownedInvitation(id: string, actor: Actor) {
  const invitation = await db.invitation.findFirst({ where: { id, ...(actor.role === "ADMIN" ? {} : { ownerId: actor.id }) } });
  if (!invitation) throw new AppError("Invitation not found.", 404);
  return invitation;
}
export async function createCustomer(input: unknown, actor: Actor) {
  const data = z.object({ name: text(100), phone: phoneSchema }).parse(input);
  const temporaryPassword = randomToken().slice(0, 22);
  const passwordHash = await hashPassword(temporaryPassword);
  const account = await db.$transaction(async tx => {
    const account = await tx.account.create({ data: { ...data, passwordHash }, select: { id: true } });
    await tx.auditEvent.create({ data: { actorId: actor.id, action: "CUSTOMER_CREATED", targetId: account.id } });
    return account;
  });
  return { ...account, temporaryPassword };
}
export async function resetCustomer(id: string, actor: Actor) {
  const temporaryPassword = randomToken().slice(0, 22);
  const passwordHash = await hashPassword(temporaryPassword);
  await db.$transaction(async tx => {
    const account = await tx.account.findFirst({ where: { id, role: "CUSTOMER" } });
    if (!account) throw new AppError("Customer not found.", 404);
    await tx.account.update({ where: { id }, data: { passwordHash, mustChangePassword: true } });
    await tx.session.deleteMany({ where: { accountId: id } });
    await tx.auditEvent.create({ data: { actorId: actor.id, action: "CUSTOMER_PASSWORD_RESET", targetId: id } });
  });
  return { temporaryPassword };
}
export async function createInvitation(input: unknown, actor: Actor) {
  const data = z.object({ ownerId: text(100), templateId: z.literal("royal-wedding"), slug: text(100), content: royalContentSchema }).parse(input);
  const owner = await db.account.findFirst({ where: { id: data.ownerId, role: "CUSTOMER", suspended: false } });
  if (!owner) throw new AppError("Choose an active customer.");
  await validateArtwork(data.content);
  const slug = normalizeSlug(data.slug);
  if (slug.length < 3) throw new AppError("Choose a slug of at least three letters or digits.");
  return db.$transaction(async tx => {
    const invitation = await tx.invitation.create({ data: { ownerId: data.ownerId, templateId: data.templateId, slug, draft: data.content,
      sections: ["opening", "ganesha", "invitation", "date", "events", "invitee"] } });
    await tx.auditEvent.create({ data: { actorId: actor.id, action: "INVITATION_CREATED", targetId: invitation.id } });
    return { id: invitation.id };
  });
}
const featureSchema = z.object({
  sections: sectionsSchema, rsvpEnabled: z.boolean(), partyLimit: z.number().int().min(1).max(100),
  rsvpDeadline: z.union([z.iso.datetime({ offset: true }), z.literal("")]), dietaryEnabled: z.boolean(), accommodationEnabled: z.boolean(),
}).refine(data => data.sections.some(id => !["opening", "ganesha"].includes(id)), "Enable at least one body section.")
  .refine(data => data.sections.includes("rsvp") === data.rsvpEnabled, "RSVP section and order feature must agree.");
export async function saveDraft(id: string, input: unknown, actor: Actor) {
  const invitation = await ownedInvitation(id, actor);
  const base = z.object({ revision: z.number().int(), content: royalContentSchema }).parse(input);
  let content = base.content;
  let extra = {};
  if (actor.role === "CUSTOMER") {
    const old = royalContentSchema.parse(invitation.draft);
    // A customer-supplied full object is never trusted for admin-only fields.
    content = { ...old, weddingDate: content.weddingDate, message: content.message, invitee: content.invitee,
      weddingStartsAt: `${content.weddingDate}${old.weddingStartsAt.slice(10)}` };
  } else {
    const data = z.object({ slug: text(100), features: featureSchema }).parse(input);
    const slug = normalizeSlug(data.slug);
    if (slug.length < 3 || (invitation.publishedAt && invitation.slug !== slug)) throw new AppError("Published links cannot be renamed.");
    extra = { slug, ...data.features, rsvpDeadline: data.features.rsvpDeadline ? new Date(data.features.rsvpDeadline) : null };
  }
  await validateArtwork(content, id);
  await db.$transaction(async tx => {
    const result = await tx.invitation.updateMany({ where: { id, revision: base.revision }, data: { draft: content, revision: { increment: 1 }, ...extra } });
    if (result.count !== 1) throw new AppError("This invitation changed in another session. Reload before saving.", 409);
    await tx.auditEvent.create({ data: { actorId: actor.id, action: "DRAFT_SAVED", targetId: id } });
  });
  return { revision: base.revision + 1 };
}
export async function publishInvitation(id: string, revision: number, actor: Actor) {
  await ownedInvitation(id, actor);
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Invitation" WHERE id = ${id} FOR UPDATE`;
    const invitation = await tx.invitation.findUniqueOrThrow({ where: { id } });
    if (!isAvailable(invitation)) throw new AppError("Only active invitations can be published.");
    if (invitation.revision !== revision) throw new AppError("Reload the latest revision before publishing.", 409);
    const content = royalContentSchema.parse(invitation.draft);
    await tx.contentRevision.upsert({ where: { invitationId_number: { invitationId: id, number: revision } }, update: {}, create: { invitationId: id, number: revision, content, actorId: actor.id } });
    await tx.invitation.update({ where: { id }, data: { published: content, publishedRevision: revision, publishedSections: invitation.sections } });
    await tx.auditEvent.create({ data: { actorId: actor.id, action: "INVITATION_PUBLISHED", targetId: id, details: { revision } } });
  });
}
export async function activateInvitation(id: string, input: unknown, actor: Actor) {
  const data = z.object({ requestKey: z.uuid(), originalPrice: z.number().int().min(0).max(2_000_000_000), cash: z.number().int().min(0).max(2_000_000_000),
    couponCode: z.string().trim().max(40), complimentary: z.boolean(), cashConfirmed: z.literal(true),
    paidAt: z.iso.datetime({ offset: true }), expiresAt: z.iso.datetime({ offset: true }), notes: z.string().trim().max(2000) }).parse(input);
  if (new Date(data.expiresAt) <= new Date() || new Date(data.paidAt).getTime() > Date.now() + 60000) throw new AppError("Check payment and expiry dates.");
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Invitation" WHERE id = ${id} FOR UPDATE`;
    const invitation = await tx.invitation.findUniqueOrThrow({ where: { id }, include: { owner: true } });
    const prior = await tx.sale.findUnique({ where: { requestKey: data.requestKey } });
    if (prior) {
      if (prior.invitationId !== id) throw new AppError("Request key already used.", 409);
      return { saleId: prior.id, replayed: true };
    }
    if (invitation.owner.suspended || invitation.state === "ARCHIVED") throw new AppError("This invitation cannot be activated.");
    if (isAvailable(invitation) && invitation.expiresAt! >= new Date(data.expiresAt)) throw new AppError("Renewal must extend the expiry date.");
    const content = royalContentSchema.parse(invitation.draft);
    let coupon = null;
    if (data.couponCode) {
      const code = data.couponCode.toUpperCase();
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Coupon" WHERE code = ${code} FOR UPDATE`;
      if (!locked.length) throw new AppError("This coupon is unavailable.");
      coupon = await tx.coupon.findUnique({ where: { code } });
      const now = new Date();
      if (!coupon || !coupon.active || (coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt <= now) || (coupon.limit !== null && coupon.used >= coupon.limit))
        throw new AppError("This coupon is unavailable.");
    }
    const discount = calculateDiscount(data.originalPrice, coupon);
    const total = data.originalPrice - discount;
    if (total === 0 ? !data.complimentary || data.cash !== 0 : data.complimentary || data.cash !== total)
      throw new AppError("Record the exact full amount due, or explicitly confirm complimentary activation for a zero-total order.");
    const sale = await tx.sale.create({ data: { requestKey: data.requestKey, invitationId: id, originalPrice: data.originalPrice,
      discount, total, cash: data.cash, complimentary: data.complimentary, paidAt: new Date(data.paidAt), expiresAt: new Date(data.expiresAt),
      notes: data.notes, actorId: actor.id, couponId: coupon?.id, couponCode: coupon?.code } });
    if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { used: { increment: 1 } } });
    await tx.invitation.update({ where: { id }, data: { state: "ACTIVE", expiresAt: new Date(data.expiresAt), published: content,
      publishedAt: invitation.publishedAt ?? new Date(), publishedRevision: invitation.revision, publishedSections: invitation.sections } });
    await tx.contentRevision.upsert({ where: { invitationId_number: { invitationId: id, number: invitation.revision } }, update: {},
      create: { invitationId: id, number: invitation.revision, content, actorId: actor.id } });
    await tx.auditEvent.create({ data: { actorId: actor.id, action: "INVITATION_ACTIVATED", targetId: id, details: { saleId: sale.id, total } } });
    return { saleId: sale.id };
  }, { maxWait: 10000, timeout: 15000 });
}
export async function writeRsvp(invitationId: string, input: unknown, actor?: Actor, responseId?: string) {
  const parsed = rsvpSchema.parse(input);
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Invitation" WHERE id = ${invitationId} FOR UPDATE`;
    const invitation = await tx.invitation.findUniqueOrThrow({ where: { id: invitationId } });
    if (!actor && (await tx.account.findUniqueOrThrow({ where: { id: invitation.ownerId } })).suspended)
      throw new AppError("RSVP is closed.", 403);
    if (actor && actor.role !== "ADMIN" && invitation.ownerId !== actor.id) throw new AppError("Invitation not found.", 404);
    if (!invitation.rsvpEnabled) throw new AppError("RSVP is not enabled for this order.", 403);
    if (!actor && (!isAvailable(invitation) || !invitation.publishedSections.includes("rsvp") || (invitation.rsvpDeadline && invitation.rsvpDeadline < new Date())))
      throw new AppError("RSVP is closed.", 403);
    const content = royalContentSchema.parse(invitation.published ?? invitation.draft);
    if (parsed.attending && (parsed.partySize < 1 || parsed.partySize > invitation.partyLimit)) throw new AppError(`Party size must be 1–${invitation.partyLimit}.`);
    if (new Set(parsed.ceremonies).size !== parsed.ceremonies.length || parsed.ceremonies.some(id => !content.ceremonies.some(event => event.id === id)))
      throw new AppError("Choose valid celebrations.");
    const data = { ...parsed, invitationId, email: parsed.email || null,
      partySize: parsed.attending ? parsed.partySize : 0, ceremonies: parsed.attending ? parsed.ceremonies : [],
      dietary: invitation.dietaryEnabled ? parsed.dietary : null, accommodation: invitation.accommodationEnabled ? parsed.accommodation : null };
    try {
      if (responseId) {
        const result = await tx.rsvp.updateMany({ where: { id: responseId, invitationId }, data });
        if (!result.count) throw new AppError("Response not found.", 404);
      } else await tx.rsvp.create({ data });
      if (actor) await tx.auditEvent.create({ data: { actorId: actor.id, action: responseId ? "RSVP_EDITED" : "RSVP_ADDED", targetId: invitationId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError("A response cannot be recorded with these details. Please contact the hosts.", 409);
      throw error;
    }
  });
}
