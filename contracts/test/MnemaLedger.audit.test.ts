import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { MnemaLedger, MockReentrantAttacker } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * SECURITY AUDIT - VERIFIKASI PERBAIKAN (VERSI SETELAH PERBAIKAN)
 * Tes yang sama dengan versi "sebelum" (tag v1-audit), tetapi asersinya dibalik:
 * serangan yang dulu berhasil sekarang harus ditolak.
 */
describe("Security Audit - Fix Verification (post-fix)", function () {
  let mnema: MnemaLedger;
  let admin: SignerWithAddress;
  let victim: SignerWithAddress; // auditor jujur
  let attacker: SignerWithAddress; // auditor jahat (insider)
  let outsider: SignerWithAddress;

  let AUDITOR_ROLE: string;

  const HASH = ethers.keccak256(ethers.toUtf8Bytes("AUDIT_DOC_X"));
  const SALT = ethers.keccak256(ethers.toUtf8Bytes("SALT_X"));
  const CID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

  const commitmentOf = (hash: string, salt: string, who: string) =>
    ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32", "address"], [hash, salt, who]));

  /** Pendaftaran lewat jalur commit-reveal (satu-satunya jalur untuk auditor). */
  async function registerViaCommitReveal(
    signer: SignerWithAddress,
    hash: string,
    salt: string,
    title = "T"
  ) {
    const c = commitmentOf(hash, salt, signer.address);
    await mnema.connect(signer).commitMemory(c);
    await time.increase(20);
    await mnema.connect(signer).revealMemory(hash, salt, CID, title, "");
    return c;
  }

  beforeEach(async function () {
    [admin, victim, attacker, outsider] = await ethers.getSigners();
    const F = await ethers.getContractFactory("MnemaLedger");
    mnema = (await F.deploy(admin.address, 15, 86400)) as MnemaLedger;
    await mnema.waitForDeployment();
    AUDITOR_ROLE = await mnema.AUDITOR_ROLE();
    await mnema.connect(admin).grantRole(AUDITOR_ROLE, victim.address);
    await mnema.connect(admin).grantRole(AUDITOR_ROLE, attacker.address);
  });

  // F-01: jalur langsung hanya untuk admin
  it("F-01 fixed: auditor cannot bypass commit-reveal via createMemoryRecord", async function () {
    const c = commitmentOf(HASH, SALT, victim.address);
    await mnema.connect(victim).commitMemory(c);
    await time.increase(20);

    await expect(
      mnema.connect(attacker).createMemoryRecord(HASH, "evil_cid", "Hijacked", "")
    ).to.be.revertedWithCustomError(mnema, "AccessControlUnauthorizedAccount");

    // Reveal korban berhasil dan korban tercatat sebagai creator
    await mnema.connect(victim).revealMemory(HASH, SALT, CID, "Original", "");
    const rec = await mnema.getRecordByHash(HASH);
    expect(rec.creator).to.equal(victim.address);
  });

  it("F-01 regression: admin can still use direct registration", async function () {
    await expect(mnema.connect(admin).createMemoryRecord(HASH, CID, "Admin", ""))
      .to.emit(mnema, "MemoryRecordCreated");
  });

  // F-03a: auditor yang role-nya dicabut tidak lagi berwenang
  it("F-03a fixed: revoked auditor cannot update status or grant access", async function () {
    await registerViaCommitReveal(victim, HASH, SALT);
    await mnema.connect(admin).revokeRole(AUDITOR_ROLE, victim.address);

    await expect(
      mnema.connect(victim).updateRecordStatus(1, 3, "tidak boleh")
    ).to.be.revertedWithCustomError(mnema, "Mnema__NotRecordCreatorOrAdmin");
    await expect(
      mnema.connect(victim).grantAccess(outsider.address, 1, 3600)
    ).to.be.revertedWithCustomError(mnema, "Mnema__NotRecordCreatorOrAdmin");
  });

  // F-03b: Revoked terkunci untuk non-admin; status sama ditolak
  it("F-03b fixed: only admin can change a Revoked record", async function () {
    await registerViaCommitReveal(victim, HASH, SALT);
    await mnema.connect(admin).updateRecordStatus(1, 3, "dicabut admin");

    await expect(
      mnema.connect(victim).updateRecordStatus(1, 0, "aktifkan lagi")
    ).to.be.revertedWithCustomError(mnema, "Mnema__RevokedRecordLocked");

    // Admin tetap boleh memulihkan
    await expect(mnema.connect(admin).updateRecordStatus(1, 0, "dipulihkan admin")).to.not.be
      .reverted;
  });

  it("F-03c fixed: setting the same status is rejected", async function () {
    await registerViaCommitReveal(victim, HASH, SALT);
    await expect(
      mnema.connect(victim).updateRecordStatus(1, 0, "status sama")
    ).to.be.revertedWithCustomError(mnema, "Mnema__InvalidStatusTransition");
  });

  // F-04: commit yang sudah di-reveal tidak bisa ditimpa
  it("F-04 fixed: revealed commitment cannot be overwritten", async function () {
    const c = await registerViaCommitReveal(victim, HASH, SALT);
    expect((await mnema.getCommitment(c)).isRevealed).to.be.true;

    // Pihak tanpa role ditolak
    await expect(
      mnema.connect(outsider).commitMemory(c)
    ).to.be.revertedWithCustomError(mnema, "AccessControlUnauthorizedAccount");

    // Auditor lain juga ditolak
    await expect(
      mnema.connect(attacker).commitMemory(c)
    ).to.be.revertedWithCustomError(mnema, "Mnema__InvalidCommitment");

    expect((await mnema.getCommitment(c)).isRevealed).to.be.true; // tetap utuh
  });

  it("F-04 regression: expired unrevealed commitment can be re-committed", async function () {
    const c = commitmentOf(HASH, SALT, victim.address);
    await mnema.connect(victim).commitMemory(c);
    await time.increase(86400 + 10);
    await expect(mnema.connect(victim).commitMemory(c)).to.not.be.reverted;
  });

  // F-05: pencabutan akses tetap bisa saat pause
  it("F-05 fixed: revokeAccess works while paused", async function () {
    await registerViaCommitReveal(victim, HASH, SALT);
    await mnema.connect(victim).grantAccess(outsider.address, 1, 3600);
    expect((await mnema.checkAccess(outsider.address, 1))[0]).to.be.true;

    await mnema.connect(admin).pause();
    await expect(mnema.connect(victim).revokeAccess(outsider.address, 1)).to.not.be.reverted;
    expect((await mnema.checkAccess(outsider.address, 1))[0]).to.be.false;
  });

  // F-06: validasi parameter
  it("F-06a fixed: minCommitDelay of 0 is rejected", async function () {
    await expect(
      mnema.connect(admin).setCommitParameters(0, 86400)
    ).to.be.revertedWithCustomError(mnema, "Mnema__InvalidCommitParameters");
  });

  it("F-06b fixed: huge maxCommitWindow is rejected (no overflow)", async function () {
    const maxU64 = (1n << 64n) - 1n;
    await expect(
      mnema.connect(admin).setCommitParameters(1, maxU64)
    ).to.be.revertedWithCustomError(mnema, "Mnema__InvalidCommitParameters");
    await expect(
      mnema.connect(admin).setCommitParameters(15, 366 * 86400)
    ).to.be.revertedWithCustomError(mnema, "Mnema__InvalidCommitParameters");
  });

  it("F-06c fixed: valid update succeeds and emits CommitParametersUpdated", async function () {
    await expect(mnema.connect(admin).setCommitParameters(30, 7200))
      .to.emit(mnema, "CommitParametersUpdated")
      .withArgs(15, 86400, 30, 7200, admin.address);
    expect(await mnema.minCommitDelay()).to.equal(30);
  });

  it("F-06d fixed: only admin can change parameters", async function () {
    await expect(
      mnema.connect(attacker).setCommitParameters(30, 7200)
    ).to.be.revertedWithCustomError(mnema, "AccessControlUnauthorizedAccount");
  });

  // F-02: accepted risk (batasan desain), perilaku tidak berubah
  it("F-02 accepted risk: on-chain data remains publicly readable", async function () {
    await registerViaCommitReveal(victim, HASH, SALT, "Judul Sensitif");
    const [hasAccess] = await mnema.checkAccess(outsider.address, 1);
    expect(hasAccess).to.be.false;

    const rec = await mnema.connect(outsider).getRecordById(1);
    expect(rec.title).to.equal("Judul Sensitif");
    // Mitigasi: jangan simpan metadata sensitif plaintext, enforcement di gateway off-chain.
  });

  // Reentrancy tidak relevan; akses lewat kontrak eksternal tetap tunduk pada role
  it("Reentrancy N/A: external contract is rejected without admin role", async function () {
    const A = await ethers.getContractFactory("MockReentrantAttacker");
    const atk = (await A.deploy(await mnema.getAddress())) as MockReentrantAttacker;
    await atk.waitForDeployment();

    await expect(
      atk.attackCreate(HASH, CID, "via contract", "")
    ).to.be.revertedWithCustomError(mnema, "AccessControlUnauthorizedAccount");
  });
});