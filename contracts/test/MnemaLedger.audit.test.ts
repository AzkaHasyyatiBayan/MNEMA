import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { MnemaLedger, MockReentrantAttacker } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * SECURITY AUDIT - EXPLOIT TESTS (VERSI SEBELUM PERBAIKAN, tag v1-audit)
 * Tiap tes lolos di kode lama = kerentanan terbukti.
 * Setelah perbaikan, ubah asersi sesuai komentar "SETELAH FIX".
 */
describe("Security Audit - Exploit Proofs (pre-fix)", function () {
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

  beforeEach(async function () {
    [admin, victim, attacker, outsider] = await ethers.getSigners();
    const F = await ethers.getContractFactory("MnemaLedger");
    mnema = (await F.deploy(admin.address, 15, 86400)) as MnemaLedger;
    await mnema.waitForDeployment();
    AUDITOR_ROLE = await mnema.AUDITOR_ROLE();
    await mnema.connect(admin).grantRole(AUDITOR_ROLE, victim.address);
    await mnema.connect(admin).grantRole(AUDITOR_ROLE, attacker.address);
  });

  // F-01: jalur langsung createMemoryRecord melewati commit-reveal
  it("F-01: attacker front-runs reveal via createMemoryRecord", async function () {
    const c = commitmentOf(HASH, SALT, victim.address);
    await mnema.connect(victim).commitMemory(c);
    await time.increase(20);

    // Attacker melihat docHash di mempool dan mendaftar lebih dulu TANPA commit
    await mnema.connect(attacker).createMemoryRecord(HASH, "evil_cid", "Hijacked", "");

    // Reveal korban gagal
    await expect(
      mnema.connect(victim).revealMemory(HASH, SALT, CID, "Original", "")
    ).to.be.revertedWithCustomError(mnema, "Mnema__RecordAlreadyExists");

    const rec = await mnema.getRecordByHash(HASH);
    expect(rec.creator).to.equal(attacker.address); // kepemilikan dirampas
    // SETELAH FIX: createMemoryRecord oleh attacker harus revert, creator = victim
  });

  // F-03a: auditor yang role-nya dicabut masih bisa mengubah status record lamanya
  it("F-03a: revoked auditor can still update status and grant access", async function () {
    await mnema.connect(victim).createMemoryRecord(HASH, CID, "T", "");
    await mnema.connect(admin).revokeRole(AUDITOR_ROLE, victim.address);

    await expect(mnema.connect(victim).updateRecordStatus(1, 3, "masih bisa")).to.not.be.reverted;
    await expect(mnema.connect(victim).grantAccess(outsider.address, 1, 3600)).to.not.be.reverted;
    // SETELAH FIX: kedua panggilan harus revert
  });

  // F-03b: creator bisa mengaktifkan kembali record yang sudah Revoked
  it("F-03b: creator can reactivate a Revoked record", async function () {
    await mnema.connect(victim).createMemoryRecord(HASH, CID, "T", "");
    await mnema.connect(admin).updateRecordStatus(1, 3, "dicabut admin");
    await mnema.connect(victim).updateRecordStatus(1, 0, "aktifkan lagi");

    const rec = await mnema.getRecordById(1);
    expect(rec.status).to.equal(0); // Active lagi
    // SETELAH FIX: panggilan victim harus revert (Revoked hanya admin)
  });

  // F-04: commit yang sudah di-reveal bisa ditimpa siapa saja
  it("F-04: anyone can overwrite a revealed commitment", async function () {
    const c = commitmentOf(HASH, SALT, victim.address);
    await mnema.connect(victim).commitMemory(c);
    await time.increase(20);
    await mnema.connect(victim).revealMemory(HASH, SALT, CID, "T", "");
    expect((await mnema.getCommitment(c)).isRevealed).to.be.true;

    await mnema.connect(outsider).commitMemory(c); // tanpa role apa pun
    expect((await mnema.getCommitment(c)).isRevealed).to.be.false; // catatan rusak
    // SETELAH FIX: commitMemory(c) harus revert InvalidCommitment
  });

  // F-05: revokeAccess terblokir saat pause
  it("F-05: revokeAccess is blocked while paused", async function () {
    await mnema.connect(victim).createMemoryRecord(HASH, CID, "T", "");
    await mnema.connect(victim).grantAccess(outsider.address, 1, 3600);
    await mnema.connect(admin).pause();

    await expect(
      mnema.connect(victim).revokeAccess(outsider.address, 1)
    ).to.be.revertedWithCustomError(mnema, "EnforcedPause");
    // SETELAH FIX: revokeAccess tetap berhasil saat pause
  });

  // F-06a: delay bisa diset 0 sehingga anti-front-running hilang
  it("F-06a: admin can set minCommitDelay to 0", async function () {
    await mnema.connect(admin).setCommitParameters(0, 86400);
    expect(await mnema.minCommitDelay()).to.equal(0);
    // SETELAH FIX: harus revert
  });

  // F-06b: window sangat besar menyebabkan overflow uint64 saat reveal
  it("F-06b: huge maxCommitWindow makes reveal panic (overflow)", async function () {
    const maxU64 = (1n << 64n) - 1n;
    await mnema.connect(admin).setCommitParameters(1, maxU64);
    const c = commitmentOf(HASH, SALT, victim.address);
    await mnema.connect(victim).commitMemory(c);
    await time.increase(5);

    await expect(
      mnema.connect(victim).revealMemory(HASH, SALT, CID, "T", "")
    ).to.be.revertedWithPanic(0x11);
    // SETELAH FIX: setCommitParameters dengan nilai tsb harus revert
  });

  // F-02: time-lock tidak membatasi pembacaan data
  it("F-02: user without grant can still read the record", async function () {
    await mnema.connect(victim).createMemoryRecord(HASH, CID, "Judul Sensitif", "");
    const [hasAccess] = await mnema.checkAccess(outsider.address, 1);
    expect(hasAccess).to.be.false;

    const rec = await mnema.connect(outsider).getRecordById(1);
    expect(rec.title).to.equal("Judul Sensitif"); // tetap terbaca
    // Batasan desain: dokumentasikan sebagai accepted risk / mitigasi off-chain
  });

  // Pelengkap: mock sebagai auditor, tidak ada jalur reentrancy
  it("Reentrancy N/A: attacker contract with role registers normally", async function () {
    const A = await ethers.getContractFactory("MockReentrantAttacker");
    const atk = (await A.deploy(await mnema.getAddress())) as MockReentrantAttacker;
    await atk.waitForDeployment();
    await mnema.connect(admin).grantRole(AUDITOR_ROLE, await atk.getAddress());

    await atk.attackCreate(HASH, CID, "via contract", "");
    expect(await mnema.totalRecords()).to.equal(1); // satu record, tidak ada re-entry
  });
});