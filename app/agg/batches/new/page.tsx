import { Metadata } from "next";
import { readIntakes, readBatches, getEmissionFactor, getPricePerKg } from "@/lib/data";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Register Batch - Aggregator",
  description: "Register a new batch",
};

export default async function AggRegisterBatchPage() {
  const [intakes, batches] = await Promise.all([readIntakes(), readBatches()]);
  const linkedIntakeIds = new Set(batches.map((b) => b.intakeId).filter(Boolean));
  const availableIntakes = intakes.filter((i) => i.status === "classified" && !linkedIntakeIds.has(i.id));

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="aggregator" data-active="2" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Aggregator</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Register batch</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>Select a picker&apos;s scan and log the weight.</p>
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
            <DarkPanel padding="lg" style={{ minHeight: "420px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", textAlign: "center" }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9FE9C3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
              <div className="d" style={{ fontSize: "28px" }}>Picker&apos;s scan</div>
              <div style={{ color: "#BFF3D8", fontWeight: 600 }}>Attached evidence will appear here</div>
            </DarkPanel>

            <Card padding="lg">
              <div className="eye">1 · Picker</div>
              <Input
                label="Search pickers"
                placeholder="Type name or area"
                style={{ marginTop: "10px", marginBottom: "10px" }}
              />
              <div className="row" style={{ gap: "8px", flexWrap: "wrap" }}>
                {[
                  { id: "picker-001", name: "Adeola Bakare", area: "Ikeja" },
                  { id: "picker-002", name: "Chinedu Okeke", area: "Yaba" },
                  { id: "picker-003", name: "Fatima Sule", area: "Surulere" },
                ].map((p) => (
                  <Badge key={p.id} variant="available" style={{ cursor: "pointer" }}><i />{p.name} · {p.area}</Badge>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <Card padding="lg">
              <div className="eye">2 · Details</div>
              <Input label="Material" placeholder="PET, HDPE, Paper, Glass, Aluminium" style={{ marginTop: "10px" }} />
              <Input label="Weight (kg), required" type="number" placeholder="e.g. 120" style={{ marginTop: "20px" }} />
              <Input label="Location" placeholder="e.g. Ikeja, Lagos" style={{ marginTop: "20px" }} />
              <Input label="Notes (optional)" placeholder="Any additional details" style={{ marginTop: "20px" }} />
              <div style={{ marginTop: "20px" }}>
                <Button variant="brand" size="lg" style={{ width: "100%" }}>Register batch<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></Button>
              </div>
            </Card>

            <Card padding="lg">
              <div className="eye">Evidence from the picker&apos;s scan</div>
              <div style={{ marginTop: "10px", height: "200px", background: "var(--color-line)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>
                [Picker&apos;s photo + AI classification]
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}