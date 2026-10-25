import { Metadata } from "next";
import { readBatches } from "@/lib/data";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaterialBadge } from "@/components/ui/MaterialBadge";

export const metadata: Metadata = {
  title: "Inbox - Recycler",
  description: "Incoming batches awaiting confirmation",
};

export default async function RecyclerInboxPage() {
  const batches = await readBatches();
  const incoming = batches.filter((b) => b.status === "registered" && b.recyclerId);
  const received = batches.filter((b) => b.status === "received" && b.recyclerId).slice(0, 5);
  const flagged = batches.filter((b) => b.status === "flagged" && b.recyclerId).slice(0, 5);

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="recycler" data-active="0" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Recycler</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Inbox</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>Batches awaiting your confirmation.</p>
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <div className="row" style={{ marginBottom: "16px" }}>
            <Badge variant="new">New</Badge>
            <Badge variant="registered" style={{ marginLeft: "8px" }}>Registered</Badge>
            <Badge variant="flagged" style={{ marginLeft: "8px" }}>Flagged</Badge>
          </div>

          <Card>
            <div className="eye" style={{ marginBottom: "16px" }}>Waiting for you</div>
            {incoming.length === 0 ? (
              <p className="text-muted p-8 text-center">No incoming batches</p>
            ) : (
              incoming.map((batch) => (
                <div key={batch.id} className="card p-5 hover:shadow-lg transition-shadow cursor-pointer" style={{ marginBottom: "10px" }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AnchorButton href={`/rec/batches/${batch.id}`} variant="ghost" size="sm" className="mono b8 text-ink hover:text-emerald">{batch.id}</AnchorButton>
                      <span className="bd sm bg-lime text-ink"><i />New</span>
                      <MaterialBadge material={batch.material} size="sm" />
                    </div>
                    <div className="mono text-muted" style={{ fontSize: "14px" }}>{batch.loggedWeightKg} kg</div>
                    <AnchorButton variant="brand" size="sm" href={`/rec/batches/${batch.id}`}>Review<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></AnchorButton>
                  </div>
                  <p className="text-sm text-muted mt-1">{batch.material}</p>
                  <p className="text-sm font-medium text-ink mt-1">{batch.loggedWeightKg} kg</p>
                </div>
              ))
            )}
          </Card>
        </div>

        <section style={{ marginTop: "32px" }}>
          <div className="row" style={{ gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <Badge variant="recycled">Received</Badge>
            <Badge variant="flagged">Flagged</Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <Card>
              <div className="eye" style={{ marginBottom: "16px" }}>Received</div>
              {received.length === 0 ? (
                <p className="text-muted p-8 text-center">No received batches</p>
              ) : (
                received.map((batch) => (
                  <div key={batch.id} className="card p-4 hover:shadow-lg transition-shadow" style={{ marginBottom: "10px" }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <AnchorButton href={`/rec/batches/${batch.id}`} variant="ghost" size="sm" className="mono b8 text-ink hover:text-emerald">{batch.id}</AnchorButton>
                        <MaterialBadge material={batch.material} size="sm" />
                        <Badge variant="recycled">Received</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted mt-1">{batch.material} · {batch.receivedWeightKg ?? batch.loggedWeightKg} kg</p>
                    <p className="text-xs text-muted mt-1">{batch.updatedAt ? new Date(batch.updatedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"}</p>
                  </div>
                ))
              )}
            </Card>

            <Card>
              <div className="eye" style={{ marginBottom: "16px", color: "var(--color-danger)" }}>Flagged</div>
              {flagged.length === 0 ? (
                <p className="text-muted p-8 text-center">No flagged batches</p>
              ) : (
                flagged.map((batch) => (
                  <div key={batch.id} className="card p-4 hover:shadow-lg transition-shadow border-danger-border" style={{ marginBottom: "10px" }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <AnchorButton href={`/rec/batches/${batch.id}`} variant="ghost" size="sm" className="mono b8 text-ink hover:text-emerald">{batch.id}</AnchorButton>
                        <MaterialBadge material={batch.material} size="sm" />
                        <Badge variant="flagged">Flagged</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted mt-1">{batch.material} · {batch.loggedWeightKg} kg (diff: {batch.mismatch?.deltaPct}%)</p>
                    <AnchorButton variant="ghost" size="sm" href={`/rec/batches/${batch.id}`}>Review</AnchorButton>
                  </div>
                ))
              )}
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}