import { ethers } from "ethers";

export const CHAIN = {
  id: 11155111,
  name: "Sepolia",
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/alch_MND1ypu9CT5Hhex0M68BG",
  explorer: "https://sepolia.etherscan.io",
} as const;

export const CONTRACT_ADDRESSES = {
  batchNFT: process.env.NEXT_PUBLIC_BATCH_NFT_ADDRESS || "",
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "",
} as const;

export const IMAGE_LIMITS = {
  maxFiles: 5,
  maxEdge: 1280,
  targetBytes: 300 * 1024,
  hardMaxBytes: 2 * 1024 * 1024,
  maxOriginalBytes: 10 * 1024 * 1024,
} as const;

export function getProvider() {
  return new ethers.JsonRpcProvider(CHAIN.rpcUrl);
}

export function getWallet(privateKey: string) {
  return new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(CHAIN.rpcUrl));
}
