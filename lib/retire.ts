import { ethers } from "ethers";
import { getWallet } from "./config";
import { demoCreditTokenId, demoTx } from "./demo";
import { StoreError, mutateJsonFile } from "./store";
import {
  BATCHES_FILE,
  PAYOUTS_FILE,
  getCurrency,
  getEmissionFactor,
  getPayoutSplit,
  getPricePerKg,
  readBatches,
  roundMoney,
  type Batch,
  type BatchOutput,
  type BatchRetirement,
  type Payout,
} from "./data";

const CREDIT_NFT_ADDRESS = process.env.NEXT_PUBLIC_CREDIT_NFT_ADDRESS || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const CREDIT_NFT_ABI = [
  "function mintCredit(address to, uint256 amount, string memory metadataURI) public returns (uint256)",
  "function getTotalMinted() public view returns (uint256)",
];

export type RetireResponse = {
  status: number;
  body: Record<string, unknown>;
};

export async function retireBatch(
  id: string,
  output: BatchOutput,
  key: string | null,
  chainTxHash: string | null = null
): Promise<RetireResponse> {
  const batches = await readBatches();
  const batch = batches.find((b) => b.id === id);

  if (!batch) {
    return { status: 404, body: { error: "Batch not found" } };
  }

  if (batch.status === "retired" && batch.retirement) {
    return {
      status: 200,
      body: {
        success: true,
        idempotent: true,
        batchId: id,
        ...retirementBody(batch, batch.retirement),
      },
    };
  }

  if (batch.status === "flagged") {
    return {
      status: 409,
      body: {
        error: "Batch is flagged for a weight mismatch and cannot be retired",
        mismatch: batch.mismatch ?? null,
      },
    };
  }

  if (batch.status !== "received") {
    return {
      status: 409,
      body: {
        error: `Batch must be confirmed as received before output (current status: ${batch.status})`,
      },
    };
  }

  const weightKg = batch.receivedWeightKg ?? batch.loggedWeightKg;
  const factor = await getEmissionFactor(batch.material);
  const co2eKg = weightKg * factor;
  const co2eTonnes = Math.floor(co2eKg / 1000);
  const credits = co2eTonnes;

  const pricePerKg = await getPricePerKg(batch.material);
  const split = await getPayoutSplit();
  const currency = await getCurrency();
  const totalValue = weightKg * pricePerKg;
  const pickerAmount = roundMoney((totalValue * split.picker) / 100);
  const aggregatorAmount = roundMoney(totalValue - pickerAmount);

  let txHash: string | null = null;
  let creditTokenId: number | null = null;
  let creditsMinted = 0;

  if (credits > 0 && batch.demo) {
    creditsMinted = credits;
    creditTokenId = demoCreditTokenId(id);
    txHash = demoTx("credit", id);
  } else if (credits > 0) {
    const privateKey = process.env.PRIVATE_KEY;

    if (!CREDIT_NFT_ADDRESS) {
      return {
        status: 503,
        body: { error: "NEXT_PUBLIC_CREDIT_NFT_ADDRESS is not set" },
      };
    }
    if (!privateKey) {
      return { status: 503, body: { error: "PRIVATE_KEY is not set" } };
    }

    try {
      const wallet = getWallet(privateKey);
      const contract = new ethers.Contract(
        CREDIT_NFT_ADDRESS,
        CREDIT_NFT_ABI,
        wallet
      );

      const recipient =
        output.recipientAddress && ethers.isAddress(output.recipientAddress)
          ? output.recipientAddress
          : wallet.address;

      const metadataURI = `${APP_URL}/verify/${id}`;

      const predictedId = await contract.mintCredit.staticCall(
        recipient,
        credits,
        metadataURI
      );
      creditTokenId = Number(predictedId.toString());

      const tx = await contract.mintCredit(recipient, credits, metadataURI);
      const receipt = await tx.wait();
      txHash = receipt?.hash ?? tx.hash;
      creditsMinted = credits;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Credit mint failed:", message);
      return {
        status: 502,
        body: { error: `Credit mint failed on-chain: ${message}` },
      };
    }
  }

  const retiredAt = new Date().toISOString();
  const retirement: BatchRetirement = {
    co2eSavedKg: co2eKg,
    co2eSavedTonnes: co2eTonnes,
    creditsMinted,
    creditTokenId,
    txHash,
    payout: { currency, pickerAmount, aggregatorAmount },
    idempotencyKey: key,
    retiredAt,
    photoUrl: output.photoUrl ?? output.photo ?? null,
    photoHash: output.photoHash ?? null,
    retireTx: chainTxHash,
  };

  try {
    await mutateJsonFile<Batch[]>(BATCHES_FILE, [], (list) => {
      const target = list.find((b) => b.id === id);
      if (!target) {
        throw new StoreError("Batch disappeared during retirement", 409);
      }
      if (target.status === "retired") {
        return list;
      }

      target.status = "retired";
      target.retiredAt = retiredAt;
      target.retireTx = chainTxHash;
      target.creditTokenId = creditTokenId;
      target.co2eSavedKg = co2eKg;
      target.co2eSavedTonnes = co2eTonnes;
      target.creditsMinted = creditsMinted;
      target.output = output;
      target.retirement = retirement;
      target.idempotencyKey = key;
      target.updatedAt = retiredAt;
      return list;
    });

    await mutateJsonFile<Payout[]>(PAYOUTS_FILE, [], (list) => {
      if (key && list.some((p) => p.idempotencyKey === key && p.batchId === id)) {
        return list;
      }
      if (list.some((p) => p.batchId === id)) {
        return list;
      }

      const base = {
        batchId: id,
        currency,
        material: batch.material,
        co2eSavedKg: co2eKg,
        co2eSavedTonnes: co2eTonnes,
        txHash,
        idempotencyKey: key,
        status: "completed" as const,
        createdAt: retiredAt,
      };

      list.push({
        ...base,
        id: `${id}-picker`,
        recipientId: batch.pickerId,
        role: "picker",
        amount: pickerAmount,
      });

      if (batch.aggregatorId) {
        list.push({
          ...base,
          id: `${id}-aggregator`,
          recipientId: batch.aggregatorId,
          role: "aggregator",
          amount: aggregatorAmount,
        });
      }

      return list;
    });
  } catch (err) {
    if (err instanceof StoreError) {
      return {
        status: err.status,
        body: {
          error: `Retirement confirmed on-chain but not saved: ${err.message}`,
          partial: true,
          txHash,
          creditTokenId,
        },
      };
    }
    throw err;
  }

  return {
    status: 200,
    body: {
      success: true,
      batchId: id,
      ...retirementBody(
        { ...batch, status: "retired" },
        retirement
      ),
      message:
        creditsMinted > 0
          ? "Batch retired. Credit minted and payouts recorded."
          : "Batch retired. Below 1 tonne CO2e, so no credit was minted.",
    },
  };
}

function retirementBody(batch: Batch, retirement: BatchRetirement) {
  return {
    status: "retired",
    material: batch.material,
    weightKg: batch.receivedWeightKg ?? batch.loggedWeightKg,
    co2eSavedKg: retirement.co2eSavedKg,
    co2eSavedTonnes: retirement.co2eSavedTonnes,
    creditsMinted: retirement.creditsMinted,
    creditTokenId: retirement.creditTokenId,
    payout: {
      currency: retirement.payout.currency,
      pickerAmount: retirement.payout.pickerAmount,
      aggregatorAmount: retirement.payout.aggregatorAmount,
      txHash: retirement.txHash,
    },
    retiredAt: retirement.retiredAt,
    photoUrl: retirement.photoUrl ?? null,
    photoHash: retirement.photoHash ?? null,
    retireTx: retirement.retireTx ?? retirement.txHash ?? null,
  };
}
