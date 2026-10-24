# DOKUMEN DESAIN SISTEM: ON-CHAIN VS OFF-CHAIN & DATA MODEL
## MNEMA: Decentralized Audit & Provenance Ledger
**Mata Kuliah:** Blockchain (KP70067008) — Semester 7 TA 2026/2027  
**Fakultas Teknik, Universitas Siliwangi**  
**Role:** Lead Blockchain Architect & Smart Contract Engineer  

---

## 1. Analisis Kebutuhan Penyimpanan & Trade-Off Arsitektural

Dalam merancang sistem enterprise DApp, kesalahan paling mendasar pemula adalah mencoba menyimpan seluruh objek berkas (seperti dokumen PDF audit, bukti forensik digital, citra, atau log berukuran puluhan megabyte) langsung ke dalam *storage* Smart Contract di blockchain.

Pada jaringan Ethereum Virtual Machine (EVM):
* Biaya penulisan storage (`SSTORE`) untuk 1 word (32 bytes) bernilai **20.000 unit gas** (cold write).
* Sebuah dokumen PDF berukuran 1 MB (1.048.576 bytes) membutuhkan sekitar 32.768 slots storage, yang setara dengan **±655 juta gas**.
* Sementara batas *Target/Max Gas Limit* per blok di Ethereum hanya **30 juta gas**. Menyimpan dokumen 1 MB secara on-chain adalah **mustahil secara teknis** (melebihi kapasitas 1 blok penuh) dan akan memakan biaya jutaan rupiah.

Oleh karena itu, MNEMA mengadopsi **Hybrid Architecture (Decentralized Content-Addressing + Immutable State Ledger)**.

---

## 2. Matriks Keputusan On-Chain vs Off-Chain

| Komponen Data | Lokasi Penyimpanan | Teknologi / Format | Alasan Teknis & Pertimbangan Keamanan |
| :--- | :--- | :--- | :--- |
| **Document Fingerprint (`docHash`)** | **On-Chain** | `bytes32` (SHA-256) | Memastikan *tamper-evident immutability*. Hash 32-byte sangat murah disimpan di EVM (20.000 gas) dan bertindak sebagai bukti matematis tak terbantahkan. |
| **Record Metadata & Ownership** | **On-Chain** | Solidity Struct (`recordId`, `creator`, `timestamp`, `blockNumber`, `status`) | Diperlukan oleh aturan bisnis Smart Contract untuk memvalidasi hak akses, riwayat siklus hidup, dan keabsahan pihak yang menandatangani. |
| **Access Grants & Expiration** | **On-Chain** | Solidity Mapping (`AccessGrant`: `isGranted`, `expiryTimestamp`) | Penegakan kontrol akses (*Authorization Engine*) wajib terdesentralisasi agar verifikasi izin tidak bergantung pada server tersentralisasi. |
| **Commitment Hash** | **On-Chain** | `bytes32` (`keccak256(docHash, salt, msg.sender)`) | Bukti kriptografis dalam skema Commit-Reveal untuk mencegah *front-running* di mempool tanpa mengekspos hash dokumen sebelum waktunya. |
| **Original File Payload** | **Off-Chain** | IPFS (InterPlanetary File System) via Pinata | File dokumen asli (PDF, CSV, JSON, PNG) berukuran besar tidak disimpan di blockchain untuk menghindari gas limit. IPFS memberikan konten terdesentralisasi berbasis hash CID. |
| **Extended Metadata / Audit Notes** | **Off-Chain** | IPFS (JSON schema) ditautkan via `metadataURI` | Menampung catatan kronologis penemu audit, daftar lampiran, tanda tangan digital tambahan, tanpa membebani storage kontrak. |
| **Read-Model Query Index** | **Off-Chain** | Indexed Events / Subgraph / Local State Cache | Mendukung fitur pencarian, filter, dan pagination yang cepat pada antarmuka DApp tanpa membebani RPC node dengan loop query on-chain. |

---

## 3. Struktur Model Data Smart Contract

### 3.1 Model Data Utama (`MemoryRecord`)
```solidity
enum RecordStatus {
    Active,      // Dokumen sah, aktif, dan dapat diverifikasi
    Superseded,  // Digantikan oleh dokumen versi revisi yang lebih baru
    Deprecated,  // Sudah tidak berlaku karena melewati masa retensi
    Revoked      // Dicabut secara hukum/administratif karena cacat prosedur
}

struct MemoryRecord {
    uint256 recordId;         // ID identitas berurutan (Primary Key)
    bytes32 docHash;          // SHA-256 cryptographic fingerprint (Unique Key)
    address creator;          // Alamat akun Ethereum yang mendaftarkan bukti
    uint64 timestamp;         // Waktu block penambangan transaksi
    uint64 blockNumber;       // Nomor blok EVM
    RecordStatus status;      // Status siklus hidup bukti
    string ipfsCID;           // Content-addressing hash IPFS off-chain
    string title;             // Label judul dokumen
    string metadataURI;       // URI ekstensi metadata JSON di IPFS
}
```

### 3.2 Model Data Akses Berkedaluwarsa (`AccessGrant`)
```solidity
struct AccessGrant {
    bool isGranted;           // Penanda izin eksplisit
    uint64 expiryTimestamp;   // Unix timestamp batas waktu berakhirnya izin
}
```
*Aturan Bisnis:* Verifikasi hak akses dievaluasi melalui logika:
$$\text{HasAccess} = (\text{msg.sender} == \text{creator}) \lor \text{isAdmin} \lor (\text{isGranted} \land \text{block.timestamp} \le \text{expiryTimestamp})$$

### 3.3 Model Data Commit-Reveal (`Commitment`)
```solidity
struct Commitment {
    bytes32 commitmentHash;   // keccak256(abi.encodePacked(docHash, salt, msg.sender))
    uint64 commitBlock;       // Blok saat commit didaftarkan
    uint64 commitTimestamp;   // Timestamp blok commit
    bool isRevealed;          // Status konsumsi komitmen
}
```

---

## 4. Mekanisme Keamanan Data & Privasi
1. **Zero Raw-Data Disclosure:** Dokumen rahasia klien atau perusahaan tidak pernah dikirim ke blockchain. Pihak ketiga di jaringan publik hanya melihat string `bytes32` (SHA-256) yang merupakan fungsi *one-way cryptographic hash* (pre-image resistant).
2. **Deterministic Integrity Verification:** Siapa pun yang memegang salinan berkas dapat menghitung hash secara lokal pada browser (menggunakan Web Crypto API `crypto.subtle.digest('SHA-256', buffer)`) lalu memanggil fungsi `verifyRecord(docHash)` tanpa mengirim isi file ke jaringan.
3. **Sybil & DoS Protection:** Pendaftaran record dibatasi hanya untuk akun dengan `AUDITOR_ROLE` dan dilindungi oleh biaya gas transaksi Ethereum.
