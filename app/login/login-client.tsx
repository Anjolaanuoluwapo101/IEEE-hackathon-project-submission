"use client";

import { useState } from "react";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DEMO_ACCOUNTS } from "@/lib/demo-users";
import type { DemoUser } from "@/lib/demo-users";
import type { Role } from "@/lib/data";

const ROLE_CARDS: Array<{
  role: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
  accounts: DemoUser[];
}> = [
  {
    role: "picker",
    label: "Picker",
    description: "Scan waste and get paid",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      </svg>
    ),
    accounts: DEMO_ACCOUNTS.filter((a) => a.role === "picker"),
  },
  {
    role: "aggregator",
    label: "Aggregator",
    description: "Register batches and track custody",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
      </svg>
    ),
    accounts: DEMO_ACCOUNTS.filter((a) => a.role === "aggregator"),
  },
  {
    role: "recycler",
    label: "Recycler",
    description: "Confirm receipt, log output, retire",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 11a5 5 0 0 1 10 0v1H7z" />
        <path d="M7 3v4M7 3l4 4" />
        <path d="M17 3v4M17 3l-4 4" />
        <path d="M3 11v1a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-1" />
      </svg>
    ),
    accounts: DEMO_ACCOUNTS.filter((a) => a.role === "recycler"),
  },
  {
    role: "producer",
    label: "Producer",
    description: "Buy verified credits, issue certificates",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 3v4a2 2 0 0 0 2 2h4" />
        <path d="M2 9h2" />
        <path d="M20 9h2" />
        <path d="M14 13V7a2 2 0 0 1 2-2h0" />
        <path d="M16 21v-2" />
        <path d="M12 21v-2" />
        <path d="M8 21v-2" />
      </svg>
    ),
    accounts: DEMO_ACCOUNTS.filter((a) => a.role === "producer"),
  },
];

export default function LoginClient({ nextPath }: { nextPath: string | null }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (account: DemoUser) => {
    setBusy(account.id);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not sign in");
      }

      window.location.assign(nextPath ?? data.home);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setBusy(null);
    }
  };

  return (
    <div className="f" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "800px", background: "var(--color-bg-primary)" }}>
      <div className="dark" style={{ borderRadius: 0, padding: "56px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="row" style={{ fontWeight: 800, fontSize: "20px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(140deg,#17B873,#075236)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px -8px #0A7A4E" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7" />
            </svg>
          </div>
          CircuLagos
        </div>
        <div>
          <h1 className="d" style={{ fontSize: "76px", margin: 0 }}>Waste you can <span style={{ color: "var(--color-lime)" }}>prove</span> was recycled.</h1>
          <p style={{ fontSize: "18px", color: "#BFF3D8", maxWidth: "440px", marginTop: "18px" }}>Pickers get paid. Recyclers log real weights. Producers get a certificate that can be claimed once.</p>
        </div>
        <div className="row" style={{ gap: "32px" }}>
          <div>
            <div className="d" style={{ fontSize: "36px" }}>1,284 kg</div>
            <div style={{ color: "#9FE9C3", fontWeight: 600 }}>verified</div>
          </div>
          <div>
            <div className="d" style={{ fontSize: "36px" }}>23</div>
            <div style={{ color: "#9FE9C3", fontWeight: 600 }}>pickers paid</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "64px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="eye" style={{ color: "var(--color-emerald)" }}>Demo</div>
        <h2 className="d" style={{ fontSize: "44px", margin: "6px 0 24px" }}>Who is signing in?</h2>
        {error && (
          <div className="card p-4 mb-6 border-danger-border bg-danger-soft" style={{ maxWidth: "none" }}>
            <p className="text-danger">{error}</p>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {ROLE_CARDS.map(({ label, description, icon, accounts }) => {
            const firstAccount = accounts[0];
            return (
              <a
                key={label}
                href="#"
                className="card"
                style={{ padding: "22px", textDecoration: "none", color: "inherit", minHeight: "180px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (firstAccount) signIn(firstAccount);
                }}
              >
                <div className="tile" style={{ background: "var(--color-mint)", color: "var(--color-emerald)" }}>
                  {icon}
                </div>
                <div>
                  <div className="d" style={{ fontSize: "22px" }}>{label}</div>
                  <div style={{ fontSize: "14px", color: "var(--color-muted)", fontWeight: 600 }}>{description}</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}