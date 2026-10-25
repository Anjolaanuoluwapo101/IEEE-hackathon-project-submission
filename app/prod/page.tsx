import { Suspense } from "react";
import MarketplacePageClient from "./marketplace/MarketplacePageClient";
import PoolPageClient from "./batches/pool-client";
import CertificatesPageClient from "./certificates/certificates-client";

export default function ProducerPage() {
  return (
    <Suspense fallback={<p className="text-neutral-500 p-8">Loading producer dashboard…</p>}>
      <div className="space-y-6">
        <MarketplacePageClient />
        <PoolPageClient />
        <CertificatesPageClient />
      </div>
    </Suspense>
  );
}