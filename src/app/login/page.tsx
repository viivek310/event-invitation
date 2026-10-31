import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentSession, authDestination } from "@/server/auth";
export const metadata = { title: "Sign in", robots: { index: false, follow: false } };
export default async function LoginPage() {
  const session = await currentSession();
  if (session) redirect(authDestination(session.kind, session.account.role));
  return <main className="auth-page"><a href="/templates">← Browse invitations</a><section className="auth-card"><p className="eyebrow">Invitation Studio</p><h1>Welcome back</h1><p>Manage your invitations and guest responses.</p><AuthForm /></section></main>;
}
