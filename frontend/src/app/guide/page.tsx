"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SAMPLE_TEMPLATES, SampleTemplate } from "../../lib/sampleTemplates";
import { useLedger } from "../../lib/LedgerContext";
import { calculateSHA256 } from "../../lib/crypto";
import {
  IconBookOpen,
  IconShield,
  IconFile,
  IconKey,
  IconLayers,
  IconDownload,
  IconEdit,
  IconCopy,
  IconCheckCircle,
  IconSparkles,
  IconUpload,
  IconRefresh,
} from "../../lib/icons";

export default function SystemGuidePage() {
  const router = useRouter();
  const { selectTemplate } = useLedger();

  const [activeTab, setActiveTab] = useState<"flow" | "templates" | "architecture" | "contract" | "defense">("flow");

  // Template Center State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(SAMPLE_TEMPLATES[0].id);
  const [editedContent, setEditedContent] = useState<string>(SAMPLE_TEMPLATES[0].content);
  const [liveHash, setLiveHash] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  const activeTemplate = SAMPLE_TEMPLATES.find((t) => t.id === selectedTemplateId) || SAMPLE_TEMPLATES[0];

  // Recalculate live SHA-256 on content change
  useEffect(() => {
    let isCancelled = false;
    calculateSHA256(editedContent).then((hash) => {
      if (!isCancelled) setLiveHash(hash);
    });
    return () => {
      isCancelled = true;
    };
  }, [editedContent]);

  // Handle template selection change
  const handleSelectTemplate = (template: SampleTemplate) => {
    setSelectedTemplateId(template.id);
    setEditedContent(template.content);
  };

  // Download file locally to user device
  const handleDownloadFile = () => {
    const mimeTypes: Record<string, string> = {
      json: "application/json",
      csv: "text/csv",
      txt: "text/plain",
      md: "text/markdown",
    };
    const mime = mimeTypes[activeTemplate.fileType] || "text/plain";
    const blob = new Blob([editedContent], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeTemplate.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Push customized template directly to Notary Vault form
  const handleSendToVault = () => {
    selectTemplate({
      ...activeTemplate,
      content: editedContent,
    });
    router.push("/");
  };

  // Copy to clipboard
  const handleCopyContent = () => {
    navigator.clipboard.writeText(editedContent);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Reset current template content to default
  const handleResetTemplate = () => {
    setEditedContent(activeTemplate.content);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-obsidian-700 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono-code text-blue-600 dark:text-signalLilac uppercase tracking-wider font-semibold">
          <IconBookOpen className="w-4 h-4 text-memoryBlue" />
          <span>Panduan Penggunaan &amp; Dokumen Desain Sistem</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-coldWhite mt-1">
          Dokumentasi Arsitektur &amp; Manual MNEMA
        </h1>
        <p className="text-sm text-slate-700 dark:text-silverMist mt-1 leading-relaxed">
          Penjelasan menyeluruh mengenai alur kerja, keputusan arsitektur on-chain vs off-chain, mekanisme keamanan Smart Contract, dan materi evaluasi sistem.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col md:flex-row md:flex-wrap gap-2 border-b border-slate-200 dark:border-obsidian-800 pb-3 text-xs font-semibold">
        {[
          { id: "flow", label: "Panduan Alur Penggunaan", icon: IconFile },
          { id: "templates", label: "Pusat Template & Generator Berkas", icon: IconDownload },
          { id: "architecture", label: "Keputusan On-Chain vs Off-Chain", icon: IconLayers },
          { id: "contract", label: "Spesifikasi Smart Contract & Audit", icon: IconShield },
          { id: "defense", label: "Materi Tanya Jawab Evaluasi (Defense)", icon: IconKey },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full md:w-auto flex items-center justify-between md:justify-start gap-2.5 px-3.5 py-2.5 md:py-2 rounded-xl transition-all ${
                isActive
                  ? "bg-memoryBlue text-white shadow-md shadow-memoryBlue/20 font-bold"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-900 dark:hover:bg-obsidian-850 text-slate-700 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </div>
              {isActive && (
                <span className="md:hidden text-[10px] font-mono-code bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  Aktif
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: ALUR PENGGUNAAN */}
      {activeTab === "flow" && (
        <div className="space-y-6 text-xs text-slate-700 dark:text-silverMist leading-relaxed">
          <div className="glass-panel p-6 sm:p-7 border border-slate-200 dark:border-obsidian-700 shadow-sm rounded-2xl space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-coldWhite uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-memoryBlue" />
              <span>Alur Operasional Pengguna (End-to-End Walkthrough)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 dark:text-coldWhite font-bold">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-memoryBlue/20 text-blue-700 dark:text-memoryBlue flex items-center justify-center font-mono-code text-[11px] font-extrabold">
                    1
                  </span>
                  <span>Pendaftaran Bukti Langsung (Direct Vault)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
                  Auditor memilih berkas dokumen atau mengetikkan string data. Browser akan secara instan menghitung SHA-256 fingerprint di perangkat lokal (Web Crypto API). Setelah mengklik tombol pendaftaran, Smart Contract membuat <code>MemoryRecord</code> baru dan memancarkan event <code>MemoryRecordCreated</code> on-chain.
                </p>
              </div>

              <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 dark:text-coldWhite font-bold">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-memoryBlue/20 text-blue-700 dark:text-signalLilac flex items-center justify-center font-mono-code text-[11px] font-extrabold">
                    2
                  </span>
                  <span>Proteksi Anti Front-Running (Commit-Reveal)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
                  Untuk bukti berkategori rahasia tinggi, gunakan menu <strong>Commit-Reveal</strong>. Tahap 1 mengunci komitmen <code>keccak256(docHash + salt + creator)</code> di blok. Setelah jeda minimum 15 detik, Tahap 2 membuka dokumen asli dan salt secara aman tanpa takut dicuri validator mempool.
                </p>
              </div>

              <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 dark:text-coldWhite font-bold">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-mono-code text-[11px] font-extrabold">
                    3
                  </span>
                  <span>Verifikasi Mandiri Pihak Ketiga (Zero-Leak)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
                  Inspektur atau publik membuka menu <strong>Verify Proof</strong>. Mereka memasukkan dokumen atau hash. Fungsi view <code>verifyRecord(docHash)</code> dieksekusi tanpa biaya gas. Jika hash cocok, sistem menampilkan <em>Sertifikat Provenance</em> lengkap dengan stempel waktu dan identitas creator.
                </p>
              </div>

              <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 dark:text-coldWhite font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-mono-code text-[11px] font-extrabold">
                    4
                  </span>
                  <span>Delegasi Akses Berkedaluwarsa (Time-Lock)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
                  Pembuat bukti dapat memberikan izin inspeksi berbatas waktu (misal: 60 detik atau 30 hari). Smart contract secara otomatis menolak akses setelah waktu habis tanpa memerlukan transaksi pencabutan izin manual oleh admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PUSAT TEMPLATE & GENERATOR BERKAS */}
      {activeTab === "templates" && (
        <div className="space-y-6 text-xs text-slate-700 dark:text-silverMist leading-relaxed">
          <div className="glass-panel p-6 sm:p-7 border border-slate-200 dark:border-obsidian-700 shadow-sm rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-obsidian-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <IconDownload className="w-5 h-5 text-memoryBlue" />
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-coldWhite uppercase tracking-wide">
                    Pusat Unduhan &amp; Editor Template Berkas Audit
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-silverMist/80 mt-1">
                  Pilih berkas audit resmi, edit data di editor interaktif, hitung SHA-256 secara real-time, lalu unduh berkas atau kirim langsung ke Vault.
                </p>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 bg-blue-50 dark:bg-memoryBlue/10 border border-blue-200 dark:border-memoryBlue/30 text-blue-700 dark:text-signalLilac font-mono-code font-bold rounded-full text-[10px]">
                {SAMPLE_TEMPLATES.length} Template Tersedia
              </span>
            </div>

            {/* Template Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SAMPLE_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                const badgeColor = {
                  json: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800",
                  csv: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
                  txt: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
                  md: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800",
                  pdf: "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800",
                }[tmpl.fileType];

                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-obsidian-850 border-memoryBlue dark:border-memoryBlue shadow-sm ring-1 ring-memoryBlue"
                        : "bg-white dark:bg-obsidian-950/70 border-slate-200 dark:border-obsidian-800 hover:border-slate-300 dark:hover:border-obsidian-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[9px] font-mono-code font-extrabold uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
                          {tmpl.fileType} • {tmpl.fileSize}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-silverMist/60 font-medium">
                          {tmpl.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-coldWhite line-clamp-1">
                        {tmpl.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-silverMist/80 line-clamp-2 mt-0.5">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="text-[10px] font-mono-code text-blue-600 dark:text-signalLilac font-semibold flex items-center justify-between pt-1 border-t border-slate-100 dark:border-obsidian-800/80">
                      <span className="truncate">{tmpl.fileName}</span>
                      <span className="shrink-0">{isSelected ? "Dipilih" : "Pilih"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Interactive Editor & Live Hash Section */}
            <div className="bg-white dark:bg-obsidian-950 border border-slate-200 dark:border-obsidian-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-obsidian-800 pb-3">
                <div className="flex items-center gap-2">
                  <IconEdit className="w-4 h-4 text-memoryBlue" />
                  <span className="font-bold text-xs text-slate-900 dark:text-coldWhite">
                    Editor Berkas: <span className="font-mono-code text-blue-600 dark:text-signalLilac">{activeTemplate.fileName}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleResetTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-800 dark:hover:bg-obsidian-700 text-slate-700 dark:text-silverMist text-xs font-semibold transition-colors"
                    title="Kembalikan ke konten template awal"
                  >
                    <IconRefresh className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    onClick={handleCopyContent}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-800 dark:hover:bg-obsidian-700 text-slate-700 dark:text-silverMist text-xs font-semibold transition-colors"
                  >
                    {copyFeedback ? (
                      <>
                        <IconCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <IconCopy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                    title={`Unduh berkas ${activeTemplate.fileName} ke komputer`}
                  >
                    <IconDownload className="w-3.5 h-3.5" />
                    <span>Unduh Berkas</span>
                  </button>

                  <button
                    onClick={handleSendToVault}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-memoryBlue hover:bg-memoryBlue-light text-white text-xs font-bold shadow-sm transition-all"
                    title="Bawa template ini langsung ke form pendaftaran Notary Vault"
                  >
                    <IconUpload className="w-3.5 h-3.5" />
                    <span>Gunakan di Vault</span>
                  </button>
                </div>
              </div>

              {/* Textarea Code/Content Editor */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-silverMist mb-1">
                  Konten Berkas Audit (Dapat diedit langsung sesuai kebutuhan pengujian):
                </label>
                <textarea
                  rows={14}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-obsidian-700 rounded-xl p-3.5 text-slate-900 dark:text-coldWhite font-mono-code text-xs leading-relaxed focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-inner"
                  placeholder="Ketik atau edit isi dokumen audit..."
                />
              </div>

              {/* Live Fingerprint Output */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-slate-800 dark:text-coldWhite flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Fingerprint SHA-256 Real-Time:</span>
                  </span>
                  <span className="text-[10px] font-mono-code text-slate-500 dark:text-silverMist">
                    Dihitung lokal via Web Crypto API (32 Bytes)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-obsidian-950 border border-slate-200 dark:border-obsidian-800 rounded-lg">
                  <span className="font-mono-code text-[11px] text-blue-600 dark:text-signalLilac font-bold truncate">
                    {liveHash || "Menghitung hash..."}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(liveHash);
                      setCopyFeedback(true);
                      setTimeout(() => setCopyFeedback(false), 2000);
                    }}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-obsidian-800 text-slate-500 dark:text-silverMist shrink-0"
                    title="Salin Hash"
                  >
                    <IconCopy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ON-CHAIN VS OFF-CHAIN */}
      {activeTab === "architecture" && (
        <div className="space-y-6 text-xs text-slate-700 dark:text-silverMist leading-relaxed">
          <div className="glass-panel p-6 sm:p-7 border border-slate-200 dark:border-obsidian-700 shadow-sm rounded-2xl space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-coldWhite uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-memoryBlue" />
              <span>Analisis Gas EVM &amp; Keputusan Desain Penyimpanan</span>
            </h2>

            <p className="text-slate-600 dark:text-silverMist">
              Auditor dan tim penilai sering menanyakan: <em>"Kenapa isi dokumen tidak disimpan langsung di dalam smart contract?"</em>
            </p>

            <div className="overflow-x-auto pt-2 rounded-xl border border-slate-200 dark:border-obsidian-800">
              <table className="w-full text-left min-w-[560px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-obsidian-950 border-b border-slate-200 dark:border-obsidian-800 text-slate-900 dark:text-coldWhite font-bold">
                    <th className="p-3.5">Kategori Data</th>
                    <th className="p-3.5">Lokasi</th>
                    <th className="p-3.5">Teknologi</th>
                    <th className="p-3.5">Alasan Teknis &amp; Regulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-obsidian-800/60 font-mono-code text-[11px]">
                  <tr className="hover:bg-slate-50 dark:hover:bg-obsidian-900/50">
                    <td className="p-3.5 text-slate-900 dark:text-coldWhite font-bold">Sidik Jari (docHash)</td>
                    <td className="p-3.5 text-emerald-700 dark:text-emerald-400 font-extrabold">On-Chain</td>
                    <td className="p-3.5">bytes32 (SHA-256)</td>
                    <td className="p-3.5 font-sans text-slate-600 dark:text-silverMist">
                      Memastikan immutability permanen. Sangat murah (20.000 unit gas per 32 bytes).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-obsidian-900/50">
                    <td className="p-3.5 text-slate-900 dark:text-coldWhite font-bold">Metadata &amp; Access Grant</td>
                    <td className="p-3.5 text-emerald-700 dark:text-emerald-400 font-extrabold">On-Chain</td>
                    <td className="p-3.5">Solidity Struct &amp; Mapping</td>
                    <td className="p-3.5 font-sans text-slate-600 dark:text-silverMist">
                      Dibutuhkan untuk penegakan aturan bisnis desentralisasi dan validasi time-lock.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-obsidian-900/50">
                    <td className="p-3.5 text-slate-900 dark:text-coldWhite font-bold">Dokumen Asli (PDF/JSON)</td>
                    <td className="p-3.5 text-blue-600 dark:text-signalLilac font-extrabold">Off-Chain</td>
                    <td className="p-3.5">IPFS via Pinata</td>
                    <td className="p-3.5 font-sans text-slate-600 dark:text-silverMist">
                      Mencegah gas limit blok 30M EVM dan mematuhi hak penghapusan privasi (UU PDP / GDPR).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50/70 dark:bg-obsidian-950 p-4 border border-blue-200 dark:border-obsidian-800 rounded-xl text-[11px] font-mono-code text-blue-800 dark:text-signalLilac mt-2">
              💡 Perhitungan: Dokumen 1 MB membutuhkan ±655 juta gas jika disimpan on-chain. Batas gas 1 blok Ethereum adalah 30 juta gas. Sehingga menyimpan file besar on-chain adalah mustahil secara fisik di EVM!
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SMART CONTRACT SPEC & AUDIT */}
      {activeTab === "contract" && (
        <div className="space-y-6 text-xs text-slate-700 dark:text-silverMist leading-relaxed">
          <div className="glass-panel p-6 sm:p-7 border border-slate-200 dark:border-obsidian-700 shadow-sm rounded-2xl space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-coldWhite uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-memoryBlue" />
              <span>Spesifikasi Keamanan MnemaLedger.sol (Project 3)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-200 dark:border-obsidian-800 rounded-xl p-4 bg-white dark:bg-obsidian-950 space-y-1 shadow-xs">
                <span className="text-slate-900 dark:text-coldWhite font-bold">Role-Based Access Control (RBAC)</span>
                <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
                  Mengimplementasikan OpenZeppelin <code>AccessControl</code>. Memisahkan hak <code>DEFAULT_ADMIN_ROLE</code>, <code>AUDITOR_ROLE</code> (pembuat bukti), dan <code>VERIFIER_ROLE</code>.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-obsidian-800 rounded-xl p-4 bg-white dark:bg-obsidian-950 space-y-1 shadow-xs">
                <span className="text-slate-900 dark:text-coldWhite font-bold">Solidity Custom Errors</span>
                <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
                  Menggantikan string <code>require</code> tradisional dengan Custom Errors (seperti <code>error Mnema__ZeroHashNotAllowed()</code>) untuk menghemat biaya gas deployment dan eksekusi.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-obsidian-800 rounded-xl p-4 bg-white dark:bg-obsidian-950 space-y-1 shadow-xs">
                <span className="text-slate-900 dark:text-coldWhite font-bold">Pausable Circuit Breaker</span>
                <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
                  Admin dapat membekukan sementara seluruh fungsi state-changing melalui <code>pause()</code> jika terdeteksi insiden keamanan eksternal.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-obsidian-800 rounded-xl p-4 bg-white dark:bg-obsidian-950 space-y-1 shadow-xs">
                <span className="text-slate-900 dark:text-coldWhite font-bold">Pencegahan Reentrancy &amp; DoS</span>
                <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
                  Menerapkan pola <em>Checks-Effects-Interactions</em> dan <code>ReentrancyGuard</code>, serta pencarian langsung berbasis mapping O(1) tanpa loop array tak terbatas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: DEFENSE Q&A */}
      {activeTab === "defense" && (
        <div className="space-y-6 text-xs text-slate-700 dark:text-silverMist leading-relaxed">
          <div className="glass-panel p-6 sm:p-7 border border-slate-200 dark:border-obsidian-700 shadow-sm rounded-2xl space-y-5">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-coldWhite uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-memoryBlue dark:text-signalLilac" />
              <span>Panduan Tanya Jawab Defense &amp; Audit Sistem</span>
            </h2>

            <div className="space-y-4">
              <div className="bg-white dark:bg-obsidian-950 p-4 border border-slate-200 dark:border-obsidian-800 rounded-xl space-y-1.5 shadow-xs">
                <div className="font-bold text-slate-900 dark:text-coldWhite flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-blue-100 dark:bg-memoryBlue/20 text-blue-700 dark:text-signalLilac font-bold uppercase">Tanya</span>
                  <span>"Kenapa harus pakai blockchain? Kenapa tidak pakai database PostgreSQL biasa?"</span>
                </div>
                <div className="text-emerald-800 dark:text-emerald-400 text-[11px] pt-1 leading-relaxed pl-1">
                  <strong>Penjelasan Arsitektural:</strong> "Database tradisional bergantung pada kepercayaan terhadap admin database (<em>Single Point of Failure</em>). Seorang DBA internal dapat mengubah isi log atau melakukan <em>backdating</em> tanpa meninggalkan jejak kriptografis. MNEMA menggunakan blockchain untuk menciptakan <em>shared memory</em> (<em>A memory no one owns alone</em>), di mana riwayat state dibuktikan oleh rantai blok yang mustahil diubah sepihak (<em>Proven by the record</em>)."
                </div>
              </div>

              <div className="bg-white dark:bg-obsidian-950 p-4 border border-slate-200 dark:border-obsidian-800 rounded-xl space-y-1.5 shadow-xs">
                <div className="font-bold text-slate-900 dark:text-coldWhite flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-blue-100 dark:bg-memoryBlue/20 text-blue-700 dark:text-signalLilac font-bold uppercase">Tanya</span>
                  <span>"Bagaimana sistem Anda mematuhi regulasi privasi data (UU PDP / GDPR) jika blockchain itu kekal (immutable)?"</span>
                </div>
                <div className="text-emerald-800 dark:text-emerald-400 text-[11px] pt-1 leading-relaxed pl-1">
                  <strong>Penjelasan Arsitektural:</strong> "MNEMA mematuhi prinsip <em>Right to be Forgotten</em>. Kami tidak pernah menyimpan data mentah PII secara on-chain; hanya sidik jari 32-byte (SHA-256) yang dicatat. Jika subjek data meminta hak penghapusan, berkas asli di IPFS/penyimpanan privat dihapus. Hash yang tertinggal di blockchain tidak lagi mereferensikan dokumen apa pun, sehingga privasi terpenuhi tanpa merusak integritas konsensus."
                </div>
              </div>

              <div className="bg-white dark:bg-obsidian-950 p-4 border border-slate-200 dark:border-obsidian-800 rounded-xl space-y-1.5 shadow-xs">
                <div className="font-bold text-slate-900 dark:text-coldWhite flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-blue-100 dark:bg-memoryBlue/20 text-blue-700 dark:text-signalLilac font-bold uppercase">Tanya</span>
                  <span>"Apa fungsi fitur Commit-Reveal yang Anda buat?"</span>
                </div>
                <div className="text-emerald-800 dark:text-emerald-400 text-[11px] pt-1 leading-relaxed pl-1">
                  <strong>Penjelasan Arsitektural:</strong> "Fitur Commit-Reveal mengatasi kerentanan <em>Transaction-Ordering / Front-Running</em> di mempool publik Ethereum. Tanpa skema ini, bot atau penyerang yang memantau mempool dapat melihat hash bukti yang dikirim dan mengajukan transaksi dengan gas lebih tinggi untuk mendahului klaim kepemilikan. Dengan Commit-Reveal, pengguna mengirim hash komitmen rahasia terlebih dahulu, lalu di-reveal setelah jeda waktu."
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
