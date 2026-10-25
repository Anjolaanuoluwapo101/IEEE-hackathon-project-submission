"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Header() {
  const [user, setUser] = useState<{ id: string; name: string; role: string; org: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie.replace(/(?:(?:^|.*)\s*cl_session\s*=\s*([^;]*).*$)|^.*$/, "$1");
    if (token) {
      fetch("/api/auth/session", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.session) {
            setUser(data.session);
          }
        });
    }
  }, []);
  
  const logout = () => {
    document.cookie = "cl_session=; Max-Age=; path=/; sameSite=lax";
    router.refresh();
  };

  if (!user) return null;

  return (
    <header className="border-b border-neutral-200 bg-[var(--color-bg-primary)] sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(140deg,#17B873,#075236)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7" />
            </svg>
          </div>
          <span className="font-medium text-[var(--color-text-primary)]">CircuLagos</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--color-muted)]">Welcome, {user.name}</span>
          <span className="text-sm font-medium text-[var(--color-emerald)]">{user.role}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}