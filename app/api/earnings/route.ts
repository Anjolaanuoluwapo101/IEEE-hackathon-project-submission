import { NextResponse } from "next/server";
import { readPayouts } from "@/lib/data";
import { failure } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";

type Period = "week" | "month" | "year";
const PERIOD_DAYS: Record<Period, number> = {
  week: 7,
  month: 30,
  year: 365,
};

function parsePeriod(value: string | null): Period | null {
  return value === "week" || value === "month" || value === "year"
    ? value
    : null;
}

export async function GET(req: Request) {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;
    const session = auth.session;

    const { searchParams } = new URL(req.url);
    const period = parsePeriod(searchParams.get("period"));

    const payouts = (await readPayouts()).filter(
      (payout) =>
        payout.recipientId === session.id && payout.role === session.role
    );

    const cutoff = period
      ? Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000
      : null;

    const inPeriod = cutoff
      ? payouts.filter((payout) => {
          const created = Date.parse(payout.createdAt);
          return Number.isFinite(created) && created >= cutoff;
        })
      : payouts;

    const totalEarned = inPeriod.reduce((sum, payout) => sum + payout.amount, 0);

    const byMaterial: Record<string, number> = {};
    for (const payout of inPeriod) {
      byMaterial[payout.material] =
        (byMaterial[payout.material] ?? 0) + payout.amount;
    }

    const currency = inPeriod[0]?.currency ?? payouts[0]?.currency ?? "NGN";

    const sorted = inPeriod
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return NextResponse.json({
      success: true,
      role: session.role,
      recipientId: session.id,
      period: period ?? "all",
      currency,
      totalEarned: Math.round(totalEarned * 100) / 100,
      count: inPeriod.length,
      byMaterial,
      payouts: sorted.slice(0, 50),
    });
  } catch (err) {
    return failure(err, "Failed to fetch earnings");
  }
}
