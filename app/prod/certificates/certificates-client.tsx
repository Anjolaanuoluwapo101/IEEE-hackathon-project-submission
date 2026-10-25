"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import type { Certificate } from "@/lib/data";

export default function CertificatesPageClient() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/certificates", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load certificates");
        if (active) setCertificates(data.certificates ?? []);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Could not load certificates");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              My certificates
            </h1>
            <p className="text-neutral-500 mt-1">
              Verified recycling certificates issued to your producer account.
            </p>
          </div>
          <Link
            href="/prod/batches"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700"
          >
            Claim batches
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <div className="text-neutral-400 text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No certificates yet
            </h3>
            <p className="text-neutral-500 mb-6">
              Choose verified batches from the pool to issue your first certificate.
            </p>
            <Link
              href="/prod/batches"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl font-semibold text-base hover:bg-green-700"
            >
              Browse verified batches
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((certificate) => (
              <article
                key={certificate.id}
                className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link
                      href={`/prod/certificates/${certificate.id}`}
                      className="font-mono text-sm text-green-700 hover:underline"
                    >
                      {certificate.id}
                    </Link>
                    <p className="mt-1 text-sm text-neutral-500">
                      {certificate.batchIds.length} batch
                      {certificate.batchIds.length === 1 ? "" : "es"} ·{" "}
                      {certificate.totalCredits} credits ·{" "}
                      {new Date(certificate.issuedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.keys(certificate.totalsByMaterial).map((material) => (
                        <MaterialBadge key={material} material={material} size="sm" />
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/prod/certificates/${certificate.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    View certificate
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
