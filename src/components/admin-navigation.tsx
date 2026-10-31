"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

const items = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/templates", label: "Templates", icon: "grid" },
  { href: "/admin/invitations", label: "Invitations", icon: "mail" },
  { href: "/admin/setup", label: "Project setup", icon: "settings" },
] as const;
export function AdminNavigation({ templateCount }: { templateCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="admin-navigation" aria-label="Studio navigation">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "active" : ""}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.href === "/admin/templates" && (
              <span className="nav-counter">{templateCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
