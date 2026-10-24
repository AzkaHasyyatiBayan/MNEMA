# MNEMA: Decentralized Provenance & Evidence Vault Ledger

<p align="left">
  <img src="https://img.shields.io/badge/Solidity-%23363636.svg?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white" alt="Ethereum" />
  <img src="https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logo=hardhat&logoColor=black" alt="Hardhat" />
  <img src="https://img.shields.io/badge/OpenZeppelin-4E5EE4?style=for-the-badge&logo=OpenZeppelin&logoColor=white" alt="OpenZeppelin" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white" alt="IPFS" />
  <img src="https://img.shields.io/badge/Ethers.js-2535A0?style=for-the-badge&logo=ethereum&logoColor=white" alt="Ethers.js" />
</p>

> *"A memory no one owns alone. Remembered by the network. Proven by the record."*

MNEMA adalah sistem pencatatan jejak audit (*audit trail*), notaris digital (*digital notary*), dan *evidence vault* lintas organisasi berbasis teknologi blockchain EVM (*Ethereum Virtual Machine*) dan IPFS (*InterPlanetary File System*). Sistem ini dirancang untuk menjamin keaslian, integritas, dan ketertelusuran dokumen audit tanpa mengekspos data mentah privat ke jaringan publik (*Zero-Leak Architecture*).

---

## Teknologi & Framework yang Digunakan

| Komponen | Teknologi | Logo & Badge | Keterangan |
| :--- | :--- | :--- | :--- |
| **Smart Contract** | Solidity | <img src="https://img.shields.io/badge/Solidity-363636?style=flat-square&logo=solidity&logoColor=white" alt="Solidity" /> | Bahasa pemrograman logika kontrak pintar on-chain |
| **EVM Blockchain** | Ethereum | <img src="https://img.shields.io/badge/Ethereum-3C3C3D?style=flat-square&logo=Ethereum&logoColor=white" alt="Ethereum" /> | Lapisan konsensus konsorsium dan mesin eksekusi transaksi |
| **Testing & Toolchain** | Hardhat | <img src="https://img.shields.io/badge/Hardhat-FFF100?style=flat-square&logo=hardhat&logoColor=black" alt="Hardhat" /> | Framework pengujian otomatis unit test (18 test cases lolos) & deployment |
| **Security Standards** | OpenZeppelin | <img src="https://img.shields.io/badge/OpenZeppelin-4E5EE4?style=flat-square&logo=OpenZeppelin&logoColor=white" alt="OpenZeppelin" /> | Pustaka teruji: `AccessControl`, `Pausable`, dan `ReentrancyGuard` |
| **Frontend Framework** | Next.js 14 | <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" /> | Framework modern React dengan App Router & Server Components |
| **UI Library** | React | <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" /> | Antarmuka interaktif responsif berbasis komponen |
| **Type Safety** | TypeScript | <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /> | Validasi tipe statis menyeluruh untuk keandalan runtime kode |
| **Styling & Theme** | Tailwind CSS | <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /> | Sistem desain Glassmorphism dengan dukungan tema Dark/Light |
| **Off-Chain Storage** | IPFS | <img src="https://img.shields.io/badge/IPFS-65C2CB?style=flat-square&logo=ipfs&logoColor=white" alt="IPFS" /> | Penyimpanan dokumen audit terdesentralisasi berbasis Content Identifier (CIDv1) |
| **Web3 Client** | Ethers.js | <img src="https://img.shields.io/badge/Ethers.js-2535A0?style=flat-square&logo=ethereum&logoColor=white" alt="Ethers.js" /> | Integrasi penyedia Web3 (MetaMask & Simulator Terintegrasi) |

---

## Fitur Utama Sistem

1. **Notary Vault (Pencatatan Bukti On-Chain)**
   - Perhitungan sidik jari kriptografis 32-byte (SHA-256) langsung di peramban lokal via Web Crypto API.
   - Pencatatan permanen pada smart contract Solidity dengan referensi konten terdesentralisasi IPFS CIDv1.
   - Pilihan template berkas audit kasus nyata multi-format (JSON, CSV, TXT, MD) untuk pengujian cepat.
   - Fitur operasi audit massal: verifikasi batch, pembaruan status siklus hidup massal, ekspor bundle audit JSON, dan pembersihan record (khusus Super Admin).

2. **Third-Party Cryptographic Verification (Zero-Leak Audit)**
   - Portal verifikasi independen tanpa gas (*gasless view function*).
   - Membandingkan sidik jari berkas terhadap data konsensus ledger on-chain secara matematis.
   - Penerbitan *Sertifikat Provenance* digital instan jika dokumen sah dan terverifikasi.

3. **Commit-Reveal Workshop (Anti Front-Running / MEV Defense)**
   - Protokol dua tahap (*Commit* lalu *Reveal*) dengan jeda waktu minimum (*minimum delay lock*).
   - Melindungi pendaftaran berkas rahasia dari intipan validator atau bot arbitrase di mempool publik Ethereum.
   - Dilengkapi simulasi uji kasus negatif (*early reveal rejection*).

4. **Time-Locked Access Delegation**
   - Delegasi izin inspeksi bukti kepada pihak ketiga dengan batas waktu kedaluwarsa otomatis berbasis stempel waktu blok (*block timestamp*).
   - Hak akses gugur secara otomatis tanpa membutuhkan biaya transaksi pencabutan manual.

5. **Role-Based Access Control (RBAC) & Circuit Breaker**
   - Pemisahan hak akses menggunakan OpenZeppelin `AccessControl` (`DEFAULT_ADMIN_ROLE`, `AUDITOR_ROLE`, `VERIFIER_ROLE`).
   - Mekanisme darurat `Pausable` yang memungkinkan penghentian sementara fungsi transaksional jika terjadi anomali keamanan.

---

## Arsitektur Data: On-Chain vs Off-Chain

MNEMA menerapkan pendekatan arsitektur hibrida (Hybrid On-Chain/Off-Chain Architecture) untuk mengoptimalkan efisiensi gas dan batas blok EVM:

- **On-Chain (Ethereum / EVM):** Menyimpan bukti kriptografis berupa sidik jari berkas 32-byte (`docHash` SHA-256), metadata kepemilikan inti (`creator`, `timestamp`, `status`), komitmen anti-front running, serta aturan kontrol akses terdesentralisasi (Time-Locked Access Delegation).
- **Off-Chain (IPFS / Pinata):** Menyimpan muatan berkas fisik dokumen asli (PDF, CSV, JSON, citra) berukuran besar menggunakan Content Identifier (CIDv1) serta catatan audit lanjutan tanpa membebani penyimpanan kontrak pintar.

Analisis mendalam mengenai pertimbangan gas limit, trade-off arsitektur, dan model data struct dapat dibaca pada [OnChain_vs_OffChain_Design.md](OnChain_vs_OffChain_Design.md).

---

## Panduan Menjalankan Sistem (Reproduksi Lokal)

### Prasyarat
- Node.js (v18.x atau lebih baru)
- npm (v9.x atau lebih baru)
- Browser modern (Google Chrome / Brave)
- Ekstensi MetaMask (opsional, sistem dilengkapi mode Web3 Simulator bawaan)

---

### Langkah 1: Pengujian, Debugging & Kompilasi Smart Contract
Masuk ke direktori `contracts/`:
```bash
cd contracts
npm install
```

Kompilasi kontrak pintar Solidity:
```bash
npx hardhat compile
```

Jalankan pengujian unit otomatis (*34 test cases lolos: Unit Test + Security Audit Verification*):
```bash
npx hardhat test
```
*Hasil log pengujian otomatis tercatat di `contracts/test/test-results.txt` dan `contracts/test-all-after.txt`.*

Jalankan pengujian audit keamanan secara spesifik:
```bash
npx hardhat test test/MnemaLedger.audit.test.ts
```

Jalankan simulasi & debugging kasus kegagalan (*Premature Reveal & Unauthorized Mutation*):
```bash
npx hardhat run scripts/debug-case.ts
```
*Dokumentasi lengkap bukti proses compile & debugging tersedia di [contracts/DEBUGGING_EVIDENCE.md](contracts/DEBUGGING_EVIDENCE.md).*

Jalankan verifikasi integrasi klien & perubahan state on-chain:
```bash
npx hardhat run scripts/verify-integration.ts
```

Lakukan deployment kontrak ke node lokal & seed data genesis:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```
*Catatan deployment resmi lengkap tersedia di [Deployment_Record.md](Deployment_Record.md).*

---

### Langkah 2: Menjalankan Antarmuka Web (Frontend)
Masuk ke direktori `frontend/`:
```bash
cd ../frontend
npm install
```

Jalankan server pengembangan:
```bash
npm run dev
```

Buka peramban pada alamat:
```
http://localhost:3000
```

---

## Panduan Penggunaan Singkat

1. **Notary Vault (`/`)**:
   - Pilih peran simulasi pada sidebar (Super Admin, Auditor, Verifier, atau Public User).
   - Pilih salah satu template audit cepat atau unggah berkas fisik Anda sendiri.
   - Klik **Catat Bukti ke Ledger (On-Chain)** untuk memancarkan transaksi dan mencatat sidik jari permanen.
2. **Verify Proof (`/verify`)**:
   - Masukkan hash atau unggah berkas yang ingin diverifikasi integritasnya.
   - Sistem akan mencocokkan hash dengan state on-chain dan menampilkan Sertifikat Keaslian.
3. **Commit-Reveal (`/commit-reveal`)**:
   - Klik **Eksekusi Commit Transaksi** (Tahap 1) untuk menyegel komitmen rahasia.
   - Tunggu jeda waktu anti-front running (15 detik).
   - Klik **Buka Komitmen & Daftarkan Bukti** (Tahap 2) untuk mendaftarkan bukti resmi ke ledger.
4. **System Guide (`/guide`)**:
   - Buka dokumentasi alur kerja, keputusan on-chain vs off-chain, spesifikasi keamanan kontrak, materi tanya jawab defense, dan pusat editor/generator berkas audit interaktif.

---

## Tim Pengembang & Pembagian Peran

| No | Nama | Peran | Tanggung Jawab & Luaran Tugas |
| :---: | :--- | :--- | :--- |
| **1** | **Azka Hasyyati Bayan** | Smart Contract & Arsitektur (Anggota 1) | • Aktor, aset, alur transaksi, kebutuhan trust, diagram arsitektur (Architecture_Diagram)<br>• Keputusan on-chain vs off-chain, [dokumen desain](OnChain_vs_OffChain_Design.md)<br>• Kontrak Solidity (struct, mapping, modifier, event, access control)<br>• Slide masalah, stakeholder, dan alasan pakai blockchain |
| **2** | **Muhammad Rafli Fajar Batubara** | Testing, Deploy & Integrasi (Anggota 2) | • Unit test (positif, negatif, batas, access control)<br>• Debugging satu kasus gagal, deployment ke local/test network, deployment record<br>• Frontend/script integrasi wallet, README reproduksi<br>• Demo end-to-end langsung, Video_Demo.mp4 cadangan, slide testing & deployment |
| **3** | **Sherly Nandia Mathovani** | Security Audit (Anggota 3) | • Threat model, pemeriksaan reentrancy, access control, front-running, oracle, DoS, validasi input<br>• Klasifikasi temuan, perbaikan kode (commit sebelum/sesudah), unit test verifikasi<br>• Tabel audit dan Security_Audit.pdf |
| **4** | **Ayu Barkilah** | Enterprise Eval & Dokumentasi (Anggota 4) | • Matriks perbandingan Ethereum vs Hyperledger Fabric (identitas, permissioning, konsensus, privasi, throughput, governance, biaya)<br>• Evaluasi skalabilitas, interoperabilitas, privasi, dan tata kelola (2-3 halaman), kapan pakai public/permissioned/database biasa, rekomendasi arsitektur akhir<br>• Laporan_UAS_Blockchain.pdf, aspek etika/regulasi/keberlanjutan, roadmap perbaikan<br>• Menggabungkan slide (maks. 10) dan merapikan repo final |
