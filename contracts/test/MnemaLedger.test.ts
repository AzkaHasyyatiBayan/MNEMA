import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { MnemaLedger, MockReentrantAttacker } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MNEMA Decentralized Ledger - Smart Contract Test Suite", function () {
  let mnema: MnemaLedger;
  let attackerContract: MockReentrantAttacker;
  let admin: SignerWithAddress;
  let auditor: SignerWithAddress;
  let verifier: SignerWithAddress;
  let unauthorizedUser: SignerWithAddress;
  let externalClient: SignerWithAddress;

  const SAMPLE_DOC_HASH = ethers.keccak256(ethers.toUtf8Bytes("MNEMA_AUDIT_DOCUMENT_V1"));
  const SAMPLE_DOC_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("MNEMA_AUDIT_DOCUMENT_V2"));
  const SAMPLE_CID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
  const SAMPLE_TITLE = "Audit Forensik Infrastruktur Cloud 2026";
  const SAMPLE_METADATA_URI = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/metadata.json";

  const MIN_COMMIT_DELAY = 15; // 15 detik
  const MAX_COMMIT_WINDOW = 86400; // 1 hari (86400 detik)

  /**
   * Setelah perbaikan audit F-01, createMemoryRecord hanya untuk admin.
   * Auditor mendaftarkan record lewat jalur commit-reveal. Helper ini
   * membuat record dengan creator = signer melalui jalur tersebut.
   */
  async function createViaCommitReveal(
    signer: SignerWithAddress,
    docHash: string,
    cid: string,
    title: string,
    uri: string
  ) {
    const salt = ethers.keccak256(ethers.solidityPacked(["string", "bytes32"], ["SALT_", docHash]));
    const commitment = ethers.keccak256(
      ethers.solidityPacked(["bytes32", "bytes32", "address"], [docHash, salt, signer.address])
    );
    await mnema.connect(signer).commitMemory(commitment);
    await time.increase(MIN_COMMIT_DELAY + 5);
    await mnema.connect(signer).revealMemory(docHash, salt, cid, title, uri);
  }

  beforeEach(async function () {
    [admin, auditor, verifier, unauthorizedUser, externalClient] = await ethers.getSigners();

    const MnemaFactory = await ethers.getContractFactory("MnemaLedger");
    mnema = (await MnemaFactory.deploy(
      admin.address,
      MIN_COMMIT_DELAY,
      MAX_COMMIT_WINDOW
    )) as MnemaLedger;
    await mnema.waitForDeployment();

    // Berikan role AUDITOR dan VERIFIER
    const AUDITOR_ROLE = await mnema.AUDITOR_ROLE();
    const VERIFIER_ROLE = await mnema.VERIFIER_ROLE();

    await mnema.connect(admin).grantRole(AUDITOR_ROLE, auditor.address);
    await mnema.connect(admin).grantRole(VERIFIER_ROLE, verifier.address);

    // Deploy mock attacker contract
    const AttackerFactory = await ethers.getContractFactory("MockReentrantAttacker");
    attackerContract = (await AttackerFactory.deploy(await mnema.getAddress())) as MockReentrantAttacker;
    await attackerContract.waitForDeployment();
  });

  // =========================================================================
  // 1. INITIALIZATION & ACCESS CONTROL (PROJECT 1)
  // =========================================================================
  describe("1. Deployment & Access Control Initialization", function () {
    it("Should correctly set admin roles and parameters", async function () {
      const DEFAULT_ADMIN_ROLE = await mnema.DEFAULT_ADMIN_ROLE();
      expect(await mnema.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await mnema.minCommitDelay()).to.equal(MIN_COMMIT_DELAY);
      expect(await mnema.maxCommitWindow()).to.equal(MAX_COMMIT_WINDOW);
      expect(await mnema.totalRecords()).to.equal(0);
    });

    it("Should reject deployment with zero address admin", async function () {
      const MnemaFactory = await ethers.getContractFactory("MnemaLedger");
      await expect(
        MnemaFactory.deploy(ethers.ZeroAddress, MIN_COMMIT_DELAY, MAX_COMMIT_WINDOW)
      ).to.be.revertedWithCustomError(mnema, "Mnema__ZeroAddressNotAllowed");
    });
  });

  // =========================================================================
  // 2. DIRECT REGISTRATION & RECORD VERIFICATION (PROJECT 1 & 2)
  // =========================================================================
  describe("2. Direct Record Creation & Verification", function () {
    it("Positive: Admin can create a new record and emit MemoryRecordCreated", async function () {
      await expect(
        mnema.connect(admin).createMemoryRecord(
          SAMPLE_DOC_HASH,
          SAMPLE_CID,
          SAMPLE_TITLE,
          SAMPLE_METADATA_URI
        )
      )
        .to.emit(mnema, "MemoryRecordCreated")
        .withArgs(1, SAMPLE_DOC_HASH, admin.address, SAMPLE_CID, SAMPLE_TITLE, (val: any) => typeof val === "bigint");

      expect(await mnema.totalRecords()).to.equal(1);
      expect(await mnema.isHashRegistered(SAMPLE_DOC_HASH)).to.be.true;

      const record = await mnema.getRecordById(1);
      expect(record.recordId).to.equal(1);
      expect(record.docHash).to.equal(SAMPLE_DOC_HASH);
      expect(record.creator).to.equal(admin.address);
      expect(record.title).to.equal(SAMPLE_TITLE);
      expect(record.status).to.equal(0); // RecordStatus.Active
    });

    it("Positive: Auditor can register a record via commit-reveal", async function () {
      await createViaCommitReveal(auditor, SAMPLE_DOC_HASH, SAMPLE_CID, SAMPLE_TITLE, SAMPLE_METADATA_URI);

      expect(await mnema.totalRecords()).to.equal(1);
      const record = await mnema.getRecordById(1);
      expect(record.creator).to.equal(auditor.address);
      expect(record.status).to.equal(0);
    });

    it("Negative: Non-auditor cannot create record", async function () {
      await expect(
        mnema.connect(unauthorizedUser).createMemoryRecord(
          SAMPLE_DOC_HASH,
          SAMPLE_CID,
          SAMPLE_TITLE,
          SAMPLE_METADATA_URI
        )
      ).to.be.revertedWithCustomError(mnema, "AccessControlUnauthorizedAccount");
    });

    it("Negative: Auditor cannot use direct registration (admin only, audit fix F-01)", async function () {
      await expect(
        mnema.connect(auditor).createMemoryRecord(
          SAMPLE_DOC_HASH,
          SAMPLE_CID,
          SAMPLE_TITLE,
          SAMPLE_METADATA_URI
        )
      ).to.be.revertedWithCustomError(mnema, "AccessControlUnauthorizedAccount");
    });

    it("Negative: Cannot register with zero hash", async function () {
      await expect(
        mnema.connect(admin).createMemoryRecord(
          ethers.ZeroHash,
          SAMPLE_CID,
          SAMPLE_TITLE,
          SAMPLE_METADATA_URI
        )
      ).to.be.revertedWithCustomError(mnema, "Mnema__ZeroHashNotAllowed");
    });

    it("Negative: Cannot register duplicate document hash", async function () {
      await mnema.connect(admin).createMemoryRecord(
        SAMPLE_DOC_HASH,
        SAMPLE_CID,
        SAMPLE_TITLE,
        SAMPLE_METADATA_URI
      );

      await expect(
        mnema.connect(admin).createMemoryRecord(
          SAMPLE_DOC_HASH,
          "another_cid",
          "Duplicate Title",
          ""
        )
      ).to.be.revertedWithCustomError(mnema, "Mnema__RecordAlreadyExists")
        .withArgs(SAMPLE_DOC_HASH);
    });

    it("Positive: Verification returns true and emits RecordVerified event", async function () {
      await mnema.connect(admin).createMemoryRecord(
        SAMPLE_DOC_HASH,
        SAMPLE_CID,
        SAMPLE_TITLE,
        SAMPLE_METADATA_URI
      );

      await expect(mnema.connect(verifier).verifyRecord(SAMPLE_DOC_HASH))
        .to.emit(mnema, "RecordVerified")
        .withArgs(1, SAMPLE_DOC_HASH, verifier.address, true, (val: any) => typeof val === "bigint");
    });

    it("Negative: Verification returns false for unregistered hash", async function () {
      const UNREGISTERED_HASH = ethers.keccak256(ethers.toUtf8Bytes("NON_EXISTENT_DOCUMENT"));
      await expect(mnema.connect(verifier).verifyRecord(UNREGISTERED_HASH))
        .to.emit(mnema, "RecordVerified")
        .withArgs(0, UNREGISTERED_HASH, verifier.address, false, (val: any) => typeof val === "bigint");
    });
  });

  // =========================================================================
  // 3. ADVANCED FEATURE: COMMIT-REVEAL SCHEME (PROJECT 1, 2, 3)
  // =========================================================================
  describe("3. Commit-Reveal Anti-Front-Running Scheme", function () {
    const salt = ethers.keccak256(ethers.toUtf8Bytes("SECRET_SALT_2026"));

    it("Positive: Full commit-reveal flow succeeds after delay", async function () {
      // commitment = keccak256(abi.encodePacked(docHash, salt, msg.sender))
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "address"],
          [SAMPLE_DOC_HASH_2, salt, auditor.address]
        )
      );

      // 1. Commit
      await expect(mnema.connect(auditor).commitMemory(commitment))
        .to.emit(mnema, "MemoryCommitted")
        .withArgs(commitment, auditor.address, (val: any) => typeof val === "bigint", (val: any) => typeof val === "bigint");

      // Verifikasi commitment tersimpan
      const savedCommitment = await mnema.getCommitment(commitment);
      expect(savedCommitment.isRevealed).to.be.false;

      // 2. Majukan waktu melewati minCommitDelay
      await time.increase(MIN_COMMIT_DELAY + 5);

      // 3. Reveal
      await expect(
        mnema.connect(auditor).revealMemory(
          SAMPLE_DOC_HASH_2,
          salt,
          SAMPLE_CID,
          "Revealed Record",
          SAMPLE_METADATA_URI
        )
      )
        .to.emit(mnema, "MemoryRevealed")
        .withArgs(1, commitment, SAMPLE_DOC_HASH_2, auditor.address);

      expect(await mnema.isHashRegistered(SAMPLE_DOC_HASH_2)).to.be.true;
    });

    it("Negative: Reveal too early reverts with Mnema__CommitmentTooEarly", async function () {
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "address"],
          [SAMPLE_DOC_HASH_2, salt, auditor.address]
        )
      );

      await mnema.connect(auditor).commitMemory(commitment);

      // Jangan majukan waktu
      await expect(
        mnema.connect(auditor).revealMemory(
          SAMPLE_DOC_HASH_2,
          salt,
          SAMPLE_CID,
          "Too Early Record",
          ""
        )
      ).to.be.revertedWithCustomError(mnema, "Mnema__CommitmentTooEarly");
    });

    it("Negative: Reveal after expiration reverts with Mnema__CommitmentExpired", async function () {
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "address"],
          [SAMPLE_DOC_HASH_2, salt, auditor.address]
        )
      );

      await mnema.connect(auditor).commitMemory(commitment);

      // Majukan waktu melebihi maxCommitWindow (1 hari + 1 jam)
      await time.increase(MAX_COMMIT_WINDOW + 3600);

      await expect(
        mnema.connect(auditor).revealMemory(
          SAMPLE_DOC_HASH_2,
          salt,
          SAMPLE_CID,
          "Expired Record",
          ""
        )
      ).to.be.revertedWithCustomError(mnema, "Mnema__CommitmentExpired");
    });

    it("Negative: Replay attack on already revealed commitment reverts", async function () {
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "address"],
          [SAMPLE_DOC_HASH_2, salt, auditor.address]
        )
      );

      await mnema.connect(auditor).commitMemory(commitment);
      await time.increase(MIN_COMMIT_DELAY + 5);

      await mnema.connect(auditor).revealMemory(
        SAMPLE_DOC_HASH_2,
        salt,
        SAMPLE_CID,
        "Record 1",
        ""
      );

      // Percobaan kedua dengan commitment yang sama
      await expect(
        mnema.connect(auditor).revealMemory(
          SAMPLE_DOC_HASH_2,
          salt,
          SAMPLE_CID,
          "Record 1 Replay",
          ""
        )
      ).to.be.revertedWithCustomError(mnema, "Mnema__CommitmentAlreadyRevealed");
    });
  });

  // =========================================================================
  // 4. TIME-LOCKED ACCESS & DELEGATION (PROJECT 1 & 2)
  // =========================================================================
  describe("4. Time-Locked Access Delegation", function () {
    beforeEach(async function () {
      // Record milik auditor, dibuat lewat commit-reveal (audit fix F-01)
      await createViaCommitReveal(
        auditor,
        SAMPLE_DOC_HASH,
        SAMPLE_CID,
        SAMPLE_TITLE,
        SAMPLE_METADATA_URI
      );
    });

    it("Positive: Creator can grant time-locked access and it expires automatically", async function () {
      const duration = 3600; // 1 jam
      await expect(
        mnema.connect(auditor).grantAccess(externalClient.address, 1, duration)
      )
        .to.emit(mnema, "AccessGranted")
        .withArgs(1, externalClient.address, auditor.address, (val: any) => typeof val === "bigint");

      // Saat ini akses aktif
      const [hasAccessBefore] = await mnema.checkAccess(externalClient.address, 1);
      expect(hasAccessBefore).to.be.true;

      // Majukan waktu melebihi durasi (1 jam + 10 detik)
      await time.increase(duration + 10);

      // Akses otomatis kedaluwarsa
      const [hasAccessAfter] = await mnema.checkAccess(externalClient.address, 1);
      expect(hasAccessAfter).to.be.false;
    });

    it("Positive: Creator can revoke access manually before expiry", async function () {
      await mnema.connect(auditor).grantAccess(externalClient.address, 1, 3600);
      expect((await mnema.checkAccess(externalClient.address, 1))[0]).to.be.true;

      await expect(mnema.connect(auditor).revokeAccess(externalClient.address, 1))
        .to.emit(mnema, "AccessRevoked")
        .withArgs(1, externalClient.address, auditor.address);

      expect((await mnema.checkAccess(externalClient.address, 1))[0]).to.be.false;
    });

    it("Negative: Non-creator cannot grant access", async function () {
      await expect(
        mnema.connect(unauthorizedUser).grantAccess(externalClient.address, 1, 3600)
      ).to.be.revertedWithCustomError(mnema, "Mnema__NotRecordCreatorOrAdmin");
    });
  });

  // =========================================================================
  // 5. LIFECYCLE STATUS & CIRCUIT BREAKER (PAUSE/UNPAUSE)
  // =========================================================================
  describe("5. Lifecycle Status & Circuit Breaker", function () {
    beforeEach(async function () {
      // Record milik auditor, dibuat lewat commit-reveal (audit fix F-01)
      await createViaCommitReveal(
        auditor,
        SAMPLE_DOC_HASH,
        SAMPLE_CID,
        SAMPLE_TITLE,
        SAMPLE_METADATA_URI
      );
    });

    it("Positive: Creator can update record status to Revoked", async function () {
      // 3 = RecordStatus.Revoked
      await expect(
        mnema.connect(auditor).updateRecordStatus(1, 3, "Dokumen dibatalkan pengadilan")
      )
        .to.emit(mnema, "RecordStatusUpdated")
        .withArgs(1, 0, 3, "Dokumen dibatalkan pengadilan", auditor.address);

      const record = await mnema.getRecordById(1);
      expect(record.status).to.equal(3);

      // Verifikasi dokumen yang direvoke menghasilkan false
      const [isValid] = await mnema.connect(verifier).verifyRecord.staticCall(SAMPLE_DOC_HASH);
      expect(isValid).to.be.false;
    });

    it("Positive: Admin can pause and unpause contract", async function () {
      await mnema.connect(admin).pause();
      expect(await mnema.paused()).to.be.true;

      // Pendaftaran record ditolak saat paused (admin lolos role check, lalu terkena pause)
      await expect(
        mnema.connect(admin).createMemoryRecord(
          SAMPLE_DOC_HASH_2,
          SAMPLE_CID,
          "Paused Attempt",
          ""
        )
      ).to.be.revertedWithCustomError(mnema, "EnforcedPause");

      // Unpause
      await mnema.connect(admin).unpause();
      expect(await mnema.paused()).to.be.false;

      // Pendaftaran berhasil pasca-unpause
      await expect(
        mnema.connect(admin).createMemoryRecord(
          SAMPLE_DOC_HASH_2,
          SAMPLE_CID,
          "Success Resume",
          ""
        )
      ).to.emit(mnema, "MemoryRecordCreated");
    });
  });

  // =========================================================================
  // 6. ACCESS CONTROL VIA EXTERNAL CONTRACT
  // =========================================================================
  describe("6. Access Control via External Contract", function () {
    it("Should reject calls from an external contract without role", async function () {
      // Catatan: ini menguji access control, bukan reentrancy.
      // Kontrak tidak mengirim ETH / memanggil kontrak eksternal, jadi reentrancy tidak relevan.
      await expect(
        attackerContract.attackCreate(
          SAMPLE_DOC_HASH_2,
          SAMPLE_CID,
          "Malicious Injected Title",
          ""
        )
      ).to.be.revertedWithCustomError(mnema, "AccessControlUnauthorizedAccount");
    });
  });
});