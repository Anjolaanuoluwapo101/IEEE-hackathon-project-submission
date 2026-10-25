"use client";

import { useEffect, useState } from "react";
import { readPayouts } from "@/lib/data";
import { Card, DarkPanel } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface PayoutItem {
  amount: number;
  batchId: string;
  date: string;
  status: string;
}

function PickerEarningsClient() {
  const [payouts, setPayouts] = useState<Array<{
    amount: number;
    batchId: string;
    date: string;
    status: "Paid" | "Pending";
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await fetch("/api/earnings", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.payouts) {
          const formatted = data.payouts.map((p: any) => ({
            amount: p.amount,
            batchId: p.batchId,
            date: p.createdAt,
            status: p.status === "completed" ? "Paid" : "Pending",
          }));
          setPayouts(formatted);
          const total = formatted.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
          setTotalEarned(total);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div>
        <DarkPanel padding="lg">
          <div className="eye" style={{ color: "#9FE9C3" }}>Total earned</div>
          <div style={{ fontSize: "64px", marginTop: "10px", fontWeight: 800 }}>₦{totalEarned.toLocaleString()}</div>
        </DarkPanel>
        <div className="card p-8">
          <div style={{ height: "120px", background: "linear-gradient(90deg,var(--color-line-light) 0%,var(--color-bg-secondary) 50%,var(--color-line-light) 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite", borderRadius: "10px" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
      <div className="dark" style={{ padding: "28px", borderRadius: "32px" }}>
        <div className="eye" style={{ color: "#9FE9C3" }}>Total earned</div>
        <div className="d" style={{ fontSize: "64px", marginTop: "10px" }}>₦{totalEarned.toLocaleString()}</div>
        <div style={{ marginTop: "12px" }}>
          <span className="bd sm" style={{ background: "var(--color-lime)", color: "var(--color-ink)" }}>+₦{payouts.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0).toLocaleString()} this week</span>
        </div>
      </div>
      <div>
        <div className="b8" style={{ fontSize: "18px", marginBottom: "4px" }}>Payouts</div>
{payouts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-muted">No payouts yet. Complete batches to earn.</p>
            </div>
          ) : (
            payouts.map((payout, index) => (
              <div key={payout.batchId} className="card row" style={{ padding: "16px 20px", marginTop: "10px", gap: "14px" }}>
                <div className="tile" />
                <div style={{ flex: 1 }}>
                  <div className="d" style={{ fontSize: "24px" }}>₦{payout.amount.toLocaleString()}</div>
                  <div className="mono" style={{ color: "var(--color-muted)" }}>{payout.batchId} · {new Date(payout.date).toLocaleDateString()}</div>
                </div>
                <span className={`bd ${payout.status === "Paid" ? "bg-mint text-emerald" : "bg-amber-soft text-amber"}`}>
                  <i />
                  {payout.status}
                </span>
              </div>
            ))
          )}
      </div>
    </div>
  );
}

export default function PickerEarningsPage() {
  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="picker" data-active="2" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Picker</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Earnings</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>Everything you have been paid.</p>
          </div>
        </div>
        <div style={{ marginTop: "28px" }}>
          <PickerEarningsClient />
        </div>
      </main>
    </div>
  );
}