import { ethers, type InterfaceAbi } from "ethers";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getProvider, getWallet } from "./config";

export const CHAIN_PROVIDER = getProvider();

export const SIGNER = process.env.PRIVATE_KEY
  ? getWallet(process.env.PRIVATE_KEY)
  : null;

function loadAbi(name: string): InterfaceAbi {
  const raw = readFileSync(
    path.join(process.cwd(), "artifacts", "contracts", `${name}.sol`, `${name}.json`),
    "utf8"
  );
  return JSON.parse(raw).abi as InterfaceAbi;
}

function contract(address: string, abi: InterfaceAbi) {
  return new ethers.Contract(address, abi, SIGNER ?? CHAIN_PROVIDER);
}

export const BATCH_NFT = contract(
  process.env.NEXT_PUBLIC_BATCH_NFT_ADDRESS || "",
  loadAbi("BatchNFT")
);
export const CREDIT_NFT = contract(
  process.env.NEXT_PUBLIC_CREDIT_NFT_ADDRESS || "",
  loadAbi("CarbonCreditNFT")
);
export const MARKETPLACE = contract(
  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "",
  loadAbi("CreditMarketplace")
);

export const CHAIN_STATUS: Record<number, string> = {
  0: "registered",
  1: "in_transit",
  2: "received",
  3: "flagged",
  4: "retired",
};

export function requireSigner() {
  if (!SIGNER) {
    const err = new Error(
      "Custodial signer not configured: set PRIVATE_KEY in .env.local"
    ) as Error & { status?: number };
    err.status = 503;
    throw err;
  }
  return SIGNER;
}

export async function readChainStatus(tokenId: number): Promise<string | null> {
  try {
    const code = await BATCH_NFT.getStatus(tokenId);
    return CHAIN_STATUS[Number(code)] ?? null;
  } catch {
    return null;
  }
}

export async function chainTxHash(tx: Promise<ethers.ContractTransactionResponse>) {
  const response = await tx;
  const receipt = await response.wait();
  return (receipt?.hash) ?? response.hash;
}