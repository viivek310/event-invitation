import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";
import { requireAccount } from "@/server/auth";
import { AppError, errorResponse } from "@/server/security";
import { isAvailable } from "@/server/invitations";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const media = await db.media.findUnique({ where: { id: (await params).id }, include: { invitation: { include: { owner: { select: { suspended: true } } } } } });
    if (!media) throw new AppError("Not found.", 404);
    const reference = `/api/media/${media.id}`;
    let allowed = media.invitation ? isAvailable(media.invitation) && !media.invitation.owner.suspended && JSON.stringify(media.invitation.published).includes(reference) : false;
    if (!media.invitation) {
      const catalog = await db.catalogEntry.findMany({ where: { visible: true }, select: { thumbnail: true, demo: true } });
      allowed = catalog.some(row => row.thumbnail === reference || JSON.stringify(row.demo).includes(reference));
      if (!allowed) {
        const active = await db.invitation.findMany({ where: { state: "ACTIVE", expiresAt: { gt: new Date() }, owner: { suspended: false } }, select: { published: true } });
        allowed = active.some(row => JSON.stringify(row.published).includes(reference));
      }
    }
    if (!allowed) {
      const actor = await requireAccount();
      allowed = actor.role === "ADMIN" || media.invitation?.ownerId === actor.id;
    }
    if (!allowed) throw new AppError("Not found.", 404);
    // Uploaded files are runtime volume data and must never be traced into a build.
    const directory = path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_ROOT || "private-media");
    const storedPath = path.join(/* turbopackIgnore: true */ directory, media.filename);
    const buffer = await readFile(/* turbopackIgnore: true */ storedPath);
    return new Response(new Uint8Array(buffer), { headers: { "Content-Type": media.mime, "Content-Length": String(buffer.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch(error) { return errorResponse(error); }
}
