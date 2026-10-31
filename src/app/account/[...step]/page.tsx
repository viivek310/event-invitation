import { redirect } from "next/navigation";
import { currentSession, authDestination } from "@/server/auth";
import { AuthForm } from "@/components/auth-form";
export const metadata = { robots: { index: false, follow: false } };
export default async function AccountStep({ params }: { params: Promise<{ step: string[] }> }) {
  const session = await currentSession();
  if (!session) redirect("/login");
  const path = (await params).step.join("/");
  const destination = authDestination(session.kind, session.account.role);
  const changingPassword = path === "password" && session.kind === "FULL";
  if (!changingPassword && `/account/${path}` !== destination) redirect(destination);
  const action = changingPassword || session.kind === "PASSWORD" ? "password" : session.kind === "ENROLL" ? "mfa-confirm" : "mfa-verify";
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Secure your account</p><h1>{action === "password" ? "Choose your password" : "Admin verification"}</h1><AuthForm action={action} /></section></main>;
}
