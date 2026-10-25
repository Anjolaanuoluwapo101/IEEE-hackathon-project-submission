import { writeJsonFile } from "./store";
import { demoCreditTokenId, demoTx } from "./demo";
import { sampleImage, type StoredImage } from "./storage";
import {
  BATCHES_FILE,
  CERTIFICATES_FILE,
  INTAKES_FILE,
  LISTINGS_FILE,
  PAYOUTS_FILE,
  type Batch,
  type Certificate,
  type Intake,
  type Listing,
  type Payout,
} from "./data";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ago(days: number, hours = 0): string {
  return new Date(Date.now() - days * DAY - hours * HOUR).toISOString();
}

function aiEvidence(material: string, valueEstimate: number) {
  return {
    material,
    confidence: 0.93,
    valueEstimate,
    sortingAdvice: `Keep ${material} dry and separate it from mixed waste before pickup.`,
    nearestBuyer: { name: "Lagos Recycling Hub", distanceKm: 3.4 },
  };
}

type ActiveBatchStatus = "registered" | "in_transit" | "received" | "flagged";

function activeBatch(params: {
  id: string;
  pickerId: string;
  aggregatorId: string;
  recyclerId?: string;
  material: string;
  location: string;
  loggedWeightKg: number;
  receivedWeightKg?: number;
  status: ActiveBatchStatus;
  image: StoredImage;
  valueEstimate: number;
  createdAt: string;
  updatedAt: string;
  intakeId?: string;
}): Batch {
  const {
    id,
    pickerId,
    aggregatorId,
    recyclerId,
    material,
    location,
    loggedWeightKg,
    receivedWeightKg,
    status,
    image,
    valueEstimate,
    createdAt,
    updatedAt,
    intakeId,
  } = params;

  const mismatch =
    receivedWeightKg === undefined
      ? null
      : {
          deltaPct:
            Math.round(
              (Math.abs(receivedWeightKg - loggedWeightKg) / loggedWeightKg) * 10000
            ) / 100,
          tolerancePct: 5,
          flagged: status === "flagged",
        };

  return {
    id,
    pickerId,
    aggregatorId,
    recyclerId: recyclerId ?? null,
    demo: true,
    material,
    location,
    loggedWeightKg,
    receivedWeightKg: receivedWeightKg ?? null,
    status,
    photoHash: image.hash,
    evidenceUrls: [image.url],
    evidenceSource: "sample",
    intakeId: intakeId ?? null,
    aiEvidence: aiEvidence(material, valueEstimate),
    registerTx: demoTx("register", id),
    transferTx: recyclerId ? demoTx("transfer", id) : null,
    confirmTx: status === "received" || status === "flagged" ? demoTx("confirm", id) : null,
    retireTx: null,
    idempotencyKey: `seed-${id}`,
    createdAt,
    updatedAt,
    mismatch,
  };
}

function retirementFor(params: {
  id: string;
  co2eKg: number;
  tonnes: number;
  credits: number;
  creditTokenId: number;
  pickerAmount: number;
  aggregatorAmount: number;
  retiredAt: string;
}) {
  const { id, co2eKg, tonnes, credits, creditTokenId, pickerAmount, aggregatorAmount } =
    params;
  const txHash = demoTx("credit", id);

  return {
    co2eSavedKg: co2eKg,
    co2eSavedTonnes: tonnes,
    creditsMinted: credits,
    creditTokenId,
    txHash,
    payout: {
      currency: "NGN",
      pickerAmount,
      aggregatorAmount,
      txHash,
    },
    idempotencyKey: `seed-${id}`,
    retiredAt: params.retiredAt,
    photoUrl: null as string | null,
    photoHash: null as string | null,
    retireTx: demoTx("retire", id),
  };
}

function retiredBatch(params: {
  id: string;
  pickerId: string;
  aggregatorId: string;
  recyclerId: string;
  material: string;
  location: string;
  loggedWeightKg: number;
  receivedWeightKg: number;
  co2eKg: number;
  tonnes: number;
  credits: number;
  pickerAmount: number;
  aggregatorAmount: number;
  retiredAt: string;
  outputProduct: string;
  image: StoredImage;
}): Batch {
  const {
    id,
    pickerId,
    aggregatorId,
    recyclerId,
    material,
    location,
    loggedWeightKg,
    receivedWeightKg,
    co2eKg,
    tonnes,
    credits,
    pickerAmount,
    aggregatorAmount,
    retiredAt,
    outputProduct,
    image,
  } = params;

  const tokenId = demoCreditTokenId(id);
  const retirement = retirementFor({
    id,
    co2eKg,
    tonnes,
    credits,
    creditTokenId: tokenId,
    pickerAmount,
    aggregatorAmount,
    retiredAt,
  });

  return {
    id,
    pickerId,
    aggregatorId,
    recyclerId,
    demo: true,
    material,
    location,
    loggedWeightKg,
    receivedWeightKg,
    status: "retired",
    photoHash: image.hash,
    evidenceUrls: [image.url],
    evidenceSource: "sample",
    intakeId: null,
    aiEvidence: aiEvidence(material, pickerAmount + aggregatorAmount),
    registerTx: demoTx("register", id),
    transferTx: demoTx("transfer", id),
    confirmTx: demoTx("confirm", id),
    retireTx: retirement.retireTx,
    creditTokenId: tokenId,
    co2eSavedKg: co2eKg,
    co2eSavedTonnes: tonnes,
    creditsMinted: credits,
    output: {
      productType: outputProduct,
      quantity: `${receivedWeightKg} kg`,
      qualityGrade: "A",
      notes: "Seeded demo output.",
      photoUrl: image.url,
      photoHash: image.hash,
    },
    retirement: {
      ...retirement,
      photoUrl: image.url,
      photoHash: image.hash,
    },
    mismatch: {
      deltaPct:
        Math.round(
          (Math.abs(receivedWeightKg - loggedWeightKg) / loggedWeightKg) * 10000
        ) / 100,
      tolerancePct: 5,
      flagged: false,
    },
    idempotencyKey: `seed-${id}`,
    createdAt: new Date(new Date(retiredAt).getTime() - 3 * DAY).toISOString(),
    updatedAt: retiredAt,
    retiredAt,
  };
}

function payout(params: {
  batchId: string;
  recipientId: string;
  role: "picker" | "aggregator";
  amount: number;
  material: string;
  co2eKg: number;
  tonnes: number;
  createdAt: string;
}): Payout {
  return {
    id: `${params.batchId}-${params.role}`,
    batchId: params.batchId,
    recipientId: params.recipientId,
    role: params.role,
    amount: params.amount,
    currency: "NGN",
    material: params.material,
    co2eSavedKg: params.co2eKg,
    co2eSavedTonnes: params.tonnes,
    txHash: demoTx("credit", params.batchId),
    idempotencyKey: `seed-${params.batchId}-${params.role}`,
    status: "completed",
    createdAt: params.createdAt,
  };
}

async function buildSeedData() {
  const [petImage, hdpeImage, paperImage, glassImage, aluminumImage, plasticImage, mixedImage] =
    await Promise.all([
      sampleImage("pet"),
      sampleImage("hdpe"),
      sampleImage("paper"),
      sampleImage("glass"),
      sampleImage("aluminum"),
      sampleImage("plastic"),
      sampleImage("general_mixed_recyclables"),
    ]);

  const intakes: Intake[] = [
    {
      id: "intake-demo-1",
      pickerId: "picker-001",
      imageUrls: [petImage.url],
      imageHashes: [petImage.hash],
      imageSources: ["sample"],
      location: "Ikeja",
      description: "Three bags of PET bottles from a restaurant.",
      status: "classified",
      aiResult: {
        material: "pet",
        confidence: 0.94,
        valueEstimate: 120,
        sortingAdvice: "Rinse bottles, remove caps, and keep them dry.",
        nearestBuyer: { name: "Lagos Recycling Hub", distanceKm: 2.1 },
      },
      idempotencyKey: null,
      createdAt: ago(0, 3),
    },
    {
      id: "intake-demo-2",
      pickerId: "picker-002",
      imageUrls: [hdpeImage.url],
      imageHashes: [hdpeImage.hash],
      imageSources: ["sample"],
      location: "Yaba",
      description: "HDPE containers collected from a market.",
      status: "classified",
      aiResult: {
        material: "hdpe",
        confidence: 0.91,
        valueEstimate: 105,
        sortingAdvice: "Drain containers and flatten them to save space.",
        nearestBuyer: { name: "Eko Circular Collective", distanceKm: 4.8 },
      },
      idempotencyKey: null,
      createdAt: ago(0, 5),
    },
    {
      id: "intake-demo-3",
      pickerId: "picker-003",
      imageUrls: [paperImage.url],
      imageHashes: [paperImage.hash],
      imageSources: ["sample"],
      location: "Surulere",
      description: "Bundled cardboard from a small shop.",
      status: "classified",
      aiResult: {
        material: "paper",
        confidence: 0.88,
        valueEstimate: 60,
        sortingAdvice: "Flatten boxes and keep them away from wet waste.",
        nearestBuyer: { name: "ReVive Materials", distanceKm: 6.2 },
      },
      idempotencyKey: null,
      createdAt: ago(1, 2),
    },
  ];

  const batches: Batch[] = [
    activeBatch({
      id: "demo-batch-1001",
      pickerId: "picker-001",
      aggregatorId: "agg-001",
      material: "pet",
      location: "Ikeja",
      loggedWeightKg: 120,
      status: "registered",
      image: petImage,
      valueEstimate: 30000,
      createdAt: ago(1, 4),
      updatedAt: ago(1, 4),
      intakeId: "intake-demo-1",
    }),
    activeBatch({
      id: "demo-batch-1002",
      pickerId: "picker-002",
      aggregatorId: "agg-001",
      recyclerId: "rec-001",
      material: "hdpe",
      location: "Yaba",
      loggedWeightKg: 80,
      status: "in_transit",
      image: hdpeImage,
      valueEstimate: 17600,
      createdAt: ago(2, 6),
      updatedAt: ago(1, 1),
      intakeId: "intake-demo-2",
    }),
    activeBatch({
      id: "demo-batch-1003",
      pickerId: "picker-003",
      aggregatorId: "agg-002",
      recyclerId: "rec-002",
      material: "paper",
      location: "Surulere",
      loggedWeightKg: 150,
      receivedWeightKg: 148,
      status: "received",
      image: paperImage,
      valueEstimate: 13320,
      createdAt: ago(3, 2),
      updatedAt: ago(0, 8),
      intakeId: "intake-demo-3",
    }),
    activeBatch({
      id: "demo-batch-1004",
      pickerId: "picker-001",
      aggregatorId: "agg-001",
      recyclerId: "rec-001",
      material: "glass",
      location: "Ikeja",
      loggedWeightKg: 90,
      receivedWeightKg: 75,
      status: "flagged",
      image: glassImage,
      valueEstimate: 3750,
      createdAt: ago(4, 5),
      updatedAt: ago(1, 3),
    }),
    retiredBatch({
      id: "demo-batch-1005",
      pickerId: "picker-001",
      aggregatorId: "agg-001",
      recyclerId: "rec-001",
      material: "pet",
      location: "Ikeja",
      loggedWeightKg: 1205,
      receivedWeightKg: 1195,
      co2eKg: 2509.5,
      tonnes: 2,
      credits: 2,
      pickerAmount: 209125,
      aggregatorAmount: 89625,
      retiredAt: ago(5),
      outputProduct: "Recycled PET flakes",
      image: petImage,
    }),
    retiredBatch({
      id: "demo-batch-1006",
      pickerId: "picker-002",
      aggregatorId: "agg-002",
      recyclerId: "rec-002",
      material: "aluminum",
      location: "Yaba",
      loggedWeightKg: 610,
      receivedWeightKg: 600,
      co2eKg: 5580,
      tonnes: 5,
      credits: 5,
      pickerAmount: 147000,
      aggregatorAmount: 63000,
      retiredAt: ago(7),
      outputProduct: "Aluminium ingot",
      image: aluminumImage,
    }),
    retiredBatch({
      id: "demo-batch-1007",
      pickerId: "picker-003",
      aggregatorId: "agg-001",
      recyclerId: "rec-001",
      material: "paper",
      location: "Surulere",
      loggedWeightKg: 3250,
      receivedWeightKg: 3200,
      co2eKg: 3840,
      tonnes: 3,
      credits: 3,
      pickerAmount: 201600,
      aggregatorAmount: 86400,
      retiredAt: ago(9),
      outputProduct: "Recycled paper pulp",
      image: paperImage,
    }),
    retiredBatch({
      id: "demo-batch-1008",
      pickerId: "picker-002",
      aggregatorId: "agg-002",
      recyclerId: "rec-002",
      material: "glass",
      location: "Yaba",
      loggedWeightKg: 4120,
      receivedWeightKg: 4000,
      co2eKg: 1600,
      tonnes: 1,
      credits: 1,
      pickerAmount: 140000,
      aggregatorAmount: 60000,
      retiredAt: ago(11),
      outputProduct: "Glass cullet",
      image: glassImage,
    }),
    retiredBatch({
      id: "demo-batch-1009",
      pickerId: "picker-001",
      aggregatorId: "agg-001",
      recyclerId: "rec-001",
      material: "hdpe",
      location: "Ikeja",
      loggedWeightKg: 1515,
      receivedWeightKg: 1500,
      co2eKg: 2850,
      tonnes: 2,
      credits: 2,
      pickerAmount: 231000,
      aggregatorAmount: 99000,
      retiredAt: ago(13),
      outputProduct: "Recycled HDPE pellets",
      image: hdpeImage,
    }),
    retiredBatch({
      id: "demo-batch-1010",
      pickerId: "picker-003",
      aggregatorId: "agg-002",
      recyclerId: "rec-002",
      material: "plastic",
      location: "Surulere",
      loggedWeightKg: 3050,
      receivedWeightKg: 3000,
      co2eKg: 3000,
      tonnes: 3,
      credits: 3,
      pickerAmount: 315000,
      aggregatorAmount: 135000,
      retiredAt: ago(15),
      outputProduct: "Mixed plastic regrind",
      image: plasticImage,
    }),
    activeBatch({
      id: "demo-batch-1011",
      pickerId: "picker-003",
      aggregatorId: "agg-002",
      material: "general_mixed_recyclables",
      location: "Oshodi",
      loggedWeightKg: 200,
      status: "registered",
      image: mixedImage,
      valueEstimate: 12000,
      createdAt: ago(0, 10),
      updatedAt: ago(0, 10),
    }),
  ];

  const payouts: Payout[] = [
    payout({
      batchId: "demo-batch-1005",
      recipientId: "picker-001",
      role: "picker",
      amount: 209125,
      material: "pet",
      co2eKg: 2509.5,
      tonnes: 2,
      createdAt: ago(5),
    }),
    payout({
      batchId: "demo-batch-1005",
      recipientId: "agg-001",
      role: "aggregator",
      amount: 89625,
      material: "pet",
      co2eKg: 2509.5,
      tonnes: 2,
      createdAt: ago(5),
    }),
    payout({
      batchId: "demo-batch-1006",
      recipientId: "picker-002",
      role: "picker",
      amount: 147000,
      material: "aluminum",
      co2eKg: 5580,
      tonnes: 5,
      createdAt: ago(7),
    }),
    payout({
      batchId: "demo-batch-1006",
      recipientId: "agg-002",
      role: "aggregator",
      amount: 63000,
      material: "aluminum",
      co2eKg: 5580,
      tonnes: 5,
      createdAt: ago(7),
    }),
    payout({
      batchId: "demo-batch-1007",
      recipientId: "picker-003",
      role: "picker",
      amount: 201600,
      material: "paper",
      co2eKg: 3840,
      tonnes: 3,
      createdAt: ago(9),
    }),
    payout({
      batchId: "demo-batch-1007",
      recipientId: "agg-001",
      role: "aggregator",
      amount: 86400,
      material: "paper",
      co2eKg: 3840,
      tonnes: 3,
      createdAt: ago(9),
    }),
    payout({
      batchId: "demo-batch-1008",
      recipientId: "picker-002",
      role: "picker",
      amount: 140000,
      material: "glass",
      co2eKg: 1600,
      tonnes: 1,
      createdAt: ago(11),
    }),
    payout({
      batchId: "demo-batch-1008",
      recipientId: "agg-002",
      role: "aggregator",
      amount: 60000,
      material: "glass",
      co2eKg: 1600,
      tonnes: 1,
      createdAt: ago(11),
    }),
    payout({
      batchId: "demo-batch-1009",
      recipientId: "picker-001",
      role: "picker",
      amount: 231000,
      material: "hdpe",
      co2eKg: 2850,
      tonnes: 2,
      createdAt: ago(13),
    }),
    payout({
      batchId: "demo-batch-1009",
      recipientId: "agg-001",
      role: "aggregator",
      amount: 99000,
      material: "hdpe",
      co2eKg: 2850,
      tonnes: 2,
      createdAt: ago(13),
    }),
    payout({
      batchId: "demo-batch-1010",
      recipientId: "picker-003",
      role: "picker",
      amount: 315000,
      material: "plastic",
      co2eKg: 3000,
      tonnes: 3,
      createdAt: ago(15),
    }),
    payout({
      batchId: "demo-batch-1010",
      recipientId: "agg-002",
      role: "aggregator",
      amount: 135000,
      material: "plastic",
      co2eKg: 3000,
      tonnes: 3,
      createdAt: ago(15),
    }),
  ];

  const certificates: Certificate[] = [
    {
      id: "cert-demo-1001",
      producerId: "prod-001",
      batchIds: ["demo-batch-1005", "demo-batch-1006"],
      totalsByMaterial: { pet: 2, aluminum: 5 },
      totalCredits: 7,
      issueTx: demoTx("certificate", "cert-demo-1001"),
      status: "issued",
      idempotencyKey: "seed-cert-demo-1001",
      issuedAt: ago(4),
    },
    {
      id: "cert-demo-1002",
      producerId: "prod-002",
      batchIds: ["demo-batch-1007", "demo-batch-1008"],
      totalsByMaterial: { paper: 3, glass: 1 },
      totalCredits: 4,
      issueTx: demoTx("certificate", "cert-demo-1002"),
      status: "issued",
      idempotencyKey: "seed-cert-demo-1002",
      issuedAt: ago(6),
    },
  ];

  const tokenE = demoCreditTokenId("demo-batch-1005");
  const tokenF = demoCreditTokenId("demo-batch-1006");
  const tokenG = demoCreditTokenId("demo-batch-1007");

  const listings: Listing[] = [
    {
      id: `listing-${tokenE}`,
      tokenId: tokenE,
      amount: 2,
      price: 1000000000000000,
      sellerId: "rec-001",
      buyerId: null,
      active: true,
      txHash: demoTx("list", String(tokenE)),
      demo: true,
      soldAt: null,
      createdAt: ago(3),
    },
    {
      id: `listing-${tokenG}`,
      tokenId: tokenG,
      amount: 3,
      price: 1200000000000000,
      sellerId: "rec-001",
      buyerId: null,
      active: true,
      txHash: demoTx("list", String(tokenG)),
      demo: true,
      soldAt: null,
      createdAt: ago(4),
    },
    {
      id: `listing-${tokenF}`,
      tokenId: tokenF,
      amount: 0,
      price: 1500000000000000,
      sellerId: "rec-002",
      buyerId: "prod-001",
      active: false,
      txHash: demoTx("buy", String(tokenF)),
      demo: true,
      soldAt: ago(2),
      createdAt: ago(6),
    },
  ];

  return { batches, payouts, certificates, intakes, listings };
}

export async function seedDemoData() {
  const { batches, payouts, certificates, intakes, listings } = await buildSeedData();

  await writeJsonFile(BATCHES_FILE, batches);
  await writeJsonFile(PAYOUTS_FILE, payouts);
  await writeJsonFile(CERTIFICATES_FILE, certificates);
  await writeJsonFile(INTAKES_FILE, intakes);
  await writeJsonFile(LISTINGS_FILE, listings);

  return {
    batches: batches.length,
    payouts: payouts.length,
    certificates: certificates.length,
    intakes: intakes.length,
    listings: listings.length,
  };
}
