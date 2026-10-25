"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/StatusPill";
import { MaterialBadge } from "@/components/ui/MaterialBadge";

type BatchStatus = "registered" | "in_transit" | "received" | "flagged" | "retired";

type BatchListing = {
  id: string;
  material: string;
  loggedWeightKg: number;
  receivedWeightKg: number | null;
  status: BatchStatus;
  createdAt: string;
};

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "in_transit", label: "In transit" },
  { value: "received", label: "Received" },
  { value: "flagged", label: "Flagged" },
  { value: "retired", label: "Retired" },
];

export default function RecyclerBatchesPageClient() {
  const [statusFilter, setStatusFilter] = useState("");
  const [batches, setBatches] = useState<BatchListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/batches", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch batches");
      const data = await res.json();
      setBatches(data.batches ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load batches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/batches", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch batches");
        return res.json();
      })
      .then((data) => {
        if (active) setBatches(data.batches ?? []);
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Could not load batches");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredBatches = batches.filter(
    (batch) => !statusFilter || batch.status === statusFilter
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Incoming batches</h1>
          <p className="text-neutral-500 mt-1">
            Batches assigned to your recycler facility. Confirm weight on receipt,
            then record the recovered output.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="px-4 py-3 text-sm border border-neutral-300 rounded-xl bg-white hover:bg-neutral-100 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-6 animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <div className="text-neutral-400 text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No batches found</h3>
            <p className="text-neutral-500">
              {statusFilter
                ? `No batches with status "${statusFilter}"`
                : "No batches awaiting your action yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBatches.map((batch) => (
              <article
                key={batch.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-neutral-600">{batch.id}</span>
                      <MaterialBadge material={batch.material} size="sm" />
                      <StatusPill status={batch.status} size="sm" />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                      <span>
                        Logged:{" "}
                        <span className="font-medium text-neutral-900">{batch.loggedWeightKg}</span> kg
                      </span>
                      {batch.receivedWeightKg != null && (
                        <span>
                          Received:{" "}
                          <span className="font-medium text-neutral-900">{batch.receivedWeightKg}</span> kg
                        </span>
                      )}
                      <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {batch.status === "in_transit" && (
                      <Link
                        href={`/rec/batches/${batch.id}`}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
                      >
                        Confirm receipt
                      </Link>
                    )}
                    {batch.status === "received" && (
                      <Link
                        href={`/rec/batches/${batch.id}/output`}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
                      >
                        Record output
                      </Link>
                    )}
                    {batch.status === "flagged" && (
                      <span className="inline-flex items-center px-4 py-2 border border-amber-300 text-amber-700 rounded-xl font-medium text-sm bg-amber-50">
                        Flagged — weight mismatch
                      </span>
                    )}
                    {batch.status === "retired" && (
                      <Link
                        href={`/rec/batches/${batch.id}`}
                        className="inline-flex items-center px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl font-medium text-sm bg-white hover:bg-neutral-50 transition-colors"
                      >
                        View summary
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
