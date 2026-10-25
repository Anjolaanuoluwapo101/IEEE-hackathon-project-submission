import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: "0.8.28",
  paths: {
    sources: "contracts",
  },
  networks: {
    sepolia: {
      type: "http",
      url: "https://eth-sepolia.g.alchemy.com/v2/alch_MND1ypu9CT5Hhex0M68BG",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
});
