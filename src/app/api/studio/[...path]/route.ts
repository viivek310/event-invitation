import { z } from "zod";
import { db } from "@/server/db";
import { requireAccount } from "@/server/auth";
import { AppError, sameOrigin, errorResponse, rateLimit, readJson } from "@/server/security";
import { text, csvCell, royalContentSchema } from "@/server/validation";
import { activateInvitation, createCustomer, resetCustomer, createInvitation, ownedInvitation, saveDraft, publishInvitation, writeRsvp } from "@/server/invitations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: Request, context: Context) {
  try {
    const actor = await requireAccount();
    const [resource, id, operation] = (await context.params).path;
    if (resource === "invitations" && id && operation === "responses") {
      const invitation = await ownedInvitation(id, actor);
      if (!invitation.rsvpEnabled) throw new AppError("RSVP is disabled for this order.", 403);
      const url = new URL(request.url);
      const search = url.searchParams.get("search")?.slice(0, 100) || "";
      const attendance = url.searchParams.get("attendance");
      const where = { invitationId: id, ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { phone: { contains: search } }] } : {}),
        ...(attendance === "yes" || attendance === "no" ? { attending: attendance === "yes" } : {}) };
      const rows = await db.rsvp.findMany({ where, orderBy: { createdAt: "desc" }, take: 1000 });
      const all = await db.rsvp.findMany({ where: { invitationId: id }, select: { attending: true, partySize: true, ceremonies: true } });
      const totals = { responses: all.length, accepted: all.filter(row => row.attending).length,
        headcount: all.reduce((sum, row) => sum + (row.attending ? row.partySize : 0), 0), ceremonies: {} as Record<string, number> };
      all.filter(row => row.attending).forEach(row => row.ceremonies.forEach(key => { totals.ceremonies[key] = (totals.ceremonies[key] || 0) + row.partySize; }));
      if (url.searchParams.get("export") === "csv") {
        await rateLimit(`export:${actor.id}`, 20, 60);
        // Fetch the entire filtered export; table responses are capped at 1000.
        const exported = await db.rsvp.findMany({ where, orderBy: { createdAt: "desc" } });
        await db.auditEvent.create({ data: { actorId: actor.id, action: "RSVP_EXPORTED", targetId: id } });
        const csv = [["Name", "Phone", "Email", "Attendance", "Party size", "Ceremonies", "Dietary", "Accommodation"],
          ...exported.map(row => [row.name, row.phone, row.email, row.attending ? "Accepted" : "Declined", row.partySize, row.ceremonies.join("; "), row.dietary, row.accommodation])]
          .map(row => row.map(csvCell).join(",")).join("\r\n");
        return new Response("\uFEFF" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="guest-responses.csv"', "Cache-Control": "private, no-store" } });
      }
      return Response.json({ rows, totals, capped: rows.length === 1000 });
    }
    if (resource === "invitations" && id) {
      const invitation = await ownedInvitation(id, actor);
      const sales = actor.role === "ADMIN" ? await db.sale.findMany({ where: { invitationId: id }, orderBy: { createdAt: "desc" } }) : undefined;
      return Response.json({ invitation: actor.role === "ADMIN" ? invitation : {
        id: invitation.id, slug: invitation.slug, draft: invitation.draft, revision: invitation.revision, publishedRevision: invitation.publishedRevision,
        templateId: invitation.templateId, state: invitation.state, expiresAt: invitation.expiresAt, rsvpEnabled: invitation.rsvpEnabled,
      }, sales });
    }
    if (resource === "overview") {
      const invitations = await db.invitation.findMany({ where: actor.role === "ADMIN" ? {} : { ownerId: actor.id },
        select: { id: true, slug: true, templateId: true, state: true, expiresAt: true, rsvpEnabled: true, draft: true, revision: true, publishedRevision: true, ownerId: true }, orderBy: { createdAt: "desc" } });
      if (actor.role !== "ADMIN") return Response.json({ invitations });
      const [customers, coupons, catalog, sales, audit, settings, media] = await Promise.all([
        db.account.findMany({ where: { role: "CUSTOMER" }, select: { id: true, name: true, phone: true, suspended: true }, orderBy: { createdAt: "desc" } }),
        db.coupon.findMany({ orderBy: { code: "asc" } }), db.catalogEntry.findMany(),
        db.sale.findMany({ orderBy: { createdAt: "desc" }, take: 50 }), db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        db.settings.findUnique({ where: { id: "studio" } }), db.media.findMany({ select: { id: true, invitationId: true, mime: true, size: true }, take: 100, orderBy: { createdAt: "desc" } }),
      ]);
      return Response.json({ invitations, customers, coupons, catalog, sales, audit, settings, media });
    }
    throw new AppError("Not found.", 404);
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request, context: Context) {
  try {
    await sameOrigin(request);
    const actor = await requireAccount();
    await rateLimit(`write:${actor.id}`, 120, 60);
    const [resource, id, operation] = (await context.params).path;
    const input = await readJson(request);
    if (resource === "invitations" && id) {
      if (operation === "draft") return Response.json(await saveDraft(id, input, actor));
      if (operation === "publish") {
        await publishInvitation(id, z.object({ revision: z.number().int() }).parse(input).revision, actor);
        return Response.json({ ok: true });
      }
      if (operation === "responses") {
        const invitation = await ownedInvitation(id, actor);
        if (!invitation.rsvpEnabled) throw new AppError("RSVP is not enabled.", 403);
        const meta = z.object({ responseId: z.string().optional(), remove: z.boolean().optional() }).parse(input);
        if (meta.remove && meta.responseId) {
          await db.$transaction(async tx => {
            await tx.rsvp.deleteMany({ where: { id: meta.responseId, invitationId: id } });
            await tx.auditEvent.create({ data: { actorId: actor.id, action: "RSVP_DELETED", targetId: id } });
          });
        } else await writeRsvp(id, input, actor, meta.responseId);
        return Response.json({ ok: true });
      }
    }
    if (actor.role !== "ADMIN") throw new AppError("Access denied.", 403);
    if (resource === "customers" && !id) return Response.json(await createCustomer(input, actor));
    if (resource === "customers" && id && operation === "reset") {
      if (input.identityVerified !== true) throw new AppError("Confirm offline identity verification first.");
      return Response.json(await resetCustomer(id, actor));
    }
    if (resource === "customers" && id && operation === "suspend") {
      const suspended = z.object({ suspended: z.boolean() }).parse(input).suspended;
      await db.$transaction(async tx => {
        const result = await tx.account.updateMany({ where: { id, role: "CUSTOMER" }, data: { suspended } });
        if (!result.count) throw new AppError("Customer not found.", 404);
        await tx.session.deleteMany({ where: { accountId: id } });
        await tx.auditEvent.create({ data: { actorId: actor.id, action: suspended ? "ACCOUNT_SUSPENDED" : "ACCOUNT_RESTORED", targetId: id } });
      });
      return Response.json({ ok: true });
    }
    if (resource === "invitations" && !id) return Response.json(await createInvitation(input, actor));
    if (resource === "invitations" && id && operation === "activate") return Response.json(await activateInvitation(id, input, actor));
    if (resource === "invitations" && id && operation === "status") {
      const state = z.object({ state: z.enum(["SUSPENDED", "ACTIVE", "ARCHIVED"]) }).parse(input).state;
      const invitation = await ownedInvitation(id, actor);
      if (state === "ACTIVE" && (!invitation.published || !invitation.expiresAt || invitation.expiresAt <= new Date())) throw new AppError("Record a sale to activate or renew this invitation.");
      await db.$transaction([db.invitation.update({ where: { id }, data: { state } }),
        db.auditEvent.create({ data: { actorId: actor.id, action: `INVITATION_${state}`, targetId: id } })]);
      return Response.json({ ok: true });
    }
    if (resource === "coupons") {
      const data = z.object({ code: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/i).transform(v => v.toUpperCase()),
        kind: z.enum(["PERCENT", "FIXED", "FREE"]), value: z.number().int().min(0).max(2_000_000_000), active: z.boolean(),
        startsAt: z.string(), endsAt: z.string(), limit: z.number().int().min(1).nullable() }).parse(input);
      if (data.kind === "PERCENT" && data.value > 100) throw new AppError("Percentage must be at most 100.");
      const startsAt = data.startsAt ? new Date(z.iso.datetime({ offset: true }).parse(data.startsAt)) : null;
      const endsAt = data.endsAt ? new Date(z.iso.datetime({ offset: true }).parse(data.endsAt)) : null;
      if (startsAt && endsAt && endsAt <= startsAt) throw new AppError("Coupon end must be after start.");
      await db.$transaction(async tx => {
        const coupon = await tx.coupon.upsert({ where: { code: data.code }, create: { ...data, startsAt, endsAt }, update: { ...data, startsAt, endsAt } });
        await tx.auditEvent.create({ data: { actorId: actor.id, action: "COUPON_SAVED", targetId: coupon.id } });
      });
      return Response.json({ ok: true });
    }
    if (resource === "catalog" && id === "royal-wedding") {
      const data = z.object({ title: text(100), description: text(500), visible: z.boolean(), thumbnail: z.string().max(200), demo: royalContentSchema }).parse(input);
      if (data.thumbnail && !/^\/(templates\/royal-wedding\/|api\/media\/)[a-zA-Z0-9/_\-.]+$/.test(data.thumbnail)) throw new AppError("Use uploaded or registered template artwork.");
      await db.$transaction([db.catalogEntry.update({ where: { id }, data }), db.auditEvent.create({ data: { actorId: actor.id, action: "CATALOG_UPDATED", targetId: id } })]);
      return Response.json({ ok: true });
    }
    if (resource === "settings") {
      const data = z.object({ name: text(100), phone: z.string().max(40), email: z.union([z.email(), z.literal("")]) }).parse(input);
      await db.$transaction([db.settings.upsert({ where: { id: "studio" }, create: { id: "studio", ...data }, update: data }),
        db.auditEvent.create({ data: { actorId: actor.id, action: "SETTINGS_UPDATED" } })]);
      return Response.json({ ok: true });
    }
    throw new AppError("Not found.", 404);
  } catch (error) { return errorResponse(error); }
}
