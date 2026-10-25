"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";

interface PublicShellProps {
  children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-ground">
      <header className="sticky top-0 z-40 bg-white border-b border-line">
        <div className="max-w-[1180px] mx-auto px-4 lg:px-12">
          <div className="flex items-center justify-between gap-4 min-h-[64px]">
            <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="CircuLagos home">
              <span className="text-2xl" aria-hidden="true">🌿</span>
              <span className="b8 text-ink">CircuLagos</span>
            </Link>
            <nav className="flex items-center gap-7 font-semibold text-ink">
              <Link href="#how-it-works" className="hover:text-emerald transition-colors">How it works</Link>
              <Link href="#impact" className="hover:text-emerald transition-colors">Impact</Link>
              <Link href="/verify" className="hover:text-emerald transition-colors">Verify</Link>
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-line bg-white py-8">
        <div className="max-w-[1180px] mx-auto px-4 lg:px-12 text-center text-muted text-sm">
          GitHub · IEEE Climate Chain hackathon
        </div>
      </footer>
    </div>
  );
}