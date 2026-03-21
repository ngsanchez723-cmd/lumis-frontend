"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useState } from "react";

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
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Hide nav on landing and auth pages
  const hideNav =
    pathname === "/" || pathname.startsWith("/auth/");

  if (hideNav) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="w-56 border-r border-neutral-200 bg-neutral-50 p-4 flex flex-col shrink-0 min-h-screen">
      <Link
        href="/"
        className="text-lg font-bold tracking-tight px-3 py-2 mb-4"
      >
        Lumis
      </Link>
      <div className="flex flex-col gap-1 flex-1">
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
      </div>

      {/* Settings + Sign out at bottom */}
      <div className="border-t border-neutral-200 pt-3 mt-3 flex flex-col gap-1">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/settings"
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <span className="text-base">⚙</span>
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors text-left disabled:opacity-50"
        >
          <span className="text-base">↗</span>
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </nav>
  );
}
