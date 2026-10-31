import { headers } from "next/headers";
import { notFound } from "next/navigation";

// This is not authentication. This milestone has no accounts or customer data.
// Bind the dev server to loopback; disable the entire workspace in production.
export async function requireLocalDevelopment() {
  if (process.env.NODE_ENV !== "development") notFound();
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") || "";
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) notFound();
}
