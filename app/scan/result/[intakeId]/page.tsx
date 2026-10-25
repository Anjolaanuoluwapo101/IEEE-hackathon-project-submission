import { Metadata } from "next";
import { notFound } from "next/navigation";
import { readIntakes } from "@/lib/data";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel, StatTile } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaterialBadge } from "@/components/ui/MaterialBadge";

interface Props {
  params: Promise<{ intakeId: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ intakeId: string }> }): Promise<Metadata> {
  const { intakeId } = await params;
  return {
    title: `Scan Result - CircuLagos`,
    description: `View scan result for intake ${intakeId}`,
  };
}

export default async function ScanResultPage({ params }: { params: Promise<{ intakeId: string }> }) {
  const { intakeId } = await params;
  const intakes = await readIntakes();
  const intake = intakes.find((i) => i.id === intakeId);

  if (!intake) notFound();

  const ai = intake.aiResult;
  const material = ai ? ai.material : "unknown";
  const confidence = ai ? Math.round(ai.confidence * 100) : 0;
  const priceEstimate = ai?.valueEstimate ?? 0;

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="picker" data-active="0" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Picker</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Scan result</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>What we found in your photo.</p>
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
            <DarkPanel padding="lg" style={{ minHeight: "360px" }}>
              <Badge variant="available" style={{ alignSelf: "flexStart" }}><i />{confidence}% match</Badge>
              <div className="eye" style={{ color: "#9FE9C3", marginTop: "28px" }}>Detected</div>
              <div className="d" style={{ fontSize: "64px", marginTop: "8px" }}>{material.charAt(0).toUpperCase() + material.slice(1)}</div>
            </DarkPanel>

            <div>
              <Card padding="lg">
                <div className="eye">Estimated price</div>
                <div className="d" style={{ fontSize: "56px", marginTop: "8px" }}>
                  ₦{priceEstimate.toLocaleString()}<span style={{ fontSize: "20px", color: "var(--color-muted)" }}> /kg</span>
                </div>
                <p className="hp">Final value depends on the weighed amount.</p>
              </Card>

              <Card padding="lg" style={{ marginTop: "16px" }}>
                <div className="row" style={{ gap: "12px", padding: "8px 0", fontWeight: 700 }}>
                  <div className="tile" style={{ width: "36px", height: "36px", borderRadius: "12px" }} />
                  Rinse and remove the caps
                </div>
                <div className="row" style={{ gap: "12px", padding: "8px 0", fontWeight: 700 }}>
                  <div className="tile" style={{ width: "36px", height: "36px", borderRadius: "12px" }} />
                  Crush bottles flat
                </div>
              </Card>

              <div style={{ marginTop: "20px" }}>
                <Button variant="primary" size="lg" style={{ width: "100%" }}>
                  Take to aggregator<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}