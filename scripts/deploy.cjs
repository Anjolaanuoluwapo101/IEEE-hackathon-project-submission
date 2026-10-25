const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=#]+)=(.*)/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

async function main() {
  console.log("=== CircuLagos Contract Deployment ===\n");

  const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/alch_MND1ypu9CT5Hhex0M68BG";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const privateKey = envVars.PRIVATE_KEY;
  if (!privateKey) {
    console.error("ERROR: PRIVATE_KEY not set in .env.local");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Deploying with wallet:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Wallet balance:", ethers.formatEther(balance), "Sepolia ETH");

  if (balance === 0n) {
    console.error("\nERROR: Wallet has no ETH!");
    console.error("Get testnet ETH from:");
    console.error("  https://sepoliafaucet.com/");
    console.error("  https://www.coinbase.com/faucets/ethereum-sepolia");
    console.error("  https://www.alchemy.com/faucets/ethereum-sepolia");
    process.exit(1);
  }

  // Load existing ABIs
  const nftAbi = JSON.parse(
    fs.readFileSync(
      path.join("contracts", "build", "contracts_CarbonCreditNFT_sol_CarbonCreditNFT.abi"),
      "utf8"
    )
  );
  const nftBin = fs.readFileSync(
    path.join("contracts", "build", "contracts_CarbonCreditNFT_sol_CarbonCreditNFT.bin"),
    "utf8"
  );
  const marketplaceAbi = JSON.parse(
    fs.readFileSync(
      path.join(
        "contracts",
        "build",
        "contracts_CreditMarketplace_sol_CreditMarketplace.abi"
      ),
      "utf8"
    )
  );
  const marketplaceBin = fs.readFileSync(
    path.join(
      "contracts",
      "build",
      "contracts_CreditMarketplace_sol_CreditMarketplace.bin"
    ),
    "utf8"
  );

  // Deploy CarbonCreditNFT
  console.log("\nDeploying CarbonCreditNFT...");
  const nftFactory = new ethers.ContractFactory(nftAbi, nftBin, wallet);
  const nftContract = await nftFactory.deploy();
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  console.log("CarbonCreditNFT:", nftAddress);

  // Deploy CreditMarketplace
  console.log("\nDeploying CreditMarketplace...");
  const marketplaceFactory = new ethers.ContractFactory(
    marketplaceAbi,
    marketplaceBin,
    wallet
  );
  const marketplaceContract = await marketplaceFactory.deploy();
  await marketplaceContract.waitForDeployment();
  const marketplaceAddress = await marketplaceContract.getAddress();
  console.log("CreditMarketplace:", marketplaceAddress);

  // ==== NEW: Deploy PayoutToken (ERC-20) ====
  console.log("\nDeploying PayoutToken...");
  const payoutAbi = JSON.parse(
    fs.readFileSync(
      path.join("contracts", "build", "contracts_PayoutToken_sol_PayoutToken.abi"),
      "utf8"
    )
  );
  const payoutBin = fs.readFileSync(
    path.join("contracts", "build", "contracts_PayoutToken_sol_PayoutToken.bin"),
    "utf8"
  );
  const payoutFactory = new ethers.ContractFactory(payoutAbi, payoutBin, wallet);
  const payoutContract = await payoutFactory.deploy();
  await payoutContract.waitForDeployment();
  const payoutAddress = await payoutContract.getAddress();
  console.log("PayoutToken:", payoutAddress);

  // ==== NEW: Deploy BatchNFT (ERC-721) ====
  console.log("\nDeploying BatchNFT...");
  const batchNftAbi = JSON.parse(
    fs.readFileSync(
      path.join("contracts", "build", "contracts_BatchNFT_sol_BatchNFT.abi"),
      "utf8"
    )
  );
  const batchNftBin = fs.readFileSync(
    path.join("contracts", "build", "contracts_BatchNFT_sol_BatchNFT.bin"),
    "utf8"
  );
  const batchNftFactory = new ethers.ContractFactory(batchNftAbi, batchNftBin, wallet);
  const batchNftContract = await batchNftFactory.deploy();
  await batchNftContract.waitForDeployment();
  const batchAddress = await batchNftContract.getAddress();
  console.log("BatchNFT:", batchAddress);

  // Save contract addresses
  const envPath = path.join(__dirname, "..", ".env.local");
  let envContent = fs.readFileSync(envPath, "utf8");

  envContent = envContent.replace(
    /NEXT_PUBLIC_BATCH_NFT_ADDRESS=.*/,
    `NEXT_PUBLIC_BATCH_NFT_ADDRESS=${batchAddress}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_MARKETPLACE_ADDRESS=.*/,
    `NEXT_PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_PAYOUT_TOKEN_ADDRESS=.*/,
    `NEXT_PUBLIC_PAYOUT_TOKEN_ADDRESS=${payoutAddress}`
  );

  if (!envContent.includes("NEXT_PUBLIC_BATCH_NFT_ADDRESS")) {
    envContent += `\nNEXT_PUBLIC_BATCH_NFT_ADDRESS=${batchAddress}`;
  }
  if (!envContent.includes("NEXT_PUBLIC_MARKETPLACE_ADDRESS")) {
    envContent += `\nNEXT_PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}`;
  }
  if (!envContent.includes("NEXT_PUBLIC_PAYOUT_TOKEN_ADDRESS")) {
    envContent += `\nNEXT_PUBLIC_PAYOUT_TOKEN_ADDRESS=${payoutAddress}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("\n.env.local updated with contract addresses");

  console.log("\n=== Deployment Complete ===");
  console.log("CarbonCreditNFT:", nftAddress);
  console.log("CreditMarketplace:", marketplaceAddress);
  console.log("PayoutToken:", payoutAddress);
  console.log("BatchNFT:", batchAddress);
  console.log("\nYou can now run: npm run dev");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});