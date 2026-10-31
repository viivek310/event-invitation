import { db } from "@/server/db";
import { sameOrigin, rateLimit, ipKey, errorResponse, AppError, readJson } from "@/server/security";
import { writeRsvp } from "@/server/invitations";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await sameOrigin(request);
    await rateLimit(`guest:${await ipKey()}`, 30, 600);
    const invitation = await db.invitation.findUnique({ where: { slug: (await params).slug }, select: { id: true } });
    if (!invitation) throw new AppError("Invitation is unavailable.", 404);
    await rateLimit(`invitation-rsvp:${invitation.id}`, 300, 600);
    await writeRsvp(invitation.id, await readJson(request));
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
