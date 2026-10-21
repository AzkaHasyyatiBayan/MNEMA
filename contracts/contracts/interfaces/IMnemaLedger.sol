// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMnemaLedger
 * @notice Interface for the MNEMA Decentralized Audit & Provenance Ledger.
 * @dev Definisikan tipe data, enum, struct, event, dan antarmuka fungsi utama.
 */
interface IMnemaLedger {
    enum RecordStatus {
        Active,      // 0: Dokumen sah, aktif, dan valid
        Superseded,  // 1: Digantikan oleh revisi versi baru
        Deprecated,  // 2: Tidak berlaku lagi karena masa berlaku habis
        Revoked      // 3: Dicabut secara hukum/administratif karena cacat bukti
    }

    struct MemoryRecord {
        uint256 recordId;
        bytes32 docHash;          // SHA-256 fingerprint dari dokumen asli
        address creator;          // Alamat pembuat bukti (Auditor)
        uint64 timestamp;         // Block timestamp pembuatan
        uint64 blockNumber;       // Nomor blok pencatatan
        RecordStatus status;      // Status siklus hidup record
        string ipfsCID;           // Content Identifier IPFS off-chain
        string title;             // Judul/label bukti audit
        string metadataURI;       // URI metadata tambahan (opsional)
    }

    struct AccessGrant {
        bool isGranted;           // Flag izin eksplisit
        uint64 expiryTimestamp;   // Waktu kedaluwarsa izin akses (Unix Timestamp)
    }

    struct Commitment {
        bytes32 commitmentHash;   // keccak256(docHash, salt, msg.sender)
        uint64 commitBlock;       // Blok saat commit dilakukan
        uint64 commitTimestamp;   // Waktu saat commit dicatat
        bool isRevealed;          // Status apakah commit sudah di-reveal
    }

    // --- EVENTS (Rich Event Emission for Subgraph & Frontend) ---
    event MemoryCommitted(
        bytes32 indexed commitment,
        address indexed creator,
        uint64 commitBlock,
        uint64 commitTimestamp
    );

    event MemoryRecordCreated(
        uint256 indexed recordId,
        bytes32 indexed docHash,
        address indexed creator,
        string ipfsCID,
        string title,
        uint64 timestamp
    );

    event MemoryRevealed(
        uint256 indexed recordId,
        bytes32 indexed commitment,
        bytes32 indexed docHash,
        address creator
    );

    event RecordVerified(
        uint256 indexed recordId,
        bytes32 indexed docHash,
        address indexed verifier,
        bool isValid,
        uint64 timestamp
    );

    event AccessGranted(
        uint256 indexed recordId,
        address indexed user,
        address indexed granter,
        uint64 expiryTimestamp
    );

    event AccessRevoked(
        uint256 indexed recordId,
        address indexed user,
        address indexed revoker
    );

    event RecordStatusUpdated(
        uint256 indexed recordId,
        RecordStatus indexed previousStatus,
        RecordStatus indexed newStatus,
        string reason,
        address updatedBy
    );

    // --- VIEW FUNCTIONS ---
    function totalRecords() external view returns (uint256);
    function getRecordById(uint256 recordId) external view returns (MemoryRecord memory);
    function getRecordByHash(bytes32 docHash) external view returns (MemoryRecord memory);
    function verifyRecord(bytes32 docHash) external returns (bool isValid, MemoryRecord memory record);
    function checkAccess(address user, uint256 recordId) external view returns (bool hasAccess, uint64 expiryTimestamp);
    function isHashRegistered(bytes32 docHash) external view returns (bool);
}
