"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import type { Certificate } from "@/lib/data";

type CertificatePayload = {
  certificate: Certificate;
  producer: { id: string; name: string; org: string };
  batches: Array<{
    id: string;
    material: string;
    weightKg: number;
    receivedWeightKg: number | null;
    retiredAt: string | null;
    co2eSavedTonnes: number | null;
    creditsMinted: number | null;
    creditTokenId: number | null;
  }>;
};

export function CertificateView({
  certificateId,
  backHref,
  backLabel,
}: {
  certificateId: string;
  backHref?: string;
  backLabel?: string;
}) {
  const [payload, setPayload] = useState<CertificatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/certificates/${certificateId}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Certificate not found");
        if (active) setPayload(data);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Could not load certificate");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [certificateId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 animate-pulse">
        <div className="h-5 bg-neutral-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error ?? "Certificate not found"}
      </div>
    );
  }

  const { certificate, producer, batches } = payload;

  return (
    <div className="space-y-6">
      {backHref && (
        <Link href={backHref} className="text-sm text-green-700 hover:underline">
          ← {backLabel ?? "Back"}
        </Link>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-green-700">
              Verified recycling certificate
            </p>
            <h1 className="mt-1 font-mono text-xl text-neutral-900">{certificate.id}</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Issued to {producer.org} on{" "}
              {new Date(certificate.issuedAt).toLocaleString()}
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-sm font-medium text-green-800">
            Issued
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-neutral-500">Total credits</dt>
            <dd className="text-2xl font-semibold text-neutral-900">
              {certificate.totalCredits}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Batches</dt>
            <dd className="font-medium text-neutral-900">{batches.length}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Producer</dt>
            <dd className="font-medium text-neutral-900">{producer.org}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <h2 className="text-sm font-medium text-neutral-700">Credits by material</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(certificate.totalsByMaterial).map(([material, tonnes]) => (
              <span
                key={material}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm"
              >
                <MaterialBadge material={material} size="sm" />
                <span className="font-medium text-neutral-900">{tonnes} t</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-neutral-900">Verified batches</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="py-2 pr-4 font-medium">Batch</th>
                <th className="py-2 pr-4 font-medium">Material</th>
                <th className="py-2 pr-4 font-medium">Weight</th>
                <th className="py-2 pr-4 font-medium">CO₂e</th>
                <th className="py-2 pr-4 font-medium">Credits</th>
                <th className="py-2 font-medium">Retired</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-3 pr-4 font-mono text-neutral-700">{batch.id}</td>
                  <td className="py-3 pr-4">
                    <MaterialBadge material={batch.material} size="sm" />
                  </td>
                  <td className="py-3 pr-4 text-neutral-700">{batch.weightKg} kg</td>
                  <td className="py-3 pr-4 text-neutral-700">
                    {batch.co2eSavedTonnes ?? 0} t
                  </td>
                  <td className="py-3 pr-4 text-neutral-700">
                    {batch.creditsMinted ?? 0}
                  </td>
                  <td className="py-3 text-neutral-500">
                    {batch.retiredAt
                      ? new Date(batch.retiredAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        This certificate references batches recorded in the CircuLagos demo ledger.
        Share the page URL for public verification.
      </p>
    </div>
  );
}
