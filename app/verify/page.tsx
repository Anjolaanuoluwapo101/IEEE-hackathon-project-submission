import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function VerifyPage() {
  return (
    <div className="f" style={{ minHeight: "760px", background: "var(--color-bg-primary)" }}>
      <header className="row" style={{ justifyContent: "space-between", padding: "18px 48px", background: "var(--color-card)", borderBottom: "1px solid var(--color-line)" }}>
        <div className="row" style={{ fontWeight: 800, fontSize: "19px", letterSpacing: "-0.02em" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(140deg,#17B873,#075236)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px -8px #0A7A4E" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7" />
            </svg>
            <span>CircuLagos</span>
          </div>
        </div>
        <Badge variant="available">Public page</Badge>
      </header>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 32px" }}>
        <div style={{ textAlign: "center" }}>
          <div className="eye" style={{ color: "var(--color-emerald)" }}>Public verification</div>
          <h1 className="d" style={{ fontSize: "56px", margin: "8px 0 10px" }}>Verify a certificate</h1>
          <p style={{ margin: 0, fontSize: "17px", color: "var(--color-muted)" }}>Enter a certificate ID or scan its QR code.</p>
        </div>

        <Card padding="lg" style={{ marginTop: "40px", maxWidth: "620px", marginLeft: "auto", marginRight: "auto" }}>
          <form action="/verify" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Input
              id="cid"
              name="id"
              label="Certificate ID"
              placeholder="e.g. CL-CERT-0007"
              required
            />
            <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
              <Button type="submit" variant="brand" size="lg">Verify<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></Button>
              <Button variant="secondary" size="lg" type="button"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 7h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M5 17H3a2 2 0 0 1-2-2v-2" /></svg> Scan QR</Button>
            </div>
            <p className="hp" style={{ marginTop: "18px" }}>No account needed. <AnchorButton variant="ghost" size="sm" href="/verify/CL-CERT-0007">Try a sample certificate</AnchorButton></p>
          </form>
        </Card>
      </main>
    </div>
  );
}