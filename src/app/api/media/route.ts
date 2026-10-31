import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "@/server/db";
import { requireAccount } from "@/server/auth";
import { AppError, sameOrigin, rateLimit, errorResponse } from "@/server/security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let written: string | undefined;
  try {
    await sameOrigin(request); const actor = await requireAccount("ADMIN");
    await rateLimit(`upload:${actor.id}`, 20, 3600);
    const reader = request.body?.getReader(); if (!reader) throw new AppError("Choose a file.");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > 12 * 1024 * 1024) { await reader.cancel(); throw new AppError("File exceeds the 10 MB limit.", 413); } chunks.push(chunk.value); }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    const file = form.get("file"); const invitationId = String(form.get("invitationId") || "");
    if (!(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024) throw new AppError("Choose an image or MP3 up to 10 MB.");
    if (!["image/jpeg","image/png","image/webp","audio/mpeg"].includes(file.type)) throw new AppError("Only still PNG, JPEG, WebP images or MP3 audio are accepted.");
    if (invitationId && !await db.invitation.findUnique({ where: { id: invitationId } })) throw new AppError("Invitation not found.", 404);
    let buffer: Buffer = Buffer.from(await file.arrayBuffer()); let mime: string; let extension: string;
    if (file.type === "audio/mpeg" && (buffer.subarray(0,3).toString() === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0))) { mime = "audio/mpeg"; extension = "mp3"; }
    else {
      const metadata = await sharp(buffer, { limitInputPixels: 30_000_000 }).metadata().catch(() => { throw new AppError("The file is not a valid supported image or MP3."); });
      if (!["jpeg","png","webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) throw new AppError("Only still PNG, JPEG, WebP images or MP3 audio are accepted.");
      buffer = await sharp(buffer, { limitInputPixels: 30_000_000 }).rotate().resize({ width: 2400, height: 3000, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer().catch(() => { throw new AppError("The image could not be decoded."); });
      mime = "image/webp"; extension = "webp";
    }
    const directory = path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_ROOT || "private-media");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const filename = `${randomUUID()}.${extension}`; written = path.join(/* turbopackIgnore: true */ directory, filename);
    await writeFile(written, buffer, { flag: "wx", mode: 0o600 });
    const media = await db.$transaction(async tx => {
      const media = await tx.media.create({ data: { filename, mime, size: buffer.length, invitationId: invitationId || null } });
      await tx.auditEvent.create({ data: { actorId: actor.id, action: "MEDIA_UPLOADED", targetId: media.id } });
      return media;
    });
    written = undefined;
    return Response.json({ id: media.id, url: `/api/media/${media.id}`, mime });
  } catch(error) { if (written) await unlink(written).catch(() => {}); return errorResponse(error); }
}
