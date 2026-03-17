"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "◫" },
  { label: "Discover", href: "/discover", icon: "◈" },
  { label: "Playbooks", href: "/playbooks", icon: "▦" },
  { label: "Companies", href: "/companies", icon: "◉" },
  { label: "Research", href: "/research", icon: "✎" },
  { label: "Portfolio", href: "/portfolio", icon: "◧" },
];

export function Navigation() {
  const pathname = usePathname();

  // Hide nav on landing and auth pages
  const hideNav =
    pathname === "/" || pathname.startsWith("/auth/");

  if (hideNav) return null;

  return (
    <nav className="w-56 border-r border-neutral-200 bg-neutral-50 p-4 flex flex-col gap-1 shrink-0">
      <Link
        href="/"
        className="text-lg font-bold tracking-tight px-3 py-2 mb-4"
      >
        Lumis
      </Link>
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
