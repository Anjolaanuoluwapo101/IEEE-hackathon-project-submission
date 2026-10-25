"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialBadge } from "@/components/ui/MaterialBadge";

type PoolBatch = {
  id: string;
  material: string;
  weightKg: number;
  co2eSavedTonnes: number;
  creditsMinted: number;
  claimed: boolean;
};

export default function NewCertificateClient({
  initialBatchIds,
}: {
  initialBatchIds: string[];
}) {
  const router = useRouter();
  const [batches, setBatches] = useState<PoolBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialBatchIds)
  );

  useEffect(() => {
    let active = true;
    fetch("/api/prod/pool", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load pool");
        if (active) setBatches(data.batches ?? []);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Could not load pool");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function issue() {
    const batchIds = Array.from(selected);
    if (batchIds.length === 0) {
      setError("Select at least one batch.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        body: JSON.stringify({ batchIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Certificate issuance failed");
      router.push(`/prod/certificates/${data.certificate.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Certificate issuance failed");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedBatches = batches.filter((batch) => selected.has(batch.id));
  const selectedCredits = selectedBatches.reduce(
    (sum, batch) => sum + batch.creditsMinted,
    0
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/prod/batches" className="text-sm text-green-700 hover:underline">
          ← Back to verified pool
        </Link>

        <div className="mt-4 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Issue certificate
          </h1>
          <p className="text-neutral-500 mt-1">
            Select retired batches to bundle into a producer certificate. Every
            batch can be claimed only once.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-24 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-2">
              {batches.map((batch) => (
                <label
                  key={batch.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                    batch.claimed
                      ? "bg-neutral-100 border-neutral-200 opacity-70 cursor-not-allowed"
                      : selected.has(batch.id)
                        ? "bg-green-50 border-green-500"
                        : "bg-white border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(batch.id)}
                    disabled={batch.claimed}
                    onChange={() => toggle(batch.id)}
                    className="mt-1 h-4 w-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-neutral-700">
                        {batch.id}
                      </span>
                      <MaterialBadge material={batch.material} size="sm" />
                      {batch.claimed && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600">
                          Claimed
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">
                      {batch.weightKg} kg · {batch.creditsMinted} credits ·{" "}
                      {batch.co2eSavedTonnes} t CO₂e
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-medium text-neutral-700">Summary</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Batches</dt>
                  <dd className="font-medium text-neutral-900">{selected.size}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Credits</dt>
                  <dd className="font-medium text-neutral-900">{selectedCredits}</dd>
                </div>
              </dl>
              <button
                onClick={issue}
                disabled={submitting || selected.size === 0}
                className="mt-4 w-full py-2.5 px-4 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Issuing…" : "Issue certificate"}
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
