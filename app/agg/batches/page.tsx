import { Metadata } from "next";
import { readBatches } from "@/lib/data";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Batches - Aggregator",
  description: "Manage your batches",
};

export default async function AggBatchesPage() {
  const batches = await readBatches();
  const aggBatches = batches.filter((b) => b.aggregatorId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="aggregator" data-active="1" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Aggregator</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Batches</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>All batches you have registered.</p>
          </div>
          <AnchorButton variant="brand" href="/agg/batches/new">Register batch<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></AnchorButton>
        </div>

        <div style={{ marginTop: "24px" }}>
          <Input
            placeholder="Search by batch ID"
            style={{ maxWidth: "300px", marginBottom: "16px" }}
          />
          <div className="row" style={{ gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <Badge variant="registered">All</Badge>
            <Badge variant="registered">Registered</Badge>
            <Badge variant="in_transit">In transit</Badge>
            <Badge variant="recycled">Received</Badge>
            <Badge variant="flagged">Flagged</Badge>
            <Badge variant="recycled">Recycled</Badge>
          </div>

          <Card>
            {aggBatches.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-muted">No batches yet. <AnchorButton href="/agg/batches/new">Register your first batch</AnchorButton>.</p>
              </div>
            ) : (
              aggBatches.map((batch) => (
                <div key={batch.id} className="card p-5 hover:shadow-lg transition-shadow cursor-pointer" style={{ marginBottom: "10px" }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AnchorButton href={`/agg/batches/${batch.id}`} variant="ghost" size="sm" className="mono b8 text-ink hover:text-emerald">{batch.id}</AnchorButton>
                      <MaterialBadge material={batch.material} size="sm" />
                    </div>
                    <Badge variant={
                      batch.status === "registered" ? "registered" :
                      batch.status === "in_transit" ? "in_transit" :
                      batch.status === "received" ? "recycled" :
                      batch.status === "flagged" ? "flagged" :
                      batch.status === "retired" ? "recycled" : "pending"
                    }>{batch.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted mt-1">{batch.material}</p>
                  <p className="text-sm font-medium text-ink mt-1">{batch.loggedWeightKg} kg</p>
                  <p className="text-xs text-muted mt-1">Recycler: {batch.recyclerId || "—"}</p>
                </div>
              ))
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}