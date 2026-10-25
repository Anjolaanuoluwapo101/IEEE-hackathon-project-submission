import { Metadata } from "next";
import { getImpactStats } from "@/lib/analytics";
import { readBatches } from "@/lib/data";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel, StatTile } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import { TxLink } from "@/components/ui/TxLink";

export const metadata: Metadata = {
  title: "Aggregator Overview - CircuLagos",
  description: "Aggregator dashboard",
};

export default async function AggOverviewPage() {
  const [stats, batches] = await Promise.all([
    getImpactStats(),
    readBatches(),
  ]);

  const flaggedBatches = batches.filter((b) => b.status === "flagged").slice(0, 3);

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="aggregator" data-active="0" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Aggregator</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Good morning</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>Here is where your batches stand today.</p>
          </div>
          <div className="row">
            <Button variant="secondary">View batches</Button>
            <AnchorButton variant="brand" href="/agg/batches/new">Register batch<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></AnchorButton>
          </div>
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: "16px", marginTop: "32px" }}>
          <DarkPanel padding="md">
            <div className="eye" style={{ color: "#9FE9C3" }}>Registered</div>
            <div className="d" style={{ fontSize: "56px", marginTop: "10px" }}>{stats.batchCount}</div>
            <div style={{ fontSize: "13px", color: "#BFF3D8", fontWeight: 600 }}>batches</div>
          </DarkPanel>
          <StatTile label="In transit" value={stats.byMaterial.in_transit ?? 0} subtext="on the way" variant="light" />
          <StatTile label="Flagged" value={stats.byMaterial.flagged ?? 0} subtext="needs review" variant="light" />
          <StatTile label="Earned" value={`₦${(stats.pickersPaid * 50000).toLocaleString()}`} subtext="your share" variant="light" />
        </section>

        <div className="eye" style={{ margin: "32px 0 12px" }}>Needs attention</div>
        <Card className="row" style={{ padding: "16px", gap: "16px", borderColor: "#F3B7C4", flexWrap: "wrap" }}>
          {flaggedBatches.length > 0 ? (
            flaggedBatches.map((batch) => (
              <div key={batch.id} className="row" style={{ gap: "12px", padding: "12px", background: "var(--color-danger-soft)", borderRadius: "12px" }}>
                <div className="b8" style={{ color: "#D61F45" }}>{batch.id}</div>
                <MaterialBadge material={batch.material} size="sm" />
                <span className="bd" style={{ background: "#FDE7EC", color: "#D61F45" }}><i />Flagged</span>
                <AnchorButton variant="ghost" size="sm" href={`/agg/batches/${batch.id}`}>Review</AnchorButton>
              </div>
            ))
          ) : (
            <div className="flex-1 text-center text-muted py-8">No batches need attention</div>
          )}
        </Card>

        <div className="eye" style={{ margin: "32px 0 12px" }}>Recent batches</div>
        <Card style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-line)", textAlign: "left", color: "var(--color-muted)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                <th style={{ padding: "14px 20px" }}>Batch</th>
                <th style={{ padding: "14px 20px" }}>Material</th>
                <th style={{ padding: "14px 20px" }}>Weight</th>
                <th style={{ padding: "14px 20px" }}>Status</th>
                <th style={{ padding: "14px 20px" }}>Holder</th>
              </tr>
            </thead>
            <tbody>
              {batches.slice(0, 5).map((batch) => (
                <tr key={batch.id} style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                  <td style={{ padding: "14px 20px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-ink)" }}>{batch.id}</td>
                  <td style={{ padding: "14px 20px" }}><MaterialBadge material={batch.material} size="sm" /></td>
                  <td style={{ padding: "14px 20px", color: "var(--color-text-primary)" }}>{batch.loggedWeightKg} kg</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span className={`bd ${batch.status === "registered" ? "bg-teal-soft text-teal" : batch.status === "in_transit" ? "bg-info-soft text-info" : batch.status === "flagged" ? "bg-danger-soft text-danger" : "bg-teal-soft text-teal"}`}><i />{batch.status}</span>
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--color-muted)" }}>{batch.recyclerId ?? batch.aggregatorId}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="hp" style={{ marginTop: "12px", padding: "0 20px 16px" }}>Showing 5 of {batches.length}</div>
        </Card>
      </main>
    </div>
  );
}