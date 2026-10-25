"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/data";
import { ROLE_LABELS, type SessionUser } from "@/lib/session";

type NavItem = { href: string; label: string };

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  picker: [{ href: "/scan", label: "Scan waste" }],
  aggregator: [
    { href: "/agg/batches", label: "Batches" },
    { href: "/agg/batches/new", label: "Register batch" },
  ],
  recycler: [{ href: "/rec/batches", label: "Inbox" }],
  producer: [
    { href: "/prod/marketplace", label: "Marketplace" },
    { href: "/prod/batches", label: "Verified pool" },
    { href: "/prod/certificates", label: "Certificates" },
  ],
};

export function RoleHeader({ session }: { session: SessionUser | null }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  if (pathname === "/login") return null;

  const signOut = async () => {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  };

  const nav = session ? NAV_BY_ROLE[session.role] : [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 min-h-14 py-2">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href={session ? "/" : "/login"}
              className="flex items-center gap-2 shrink-0"
              aria-label="CircuLagos home"
            >
              <span className="text-2xl" aria-hidden="true">
                🌿
              </span>
              <span className="font-semibold text-neutral-900">CircuLagos</span>
            </Link>

            {session && (
              <nav className="flex items-center gap-1 overflow-x-auto">
                {nav.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/agg/batches" &&
                      pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                        active
                          ? "bg-green-100 text-green-700"
                          : "text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {session ? (
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-neutral-900 leading-tight">
                  {session.org}
                </p>
                <p className="text-xs text-neutral-500 leading-tight">
                  {session.name} · {ROLE_LABELS[session.role]}
                </p>
              </div>
              <span className="sm:hidden text-xs font-medium text-neutral-600">
                {ROLE_LABELS[session.role]}
              </span>
              <button
                onClick={signOut}
                disabled={signingOut}
                className="px-3 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 transition-colors"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
