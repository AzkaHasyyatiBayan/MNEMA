// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IMnemaLedger} from "./interfaces/IMnemaLedger.sol";

/**
 * @title MnemaLedger
 * @author Lead Blockchain Architect & Smart Contract Engineer (MNEMA Team)
 * @notice Decentralized Audit & Provenance Ledger - Sistem Pencatatan Jejak Audit,
 *         Notaris Digital, dan Evidence Vault Lintas Organisasi.
 * @dev Mengimplementasikan Role-Based Access Control (RBAC), Commit-Reveal Anti-Front-Running,
 *      Time-Locked Access Delegation, Circuit Breaker (Pausable), dan Custom Errors
 *      untuk efisiensi gas maksimal sesuai rubrik UAS OBE.
 */
contract MnemaLedger is IMnemaLedger, AccessControl, Pausable, ReentrancyGuard {
    // =========================================================================
    // ROLES DEFINITION
    // =========================================================================
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // =========================================================================
    // CUSTOM ERRORS (Gas-Efficient Error Handling)
    // =========================================================================
    error Mnema__ZeroHashNotAllowed();
    error Mnema__EmptyStringNotAllowed();
    error Mnema__RecordAlreadyExists(bytes32 docHash);
    error Mnema__RecordNotFound(bytes32 docHash);
    error Mnema__RecordIdNotFound(uint256 recordId);
    error Mnema__InvalidCommitment();
    error Mnema__CommitmentAlreadyRevealed();
    error Mnema__CommitmentNotFound();
    error Mnema__CommitmentTooEarly(uint64 currentTimestamp, uint64 readyTimestamp);
    error Mnema__CommitmentExpired(uint64 currentTimestamp, uint64 expiryTimestamp);
    error Mnema__NotRecordCreatorOrAdmin();
    error Mnema__InvalidExpiryDuration();
    error Mnema__ZeroAddressNotAllowed();

    // =========================================================================
    // STATE VARIABLES
    // =========================================================================
    uint256 private _recordCounter;

    /// @notice Konfigurasi Commit-Reveal Anti Front-Running
    uint64 public minCommitDelay; // Waktu tunggu minimum sebelum reveal (default: 15 detik)
    uint64 public maxCommitWindow; // Jendela waktu kedaluwarsa commit (default: 1 hari)

    /// @notice Penyimpanan Record Utama
    /// @dev recordId => MemoryRecord
    mapping(uint256 => MemoryRecord) private _records;

    /// @notice Pencarian O(1) dari Hash Dokumen ke Record ID
    /// @dev docHash => recordId
    mapping(bytes32 => uint256) private _hashToRecordId;

    /// @notice Daftar Record ID yang dibuat oleh masing-masing creator
    /// @dev creatorAddress => array of recordId
    mapping(address => uint256[]) private _creatorRecords;

    /// @notice Delegasi Akses Berbatas Waktu (Time-Locked Access)
    /// @dev recordId => (userAddress => AccessGrant)
    mapping(uint256 => mapping(address => AccessGrant)) private _accessGrants;

    /// @notice Registry Komitmen Rahasia (Commit-Reveal)
    /// @dev commitmentHash => Commitment
    mapping(bytes32 => Commitment) private _commitments;

    // =========================================================================
    // MODIFIERS
    // =========================================================================
    modifier onlyCreatorOrAdmin(uint256 recordId) {
        if (recordId == 0 || recordId > _recordCounter) {
            revert Mnema__RecordIdNotFound(recordId);
        }
        address creator = _records[recordId].creator;
        if (msg.sender != creator && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert Mnema__NotRecordCreatorOrAdmin();
        }
        _;
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================
    /**
     * @notice Inisialisasi kontrak MNEMA dengan admin awal dan konfigurasi jendela commit-reveal.
     * @param rootAdmin Alamat Super Admin / Regulator tata kelola
     * @param initialMinCommitDelay Delay minimum commit sebelum reveal (detik)
     * @param initialMaxCommitWindow Batas waktu reveal sebelum commit kedaluwarsa (detik)
     */
    constructor(
        address rootAdmin,
        uint64 initialMinCommitDelay,
        uint64 initialMaxCommitWindow
    ) {
        if (rootAdmin == address(0)) revert Mnema__ZeroAddressNotAllowed();

        _grantRole(DEFAULT_ADMIN_ROLE, rootAdmin);
        _grantRole(AUDITOR_ROLE, rootAdmin);
        _grantRole(VERIFIER_ROLE, rootAdmin);

        minCommitDelay = initialMinCommitDelay > 0 ? initialMinCommitDelay : 15 seconds;
        maxCommitWindow = initialMaxCommitWindow > 0 ? initialMaxCommitWindow : 1 days;
    }

    // =========================================================================
    // CORE FUNCTIONS (REGISTRASI & COMMIT-REVEAL)
    // =========================================================================

    /**
     * @notice Membuat record audit secara langsung (Direct Registration).
     * @dev Memerlukan AUDITOR_ROLE dan kontrak tidak dalam kondisi pause.
     * @param docHash Fingerprint SHA-256 dari berkas audit asli
     * @param ipfsCID Content Identifier IPFS tempat berkas tersimpan
     * @param title Judul atau deskripsi singkat record
     * @param metadataURI Metadata terstruktur tambahan
     * @return recordId ID identitas rekaman yang baru dibuat
     */
    function createMemoryRecord(
        bytes32 docHash,
        string calldata ipfsCID,
        string calldata title,
        string calldata metadataURI
    ) external onlyRole(AUDITOR_ROLE) whenNotPaused nonReentrant returns (uint256 recordId) {
        return _internalCreateRecord(docHash, ipfsCID, title, metadataURI, msg.sender);
    }

    /**
     * @notice Tahap 1 Skema Commit-Reveal: Mendaftarkan komitmen hash rahasia sebelum reveal.
     * @dev Menghindari penyerang melakukan front-running transaksi pencatatan bukti penting.
     *      commitment = keccak256(abi.encodePacked(docHash, salt, msg.sender))
     * @param commitment Hash komitmen dari bukti dan salt rahasia
     */
    function commitMemory(bytes32 commitment) external whenNotPaused {
        if (commitment == bytes32(0)) revert Mnema__ZeroHashNotAllowed();

        Commitment storage comm = _commitments[commitment];
        if (comm.commitTimestamp != 0 && !comm.isRevealed) {
            // Re-commit hanya diizinkan jika sudah expired atau baru
            if (block.timestamp <= comm.commitTimestamp + maxCommitWindow) {
                revert Mnema__InvalidCommitment();
            }
        }

        _commitments[commitment] = Commitment({
            commitmentHash: commitment,
            commitBlock: uint64(block.number),
            commitTimestamp: uint64(block.timestamp),
            isRevealed: false
        });

        emit MemoryCommitted(
            commitment,
            msg.sender,
            uint64(block.number),
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Tahap 2 Skema Commit-Reveal: Mengungkap berkas asli dan memverifikasi komitmen.
     * @dev Menghitung ulang hash komitmen dan memastikan jendela waktu valid.
     * @param docHash Hash SHA-256 dokumen asli
     * @param salt Kunci acak (salt) yang digunakan saat commit
     * @param ipfsCID Content Identifier IPFS berkas bukti
     * @param title Judul record bukti audit
     * @param metadataURI URI metadata tambahan
     * @return recordId ID unik record yang berhasil diverifikasi dan didaftarkan
     */
    function revealMemory(
        bytes32 docHash,
        bytes32 salt,
        string calldata ipfsCID,
        string calldata title,
        string calldata metadataURI
    ) external onlyRole(AUDITOR_ROLE) whenNotPaused nonReentrant returns (uint256 recordId) {
        bytes32 computedCommitment = keccak256(
            abi.encodePacked(docHash, salt, msg.sender)
        );

        Commitment storage comm = _commitments[computedCommitment];
        if (comm.commitTimestamp == 0) revert Mnema__CommitmentNotFound();
        if (comm.isRevealed) revert Mnema__CommitmentAlreadyRevealed();

        uint64 readyTimestamp = comm.commitTimestamp + minCommitDelay;
        if (block.timestamp < readyTimestamp) {
            revert Mnema__CommitmentTooEarly(uint64(block.timestamp), readyTimestamp);
        }

        uint64 expiryTimestamp = comm.commitTimestamp + maxCommitWindow;
        if (block.timestamp > expiryTimestamp) {
            revert Mnema__CommitmentExpired(uint64(block.timestamp), expiryTimestamp);
        }

        comm.isRevealed = true;

        recordId = _internalCreateRecord(
            docHash,
            ipfsCID,
            title,
            metadataURI,
            msg.sender
        );

        emit MemoryRevealed(recordId, computedCommitment, docHash, msg.sender);
        return recordId;
    }

    /**
     * @dev Logika internal pendaftaran record guna memastikan optimasi DRY dan gas.
     */
    function _internalCreateRecord(
        bytes32 docHash,
        string calldata ipfsCID,
        string calldata title,
        string calldata metadataURI,
        address creator
    ) internal returns (uint256) {
        if (docHash == bytes32(0)) revert Mnema__ZeroHashNotAllowed();
        if (bytes(ipfsCID).length == 0 || bytes(title).length == 0) {
            revert Mnema__EmptyStringNotAllowed();
        }
        if (_hashToRecordId[docHash] != 0) {
            revert Mnema__RecordAlreadyExists(docHash);
        }

        uint256 newId = ++_recordCounter;

        _records[newId] = MemoryRecord({
            recordId: newId,
            docHash: docHash,
            creator: creator,
            timestamp: uint64(block.timestamp),
            blockNumber: uint64(block.number),
            status: RecordStatus.Active,
            ipfsCID: ipfsCID,
            title: title,
            metadataURI: metadataURI
        });

        _hashToRecordId[docHash] = newId;
        _creatorRecords[creator].push(newId);

        emit MemoryRecordCreated(
            newId,
            docHash,
            creator,
            ipfsCID,
            title,
            uint64(block.timestamp)
        );

        return newId;
    }

    // =========================================================================
    // VERIFIKASI & AUDIT
    // =========================================================================

    /**
     * @notice Memverifikasi integritas dokumen dan memancarkan event verifikasi on-chain.
     * @param docHash Fingerprint SHA-256 yang ingin dicocokkan dengan ledger
     * @return isValid Boolean keabsahan dokumen
     * @return record Struct data lengkap rekaman jika ditemukan
     */
    function verifyRecord(bytes32 docHash)
        external
        whenNotPaused
        returns (bool isValid, MemoryRecord memory record)
    {
        uint256 id = _hashToRecordId[docHash];
        if (id == 0) {
            emit RecordVerified(0, docHash, msg.sender, false, uint64(block.timestamp));
            return (false, record);
        }

        record = _records[id];
        isValid = (record.status == RecordStatus.Active);

        emit RecordVerified(
            record.recordId,
            docHash,
            msg.sender,
            isValid,
            uint64(block.timestamp)
        );

        return (isValid, record);
    }

    // =========================================================================
    // TIME-LOCKED ACCESS DELEGATION (KONTROL AKSES BERKEDALUWARSA)
    // =========================================================================

    /**
     * @notice Memberikan izin akses berbatas waktu (*Time-Locked Access*) kepada pihak ketiga.
     * @dev Hanya creator dokumen atau Admin yang memiliki otorisasi pemberian akses.
     * @param user Alamat penerima izin inspeksi
     * @param recordId ID record yang ingin didelegasikan
     * @param durationInSeconds Durasi izin berlaku dari sekarang (detik)
     */
    function grantAccess(
        address user,
        uint256 recordId,
        uint256 durationInSeconds
    ) external onlyCreatorOrAdmin(recordId) whenNotPaused {
        if (user == address(0)) revert Mnema__ZeroAddressNotAllowed();
        if (durationInSeconds == 0 || durationInSeconds > 365 days) {
            revert Mnema__InvalidExpiryDuration();
        }

        uint64 expiry = uint64(block.timestamp + durationInSeconds);
        _accessGrants[recordId][user] = AccessGrant({
            isGranted: true,
            expiryTimestamp: expiry
        });

        emit AccessGranted(recordId, user, msg.sender, expiry);
    }

    /**
     * @notice Mencabut izin akses secara manual sebelum waktu kedaluwarsa habis.
     * @param user Alamat yang izinnya akan dicabut
     * @param recordId ID record yang bersangkutan
     */
    function revokeAccess(address user, uint256 recordId)
        external
        onlyCreatorOrAdmin(recordId)
        whenNotPaused
    {
        if (user == address(0)) revert Mnema__ZeroAddressNotAllowed();

        delete _accessGrants[recordId][user];
        emit AccessRevoked(recordId, user, msg.sender);
    }

    /**
     * @notice Mengecek apakah pengguna memiliki hak akses aktif terhadap record tertentu.
     * @param user Alamat yang diperiksa
     * @param recordId ID record yang bersangkutan
     * @return hasAccess Boolean apakah akses masih aktif dan belum kedaluwarsa
     * @return expiryTimestamp Waktu batas kadaluwarsa akses
     */
    function checkAccess(address user, uint256 recordId)
        external
        view
        returns (bool hasAccess, uint64 expiryTimestamp)
    {
        if (recordId == 0 || recordId > _recordCounter) return (false, 0);

        MemoryRecord memory r = _records[recordId];
        // Creator dan Admin selalu memiliki hak akses inheren
        if (user == r.creator || hasRole(DEFAULT_ADMIN_ROLE, user)) {
            return (true, type(uint64).max);
        }

        AccessGrant memory grant = _accessGrants[recordId][user];
        if (grant.isGranted && block.timestamp <= grant.expiryTimestamp) {
            return (true, grant.expiryTimestamp);
        }

        return (false, grant.expiryTimestamp);
    }

    // =========================================================================
    // STATUS LIFECYCLE MANAGEMENT
    // =========================================================================

    /**
     * @notice Mengubah status record (Active, Superseded, Deprecated, Revoked).
     * @param recordId ID record yang statusnya akan diubah
     * @param newStatus Status baru dari enum RecordStatus
     * @param reason Alasan audit perombakan status
     */
    function updateRecordStatus(
        uint256 recordId,
        RecordStatus newStatus,
        string calldata reason
    ) external onlyCreatorOrAdmin(recordId) whenNotPaused {
        if (bytes(reason).length == 0) revert Mnema__EmptyStringNotAllowed();

        MemoryRecord storage record = _records[recordId];
        RecordStatus oldStatus = record.status;
        record.status = newStatus;

        emit RecordStatusUpdated(
            recordId,
            oldStatus,
            newStatus,
            reason,
            msg.sender
        );
    }

    // =========================================================================
    // ADMIN CIRCUIT BREAKER & PARAMETERS
    // =========================================================================

    /**
     * @notice Menghentikan sementara operasi kontrak saat insiden darurat.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Melanjutkan kembali operasi kontrak pasca-insiden.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Mengubah parameter waktu tunggu commit-reveal.
     */
    function setCommitParameters(
        uint64 newMinCommitDelay,
        uint64 newMaxCommitWindow
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newMinCommitDelay >= newMaxCommitWindow) revert Mnema__InvalidExpiryDuration();
        minCommitDelay = newMinCommitDelay;
        maxCommitWindow = newMaxCommitWindow;
    }

    // =========================================================================
    // VIEW GETTERS
    // =========================================================================

    function totalRecords() external view returns (uint256) {
        return _recordCounter;
    }

    function isHashRegistered(bytes32 docHash) external view returns (bool) {
        return _hashToRecordId[docHash] != 0;
    }

    function getRecordById(uint256 recordId)
        external
        view
        returns (MemoryRecord memory)
    {
        if (recordId == 0 || recordId > _recordCounter) {
            revert Mnema__RecordIdNotFound(recordId);
        }
        return _records[recordId];
    }

    function getRecordByHash(bytes32 docHash)
        external
        view
        returns (MemoryRecord memory)
    {
        uint256 id = _hashToRecordId[docHash];
        if (id == 0) revert Mnema__RecordNotFound(docHash);
        return _records[id];
    }

    function getRecordsByCreator(address creator)
        external
        view
        returns (uint256[] memory)
    {
        return _creatorRecords[creator];
    }

    function getCommitment(bytes32 commitmentHash)
        external
        view
        returns (Commitment memory)
    {
        return _commitments[commitmentHash];
    }
}
