import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const development = process.env.NODE_ENV !== "production";
  const csp = ["default-src 'self'", `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'", "media-src 'self' blob:",
    `connect-src 'self'${development ? " ws: wss:" : ""}`, "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'", "frame-src 'self'"].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  if (/^\/(api|admin|dashboard|account|login|invite|preview)(\/|$)/.test(request.nextUrl.pathname))
    response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|templates/royal-wedding/opening|templates/royal-wedding/palace).*)"] };
