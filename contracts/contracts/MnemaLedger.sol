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
 *      Time-Locked Access Delegation, Circuit Breaker (Pausable), dan Custom Errors.
 *
 *      VERSI SETELAH AUDIT KEAMANAN (perbaikan F-01, F-03, F-04, F-05, F-06).
 *      Versi sebelum perbaikan: tag git `v1-audit`.
 */
contract MnemaLedger is IMnemaLedger, AccessControl, Pausable, ReentrancyGuard {
    // =========================================================================
    // ROLES DEFINITION
    // =========================================================================
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // =========================================================================
    // CONSTANTS
    // =========================================================================
    /// @dev [F-06] Batas atas jendela commit agar tidak terjadi overflow uint64 / DoS.
    uint64 public constant MAX_COMMIT_WINDOW_LIMIT = 365 days;

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
    /// @dev [F-06] Parameter commit-reveal di luar batas aman.
    error Mnema__InvalidCommitParameters(uint64 minDelay, uint64 maxWindow);
    /// @dev [F-03] Perubahan status ke status yang sama.
    error Mnema__InvalidStatusTransition(RecordStatus current, RecordStatus requested);
    /// @dev [F-03] Record berstatus Revoked hanya boleh diubah admin.
    error Mnema__RevokedRecordLocked();

    // =========================================================================
    // EVENTS (tambahan)
    // =========================================================================
    /// @dev [F-06] Jejak tata kelola perubahan parameter.
    event CommitParametersUpdated(
        uint64 oldMinDelay,
        uint64 oldMaxWindow,
        uint64 newMinDelay,
        uint64 newMaxWindow,
        address indexed updatedBy
    );

    // =========================================================================
    // STATE VARIABLES
    // =========================================================================
    uint256 private _recordCounter;

    /// @notice Konfigurasi Commit-Reveal Anti Front-Running
    uint64 public minCommitDelay; // Waktu tunggu minimum sebelum reveal (default: 15 detik)
    uint64 public maxCommitWindow; // Jendela waktu kedaluwarsa commit (default: 1 hari)

    mapping(uint256 => MemoryRecord) private _records;
    mapping(bytes32 => uint256) private _hashToRecordId;
    mapping(address => uint256[]) private _creatorRecords;
    mapping(uint256 => mapping(address => AccessGrant)) private _accessGrants;
    mapping(bytes32 => Commitment) private _commitments;

    // =========================================================================
    // MODIFIERS
    // =========================================================================
    /**
     * @dev [F-03] Admin, atau creator yang MASIH memegang AUDITOR_ROLE.
     *      Sebelumnya auditor yang role-nya sudah dicabut tetap lolos.
     */
    modifier onlyCreatorOrAdmin(uint256 recordId) {
        if (recordId == 0 || recordId > _recordCounter) {
            revert Mnema__RecordIdNotFound(recordId);
        }
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            if (
                msg.sender != _records[recordId].creator ||
                !hasRole(AUDITOR_ROLE, msg.sender)
            ) {
                revert Mnema__NotRecordCreatorOrAdmin();
            }
        }
        _;
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================
    constructor(
        address rootAdmin,
        uint64 initialMinCommitDelay,
        uint64 initialMaxCommitWindow
    ) {
        if (rootAdmin == address(0)) revert Mnema__ZeroAddressNotAllowed();

        _grantRole(DEFAULT_ADMIN_ROLE, rootAdmin);
        _grantRole(AUDITOR_ROLE, rootAdmin);
        _grantRole(VERIFIER_ROLE, rootAdmin);

        uint64 minDelay = initialMinCommitDelay > 0 ? initialMinCommitDelay : 15 seconds;
        uint64 maxWindow = initialMaxCommitWindow > 0 ? initialMaxCommitWindow : 1 days;
        _validateCommitParameters(minDelay, maxWindow);

        minCommitDelay = minDelay;
        maxCommitWindow = maxWindow;
    }

    // =========================================================================
    // CORE FUNCTIONS (REGISTRASI & COMMIT-REVEAL)
    // =========================================================================

    /**
     * @notice Membuat record secara langsung (Direct Registration).
     * @dev [F-01] Hanya ADMIN. Sebelumnya AUDITOR_ROLE, sehingga auditor jahat dapat
     *      mendahului (front-run) reveal auditor lain tanpa commit. Auditor biasa
     *      wajib memakai jalur commit-reveal.
     */
    function createMemoryRecord(
        bytes32 docHash,
        string calldata ipfsCID,
        string calldata title,
        string calldata metadataURI
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 recordId)
    {
        return _internalCreateRecord(docHash, ipfsCID, title, metadataURI, msg.sender);
    }

    /**
     * @notice Tahap 1 Skema Commit-Reveal.
     * @dev commitment = keccak256(abi.encodePacked(docHash, salt, msg.sender))
     *      [F-04] Commitment yang sudah di-reveal tidak boleh ditimpa.
     *      [F-09] Hanya AUDITOR_ROLE agar tidak bisa di-spam pihak luar.
     */
    function commitMemory(bytes32 commitment)
        external
        onlyRole(AUDITOR_ROLE)
        whenNotPaused
    {
        if (commitment == bytes32(0)) revert Mnema__ZeroHashNotAllowed();

        Commitment storage comm = _commitments[commitment];
        if (comm.commitTimestamp != 0) {
            // Ditolak jika sudah di-reveal, atau masih dalam jendela aktif.
            // Re-commit hanya boleh untuk commit yang kedaluwarsa dan belum di-reveal.
            if (
                comm.isRevealed ||
                block.timestamp <= uint256(comm.commitTimestamp) + maxCommitWindow
            ) {
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
     * @notice Tahap 2 Skema Commit-Reveal.
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
    // TIME-LOCKED ACCESS DELEGATION
    // =========================================================================

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
     * @notice Mencabut izin akses.
     * @dev [F-05] Tanpa `whenNotPaused`: pencabutan akses harus tetap bisa dilakukan
     *      saat insiden (kontrak sedang di-pause).
     */
    function revokeAccess(address user, uint256 recordId)
        external
        onlyCreatorOrAdmin(recordId)
    {
        if (user == address(0)) revert Mnema__ZeroAddressNotAllowed();

        delete _accessGrants[recordId][user];
        emit AccessRevoked(recordId, user, msg.sender);
    }

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
     * @notice Mengubah status record.
     * @dev [F-03] (1) status baru harus berbeda, (2) record Revoked hanya bisa
     *      diubah admin, (3) pemanggil harus admin atau creator beraudit-role aktif
     *      (lihat modifier).
     */
    function updateRecordStatus(
        uint256 recordId,
        RecordStatus newStatus,
        string calldata reason
    ) external onlyCreatorOrAdmin(recordId) whenNotPaused {
        if (bytes(reason).length == 0) revert Mnema__EmptyStringNotAllowed();

        MemoryRecord storage record = _records[recordId];
        RecordStatus oldStatus = record.status;

        if (newStatus == oldStatus) {
            revert Mnema__InvalidStatusTransition(oldStatus, newStatus);
        }
        if (
            oldStatus == RecordStatus.Revoked &&
            !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        ) {
            revert Mnema__RevokedRecordLocked();
        }

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

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Mengubah parameter waktu tunggu commit-reveal.
     * @dev [F-06] Delay minimal 1 detik, window maksimal 365 hari, delay < window,
     *      dan perubahan dicatat lewat event.
     */
    function setCommitParameters(
        uint64 newMinCommitDelay,
        uint64 newMaxCommitWindow
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _validateCommitParameters(newMinCommitDelay, newMaxCommitWindow);

        uint64 oldMin = minCommitDelay;
        uint64 oldMax = maxCommitWindow;
        minCommitDelay = newMinCommitDelay;
        maxCommitWindow = newMaxCommitWindow;

        emit CommitParametersUpdated(
            oldMin,
            oldMax,
            newMinCommitDelay,
            newMaxCommitWindow,
            msg.sender
        );
    }

    function _validateCommitParameters(uint64 minDelay, uint64 maxWindow) internal pure {
        if (
            minDelay == 0 ||
            minDelay >= maxWindow ||
            maxWindow > MAX_COMMIT_WINDOW_LIMIT
        ) {
            revert Mnema__InvalidCommitParameters(minDelay, maxWindow);
        }
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
