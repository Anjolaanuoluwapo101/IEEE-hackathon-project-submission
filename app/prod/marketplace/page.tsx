"use client";

import { Suspense } from "react";
import MarketplacePageClient from "./MarketplacePageClient";

export default function MarketplacePage() {
  return (
    <Suspense fallback={<p className="text-neutral-500 p-8">Loading marketplace…</p>}>
      <MarketplacePageClient />
    </Suspense>
  );
}