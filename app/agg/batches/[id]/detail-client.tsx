"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { CHAIN } from "@/lib/config";
import { DEMO_RECYCLERS, findDemoAccount } from "@/lib/demo-users";
import type { Batch } from "@/lib/data";

function shortHash(hash?: string | null) {
  if (!hash) return "—";
  return hash.length > 16 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash;
}

function TxRow({ label, hash }: { label: string; hash?: string | null }) {
  if (!hash) {
    return (
      <div className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 last:border-0">
        <span className="text-neutral-500">{label}</span>
        <span className="text-neutral-400">Not yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <a
        href={`${CHAIN.explorer}/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-green-700 hover:underline"
      >
        {shortHash(hash)}
      </a>
    </div>
  );
}

export default function AggBatchDetailClient({ batchId }: { batchId: string }) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recyclerId, setRecyclerId] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${batchId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load batch");
      setBatch(data.batch);
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
        if (active) setBatch(data.batch);
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

  async function transfer() {
    if (!recyclerId || !batch) return;
    setTransferring(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/batches/${batch.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recyclerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transfer failed");
      setNotice(`Batch transferred to ${findDemoAccount(recyclerId)?.org ?? recyclerId}.`);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setTransferring(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="h-40 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error ?? "Batch not found"}
          </div>
          <Link href="/agg/batches" className="inline-block mt-4 text-sm text-green-700 underline">
            Back to batches
          </Link>
        </div>
      </div>
    );
  }

  const picker = findDemoAccount(batch.pickerId);
  const recycler = batch.recyclerId ? findDemoAccount(batch.recyclerId) : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/agg/batches" className="text-sm text-green-700 hover:underline">
          ← Back to batches
        </Link>

        <div className="mt-4 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg text-neutral-800">{batch.id}</span>
            <MaterialBadge material={batch.material} size="sm" />
            <StatusPill status={batch.status} size="sm" />
            {batch.demo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                Demo
              </span>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-neutral-500">Logged weight</dt>
              <dd className="font-medium text-neutral-900">{batch.loggedWeightKg} kg</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Received weight</dt>
              <dd className="font-medium text-neutral-900">
                {batch.receivedWeightKg != null ? `${batch.receivedWeightKg} kg` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Registered</dt>
              <dd className="font-medium text-neutral-900">
                {new Date(batch.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Picker</dt>
              <dd className="font-medium text-neutral-900">{picker?.org ?? batch.pickerId}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Recycler</dt>
              <dd className="font-medium text-neutral-900">
                {recycler?.org ?? (batch.recyclerId || "Unassigned")}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Location</dt>
              <dd className="font-medium text-neutral-900">{batch.location || "—"}</dd>
            </div>
          </dl>

          {batch.mismatch && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">Weight mismatch</p>
              <p className="mt-1">
                {batch.mismatch.deltaPct}% variance against a {batch.mismatch.tolerancePct}% tolerance.
                {batch.mismatch.flagged
                  ? " This batch was flagged and cannot be retired."
                  : " Within tolerance."}
              </p>
            </div>
          )}
        </div>

        {batch.status === "registered" && (
          <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-900">Assign a recycler</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Pick the facility that will receive and process this batch.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                value={recyclerId}
                onChange={(e) => setRecyclerId(e.target.value)}
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a recycler…</option>
                {DEMO_RECYCLERS.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.org} — {account.area}
                  </option>
                ))}
              </select>
              <button
                onClick={transfer}
                disabled={!recyclerId || transferring}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferring ? "Transferring…" : "Transfer batch"}
              </button>
            </div>
            {notice && <p className="mt-3 text-sm text-neutral-700">{notice}</p>}
          </div>
        )}

        {batch.evidenceUrls && batch.evidenceUrls.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-900">Evidence</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {batch.evidenceUrls.map((url) => (
                <Image
                  key={url}
                  src={url}
                  alt="Batch evidence"
                  width={320}
                  height={240}
                  unoptimized
                  className="h-32 w-full rounded-lg object-cover border border-neutral-200"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900">Chain trail</h2>
          <div className="mt-3">
            <TxRow label="Registration" hash={batch.registerTx} />
            <TxRow label="Transfer to recycler" hash={batch.transferTx} />
            <TxRow label="Receipt confirmation" hash={batch.confirmTx} />
            <TxRow label="Retirement" hash={batch.retireTx} />
          </div>
        </div>

        {batch.status === "retired" && (
          <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-900">Retirement</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-neutral-500">CO₂e avoided</dt>
                <dd className="font-medium text-neutral-900">
                  {batch.co2eSavedKg ?? 0} kg
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Credits minted</dt>
                <dd className="font-medium text-neutral-900">{batch.creditsMinted ?? 0}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Credit token</dt>
                <dd className="font-mono text-neutral-900">{batch.creditTokenId ?? "—"}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
