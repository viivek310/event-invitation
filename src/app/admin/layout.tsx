import Link from "next/link";
import type { ReactNode } from "react";
import { requirePageAccount } from "@/server/auth";
import { Brand } from "@/components/brand";
import { SignOut } from "@/components/business-ui";
export const dynamic = "force-dynamic";
export const metadata = { title: "Studio workspace", robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const account = await requirePageAccount("ADMIN");
  return <div className="admin-shell"><aside className="admin-sidebar"><Brand /><div className="workspace-identity"><div><strong>{account.name}</strong><span>Admin workspace</span></div></div><nav className="admin-navigation" aria-label="Studio navigation">{[["","Overview"],["customers","Customers"],["invitations","Invitations"],["templates","Templates"],["coupons","Coupons"],["sales","Sales"],["settings","Settings"],["audit","Activity"]].map(([path,label])=><Link key={path} href={`/admin${path?`/${path}`:""}`}>{label}</Link>)}</nav><div className="sidebar-bottom"><Link href="/templates">View public collection ↗</Link><SignOut /></div></aside><div className="admin-body"><header className="admin-topbar"><span>Invitation Studio / Admin</span><Link href="/dashboard">Customer view</Link></header><main id="main-content" className="admin-content">{children}</main></div></div>;
}