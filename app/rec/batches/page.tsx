import { Metadata } from "next";
import { readBatches } from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const metadata: Metadata = {
  title: "Batches - Recycler",
  description: "All batches handled",
};

export default async function RecyclerBatchesPage() {
  const batches = await readBatches();
  const recyclerBatches = batches.filter((b) => b.recyclerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="recycler" data-active="1" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Recycler</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Batches</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>All batches you have handled.</p>
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
          <Input placeholder="Search by batch ID" style={{ maxWidth: "300px", marginBottom: "16px" }} />
          <div className="row" style={{ gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <Badge variant="registered">All</Badge>
            <Badge variant="registered">Registered</Badge>
            <Badge variant="in_transit">In transit</Badge>
            <Badge variant="recycled">Received</Badge>
            <Badge variant="flagged">Flagged</Badge>
            <Badge variant="recycled">Recycled</Badge>
          </div>

          <Card>
            {batches.filter((b) => b.recyclerId).length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-muted">No batches yet.</p>
              </div>
            ) : (
              batches.filter((b) => b.recyclerId).map((batch) => (
                <div key={batch.id} className="card p-5 hover:shadow-lg transition-shadow" style={{ marginBottom: "10px" }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AnchorButton href={`/rec/batches/${batch.id}`} variant="ghost" size="sm" className="mono b8 text-ink hover:text-emerald">{batch.id}</AnchorButton>
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
                  <p className="text-xs text-muted mt-1">Picker: {batch.pickerId}</p>
                </div>
              ))
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}