# DOKUMEN CATATAN DEPLOYMENT (DEPLOYMENT RECORD)
**Proyek:** MNEMA: Decentralized Provenance & Evidence Vault Ledger  
**Tugas:** Bagian C. PROJECT 2 - TESTING, DEBUGGING, DEPLOYMENT, DAN INTEGRASI  
**Penanggung Jawab:** Muhammad Rafli Fajar Batubara (Anggota 2 - Testing, Deploy & Integrasi)  
**Mata Kuliah:** Blockchain (KP70067008) - Semester 7 (Ganjil)  
**Program Studi:** S-1 Informatika, Fakultas Teknik, Universitas Siliwangi  
**Dosen Pengampu:** Dr. Ir. Nur Widiyasono, M.Kom.  

---

## 1. Ringkasan Eksekutif Deployment

Smart contract `MnemaLedger` telah berhasil dikompilasi, diuji melalui 30 skenario unit test otomatis (*100% pass*), dan dideploy ke jaringan blockchain pengujian lokal (*Localhost / Hardhat EVM Network*) dengan konfigurasi non-produksi yang aman tanpa aset kripto nyata sesuai ketentuan akademik.

| Parameter | Nilai On-Chain | Keterangan |
| :--- | :--- | :--- |
| **Contract Name** | `MnemaLedger` | Kontrak utama notaris audit & evidence vault |
| **Network Name** | `hardhat` / `localhost` | EVM-compatible Local Node |
| **Chain ID** | `31337` (0x7a69) | Localhost EVM Chain ID standar |
| **Contract Address** | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | Alamat deterministik deployer awal |
| **Deployer / Admin** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Akun Super Admin & Multi-role Owner |
| **Deployment Tx Hash** | `0x087b36dc88134e697267da78add13fbc16c6f5ac839329056e1f1c2db1566469` | Hash transaksi pembuatan kontrak di blockchain |
| **Block Number** | `1` | Nomor blok deployment |
| **Deploy Timestamp** | `2026-10-23T01:21:26.030Z` | Stempel waktu penempatan kontrak |
| **Initial Records** | `2` records | Seed bukti audit awal untuk pengujian sistem |
| **Min Commit Delay** | `15` detik | Batas jeda anti-front running |
| **Max Commit Window**| `86400` detik (24 jam) | Jendela kedaluwarsa komitmen rahasia |

---

## 2. Inisialisasi Akun & Pembagian Role (RBAC)

Kontrak mengadopsi standar `AccessControl` OpenZeppelin dengan 3 role hierarkis:
- **`DEFAULT_ADMIN_ROLE`** (`0x00...00`): Diberikan kepada deployer untuk manajemen role, perubahan durasi delay, serta sakelar darurat (*Circuit Breaker* `pause`/`unpause`).
- **`AUDITOR_ROLE`** (`keccak256("AUDITOR_ROLE")`): Hak untuk mencatat berkas bukti asli (`createMemoryRecord`) dan membuka komitmen terenkripsi (`revealMemory`).
- **`VERIFIER_ROLE`** (`keccak256("VERIFIER_ROLE")`): Hak untuk memvalidasi integritas hash berkas dan menerbitkan sertifikat verifikasi on-chain (`verifyRecord`).

### Alamat Pengujian:
1. **Super Admin / Deployer:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
2. **Lead Evidence Auditor:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
3. **Third-Party Inspector / Verifier:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
4. **External Client (Time-Locked Access):** `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
5. **Untrusted / Unauthorized Guest:** `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`

---

## 3. Bukti Transaksi Genesis Audit Records (Seed Data)

Pada saat proses deployment (`scripts/deploy.ts`), 2 rekaman audit perdana didaftarkan langsung ke dalam ledger on-chain untuk memvalidasi fungsi *write-state* dan menyediakan data bagi antarmuka pengguna:

### Rekaman Bukti #1: Genesis Audit Report
- **Record ID:** `1`
- **Judul Dokumen:** *Laporan Audit Forensik Smart Contract & Data Privacy 2026*
- **Document Hash (SHA-256):** `0x892a065c71be399fdb60d4b1a5bc3b9487fa83be313c41cf3ce3f46f554ea388`
- **IPFS CIDv1:** `bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi`
- **Metadata URI:** `ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/metadata.json`
- **Creator Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Transaction Hash:** `0x77cdf17343a090e78c02e09697077292dfe2c013ecf3b66c9bee23d06c5da673`
- **Event On-Chain:** `MemoryRecordCreated(recordId: 1, docHash, creator, ipfsCID, title, timestamp)`

### Rekaman Bukti #2: Regulatory & GDPR Compliance Proof
- **Record ID:** `2`
- **Judul Dokumen:** *Verifikasi Bukti Kepatuhan GDPR & Regulasi UU PDP*
- **Document Hash (SHA-256):** `0xd7643b95764d99f7d235cfa3f2c52fb58f79110091217743b174241d6b051268`
- **IPFS CIDv1:** `bafybeihdwdcefgh4dqkjv67eycm2t6bfikxvf72mb5acaxsqvir5v5t7lu`
- **Metadata URI:** `ipfs://bafybeihdwdcefgh4dqkjv67eycm2t6bfikxvf72mb5acaxsqvir5v5t7lu/compliance.json`
- **Creator Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Transaction Hash:** `0x438f4dac2858a95162317a614aaea49f46f57e97f45a66b5a9d964587c9ffaef`
- **Event On-Chain:** `MemoryRecordCreated(recordId: 2, docHash, creator, ipfsCID, title, timestamp)`

---

## 4. Langkah Reproduksi Deployment Secara Mandiri (Step-by-Step)

Untuk mereproduksi seluruh lingkungan blockchain lokal dan antarmuka web, ikuti tahapan berikut:

### Prasyarat:
- Node.js versi 18.x atau lebih baru (`node -v`)
- npm versi 9.x atau lebih baru (`npm -v`)
- Terminal Windows PowerShell / Bash

### Langkah 1: Instalasi Dependensi Smart Contract
```bash
cd contracts
npm install
```

### Langkah 2: Menjalankan Unit Test Lengkap (30 Test Cases)
Verifikasi bahwa seluruh skenario positif, negatif, batas, dan kontrol akses berstatus lulus:
```bash
npx hardhat test
```
*Catatan:* Hasil pengujian otomatis tersimpan pada berkas `contracts/test/test-results.txt`.

### Langkah 3: Menjalankan Simulasi Debugging & Kasus Kegagalan
Jalankan script diagnostik untuk melihat penanganan kasus *premature reveal* dan *unauthorized mutation*:
```bash
npx hardhat run scripts/debug-case.ts
```

### Langkah 4: Menjalankan Node Blockchain Lokal (Opsional untuk Multi-node/MetaMask)
Buka tab terminal baru dan jalankan:
```bash
npx hardhat node
```
*Node lokal akan berjalan pada RPC HTTP port 8545 dengan 20 akun berdana 10,000 ETH bawaan.*

### Langkah 5: Deployment Smart Contract
Deploy kontrak dan seed data ke node lokal:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```
*Script ini otomatis memperbarui berkas konfigurasi frontend pada `frontend/src/lib/contractDetails.json`.*

### Langkah 6: Verifikasi Integrasi Client & Emisi Event
Uji integrasi client end-to-end melalui script headless:
```bash
npx hardhat run scripts/verify-integration.ts
```

### Langkah 7: Menjalankan Antarmuka Web (Frontend DApp)
Masuk ke direktori antarmuka web dan jalankan dev server:
```bash
cd ../frontend
npm install
npm run dev
```
Buka peramban pada alamat `http://localhost:3000`.

---

## 5. Bukti Sinkronisasi Artefak dengan Frontend

File integrasi telah diekspor secara otomatis pada:
`frontend/src/lib/contractDetails.json`:
```json
{
  "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "chainId": 31337,
  "abi": [ ... ]
}
```
Frontend DApp membaca konfigurasi ini secara langsung via `web3.ts` dan mendukung:
1. **Mode Simulator Terintegrasi:** Berjalan tanpa ekstensi eksternal, memudahkan dosen/penguji menguji skenario multi-peran secara instan.
2. **Mode MetaMask / Eksternal:** Menghubungkan dompet fisik Web3 ke localhost RPC (Chain ID 31337).
