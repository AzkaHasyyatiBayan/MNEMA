export interface SampleTemplate {
  id: string;
  name: string;
  category: "Notariat & Legal" | "Forensik Siber" | "Kepatuhan Regulasi" | "Pengadaan BAST" | "Audit Keamanan" | "Rantai Pasok";
  fileType: "json" | "csv" | "txt" | "pdf" | "md";
  fileSize: string;
  description: string;
  fileName: string;
  content: string;
  suggestedTitle: string;
  ipfsCID: string;
}

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: "template-notary-escrow",
    name: "Akta Notaris Digital & Perjanjian Escrow Lintas Lembaga",
    category: "Notariat & Legal",
    fileType: "json",
    fileSize: "2.4 KB",
    description: "Akta perjanjian fidusia dan penitipan dana escrow antar konsorsium perbankan dan institusi BUMN.",
    fileName: "AKTA_NOTARIS_ESCROW_2026_094.json",
    suggestedTitle: "Akta Notaris Digital No. 094/NOT-MNEMA/2026",
    ipfsCID: "bafybeih4j6z7zsqgcz3e2xld6yq5bvhb2u5m6v7j4wcb2z77e6q3m63fpy",
    content: JSON.stringify(
      {
        nomorAkta: "094/NOT-MNEMA/X/2026",
        tanggalPencatatan: "2026-10-20T09:30:00Z",
        notarisPengesah: {
          nama: "Dr. Hendrawan Danusaputra, S.H., M.Kn.",
          skKemenkumham: "AHU-00284.AH.02.01.TAHUN.2018",
          kedudukan: "Kota Tasikmalaya",
        },
        paraPihak: [
          {
            namaInstansi: "PT Konsorsium Infrastruktur Finansial Nusantara",
            npwp: "01.345.678.9-425.000",
            peran: "Pihak Pertama (Penyedia Escrow)",
          },
          {
            namaInstansi: "Lembaga Kliring & Penjaminan Digital Indonesia",
            npwp: "02.890.123.4-051.000",
            peran: "Pihak Kedua (Pengawas / Kustodian)",
          },
        ],
        klausulUtama: "Penguncian deposit jaminan likuiditas senilai Rp 25.000.000.000,- dengan verifikasi multisig on-chain.",
        statusHukum: "SAH DAN BERKEKUATAN HUKUM MENGIKAT",
      },
      null,
      2
    ),
  },
  {
    id: "template-cyber-forensic",
    name: "Laporan Forensik Insiden Siber & Investigasi Ransomware",
    category: "Forensik Siber",
    fileType: "csv",
    fileSize: "1.8 KB",
    description: "Log bukti forensik digital serangan eksfiltrasi data jaringan core banking untuk kepentingan penyidikan hukum.",
    fileName: "FORENSIC_EVIDENCE_INCIDENT_IR_2026_88.csv",
    suggestedTitle: "Bukti Forensik Serangan Siber CSIRT-ID #2026-88",
    ipfsCID: "bafybeif476kjv2o2m7f7huvcxv4vhx55i7a53c6tq3mfnqwq265b7du22y",
    content: `TIMESTAMP_UTC,SOURCE_IP,DESTINATION_IP,PORT,PROTOCOL,IOC_SIGNATURE,HASH_PAYLOAD,ANOMALY_LEVEL
2026-10-19T23:14:02Z,10.24.110.45,198.51.100.24,443,TLSv1.3,MAL_EXFIL_LOCKBIT_V4,e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,CRITICAL
2026-10-19T23:14:15Z,10.24.110.45,198.51.100.24,443,TLSv1.3,SHADOW_COPY_DELETION,4a5a58a60965d08fa67c139c8eb0106e572093ea6cf99577c2feae0bb05f24f5,HIGH
2026-10-19T23:15:00Z,10.24.110.88,198.51.100.24,8080,TCP,LATERAL_PS_EXEC_INJECT,8f434346648f6b96df89dda901c5176b10e6d059612d559c41438b3f116a3c6c,CRITICAL`,
  },
  {
    id: "template-iso-compliance",
    name: "Sertifikat Kepatuhan ISO/IEC 27001 & Audit Privasi UU PDP",
    category: "Kepatuhan Regulasi",
    fileType: "txt",
    fileSize: "1.5 KB",
    description: "Sertifikat hasil audit pihak ketiga independen terkait sistem manajemen keamanan informasi dan kepatuhan UU No. 27/2022.",
    fileName: "AUDIT_CERTIFICATE_ISO27001_PDP_2026.txt",
    suggestedTitle: "Sertifikasi Kepatuhan Keamanan Informasi ISO/IEC 27001",
    ipfsCID: "bafybeidv7f7cm7k62c5b3qw42mv63mxfu7d2w6bv7cq42bvq6t53mcv2ry",
    content: `================================================================================
KONSIL AKREDITASI AUDITOR KEAMANAN INFORMASI INDONESIA
SERTIFIKAT KEPATUHAN SISTEM MANAJEMEN KEAMANAN INFORMASI (SMKI)
NOMOR SERTIFIKAT : CERT-SMKI/2026/ID-AUDIT/00481
================================================================================

Dengan ini menerangkan bahwa:
Institusi Teruji : MNEMA Decentralized Provenance Infrastructure
Lingkup Audit   : Pengelolaan Bukti Audit Lintas Instansi & Penyimpanan Off-Chain
Standar Acuan   : ISO/IEC 27001:2022 & UU RI No. 27 Tahun 2022 (Perlindungan Data Pribadi)

HASIL EVALUASI AUDIT:
1. Kontrol Akses Kriptografis (A.9)        : MEMENUHI (Score: 100% RBAC on EVM)
2. Kriptografi & Integritas Data (A.10)     : MEMENUHI (SHA-256 + Commit-Reveal)
3. Privasi Data & Right to be Forgotten    : MEMENUHI (Zero PII on-chain ledger)

Auditor Utama : Ir. Bambang Suryonegoro, M.Sc., CISA, CISSP
Status Akhir  : COMPLIANT / TERVERIFIKASI RESMI
Masa Berlaku  : 20 Oktober 2026 s/d 19 Oktober 2027
================================================================================`,
  },
  {
    id: "template-procurement-bast",
    name: "Berita Acara Serah Terima Aset Digital (BAST Cloud Cluster)",
    category: "Pengadaan BAST",
    fileType: "json",
    fileSize: "2.1 KB",
    description: "Dokumen BAST serah terima infrastruktur multi-cluster server cloud dengan tanda tangan digital para pihak pengadaan publik.",
    fileName: "BAST_PENGADAAN_CLOUD_SERVER_2026.json",
    suggestedTitle: "BAST Pengadaan Cluster Server Cloud No. 418/BAST/2026",
    ipfsCID: "bafybeih6m7bv2cxw4mv63mxfu7d2w6bv7cq42bvq6t53mcv2ryb2u5m6v7",
    content: JSON.stringify(
      {
        nomorBAST: "418/PPK-TI/BAST/X/2026",
        kegiatan: "Pengadaan Infrastruktur Node Blockchain & Storage Kluster Pemerintahan",
        nilaiKontrakIDR: 4250000000,
        pejabatPembuatKomitmen: "H. Ridwan Sanjaya, S.T., M.T.",
        penyediaBarangJasa: "PT Sinergi Teknologi Komputasi",
        rincianItem: [
          { item: "Validator Node Server EVM (128GB RAM, NVMe 4TB)", jumlah: 4, statusUji: "LULUS" },
          { item: "Dedicated IPFS Enterprise Gateway Cluster", jumlah: 2, statusUji: "LULUS" },
          { item: "Hardware Security Module (HSM FIPS 140-2 Level 3)", jumlah: 2, statusUji: "LULUS" },
        ],
        kesimpulan: "Pekerjaan diselesaikan 100% sesuai Kerangka Acuan Kerja (KAK) dan diserahterimakan.",
      },
      null,
      2
    ),
  },
  {
    id: "template-smartcontract-audit",
    name: "Laporan Audit Keamanan Smart Contract & Analisis Kerentanan",
    category: "Audit Keamanan",
    fileType: "md",
    fileSize: "3.2 KB",
    description: "Dokumen audit komprehensif smart contract meliputi reentrancy, access control, front-running, dan gas profiling.",
    fileName: "AUDIT_REPORT_SMART_CONTRACT_MNEMA_V1.md",
    suggestedTitle: "Laporan Audit Keamanan Smart Contract MNEMA v1.0",
    ipfsCID: "bafybeid9n8v7x2q5m4w3b2v1c8m9n0p2q3r4s5t6u7v8w9x0y1z2a3b4c5",
    content: `# EXECUTIVE SECURITY AUDIT REPORT: MNEMA PROVENANCE PROTOCOL
**Target Kontrak**: \`MnemaProvenanceLedger.sol\`
**Compiler Version**: Solidity ^0.8.20
**Tanggal Audit**: 20 Oktober 2026
**Lead Security Auditor**: OpenZeppelin Certified Smart Contract Auditor

## 1. Ringkasan Eksekutif (Executive Summary)
Pemeriksaan kode statis dan dinamis telah dilakukan terhadap seluruh fungsi *lifecycle*, *commit-reveal*, serta *time-locked access delegation*. Tidak ditemukan kerentanan dengan tingkat keparahan Kritis (Critical) maupun Tinggi (High).

## 2. Matriks Temuan Keamanan
| Kategori Kerentanan | Tingkat Risiko | Status Mitigasi | Catatan Analisis |
| :--- | :---: | :---: | :--- |
| **Reentrancy Attack** | Critical | **RESOLVED** | Proteksi via Checks-Effects-Interactions & nonReentrant modifier |
| **Front-Running (MEV)** | High | **RESOLVED** | Implementasi skema Commit-Reveal dengan salt 256-bit |
| **Broken Access Control** | High | **RESOLVED** | Penerapan OpenZeppelin AccessControlDefaultAdminRules |
| **Denial of Service (DoS)** | Medium | **RESOLVED** | Mapping O(1) tanpa unbounded loop array state |
| **Gas Griefing** | Low | **RESOLVED** | Payload off-chain IPFS, hanya hash 32-byte on-chain |

## 3. Kesimpulan & Rekomendasi
Kontrak aman untuk tahap peluncuran Mainnet (Production Ready). Seluruh 18/18 unit test otomatis Hardhat dinyatakan LULUS (PASS).`,
  },
  {
    id: "template-supplychain-integrity",
    name: "Formulir Audit Integritas Rantai Pasok & Batch Farmasi",
    category: "Rantai Pasok",
    fileType: "json",
    fileSize: "2.8 KB",
    description: "Verifikasi rantai dingin (cold-chain) vaksin dan obat-obatan farmasi dengan telemetry IoT sensor dan signature produsen.",
    fileName: "SUPPLY_CHAIN_PHARMA_BATCH_VAKSIN_2026.json",
    suggestedTitle: "Log Integritas Rantai Pasok Farmasi Batch #VAX-2026-902",
    ipfsCID: "bafybeic3m2b1v0x9n8m7l6k5j4h3g2f1e0d9c8b7a6z5y4x3w2v1u0t9s8",
    content: JSON.stringify(
      {
        kodeBatch: "VAX-2026-IND-902",
        komoditas: "Vaksin Imunisasi Rekombinan Generasi IV",
        produsen: "PT Bio Farma Global Nusantara",
        sertifikasiBPOM: "BPOM-RI-EUA-2026-7782",
        telemetriSuhu: {
          rentangDiizinkanCelsius: "2.0 s/d 8.0",
          suhuRataRata: 4.2,
          anomaliTerdeteksi: false,
          totalPencatatanSensor: 1440,
        },
        tahapanDistribusi: [
          { pos: "Pabrik Produksi (Bandung)", waktuUTC: "2026-10-18T04:00:00Z", penanggungJawab: "Quality Control Lead" },
          { pos: "Gudang Kargo Bandara Kertajati", waktuUTC: "2026-10-18T14:30:00Z", penanggungJawab: "Logistics Officer" },
          { pos: "Depo Farmasi RSUD Pusat", waktuUTC: "2026-10-19T08:15:00Z", penanggungJawab: "Kepala Instalasi Farmasi" },
        ],
        verifikasiKripto: "SIGNED_RSA_4096_SHA256_AUTHENTICATED",
        statusBatch: "RELEASED_FOR_CLINICAL_USE",
      },
      null,
      2
    ),
  },
  {
    id: "template-data-privacy-pdp",
    name: "Lembar Evaluasi Kepatuhan Dampak Privasi UU PDP (DPIA)",
    category: "Kepatuhan Regulasi",
    fileType: "csv",
    fileSize: "1.9 KB",
    description: "Data Protection Impact Assessment (DPIA) checklist kepatuhan pemrosesan data sensitif sesuai UU No. 27/2022.",
    fileName: "DPIA_EVALUATION_PRIVACY_PDP_2026.csv",
    suggestedTitle: "Lembar Audit Dampak Privasi (DPIA) UU PDP #DPIA-2026-44",
    ipfsCID: "bafybeih5j4k3l2m1n0o9p8q7r6s5t4u3v2w1x0y9z8a7b6c5d4e3f2g1h0",
    content: `ID_KONTROL,PASAL_UU_PDP,ASPEK_AUDIT,STATUS_EVALUASI,BUKTI_ONCHAIN_HASH,CATATAN_AUDITOR
PDP-K01,Pasal 20,Dasar Pemrosesan Persetujuan (Consent),MEMENUHI,0x77cdf17343a090e78c02e09697077292dfe2c013ecf3b66c9bee23d06c5da673,Explicit consent tersimpan terenkripsi di client
PDP-K02,Pasal 35,Enkripsi & Pseudonimisasi Data,MEMENUHI,0x438f4dac2858a95162317a614aaea49f46f57e97f45a66b5a9d964587c9ffaef,Zero PII on-chain (hanya 32-byte cryptographic digest)
PDP-K03,Pasal 40,Hak Penarikan Kembali & Right to be Forgotten,MEMENUHI,0x892a065c71be399fdb60d4b1a5bc3b9487fa83be313c41cf3ce3f46f554ea388,Status on-chain dapat diubah menjadi Revoked/Deprecated
PDP-K04,Pasal 46,Pemberitahuan Kegagalan Pelindungan Data,MEMENUHI,0xd7643b95764d99f7d235cfa3f2c52fb58f79110091217743b174241d6b051268,Auditable event log transparan secara real-time`,
  },
];

