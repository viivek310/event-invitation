import { db } from "@/server/db";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("ready") !== "1") return Response.json({ status: "alive" });
  try { await db.$queryRaw`SELECT 1`; return Response.json({ status: "ready" }); }
  catch { return Response.json({ status: "unavailable" }, { status: 503 }); }
}
