"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialBadge } from "@/components/ui/MaterialBadge";

type PoolBatch = {
  id: string;
  material: string;
  weightKg: number;
  retiredAt: string | null;
  co2eSavedTonnes: number;
  creditsMinted: number;
  claimed: boolean;
};

export default function PoolPageClient() {
  const router = useRouter();
  const [batches, setBatches] = useState<PoolBatch[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const selectedBatches = batches.filter((batch) => selected.has(batch.id));
  const selectedCredits = selectedBatches.reduce(
    (sum, batch) => sum + batch.creditsMinted,
    0
  );
  const selectedTonnes = selectedBatches.reduce(
    (sum, batch) => sum + batch.co2eSavedTonnes,
    0
  );

  const claimable = batches.filter((batch) => !batch.claimed);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Verified batch pool
            </h1>
            <p className="text-neutral-500 mt-1">
              Retired batches available to back a producer certificate. Each batch
              can be claimed once.
            </p>
          </div>
          <Link
            href="/prod/certificates"
            className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-xl bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            My certificates
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : claimable.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <div className="text-neutral-400 text-4xl mb-4">♻️</div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No unclaimed batches
            </h3>
            <p className="text-neutral-500">
              Recyclers must retire batches before they appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <label
                key={batch.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-5 shadow-sm transition-colors ${
                  batch.claimed
                    ? "border-neutral-200 bg-neutral-100 opacity-70 cursor-not-allowed"
                    : selected.has(batch.id)
                      ? "border-green-500 bg-green-50"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
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
                  <p className="mt-2 text-sm text-neutral-600">
                    {batch.weightKg} kg ·{" "}
                    <span className="font-medium text-neutral-900">
                      {batch.creditsMinted} credit
                      {batch.creditsMinted === 1 ? "" : "s"}
                    </span>{" "}
                    · {batch.co2eSavedTonnes} t CO₂e
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Retired{" "}
                    {batch.retiredAt
                      ? new Date(batch.retiredAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        {selected.size > 0 && (
          <div className="sticky bottom-4 mt-6 rounded-2xl border border-green-200 bg-white p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">
                  {selected.size} batch{selected.size === 1 ? "" : "es"}
                </span>{" "}
                · {selectedCredits} credits · {selectedTonnes} t CO₂e
              </div>
              <button
                onClick={() =>
                  router.push(
                    `/prod/certificates/new?batchIds=${Array.from(selected)
                      .map(encodeURIComponent)
                      .join(",")}`
                  )
                }
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700"
              >
                Issue certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
