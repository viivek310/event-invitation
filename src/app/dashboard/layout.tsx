import type { ReactNode } from "react";
import { requirePageAccount } from "@/server/auth";
import { SignOut } from "@/components/business-ui";
export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const account = await requirePageAccount();
  return <div className="customer-shell"><header className="customer-header"><a href="/dashboard">Invitation Studio</a><span>{account.name}</span><a href="/account/password">Change password</a><SignOut /></header><main id="main-content">{children}</main></div>;
}
