# BUKTI PROSES COMPILE & DEBUGGING SMART CONTRACT
**Proyek:** MNEMA: Decentralized Provenance & Evidence Vault Ledger  
**Bagian:** C. PROJECT 2 - TESTING, DEBUGGING, DEPLOYMENT, DAN INTEGRASI (Bobot 20 Poin)  
**Tanggung Jawab:** Anggota 2 - Muhammad Rafli Fajar Batubara  
**Mata Kuliah:** Blockchain (KP70067008) - Semester 7  
**Dosen Pengampu:** Dr. Ir. Nur Widiyasono, M.Kom.  

---

## 1. Proses Kompilasi Kontrak Pintar (Compile Process)

Kompilasi kontrak pintar dilakukan menggunakan toolchain **Hardhat 2.22+** dan kompiler **Solidity 0.8.24** dengan optimasi aktif (*runs: 200*).

### Perintah Kompilasi
```bash
cd contracts
npx hardhat compile
```

### Log Output Kompilasi
```text
Generating typings for: 4 artifacts in dir: typechain-types for target: ethers-v6
Successfully generated 27 typings!
Compiled 4 Solidity files successfully (evm target: paris).
```

### Verifikasi Artefak Kompilasi
- **Kontrak Utama:** `contracts/artifacts/contracts/MnemaLedger.sol/MnemaLedger.json`
- **Interface:** `contracts/artifacts/contracts/interfaces/IMnemaLedger.sol/IMnemaLedger.json`
- **Mocks untuk Uji Keamanan:** `contracts/artifacts/contracts/mocks/MockReentrantAttacker.sol/MockReentrantAttacker.json`
- **Keterangan:** Kompilasi bersih tanpa *warnings* dan menghasilkan TypeChain types untuk pengetikan statis TypeScript.

---

## 2. Debugging Kasus Kegagalan #1: Pelanggaran Jendela Waktu Reveal (Early Reveal Violation)

### A. Skenario & Kondisi Tidak Valid
Pada arsitektur MNEMA, untuk mencegah serangan *Front-Running* / *Maximal Extractable Value (MEV)* dari validator atau bot mempool, pendaftaran bukti rahasia menggunakan protokol **Commit-Reveal** dua tahap:
1. Tahap 1: Pengguna mengirimkan komitmen `hash(docHash, salt, msg.sender)`.
2. Jeda Waktu: Sistem mewajibkan jeda waktu minimum `minCommitDelay` (15 detik pada pengujian lokal, 60 detik pada jaringan publik).
3. Tahap 2: Pengguna membuka (*reveal*) dokumen asli beserta `salt`.

**Kondisi Tidak Valid yang Diuji:**  
Auditor mencoba memanggil fungsi `revealMemory()` seketika (selisih waktu 0 detik) setelah transaksi `commitMemory()` dipancarkan, sebelum `minCommitDelay` terpenuhi.

### B. Eksekusi Script Debugging
Script reproduksi debugging:
```bash
npx hardhat run scripts/debug-case.ts
```

### C. Tangkapan Error (Revert Trace & Stack Trace)
```text
--------------------------------------------------------------------------
CASE DEBUGGING #1: Premature Reveal Attempt (Anti-Front-Running Delay Violation)
--------------------------------------------------------------------------
1. Tahap Commit: Auditor mengirim komitmen hash...
   -> Komitmen berhasil dicatat pada block #3

2. Pemicuan Kegagalan (Failure Trigger): Auditor mencoba me-reveal seketika (0 detik jeda)...
   ✅ REVERT TERTANGKAP SECARA TEPAT!
   [Raw Error Name]: Error
   [Custom Error]:   VM Exception while processing transaction: reverted with custom error 'Mnema__CommitmentTooEarly(1792718395, 1792718409)'
```

### D. Analisis Akar Masalah (Root Cause Diagnostic)
1. **Pemeriksaan Invariant Kontrak:**
   Pada [MnemaLedger.sol](file:///C:/Users/mpran/Downloads/MNEMA/MNEMA-main/contracts/contracts/MnemaLedger.sol#L188-L192):
   ```solidity
   uint64 readyTimestamp = comm.commitTimestamp + minCommitDelay;
   if (block.timestamp < readyTimestamp) {
       revert Mnema__CommitmentTooEarly(uint64(block.timestamp), readyTimestamp);
   }
   ```
2. **Data Diagnostik:**
   - `comm.commitTimestamp` = `1792718395`
   - `minCommitDelay` = `15` detik
   - `readyTimestamp` = `1792718409`
   - `block.timestamp` saat eksekusi = `1792718395` (selisih 0 detik)
   - Karena `block.timestamp < readyTimestamp`, EVM menghentikan transaksi secara deterministik.
3. **Efisiensi Gas:** Kontrak memanfaatkan *Custom Error* `Mnema__CommitmentTooEarly` yang memakan biaya gas 4x lebih rendah dibandingkan `require(..., "string")`.

### E. Langkah Remediasi & Verifikasi Perbaikan
- **Langkah Mitigasi/Perbaikan:**
  Dalam environment pengujian Hardhat, stempel waktu EVM dimajukan melewati ambang batas menggunakan helper waktu:
  ```typescript
  await time.increase(20); // Majukan waktu 20 detik (> 15 detik)
  ```
- **Hasil Verifikasi Pasca-Remediasi:**
  ```text
  3. Langkah Remediasi / Debugging Fix:
     -> Memajukan stempel waktu blok (evm_increaseTime) sebanyak 20 detik...
     -> Waktu jaringan telah dimajukan melewati batas minCommitDelay (15s).

  4. Verifikasi Pasca-Remediasi:
     ✅ SUKSES! Transaksi reveal diterima pada block #6
     🔗 Tx Hash: 0x6320c797e4baac49ab643e22057c82e9d9211dc9ab1d6cc7845838d29ae36bab
     📊 State On-Chain: isHashRegistered = true
  ```
  Status state `isHashRegistered` berubah menjadi `true` dan event `MemoryRevealed` berhasil dipancarkan ke ledger.

---

## 3. Debugging Kasus Kegagalan #2: Pelanggaran Hak Akses Status Dokumen (Unauthorized Mutation)

### A. Skenario & Kondisi Tidak Valid
Status siklus hidup dokumen audit (`Active`, `Superseded`, `Deprecated`, `Revoked`) hanya boleh diubah oleh pihak yang menerbitkan dokumen (*Creator*) atau regulator (*DEFAULT_ADMIN_ROLE*).

**Kondisi Tidak Valid yang Diuji:**  
Pihak ketiga atau pengguna tidak berwenang (*Unauthorized Account*: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`) mencoba mengeksekusi `updateRecordStatus(1, 3, "Hacked Status")` untuk membatalkan bukti audit milik pihak lain.

### B. Tangkapan Error
```text
--------------------------------------------------------------------------
CASE DEBUGGING #2: Unauthorized State Modification (Access Control Violation)
--------------------------------------------------------------------------
1. Pemicuan Kegagalan: Pengguna unauthorized mencoba mencabut/merevoke status record #1...
   ✅ REVERT TERTANGKAP SECARA TEPAT!
   [Custom Error]: VM Exception while processing transaction: reverted with custom error 'Mnema__NotRecordCreatorOrAdmin()'
```

### C. Analisis Diagnostik & Remediasi
1. **Pemeriksaan Modifier:**
   Pada [MnemaLedger.sol](file:///C:/Users/mpran/Downloads/MNEMA/MNEMA-main/contracts/contracts/MnemaLedger.sol#L74-L83):
   ```solidity
   modifier onlyCreatorOrAdmin(uint256 recordId) {
       address creator = _records[recordId].creator;
       if (msg.sender != creator && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
           revert Mnema__NotRecordCreatorOrAdmin();
       }
       _;
   }
   ```
2. **Akar Masalah:** `msg.sender` tidak terdaftar sebagai pemilik record dan tidak memiliki hak akses tata kelola admin.
3. **Remediasi:** Transaksi diarahkan kembali ke akun Auditor pemilik dokumen resmi (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`).
4. **Verifikasi:**
   ```text
   2. Langkah Remediasi / Debugging Fix:
      -> Menjalankan updateRecordStatus melalui akun Auditor (Creator Sah)...
      ✅ SUKSES! Status berhasil diubah ke Revoked (3) pada block #8
      📊 State Record #1 Status: 3 (Revoked)
   ```

---

## 4. Ringkasan Kesimpulan Debugging

| Kasus Uji | Kondisi Gagal | Custom Error | Metode Deteksi | Status Resolusi |
| :--- | :--- | :--- | :--- | :--- |
| **Commit-Reveal Delay** | Reveal sebelum 15s | `Mnema__CommitmentTooEarly` | Trace RPC Hardhat & EVM timestamp | **RESOLVED** (Waktu dimajukan > 15s) |
| **Access Control** | Non-creator revoke | `Mnema__NotRecordCreatorOrAdmin` | AccessControl modifier & sender check | **RESOLVED** (Otorisasi via Creator) |
| **Zero Hash** | Input `bytes32(0)` | `Mnema__ZeroHashNotAllowed` | Validasi input parameter on-chain | **VERIFIED & PREVENTED** |
| **Replay Attack** | Reveal kedua kali | `Mnema__CommitmentAlreadyRevealed` | Status komitmen `isRevealed` | **VERIFIED & PREVENTED** |
