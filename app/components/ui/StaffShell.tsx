"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface StaffShellProps {
  children: ReactNode;
  role: "aggregator" | "recycler" | "producer";
  orgName: string;
  orgInitials: string;
  userName: string;
  navItems: NavItem[];
}

export function StaffShell({ children, role, orgName, orgInitials, userName, navItems }: StaffShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleLabels = {
    aggregator: "Aggregator",
    recycler: "Recycler",
    producer: "Producer",
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-ground flex">
      <aside
        className="hidden lg:flex lg:flex-col fixed lg:static inset-y-0 left-0 z-30 w-[248px] bg-ink flex-col gap-6 p-6 lg:p-6 transition-transform duration-300"
        aria-label={`${roleLabels[role]} navigation`}
      >
        <div className="row mb-4" style={{ color: "#fff", fontWeight: 800, fontSize: "19px", letterSpacing: "-0.02em" }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-bright to-emerald flex items-center justify-center shadow-[0_8px_16px_-8px_#0A7A4E]">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7" />
            </svg>
          </div>
          CircuLagos
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/agg/batches" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`row gap-3 px-3 py-3 rounded-xl font-semibold text-base transition-all duration-200 ${
                  active
                    ? "bg-emerald text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                    : "text-[#C9D6CE] hover:bg-emerald-deep/30"
                }`}
              >
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="row mt-auto p-3 rounded-2xl bg-emerald-deep/30">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-bright to-emerald flex items-center justify-center font-extrabold text-sm">
            {orgInitials}
          </div>
          <div className="flex-1 min-w-0 ml-3">
            <div className="b7 text-sm truncate text-white">{orgName}</div>
            <div className="text-xs font-semibold text-[#9DB6A8]">{roleLabels[role]}</div>
          </div>
        </div>
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-line">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="CircuLagos home">
            <span className="text-2xl" aria-hidden="true">🌿</span>
            <span className="b8 text-ink">CircuLagos</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-xl border border-line bg-white flex items-center justify-center"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-ink/50" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-ink p-6 flex flex-col gap-4 transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label={`${roleLabels[role]} navigation`}
      >
        <div className="row mb-4" style={{ color: "#fff", fontWeight: 800, fontSize: "19px", letterSpacing: "-0.02em" }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-bright to-emerald flex items-center justify-center shadow-[0_8px_16px_-8px_#0A7A4E]">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7" />
            </svg>
          </div>
          CircuLagos
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/agg/batches" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`row gap-3 px-3 py-3 rounded-xl font-semibold text-base transition-all duration-200 ${
                  active
                    ? "bg-emerald text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                    : "text-[#C9D6CE] hover:bg-emerald-deep/30"
                }`}
              >
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="row mt-auto p-3 rounded-2xl bg-emerald-deep/30">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-bright to-emerald flex items-center justify-center font-extrabold text-sm">
            {orgInitials}
          </div>
          <div className="flex-1 min-w-0 ml-3">
            <div className="b7 text-sm truncate text-white">{orgName}</div>
            <div className="text-xs font-semibold text-[#9DB6A8]">{roleLabels[role]}</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[248px] min-w-0">
        <div className="lg:hidden h-16" />
        <div className="p-6 lg:p-12">{children}</div>
      </main>
    </div>
  );
}