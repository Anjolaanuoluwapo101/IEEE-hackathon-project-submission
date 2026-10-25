"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import { CHAIN } from "@/lib/config";
import { findDemoAccount } from "@/lib/demo-users";
import { compressImage } from "@/lib/image-compress";
import type { Batch } from "@/lib/data";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { TxLink } from "@/components/ui/TxLink";
import { ErrorState, EmptyState } from "@/components/ui/States";

const PRODUCTS = [
  "Recycled PET flakes",
  "Recycled HDPE pellets",
  "Recycled mixed plastic",
  "Recycled paper pulp",
  "Glass cullet",
  "Recovered metal",
  "Aluminium ingot",
  "Organic compost",
  "E-waste fractions",
  "Tyre crumb",
];

function newKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type RetireResult = {
  success?: boolean;
  batchId: string;
  status: string;
  material: string;
  weightKg: number;
  co2eSavedKg: number;
  co2eSavedTonnes: number;
  creditsMinted: number;
  creditTokenId: number | null;
  co2eAvoidedKg?: number;
  credits?: number;
  retireTx: string | null;
  photoUrl?: string | null;
  payout?: {
    currency: string;
    pickerAmount: number;
    aggregatorAmount: number;
    txHash?: string | null;
  };
  message?: string;
};

export default function BatchOutputClient({ batchId }: { batchId: string }) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [productType, setProductType] = useState(PRODUCTS[0]);
  const [quantity, setQuantity] = useState("");
  const [qualityGrade, setQualityGrade] = useState("A");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RetireResult | null>(null);
  const [listAmount, setListAmount] = useState("1");
  const [listPriceWei, setListPriceWei] = useState("1000000000000000");
  const [listing, setListing] = useState(false);
  const [listed, setListed] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/batches/${batchId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load batch");
      setBatch(data.batch);
      const weight = data.batch?.receivedWeightKg ?? data.batch?.loggedWeightKg;
      if (weight != null) setQuantity(`${weight} kg`);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load batch");
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
        const weight = data.batch?.receivedWeightKg ?? data.batch?.loggedWeightKg;
        if (weight != null) setQuantity(`${weight} kg`);
      })
      .catch((e) => {
        if (active) {
          setLoadError(e instanceof Error ? e.message : "Could not load batch");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [batchId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!batch) return;

    setSubmitting(true);
    setError(null);
    try {
      let outputPhotoUrl: string | undefined;
      let outputPhotoHash: string | undefined;

      if (photo) {
        const compressed = await compressImage(photo);
        const form = new FormData();
        form.append("prefix", "output");
        form.append("files", compressed);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData?.error ?? "Photo upload failed");
        }
        const image = uploadData.images?.[0];
        outputPhotoUrl = image?.url;
        outputPhotoHash = image?.hash;
      }

      const res = await fetch(`/api/batches/${batch.id}/retire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": newKey(),
        },
        body: JSON.stringify({
          outputProduct: productType,
          outputQuantity: quantity,
          qualityGrade,
          notes: notes || undefined,
          outputPhotoUrl,
          outputPhotoHash,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not retire batch");

      setResult(data as RetireResult);
      if (data.creditTokenId && (data.creditsMinted ?? 0) > 0) {
        setListAmount(String(data.creditsMinted));
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not retire batch");
    } finally {
      setSubmitting(false);
    }
  }

  async function listCredit() {
    if (!result?.creditTokenId) return;
    setListing(true);
    setListError(null);
    try {
      const res = await fetch("/api/marketplace/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: result.creditTokenId,
          amount: Number(listAmount),
          price: listPriceWei,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not list credit");
      setListed(true);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Could not list credit");
    } finally {
      setListing(false);
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

  if (loadError || !batch) {
    return (
      <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
        <aside data-cl-sidebar data-role="recycler" data-active="0" />
        <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
          <ErrorState title="Error" message={loadError ?? "Batch not found"} onRetry={load} retryLabel="Try again" />
        </main>
      </div>
    );
  }

  const picker = findDemoAccount(batch.pickerId);
  const canRetire = batch.status === "received";

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
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Log output and retire</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>Record the recovered material and retire the batch.</p>
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <Card padding="lg" style={{ marginBottom: "24px" }}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="mono b8 text-ink">{batch.id}</span>
              <MaterialBadge material={batch.material} size="sm" />
              <Badge variant={statusVariants[batch.status] || "pending"}>{batch.status.replace("_", " ")}</Badge>
            </div>
            <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--color-muted)" }}>
              {picker?.org ?? batch.pickerId} · {(batch.receivedWeightKg ?? batch.loggedWeightKg).toFixed(1)} kg received
            </p>
          </Card>

          {!canRetire && !result && (
            <Card style={{ marginBottom: "24px", borderColor: "var(--color-amber)", background: "var(--color-amber-soft)" }}>
              <div className="eye" style={{ color: "var(--color-amber)" }}>Cannot retire</div>
              <p style={{ marginTop: "8px", color: "var(--color-amber)", fontWeight: 600 }}>
                This batch is {batch.status}. Only a received batch can be retired.
              </p>
              <AnchorButton href={`/rec/batches/${batch.id}`} variant="ghost" size="sm">View batch</AnchorButton>
            </Card>
          )}

          {canRetire && (
            <form onSubmit={submit} className="space-y-6" style={{ marginBottom: "24px" }}>
              <Card padding="lg">
                <div className="eye">What did you make?</div>
                <div style={{ marginTop: "16px" }}>
                  <Input label="Product type" placeholder="e.g. Recycled PET flakes" value={productType} onChange={(e) => setProductType(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                  <Input label="Quantity (kg)" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g., 950 kg" />
                  <Input label="Quality grade" value={qualityGrade} onChange={(e) => setQualityGrade(e.target.value)} placeholder="A, B, or C" />
                </div>
                <div style={{ marginTop: "16px" }}>
                  <Input label="Notes (optional)" placeholder="Processing notes, buyer, batch quality…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div style={{ marginTop: "16px" }}>
                  <label className="lab">Output photo (optional)</label>
                  <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="w-full text-sm text-neutral-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200" />
                </div>
              </Card>

              <Card padding="lg" style={{ marginTop: "16px" }}>
                <div className="eye">When you retire it</div>
                <div style={{ marginTop: "16px" }}>
                  <p className="text-muted">Retiring this batch mints carbon credits, triggers payouts to the picker and aggregator, and adds the credit to the marketplace.</p>
                  <div className="row ln" style={{ justifyContent: "space-between", padding: "14px 0", marginTop: "16px", fontWeight: 700, borderColor: "var(--color-danger)" }}>
                    <span>Irreversible action: </span>
                    <span className="text-danger">Retiring this batch can&apos;t be undone.</span>
                  </div>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <Button type="submit" variant="brand" size="lg" disabled={submitting || !quantity.trim()} style={{ width: "100%" }}>
                    {submitting ? "Retiring batch…" : "Retire batch"}
                  </Button>
                </div>
              </Card>
            </form>
          )}

          {result && (
            <Card style={{ marginBottom: "24px" }} padding="lg" className="border-green-border bg-mint/30">
              <div className="row" style={{ gap: "14px" }}>
                <div className="lime" style={{ width: "44px", height: "44px", margin: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07130E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <div className="d" style={{ fontSize: "40px" }}>Batch retired</div>
                  <div style={{ color: "#BFF3D8", fontWeight: 600, fontSize: "14px", marginTop: "4px" }}>
                    {result.message ?? "Batch retired successfully. Credits minted and payouts triggered."}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "24px" }}>
                <div className="eye">Payout summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                  <div className="card p-4"><div className="eye">Picker payout</div><div className="d" style={{ fontSize: "28px", marginTop: "8px" }}>{result.payout?.currency ?? "NGN"} {result.payout?.pickerAmount?.toLocaleString() ?? 0}</div></div>
                  <div className="card p-4"><div className="eye">Aggregator payout</div><div className="d" style={{ fontSize: "28px", marginTop: "8px" }}>{result.payout?.currency ?? "NGN"} {result.payout?.aggregatorAmount?.toLocaleString() ?? 0}</div></div>
                </div>
              </div>
              <div style={{ marginTop: "16px" }}>
                <div className="eye">Carbon credits</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px" }}>
                  <div className="card p-4"><div className="eye">CO₂e avoided</div><div className="d" style={{ fontSize: "28px", marginTop: "8px" }}>{result.co2eSavedKg ?? result.co2eAvoidedKg ?? 0} kg</div></div>
                  <div className="card p-4"><div className="eye">Credits minted</div><div className="d" style={{ fontSize: "28px", marginTop: "8px" }}>{result.credits ?? result.creditsMinted ?? 0}</div></div>
                  <div className="card p-4"><div className="eye">Credit token</div><div className="mono" style={{ marginTop: "8px" }}>{result.creditTokenId ?? "—"}</div></div>
                </div>
              </div>
              {result.retireTx && (
                <div style={{ marginTop: "16px" }}>
                  <div className="mono" style={{ color: "var(--color-muted)" }}>Retirement transaction</div>
                  <TxLink txHash={result.retireTx} className="inline-flex" />
                </div>
              )}
              {result.creditTokenId != null && (result.credits ?? result.creditsMinted) > 0 && !listed && (
                <Card padding="lg" style={{ marginTop: "16px", borderColor: "var(--color-emerald)" }}>
                  <div className="eye">List your carbon credit</div>
                  <p className="text-muted mt-2">Only your recycler account can list this credit for producers to buy.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Input label="Amount (credits)" type="number" min="1" step="1" value={listAmount} onChange={(e) => setListAmount(e.target.value)} />
                    <Input label="Price per credit (wei)" type="text" inputMode="numeric" value={listPriceWei} onChange={(e) => setListPriceWei(e.target.value)} />
                  </div>
                  {listError && <p className="mt-2 text-sm text-danger">{listError}</p>}
                  <div style={{ marginTop: "16px" }}>
                    <Button variant="brand" size="lg" onClick={listCredit} disabled={listing} style={{ width: "100%" }}>
                      {listing ? "Listing…" : "List credit"}
                    </Button>
                  </div>
                </Card>
              )}
              {listed && (
                <Card padding="lg" style={{ background: "var(--color-mint)", borderColor: "var(--color-emerald)" }}>
                  <div className="row" style={{ gap: "14px", alignItems: "center" }}>
                    <div className="lime" style={{ width: "44px", height: "44px", margin: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07130E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <div>
                      <div className="d" style={{ fontSize: "24px" }}>Credit listed on marketplace</div>
                      <div style={{ color: "var(--color-muted)", marginTop: "4px" }}>Producers can now buy this credit.</div>
                    </div>
                    <AnchorButton variant="secondary" size="sm" href="/prod/marketplace">View marketplace</AnchorButton>
                  </div>
                </Card>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}