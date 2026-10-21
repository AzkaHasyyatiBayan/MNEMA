import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("====================================================");
  console.log("🚀 MNEMA DEPLOYMENT SYSTEM - UAS BLOCKCHAIN SEMESTER 7");
  console.log("   Lead Blockchain Architect & Smart Contract Engineer");
  console.log("====================================================");

  const [deployer] = await ethers.getSigners();
  console.log(`📡 Deploying with account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account Balance: ${ethers.formatEther(balance)} ETH`);

  const MIN_COMMIT_DELAY = 15; // 15 detik untuk pengujian & demo
  const MAX_COMMIT_WINDOW = 86400; // 24 jam

  console.log("\n📦 Deploying MnemaLedger contract...");
  const MnemaFactory = await ethers.getContractFactory("MnemaLedger");
  const mnema = await MnemaFactory.deploy(
    deployer.address,
    MIN_COMMIT_DELAY,
    MAX_COMMIT_WINDOW
  );

  await mnema.waitForDeployment();
  const mnemaAddress = await mnema.getAddress();
  const txHash = mnema.deploymentTransaction()?.hash || "N/A";
  const blockNumber = await ethers.provider.getBlockNumber();

  console.log(`✅ MnemaLedger successfully deployed to: ${mnemaAddress}`);
  console.log(`🔗 Transaction Hash: ${txHash}`);
  console.log(`🧱 Block Number: ${blockNumber}`);

  // Seed Initial Audit Record for Showcase
  console.log("\n🌱 Seeding initial provenance records for Showcase demo...");
  const sampleHash1 = ethers.keccak256(ethers.toUtf8Bytes("MNEMA_GENESIS_AUDIT_REPORT_2026"));
  const sampleCID1 = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
  const sampleTitle1 = "Laporan Audit Forensik Smart Contract & Data Privacy 2026";
  const sampleMetadata1 = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/metadata.json";

  const tx1 = await mnema.createMemoryRecord(
    sampleHash1,
    sampleCID1,
    sampleTitle1,
    sampleMetadata1
  );
  await tx1.wait();
  console.log(`  -> Record #1 created! Tx: ${tx1.hash}`);

  const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("KONSIL_ETIKA_AKADEMIK_RECORD_02"));
  const sampleCID2 = "bafybeihdwdcefgh4dqkjv67eycm2t6bfikxvf72mb5acaxsqvir5v5t7lu";
  const sampleTitle2 = "Verifikasi Bukti Kepatuhan GDPR & Regulasi UU PDP";
  const sampleMetadata2 = "ipfs://bafybeihdwdcefgh4dqkjv67eycm2t6bfikxvf72mb5acaxsqvir5v5t7lu/compliance.json";

  const tx2 = await mnema.createMemoryRecord(
    sampleHash2,
    sampleCID2,
    sampleTitle2,
    sampleMetadata2
  );
  await tx2.wait();
  console.log(`  -> Record #2 created! Tx: ${tx2.hash}`);

  // Save deployment artifact
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contractAddress: mnemaAddress,
    deployer: deployer.address,
    transactionHash: txHash,
    blockNumber: blockNumber,
    timestamp: new Date().toISOString(),
    minCommitDelay: MIN_COMMIT_DELAY,
    maxCommitWindow: MAX_COMMIT_WINDOW,
    recordsCount: Number(await mnema.totalRecords()),
  };

  const deployRecordPath = path.join(__dirname, "../deployment-record.json");
  fs.writeFileSync(deployRecordPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment record saved to: ${deployRecordPath}`);

  // Export contract details for frontend
  const frontendDir = path.join(__dirname, "../../frontend/src/lib");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const artifactPath = path.join(__dirname, "../artifacts/contracts/MnemaLedger.sol/MnemaLedger.json");
  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const contractDetails = {
    address: mnemaAddress,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    abi: contractArtifact.abi,
  };

  fs.writeFileSync(
    path.join(frontendDir, "contractDetails.json"),
    JSON.stringify(contractDetails, null, 2)
  );
  console.log(`🔗 Frontend contract details exported to: ${path.join(frontendDir, "contractDetails.json")}`);
  console.log("\n🎉 Deployment & Initialization Completed Successfully!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
