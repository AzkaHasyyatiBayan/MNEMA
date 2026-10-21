# MNEMA — Decentralized Provenance & Evidence Vault Ledger

> *"A memory no one owns alone. Remembered by the network. Proven by the record."*

MNEMA adalah sistem pencatatan jejak audit (*audit trail*), notaris digital (*digital notary*), dan *evidence vault* lintas organisasi berbasis teknologi blockchain EVM (*Ethereum Virtual Machine*) dan IPFS (*InterPlanetary File System*). Sistem ini dirancang untuk menjamin keaslian, integritas, dan ketertelusuran dokumen audit tanpa mengekspos data mentah privat ke jaringan publik (*Zero-Leak Architecture*).

---

## Tim Pengembang & Pembagian Peran

Berikut adalah susunan anggota tim dan pembagian tugas:

### 1. Azka Hasyyati Bayan
**Peran: Smart Contract & Arsitektur (Anggota 1)**
- Aktor, aset, alur transaksi, kebutuhan trust, diagram arsitektur (Architecture_Diagram)
- Keputusan on-chain vs off-chain, dokumen desain
- Kontrak Solidity (struct, mapping, modifier, event, access control)
- Slide masalah, stakeholder, dan alasan pakai blockchain

### 2. Muhammad Rafli Fajar Batubara
**Peran: Testing, Deploy & Integrasi (Anggota 2)**
- Unit test (positif, negatif, batas, access control)
- Debugging satu kasus gagal, deployment ke local/test network, deployment record
- Frontend/script integrasi wallet, README reproduksi
- Demo end-to-end langsung, Video_Demo.mp4 cadangan, slide testing & deployment

### 3. Sherly Nandia Mathovani
**Peran: Security Audit (Anggota 3)**
- Threat model, pemeriksaan reentrancy, access control, front-running, oracle, DoS, validasi input
- Klasifikasi temuan, perbaikan kode (commit sebelum/sesudah), unit test verifikasi
- Tabel audit dan Security_Audit.pdf

### 4. Ayu Barkilah
**Peran: Enterprise Eval & Dokumentasi (Anggota 4)**
- Matriks perbandingan Ethereum vs Hyperledger Fabric (identitas, permissioning, konsensus, privasi, throughput, governance, biaya)
- Evaluasi skalabilitas, interoperabilitas, privasi, dan tata kelola (2-3 halaman), kapan pakai public/permissioned/database biasa, rekomendasi arsitektur akhir
- Laporan_UAS_Blockchain.pdf, aspek etika/regulasi/keberlanjutan, roadmap perbaikan
- Menggabungkan slide (maks. 10) dan merapikan repo final

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

## Panduan Menjalankan Sistem (Reproduksi Lokal)

### Prasyarat
- Node.js (v18.x atau lebih baru)
- npm (v9.x atau lebih baru)
- Browser modern (Google Chrome / Brave)
- Ekstensi MetaMask (opsional, sistem dilengkapi mode Web3 Simulator bawaan)

---

### Langkah 1: Pengujian & Kompilasi Smart Contract
Masuk ke direktori `contracts/`:
```bash
cd contracts
npm install
```

Jalankan pengujian unit otomatis (*18 test cases*):
```bash
npx hardhat test
```

Jalankan node lokal Hardhat (opsional jika ingin node lokal aktif):
```bash
npx hardhat node
```

Lakukan deployment kontrak ke node lokal:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

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
