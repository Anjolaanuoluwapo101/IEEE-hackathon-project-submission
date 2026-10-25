import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CANONICAL_MATERIALS,
  DEFAULT_EMISSION_FACTORS,
  DEFAULT_PRICES_NGN,
} from "../lib/materials";

const GIST_API = "https://api.github.com/gists";

type Env = Record<string, string>;

async function readEnv(): Promise<Env> {
  const raw = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
  const env: Env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return env;
}

function buildSeedFiles(): Record<string, unknown> {
  const factors: Record<string, unknown> = {};
  for (const material of CANONICAL_MATERIALS) {
    factors[material] = {
      price_per_kg: DEFAULT_PRICES_NGN[material],
      emission_factor_kg_co2e_per_kg: DEFAULT_EMISSION_FACTORS[material],
      source: "EPA AP-42 Ch.2; IPCC AR6 WGIII",
    };
  }

  const config = {
    currency: "NGN",
    payoutSplit: { picker: 70, aggregator: 30 },
    weightTolerancePct: 5,
    materials: [...CANONICAL_MATERIALS],
    pricePerKg: { ...DEFAULT_PRICES_NGN },
    emissionFactorsKgCO2ePerKg: { ...DEFAULT_EMISSION_FACTORS },
    updatedAt: new Date().toISOString(),
  };

  const emissions = {
    source: "EPA AP-42 Ch.2; IPCC AR6 WGIII",
    unit: "kg CO2e avoided per kg material",
    note: "Normalized to CircuLagos canonical material keys. Demo values; verify before citing.",
    materials: factors,
    last_updated: new Date().toISOString(),
  };

  return {
    "config.json": config,
    "emissions_factors.json": emissions,
    "batches.json": [],
    "payouts.json": [],
    "certificates.json": [],
    "intakes.json": [],
    "listings.json": [],
  };
}

async function main() {
  const force = process.argv.includes("--force");
  const env = await readEnv();
  const token = env.GIST_TOKEN;
  const gistId = env.GIST_ID;

  if (!token || !gistId || token.startsWith("your_") || gistId.startsWith("your_")) {
    throw new Error("Set a real GIST_TOKEN and GIST_ID in .env.local first.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "circulagos-seed",
    "Content-Type": "application/json",
  };

  const read = await fetch(`${GIST_API}/${gistId}`, { headers });
  if (!read.ok) {
    throw new Error(`Gist read failed (${read.status})`);
  }
  const gist = (await read.json()) as {
    files?: Record<string, { content?: string; size?: number }>;
  };
  const existing = gist.files ?? {};

  const seed = buildSeedFiles();
  const toCreate: Record<string, { content: string }> = {};

  for (const [name, value] of Object.entries(seed)) {
    const file = existing[name];
    const isEmpty = !file || !file.content || file.content.trim() === "";
    if (force || isEmpty) {
      toCreate[name] = { content: JSON.stringify(value, null, 2) };
    }
  }

  const names = Object.keys(toCreate);
  if (names.length === 0) {
    console.log("Nothing to seed. All files already exist (use --force to overwrite).");
    return;
  }

  const write = await fetch(`${GIST_API}/${gistId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ files: toCreate }),
  });

  if (!write.ok) {
    const detail = await write.text();
    throw new Error(`Gist write failed (${write.status}): ${detail.slice(0, 300)}`);
  }

  console.log(`Seeded ${names.length} file(s): ${names.join(", ")}`);
  const skipped = Object.keys(seed).filter((name) => !names.includes(name));
  if (skipped.length > 0) {
    console.log(`Kept existing: ${skipped.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
