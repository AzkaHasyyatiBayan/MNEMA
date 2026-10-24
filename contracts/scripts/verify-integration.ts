import { ethers } from "hardhat";

async function main() {
  console.log("==========================================================================");
  console.log("🌐 MNEMA CLIENT INTEGRATION & STATE CHANGE VERIFICATION");
  console.log("   UAS Blockchain - Bagian C. Project 2: Integrasi & Verifikasi Event");
  console.log("   Anggota 2: Muhammad Rafli Fajar Batubara");
  console.log("==========================================================================");

  const [admin, auditor, verifier, clientUser] = await ethers.getSigners();
  
  // Deploy fresh instance
  const MnemaFactory = await ethers.getContractFactory("MnemaLedger");
  const mnema = await MnemaFactory.deploy(admin.address, 15, 86400);
  await mnema.waitForDeployment();
  const contractAddress = await mnema.getAddress();
  console.log(`[CLIENT] Connected to MnemaLedger at: ${contractAddress}`);

  const AUDITOR_ROLE = await mnema.AUDITOR_ROLE();
  const VERIFIER_ROLE = await mnema.VERIFIER_ROLE();
  await mnema.connect(admin).grantRole(AUDITOR_ROLE, auditor.address);
  await mnema.connect(admin).grantRole(VERIFIER_ROLE, verifier.address);

  // --------------------------------------------------------------------------
  // DEMONSTRASI 1: Pembuatan Record, Emisi Event MemoryRecordCreated & Perubahan State
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------");
  console.log("DEMONSTRASI 1: Pencatatan Bukti Baru & State Change (totalRecords & isHashRegistered)");
  console.log("--------------------------------------------------------------------------");

  const stateRecordsBefore = await mnema.totalRecords();
  const testDocHash = ethers.keccak256(ethers.toUtf8Bytes("INTEGRATION_TEST_RECORD_2026"));
  const isRegisteredBefore = await mnema.isHashRegistered(testDocHash);

  console.log(`[STATE SEBELUM TRANSAKSI]`);
  console.log(`   • totalRecords       : ${stateRecordsBefore}`);
  console.log(`   • isHashRegistered   : ${isRegisteredBefore}`);

  console.log(`\n[EKSEKUSI TRANSAKSI]: Admin (${admin.address}) memanggil createMemoryRecord() [Direct Admin Registration]...`);
  const txRecord = await mnema.connect(admin).createMemoryRecord(
    testDocHash,
    "bafybeicgr5aumek4s2zwh2x2xldh7spsqlyu3m2qfhnl4b",
    "Audit Keamanan Aplikasi Web3 2026",
    "ipfs://bafybeicgr5aumek4s2zwh2x2xldh7spsqlyu3m2qfhnl4b/audit.json"
  );
  const receiptRecord = await txRecord.wait();

  console.log(`\n[EVENT YANG DIPANCARKAN (EMITTED ON-CHAIN)]`);
  const recordCreatedEvents = receiptRecord?.logs.map((log: any) => {
    try {
      return mnema.interface.parseLog(log);
    } catch {
      return null;
    }
  }).filter((e: any) => e && e.name === "MemoryRecordCreated");

  if (recordCreatedEvents && recordCreatedEvents.length > 0) {
    const event = recordCreatedEvents[0];
    console.log(`   🎯 Event Name    : ${event?.name}`);
    console.log(`   📌 Record ID     : ${event?.args.recordId.toString()}`);
    console.log(`   🔑 Document Hash : ${event?.args.docHash}`);
    console.log(`   👤 Creator       : ${event?.args.creator}`);
    console.log(`   📦 IPFS CID      : ${event?.args.ipfsCID}`);
    console.log(`   🏷️  Title        : ${event?.args.title}`);
    console.log(`   ⏰ Timestamp     : ${event?.args.timestamp.toString()}`);
  }

  const stateRecordsAfter = await mnema.totalRecords();
  const isRegisteredAfter = await mnema.isHashRegistered(testDocHash);

  console.log(`\n[STATE SESUDAH TRANSAKSI]`);
  console.log(`   • totalRecords       : ${stateRecordsAfter} (Bertambah +1)`);
  console.log(`   • isHashRegistered   : ${isRegisteredAfter} (Berubah False -> True)`);
  console.log(`   • Tx Hash            : ${receiptRecord?.hash}`);
  console.log(`   • Block Number       : ${receiptRecord?.blockNumber}`);
  console.log(`   • Gas Terpakai       : ${receiptRecord?.gasUsed.toString()} units`);

  // --------------------------------------------------------------------------
  // DEMONSTRASI 2: Verifikasi On-Chain & Emisi Event RecordVerified
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------");
  console.log("DEMONSTRASI 2: Verifikasi On-Chain oleh Pihak Ketiga (RecordVerified Event)");
  console.log("--------------------------------------------------------------------------");

  console.log(`[EKSEKUSI TRANSAKSI]: Verifier (${verifier.address}) memanggil verifyRecord()...`);
  const txVerify = await mnema.connect(verifier).verifyRecord(testDocHash);
  const receiptVerify = await txVerify.wait();

  const verifyEvents = receiptVerify?.logs.map((log: any) => {
    try {
      return mnema.interface.parseLog(log);
    } catch {
      return null;
    }
  }).filter((e: any) => e && e.name === "RecordVerified");

  if (verifyEvents && verifyEvents.length > 0) {
    const event = verifyEvents[0];
    console.log(`   🎯 Event Name    : ${event?.name}`);
    console.log(`   📌 Record ID     : ${event?.args.recordId.toString()}`);
    console.log(`   🔑 Document Hash : ${event?.args.docHash}`);
    console.log(`   👤 Verifier      : ${event?.args.verifier}`);
    console.log(`   ✅ Is Valid      : ${event?.args.isValid}`);
  }

  // --------------------------------------------------------------------------
  // DEMONSTRASI 3: Delegasi Akses Berbatas Waktu & Perubahan Hak Akses
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------");
  console.log("DEMONSTRASI 3: Delegasi Akses Berbatas Waktu (Time-Locked Access Delegation)");
  console.log("--------------------------------------------------------------------------");

  const [accessBefore] = await mnema.checkAccess(clientUser.address, 1);
  console.log(`[STATE SEBELUM DELEGASI]`);
  console.log(`   • Akses Client (${clientUser.address}): ${accessBefore}`);

  console.log(`\n[EKSEKUSI TRANSAKSI]: Creator/Admin mendelegasikan akses 7200 detik (2 jam)...`);
  const txGrant = await mnema.connect(admin).grantAccess(clientUser.address, 1, 7200);
  const receiptGrant = await txGrant.wait();

  const grantEvents = receiptGrant?.logs.map((log: any) => {
    try {
      return mnema.interface.parseLog(log);
    } catch {
      return null;
    }
  }).filter((e: any) => e && e.name === "AccessGranted");

  if (grantEvents && grantEvents.length > 0) {
    const event = grantEvents[0];
    console.log(`   🎯 Event Name    : ${event?.name}`);
    console.log(`   📌 Record ID     : ${event?.args.recordId.toString()}`);
    console.log(`   👤 Grantee       : ${event?.args.user}`);
    console.log(`   ⏰ Expiry        : ${event?.args.expiryTimestamp.toString()}`);
  }

  const [accessAfter, expiryTime] = await mnema.checkAccess(clientUser.address, 1);
  console.log(`\n[STATE SESUDAH DELEGASI]`);
  console.log(`   • Akses Client   : ${accessAfter} (Berubah False -> True)`);
  console.log(`   • Expiry Unix    : ${expiryTime.toString()}`);

  console.log("\n==========================================================================");
  console.log("🎉 INTEGRATION & EVENT VERIFICATION COMPLETED SUCCESSFULLY!");
  console.log("==========================================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
