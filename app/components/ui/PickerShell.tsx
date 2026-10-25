"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface PickerShellProps {
  children: ReactNode;
  orgName: string;
  orgInitials: string;
  userName: string;
  walletAddress: string;
}

const navItems = [
  { href: "/scan", label: "Scan", icon: ScanIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/earnings", label: "Earnings", icon: EarningsIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
];

function ScanIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#566B60"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  );
}

function HistoryIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#566B60"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function EarningsIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#566B60"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ProfileIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#566B60"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function PickerShell({ children, orgName, orgInitials, userName, walletAddress }: PickerShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-ground flex flex-col">
      <header className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 z-30 lg:w-[248px] bg-ink flex-col gap-6 p-6 transition-transform duration-300" aria-label="Picker navigation">
        <div className="row mb-4" style={{ color: "#fff", fontWeight: 800, fontSize: "19px", letterSpacing: "-0.02em" }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-bright to-emerald flex items-center justify-center shadow-[0_8px_16px_-8px_#0A7A4E]">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7" />
            </svg>
          </div>
          CircuLagos
        </div>
        <nav className="flex-1 flex flex-col gap-2" aria-label="Picker navigation">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/scan" && pathname.startsWith(`${item.href}/`));
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
                <span className="w-5 h-5 flex-shrink-0">{item.icon({ active })}</span>
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
            <div className="text-xs font-semibold text-[#9DB6A8]">Picker</div>
          </div>
        </div>
      </header>

      <main className="flex-1 lg:ml-[248px] min-w-0 pb-[120px] lg:pb-0">
        <div className="lg:hidden h-16" />
        <div className="p-6 lg:p-12">{children}</div>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 safe-bottom" aria-label="Picker bottom navigation">
          <div className="flex bg-white border border-line rounded-[28px] p-2 shadow-[0_18px_36px_-20px_rgba(7,19,14,0.45)]">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/scan" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-[20px] text-xs font-extrabold text-decoration-none transition-all duration-200 ${
                    active
                      ? "bg-ink text-white"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <span className="w-5 h-5">{item.icon({ active })}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}