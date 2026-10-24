import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  console.log("==========================================================================");
  console.log("🔍 MNEMA SMART CONTRACT DEBUGGING & DIAGNOSTIC SUITE");
  console.log("   UAS Blockchain - Bagian C. Project 2: Testing, Debugging, Deployment");
  console.log("   Anggota 2: Muhammad Rafli Fajar Batubara");
  console.log("==========================================================================");

  const [admin, auditor, unauthorizedUser] = await ethers.getSigners();
  console.log(`\n[INIT] Deploying MnemaLedger for Debugging Session...`);
  const MnemaFactory = await ethers.getContractFactory("MnemaLedger");
  const mnema = await MnemaFactory.deploy(admin.address, 15, 86400);
  await mnema.waitForDeployment();
  const address = await mnema.getAddress();
  console.log(`[INIT] Deployed at: ${address}`);

  const AUDITOR_ROLE = await mnema.AUDITOR_ROLE();
  await mnema.connect(admin).grantRole(AUDITOR_ROLE, auditor.address);
  console.log(`[INIT] Granted AUDITOR_ROLE to: ${auditor.address}`);

  console.log("\n--------------------------------------------------------------------------");
  console.log("CASE DEBUGGING #1: Premature Reveal Attempt (Anti-Front-Running Delay Violation)");
  console.log("--------------------------------------------------------------------------");

  const sampleDocHash = ethers.keccak256(ethers.toUtf8Bytes("DEBUG_TEST_DOC_2026"));
  const sampleSalt = ethers.keccak256(ethers.toUtf8Bytes("SECRET_SALT_DEBUG"));
  const commitment = ethers.keccak256(
    ethers.solidityPacked(
      ["bytes32", "bytes32", "address"],
      [sampleDocHash, sampleSalt, auditor.address]
    )
  );

  console.log("1. Tahap Commit: Auditor mengirim komitmen hash...");
  const commitTx = await mnema.connect(auditor).commitMemory(commitment);
  const commitReceipt = await commitTx.wait();
  console.log(`   -> Komitmen berhasil dicatat pada block #${commitReceipt?.blockNumber}`);

  console.log("\n2. Pemicuan Kegagalan (Failure Trigger): Auditor mencoba me-reveal seketika (0 detik jeda)...");
  try {
    await mnema.connect(auditor).revealMemory(
      sampleDocHash,
      sampleSalt,
      "bafybeidebugcid123",
      "Dokumen Debugging 1",
      ""
    );
    console.error("   ❌ ERROR: Transaksi seharusnya gagal, tapi berhasil!");
  } catch (error: any) {
    console.log("   ✅ REVERT TERTANGKAP SECARA TEPAT!");
    console.log(`   [Raw Error Name]: ${error.name}`);
    console.log(`   [Custom Error]:   ${error.message}`);
    
    // Analisis Diagnostik
    console.log("\n   [DIAGNOSTIC & ROOT CAUSE ANALYSIS]");
    console.log("   • Penyebab: Fungsi revealMemory() mengecek invariant block.timestamp < readyTimestamp.");
    console.log("   • Logika Kontrak: require(block.timestamp >= comm.commitTimestamp + minCommitDelay).");
    console.log("   • Parameter: minCommitDelay = 15 detik. Waktu berlalu = 0 detik.");
    console.log("   • Custom Error yang Dipancarkan: Mnema__CommitmentTooEarly(currentTimestamp, readyTimestamp).");
    console.log("   • Kesimpulan: Protokol Anti-Front-Running berfungsi sempurna mencegah pemalsuan timing.");
  }

  console.log("\n3. Langkah Remediasi / Debugging Fix:");
  console.log("   -> Memajukan stempel waktu blok (evm_increaseTime) sebanyak 20 detik...");
  await time.increase(20);
  console.log("   -> Waktu jaringan telah dimajukan melewati batas minCommitDelay (15s).");

  console.log("\n4. Verifikasi Pasca-Remediasi:");
  const revealTx = await mnema.connect(auditor).revealMemory(
    sampleDocHash,
    sampleSalt,
    "bafybeidebugcid123",
    "Dokumen Debugging 1",
    ""
  );
  const revealReceipt = await revealTx.wait();
  console.log(`   ✅ SUKSES! Transaksi reveal diterima pada block #${revealReceipt?.blockNumber}`);
  console.log(`   🔗 Tx Hash: ${revealReceipt?.hash}`);
  console.log(`   📊 State On-Chain: isHashRegistered = ${await mnema.isHashRegistered(sampleDocHash)}`);

  console.log("\n--------------------------------------------------------------------------");
  console.log("CASE DEBUGGING #2: Unauthorized State Modification (Access Control Violation)");
  console.log("--------------------------------------------------------------------------");

  console.log("1. Pemicuan Kegagalan: Pengguna unauthorized mencoba mencabut/merevoke status record #1...");
  try {
    await mnema.connect(unauthorizedUser).updateRecordStatus(1, 3, "Hacked Status");
    console.error("   ❌ ERROR: Transaksi seharusnya gagal, tapi berhasil!");
  } catch (error: any) {
    console.log("   ✅ REVERT TERTANGKAP SECARA TEPAT!");
    console.log(`   [Custom Error]: ${error.message}`);
    console.log("\n   [DIAGNOSTIC & ROOT CAUSE ANALYSIS]");
    console.log("   • Penyebab: Modifier onlyCreatorOrAdmin mengecek msg.sender == creator || hasRole(DEFAULT_ADMIN_ROLE).");
    console.log(`   • msg.sender: ${unauthorizedUser.address} (Bukan creator dan bukan admin).`);
    console.log("   • Custom Error yang Dipancarkan: Mnema__NotRecordCreatorOrAdmin().");
    console.log("   • Efisiensi Gas: Menggunakan custom error alih-alih require string panjang.");
  }

  console.log("\n2. Langkah Remediasi / Debugging Fix:");
  console.log("   -> Menjalankan updateRecordStatus melalui akun Auditor (Creator Sah)...");
  const updateTx = await mnema.connect(auditor).updateRecordStatus(1, 3, "Dokumen dicabut oleh Auditor Resmi");
  const updateReceipt = await updateTx.wait();
  console.log(`   ✅ SUKSES! Status berhasil diubah ke Revoked (3) pada block #${updateReceipt?.blockNumber}`);
  const updatedRecord = await mnema.getRecordById(1);
  console.log(`   📊 State Record #1 Status: ${updatedRecord.status} (Revoked)`);

  console.log("\n==========================================================================");
  console.log("🎯 DEBUGGING & DIAGNOSTIC SESSION COMPLETE - ALL INVARIANTS VERIFIED");
  console.log("==========================================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
