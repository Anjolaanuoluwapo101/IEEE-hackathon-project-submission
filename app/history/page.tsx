"use client";

import { useEffect, useState } from "react";
import { readIntakes } from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface IntakeHistoryItem {
  id: string;
  material: string;
  date: string;
  location: string;
  status: string;
}

function PickerHistoryClient() {
  const [history, setHistory] = useState<IntakeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/intake?self=true", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.intakes) {
          const formatted = data.intakes.map((intake: any) => ({
            id: intake.id,
            material: intake.aiResult?.material ?? "unknown",
            date: intake.createdAt,
            location: intake.location,
            status: intake.status === "classified" ? "pending" : "registered",
          }));
          setHistory(formatted);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const statusVariants: Record<string, "available" | "claimed" | "pending" | "registered" | "recycled" | "in_transit" | "flagged" | "new"> = {
    pending: "pending",
    registered: "registered",
    in_transit: "in_transit",
    received: "recycled",
    flagged: "flagged",
    retired: "recycled",
  };

  if (loading) {
    return (
      <Card>
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </Card>
    );
  }

  return (
    <Card>
      {history.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted">No scans yet. <a href="/scan" className="text-emerald hover:underline">Scan your first waste</a>.</p>
        </div>
      ) : (
        <>
          {history.map((intake, index) => (
            <div key={intake.id} className={`card row${index > 0 ? " ln" : ""}`} style={{ padding: "16px 24px", gap: "16px" }}>
              <div className="dark" style={{ width: "52px", height: "52px", borderRadius: "16px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="b8">{intake.material.charAt(0).toUpperCase() + intake.material.slice(1)}</div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{new Date(intake.date).toLocaleDateString(undefined, { weekday: "short" })} · {intake.location}</div>
              </div>
              <Badge variant={statusVariants[intake.status] || "pending"}>
                {intake.status === "classified" ? "Pending" : intake.status.charAt(0).toUpperCase() + intake.status.slice(1)}
              </Badge>
            </div>
          ))}
        </>
      )}
      <p className="hp" style={{ marginTop: "14px" }}>Weight appears here after your aggregator registers the batch.</p>
    </Card>
  );
}

export default function PickerHistoryPage() {
  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="picker" data-active="1" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Picker</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Past scans</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>Your scans and where they are now.</p>
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <PickerHistoryClient />
        </div>
      </main>
    </div>
  );
}