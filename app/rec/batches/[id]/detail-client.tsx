"use client";

import React, { useCallback, useEffect, useState, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import { CHAIN } from "@/lib/config";
import { findDemoAccount } from "@/lib/demo-users";
import type { Batch } from "@/lib/data";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { TxLink } from "@/components/ui/TxLink";
import { ErrorState, EmptyState } from "@/components/ui/States";

function shortHash(hash?: string | null) {
  if (!hash) return "—";
  return hash.length > 16 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash;
}

function newKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function RecyclerBatchDetailClient({ batchId }: { batchId: string }) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [tolerancePct, setTolerancePct] = useState(5);
  const [receivedWeight, setReceivedWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${batchId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load batch");
      setBatch(data.batch);
      if (data.batch?.receivedWeightKg != null) {
        setReceivedWeight(String(data.batch.receivedWeightKg));
      } else if (data.batch?.loggedWeightKg != null) {
        setReceivedWeight(String(data.batch.loggedWeightKg));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load batch");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/batches/${batchId}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load batch");
        if (!active) return;
        setBatch(data.batch);
        if (data.batch?.receivedWeightKg != null) {
          setReceivedWeight(String(data.batch.receivedWeightKg));
        } else if (data.batch?.loggedWeightKg != null) {
          setReceivedWeight(String(data.batch.loggedWeightKg));
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Could not load batch");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [batchId]);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((config) => {
        if (!config) return;
        const value =
          config.weightTolerancePct ??
          config.weightMismatchTolerancePct ??
          config.tolerancePct;
        if (typeof value === "number" && Number.isFinite(value)) {
          setTolerancePct(value);
        }
      })
      .catch(() => undefined);
  }, []);

  async function confirm() {
    if (!batch) return;
    const weight = Number(receivedWeight);
    if (!Number.isFinite(weight) || weight <= 0) {
      setError("Enter a positive received weight.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/batches/${batch.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receivedWeightKg: weight,
          key: newKey(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Confirmation failed");
      setNotice(
        data.status === "flagged"
          ? `Receipt confirmed at ${weight} kg, but the variance exceeds ${tolerancePct}% so the batch was flagged.`
          : `Receipt confirmed at ${weight} kg. You can now record the recovered output.`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confirmation failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
        <aside data-cl-sidebar data-role="recycler" data-active="0" />
        <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
          <Card style={{ padding: "48px", textAlign: "center" }}>
            <div className="spin" style={{ width: "48px", height: "48px", borderWidth: "4px", borderColor: "var(--color-emerald) transparent transparent transparent", margin: "0 auto 16px", borderRadius: "50%", borderStyle: "solid" }} />
            <div className="b8" style={{ fontSize: "24px" }}>Loading batch details…</div>
          </Card>
        </main>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
        <aside data-cl-sidebar data-role="recycler" data-active="0" />
        <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
          <ErrorState title="Error" message={error} onRetry={load} retryLabel="Try again" />
        </main>
      </div>
    );
  }

  if (!batch) return null;

  const picker = findDemoAccount(batch.pickerId);
  const aggregator = batch.aggregatorId ? findDemoAccount(batch.aggregatorId) : null;
  const deltaPct =
    Number(receivedWeight) > 0 && batch.loggedWeightKg > 0
      ? (Math.abs(Number(receivedWeight) - batch.loggedWeightKg) / batch.loggedWeightKg) * 100
      : 0;

  const statusVariants: Record<string, "available" | "claimed" | "pending" | "registered" | "recycled" | "in_transit" | "flagged" | "new"> = {
    registered: "registered",
    in_transit: "in_transit",
    received: "recycled",
    flagged: "flagged",
    retired: "recycled",
  };

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="recycler" data-active="0" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Recycler</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>{batch.id}</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>
              {batch.material} · {batch.loggedWeightKg} kg · {batch.status.replace("_", " ")}
            </p>
          </div>
          <div className="row">
            <Badge variant={statusVariants[batch.status] || "pending"}>{batch.status.replace("_", " ")}</Badge>
          </div>
        </div>

        <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <DarkPanel padding="lg" style={{ minHeight: "360px" }}>
            <div className="eye">Evidence from the picker&apos;s scan</div>
            <div style={{ marginTop: "16px", height: "240px", background: "var(--color-line)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>
              [Photo + AI classification]
            </div>
            <div className="eye" style={{ marginTop: "24px" }}>Batch info</div>
            <table style={{ width: "100%", marginTop: "12px", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Material</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}><MaterialBadge material={batch.material} size="sm" /></td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Logged weight</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}>{batch.loggedWeightKg} kg</td>
                </tr>
                {batch.receivedWeightKg && (
                  <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                    <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Received weight</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}>{batch.receivedWeightKg} kg</td>
                  </tr>
                )}
                <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Location</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}>{batch.location}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Picker</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}>{batch.pickerId}</td>
                </tr>
              </tbody>
            </table>
          </DarkPanel>

          <Card padding="lg">
            <div className="eye">Custody</div>
            <div style={{ marginTop: "16px" }}>
              <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: "18px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                <div className="flex-1">
                  <div className="b8" style={{ fontSize: "15px" }}>Registered</div>
                  <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.createdAt ? new Date(batch.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · {batch.aggregatorId}</div>
                </div>
                {batch.registerTx && <TxLink txHash={batch.registerTx} />}
              </div>
              {batch.transferTx && (
                <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: "18px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="b8" style={{ fontSize: "15px" }}>Transferred</div>
                    <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.updatedAt ? new Date(batch.updatedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · to {batch.recyclerId}</div>
                  </div>
                  <TxLink txHash={batch.transferTx} />
                </div>
              )}
              {batch.confirmTx && (
                <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: "18px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="b8" style={{ fontSize: "15px" }}>{batch.mismatch?.flagged ? "Flagged" : "Received"}</div>
                    <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.updatedAt ? new Date(batch.updatedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · {batch.receivedWeightKg ? `${batch.receivedWeightKg} kg, ${batch.mismatch?.deltaPct}% diff` : "confirmed"}</div>
                  </div>
                  <TxLink txHash={batch.confirmTx} />
                </div>
              )}
              {batch.retireTx && (
                <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: "18px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="b8" style={{ fontSize: "15px" }}>Recycled</div>
                    <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.retiredAt ? new Date(batch.retiredAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · retired</div>
                  </div>
                  <TxLink txHash={batch.retireTx} />
                </div>
              )}
              {batch.retirement?.retireTx && (
                <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: 0 }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="b8" style={{ fontSize: "15px" }}>Certified</div>
                    <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.retirement.retiredAt ? new Date(batch.retirement.retiredAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · certified</div>
                  </div>
                  <TxLink txHash={batch.retirement.retireTx} />
                </div>
              )}
            </div>
          </Card>
        </div>

        <div style={{ marginTop: "24px" }}>
          <Card padding="lg">
            <div className="eye">Action area</div>
            <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {batch.status === "in_transit" && (
                <React.Fragment>
                  <Input
                    label="Received weight (kg)"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={receivedWeight}
                    onChange={(e) => setReceivedWeight(e.target.value)}
                    placeholder="e.g. 120"
                    style={{ width: "200px" }}
                  />
                  <div className="flex items-center gap-12" style={{ marginTop: "32px" }}>
                    <p className="text-sm text-muted">Variance: </p>
                    <span className={`b8 ${deltaPct > tolerancePct ? "text-danger" : "text-emerald"}`}>
                      {deltaPct.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted">(tolerance {tolerancePct}%)</span>
                  </div>
                  <Button variant="brand" size="lg" onClick={confirm} disabled={submitting} style={{ marginTop: "16px" }}>
                    {submitting ? "Confirming…" : "Confirm receipt"}
                  </Button>
                </React.Fragment>
              )}
              {batch.status === "received" && (
                <AnchorButton variant="brand" size="lg" href={`/rec/batches/${batch.id}/output`}>
                  Record output<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
                </AnchorButton>
              )}
              {batch.mismatch?.flagged && (
                <Badge variant="flagged">Flagged - cannot retire</Badge>
              )}
              {batch.status === "retired" && (
                <Badge variant="claimed">Retired & certified</Badge>
              )}
            </div>
          </Card>
        </div>

        {batch.status === "flagged" && (
          <Card style={{ marginTop: "24px", borderColor: "var(--color-danger)", background: "var(--color-danger-soft)" }}>
            <div className="eye" style={{ color: "var(--color-danger)" }}>Flagged batch</div>
            <p style={{ marginTop: "8px", color: "var(--color-danger)", fontWeight: 600 }}>
              This batch is flagged. Weight variance: {batch.mismatch?.deltaPct}% (tolerance {tolerancePct}%).
            </p>
            <p style={{ marginTop: "8px", color: "var(--color-muted)" }}>An administrator must resolve the weight mismatch before it can be retired.</p>
          </Card>
        )}

        {batch.status === "retired" && (
          <Card style={{ marginTop: "24px" }} padding="lg">
            <div className="eye">Retirement summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "16px" }}>
              <div className="card p-4"><div className="eye">CO₂e avoided</div><div className="d" style={{ fontSize: "24px", marginTop: "8px" }}>{batch.co2eSavedKg ?? 0} kg</div></div>
              <div className="card p-4"><div className="eye">Credits minted</div><div className="d" style={{ fontSize: "24px", marginTop: "8px" }}>{batch.creditsMinted ?? 0}</div></div>
              <div className="card p-4"><div className="eye">Credit token</div><div className="mono" style={{ marginTop: "8px" }}>{batch.creditTokenId ?? "—"}</div></div>
              <div className="card p-4" style={{ gridColumn: "span 3" }}><div className="eye">Output</div><div style={{ marginTop: "8px" }}>{batch.output?.productType ?? "—"} {batch.output?.quantity ? ` · ${batch.output.quantity}` : ""}</div></div>
              <div className="card p-4" style={{ gridColumn: "span 3" }}><div className="eye">Retired</div><div style={{ marginTop: "8px" }}>{batch.retiredAt ? new Date(batch.retiredAt).toLocaleString() : "—"}</div></div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}