import { getConfig, getEmissionsFactors, readJsonFile } from "./store";
import {
  DEFAULT_EMISSION_FACTORS,
  DEFAULT_PRICES_NGN,
  factorKeys,
  normalizeMaterial,
} from "./materials";

export const BATCHES_FILE = "batches.json";
export const PAYOUTS_FILE = "payouts.json";
export const CERTIFICATES_FILE = "certificates.json";
export const INTAKES_FILE = "intakes.json";
export const LISTINGS_FILE = "listings.json";

export type Role = "picker" | "aggregator" | "recycler" | "producer";

export type BatchStatus =
  | "pending"
  | "registered"
  | "in_transit"
  | "received"
  | "flagged"
  | "retired";

export type BatchOutput = {
  productType?: string;
  quantity?: string | number;
  photo?: string;
  photoUrl?: string;
  photoHash?: string;
  qualityGrade?: string;
  notes?: string;
  recipientAddress?: string;
};

export type BatchRetirement = {
  co2eSavedKg: number;
  co2eSavedTonnes: number;
  creditsMinted: number;
  creditTokenId: number | null;
  txHash: string | null;
  payout: {
    currency: string;
    pickerAmount: number;
    aggregatorAmount: number;
    txHash?: string | null;
  };
  retireTx?: string | null;
  idempotencyKey: string | null;
  retiredAt: string;
  photoUrl?: string | null;
  photoHash?: string | null;
};

export type Batch = {
  id: string;
  pickerId: string;
  aggregatorId?: string | null;
  recyclerId?: string | null;
  demo?: boolean;
  material: string;
  location?: string;
  loggedWeightKg: number;
  receivedWeightKg?: number | null;
  status: BatchStatus | string;
  photoHash?: string;
  evidenceUrls?: string[];
  evidenceSource?: "upload" | "sample" | string;
  intakeId?: string | null;
  aiEvidence?: unknown;
  registerTx?: string | null;
  transferTx?: string | null;
  confirmTx?: string | null;
  retireTx?: string | null;
  creditTokenId?: number | null;
  co2eSavedKg?: number;
  co2eSavedTonnes?: number;
  creditsMinted?: number;
  output?: BatchOutput | null;
  retirement?: BatchRetirement | null;
  mismatch?: {
    deltaPct: number;
    tolerancePct: number;
    flagged: boolean;
  } | null;
  idempotencyKey?: string | null;
  transferKey?: string | null;
  confirmKey?: string | null;
  createdAt: string;
  updatedAt?: string;
  retiredAt?: string | null;
};

export type Payout = {
  id: string;
  batchId: string;
  recipientId: string;
  role: "picker" | "aggregator";
  amount: number;
  currency: string;
  material: string;
  co2eSavedKg?: number;
  co2eSavedTonnes?: number;
  txHash?: string | null;
  idempotencyKey?: string | null;
  status: "pending" | "completed";
  createdAt: string;
};

export type Certificate = {
  id: string;
  producerId: string;
  batchIds: string[];
  totalsByMaterial: Record<string, number>;
  totalCredits: number;
  issueTx: string | null;
  status: "issued";
  idempotencyKey?: string | null;
  issuedAt: string;
};

export type Listing = {
  id: string;
  tokenId: number;
  amount: number;
  price: number;
  sellerId: string;
  buyerId?: string | null;
  active: boolean;
  txHash: string | null;
  demo?: boolean;
  soldAt?: string | null;
  createdAt: string;
};

export type IntakeAiResult = {
  material: string;
  confidence: number;
  valueEstimate: number;
  sortingAdvice: string;
  nearestBuyer: { name: string; distanceKm: number };
};

export type Intake = {
  id: string;
  pickerId: string;
  imageUrls: string[];
  imageHashes: string[];
  imageSources?: string[];
  location: string;
  description: string;
  status: "pending" | "classified";
  aiResult: IntakeAiResult | null;
  idempotencyKey?: string | null;
  createdAt: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export const readBatches = () => readJsonFile<Batch[]>(BATCHES_FILE, []);
export const readPayouts = () => readJsonFile<Payout[]>(PAYOUTS_FILE, []);
export const readCertificates = () =>
  readJsonFile<Certificate[]>(CERTIFICATES_FILE, []);
export const readIntakes = () => readJsonFile<Intake[]>(INTAKES_FILE, []);
export const readListings = () => readJsonFile<Listing[]>(LISTINGS_FILE, []);

export async function getEmissionFactor(material: string): Promise<number> {
  const canonical = normalizeMaterial(material);
  if (!canonical) return 1;

  const keys = factorKeys(canonical);
  const config = await getConfig();
  const direct = asRecord(config?.emissionFactorsKgCO2ePerKg);

  for (const key of keys) {
    const value = asNumber(direct?.[key]);
    if (value !== null) return value;
  }

  const factors = await getEmissionsFactors();
  const materials = asRecord(factors?.materials);

  for (const key of keys) {
    const entry = asRecord(materials?.[key]);
    const nested =
      asNumber(entry?.emission_factor_kg_co2e_per_kg) ?? asNumber(entry?.factor);
    if (nested !== null) return nested;
  }

  return DEFAULT_EMISSION_FACTORS[canonical];
}

export async function getPricePerKg(material: string): Promise<number> {
  const canonical = normalizeMaterial(material);
  if (!canonical) return 0;

  const config = await getConfig();
  const prices =
    asRecord(config?.pricePerKg) ?? asRecord(config?.pricesPerKg) ?? null;

  for (const key of factorKeys(canonical)) {
    const value = asNumber(prices?.[key]);
    if (value !== null) return value;
  }

  return DEFAULT_PRICES_NGN[canonical];
}

export async function getPayoutSplit(): Promise<{
  picker: number;
  aggregator: number;
}> {
  const config = await getConfig();
  const split = asRecord(config?.payoutSplit);
  const picker = asNumber(split?.picker);
  const aggregator = asNumber(split?.aggregator);

  if (picker !== null) {
    return { picker, aggregator: aggregator ?? 100 - picker };
  }
  return { picker: 70, aggregator: 30 };
}

export async function getWeightTolerancePct(): Promise<number> {
  const config = await getConfig();
  return (
    asNumber(config?.weightTolerancePct) ??
    asNumber(config?.weightMismatchTolerancePct) ??
    asNumber(config?.tolerancePct) ??
    5
  );
}

export async function getCurrency(): Promise<string> {
  const config = await getConfig();
  const currency = config?.currency;
  return typeof currency === "string" && currency.trim() !== ""
    ? currency.trim()
    : "NGN";
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
