const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const envPath = path.join(ROOT, ".env.local");

const envVars = {};
fs.readFileSync(envPath, "utf8")
  .split("\n")
  .forEach((line) => {
    const match = line.match(/^([^=#]+)=(.*)/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

function loadArtifact(name) {
  const p = path.join(
    ROOT,
    "artifacts",
    "contracts",
    `${name}.sol`,
    `${name}.json`
  );
  const json = JSON.parse(fs.readFileSync(p, "utf8"));
  return { abi: json.abi, bytecode: json.bytecode };
}

async function deploy(name, wallet) {
  const { abi, bytecode } = loadArtifact(name);
  console.log(`\nDeploying ${name}...`);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`${name}: ${address}`);
  return address;
}

function setEnv(content, key, value) {
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, `${key}=${value}`);
  return content.replace(/\n*$/, `\n${key}=${value}\n`);
}

async function main() {
  console.log("=== CircuLagos: PayoutToken + BatchNFT Deployment ===\n");

  const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/alch_MND1ypu9CT5Hhex0M68BG";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const privateKey = envVars.PRIVATE_KEY;

  if (!privateKey) {
    console.error("ERROR: PRIVATE_KEY not set in .env.local");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log("Wallet:", wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "Sepolia ETH\n");

  if (balance === 0n) {
    console.error("ERROR: wallet has no Sepolia ETH");
    process.exit(1);
  }

  const payoutAddress = await deploy("PayoutToken", wallet);
  const batchNftAddress = await deploy("BatchNFT", wallet);

  let content = fs.readFileSync(envPath, "utf8");
  content = setEnv(content, "NEXT_PUBLIC_PAYOUT_TOKEN_ADDRESS", payoutAddress);
  content = setEnv(content, "NEXT_PUBLIC_BATCH_NFT_ADDRESS", batchNftAddress);
  if (!/^NEXT_PUBLIC_CREDIT_NFT_ADDRESS=/m.test(content)) {
    content = setEnv(content, "NEXT_PUBLIC_CREDIT_NFT_ADDRESS", batchNftAddress);
  }
  fs.writeFileSync(envPath, content);

  console.log("\n=== Deployment Complete ===");
  console.log("PayoutToken:", payoutAddress);
  console.log("BatchNFT:   ", batchNftAddress);
  console.log("\n.env.local updated.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
