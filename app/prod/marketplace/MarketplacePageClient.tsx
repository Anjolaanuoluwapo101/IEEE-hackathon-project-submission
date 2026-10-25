"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Listing = {
  tokenId: number;
  amount: number;
  price: number;
  sellerId: string;
  sellerName: string;
  status: "active" | "sold";
  active: boolean;
};

function formatEth(wei: number) {
  return (wei / 1e18).toFixed(4);
}

export default function MarketplacePageClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [buyingToken, setBuyingToken] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch marketplace");
      setListings(data.listings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load marketplace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/marketplace", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch marketplace");
        if (active) setListings(data.listings ?? []);
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Could not load marketplace");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function buy(listing: Listing) {
    setBuyingToken(listing.tokenId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: listing.tokenId, amount: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not buy the credit");
      setNotice(
        `Purchased 1 credit from ${listing.sellerName} (token ${listing.tokenId}).`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not buy the credit");
    } finally {
      setBuyingToken(null);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Carbon credit marketplace
            </h1>
            <p className="text-neutral-500 mt-1">
              Buy verified credits minted by recycler facilities. Only recycler
              accounts can list credits.
            </p>
          </div>
          <Link
            href="/prod/batches"
            className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-xl bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Issued certificates
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {notice}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-700">Active listings</h2>
          <button
            onClick={load}
            className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg bg-white hover:bg-neutral-100"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <div className="text-neutral-400 text-4xl mb-4">🌱</div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No credits listed yet
            </h3>
            <p className="text-neutral-500">
              Recyclers list credits after retiring verified batches.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <article
                key={listing.tokenId}
                className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-neutral-600">
                        Token {listing.tokenId}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          listing.active
                            ? "bg-green-100 text-green-800"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {listing.active ? "Active" : "Sold out"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">
                      {listing.amount} credit{listing.amount === 1 ? "" : "s"} from{" "}
                      <span className="font-medium text-neutral-900">
                        {listing.sellerName}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {listing.price.toLocaleString()} wei per credit · ≈{" "}
                      {formatEth(listing.price)} ETH
                    </p>
                  </div>
                  <button
                    onClick={() => buy(listing)}
                    disabled={!listing.active || listing.amount < 1 || buyingToken === listing.tokenId}
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buyingToken === listing.tokenId ? "Buying…" : "Buy 1 credit"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
