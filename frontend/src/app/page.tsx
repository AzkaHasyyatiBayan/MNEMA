"use client";

import React, { useState, useEffect } from "react";
import { useLedger } from "../lib/LedgerContext";
import { calculateSHA256, generateSimulatedCID } from "../lib/crypto";
import { SAMPLE_TEMPLATES, SampleTemplate } from "../lib/sampleTemplates";
import {
  IconShield,
  IconFile,
  IconCheckCircle,
  IconLock,
  IconClock,
  IconUpload,
  IconKey,
  IconCopy,
  IconActivity,
  IconAlert,
  IconRefresh,
  IconFolder,
  IconSparkles,
  IconTrash,
  IconDownload,
  IconEdit,
  IconFilter,
} from "../lib/icons";

export default function NotaryVaultPage() {
  const {
    records,
    events,
    currentAccount,
    createRecord,
    grantAccess,
    updateRecordStatus,
    deleteRecords,
    batchUpdateRecordStatus,
    clearAuditEvents,
    resetLedgerToGenesis,
    verifyRecord,
    isPaused,
    contractAddress,
    activeTemplate,
    selectTemplate,
  } = useLedger();

  // Registration Form State
  const [file, setFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [manualText, setManualText] = useState("");
  const [calculatedHash, setCalculatedHash] = useState("");
  const [ipfsCID, setIpfsCID] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    msg: string;
    txHash?: string;
  } | null>(null);

  // Time-Locked Access Modal State
  const [activeGrantModalRecordId, setActiveGrantModalRecordId] = useState<number | null>(null);
  const [grantRecipient, setGrantRecipient] = useState("0x90F79bf6EB2c4f870365E785982E1f101E93b906");
  const [grantDuration, setGrantDuration] = useState(60); // 60 detik default for quick demo
  const [grantResult, setGrantResult] = useState<string | null>(null);

  // Status Change Modal State
  const [statusModalRecordId, setStatusModalRecordId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<"Active" | "Superseded" | "Deprecated" | "Revoked">("Revoked");
  const [statusReason, setStatusReason] = useState("Cacat bukti formal pasca audit investigatif");

  // Audit Management & Multi-Select State
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [isBatchStatusModalOpen, setIsBatchStatusModalOpen] = useState(false);
  const [batchTargetStatus, setBatchTargetStatus] = useState<"Active" | "Superseded" | "Deprecated" | "Revoked">("Revoked");
  const [batchReason, setBatchReason] = useState("Pembaruan status kepatuhan berkas hasil audit berkala");
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [auditToast, setAuditToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [verifyModalRecords, setVerifyModalRecords] = useState<{ id: number; title: string; isValid: boolean; status: string }[] | null>(null);

  // Auto-hide toast notification
  useEffect(() => {
    if (auditToast) {
      const timer = setTimeout(() => setAuditToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [auditToast]);

  // Multi-Select Handlers
  const toggleSelectAll = () => {
    if (selectedRecordIds.length === records.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(records.map((r) => r.recordId));
    }
  };

  const toggleSelectRecord = (id: number) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch Verify
  const handleBatchVerify = async () => {
    if (selectedRecordIds.length === 0) return;
    const results = [];
    for (const id of selectedRecordIds) {
      const rec = records.find((r) => r.recordId === id);
      if (rec) {
        const res = await verifyRecord(rec.docHash);
        results.push({ id: rec.recordId, title: rec.title, isValid: res.isValid, status: rec.status });
      }
    }
    setVerifyModalRecords(results);
  };

  // Batch Status Update
  const handleBatchStatusSubmit = async () => {
    if (selectedRecordIds.length === 0) return;
    const res = await batchUpdateRecordStatus(selectedRecordIds, batchTargetStatus, batchReason);
    if (res.success) {
      setIsBatchStatusModalOpen(false);
      setSelectedRecordIds([]);
      setAuditToast({
        message: `Status ${selectedRecordIds.length} bukti berhasil diubah menjadi ${batchTargetStatus}.`,
        type: "success",
      });
    } else {
      setAuditToast({ message: res.error || "Gagal memperbarui status", type: "error" });
    }
  };

  // Batch Delete (Super Admin only)
  const handleDeleteSelected = async () => {
    if (currentAccount.role !== "Super Admin") {
      setAuditToast({
        message: "Akses Ditolak: Hanya Super Admin yang memiliki hak pemeliharaan pemangkasan record.",
        type: "error",
      });
      return;
    }
    const res = await deleteRecords(selectedRecordIds);
    if (res.success) {
      setSelectedRecordIds([]);
      setIsDeleteConfirmModalOpen(false);
      setAuditToast({
        message: `${res.count} record berhasil dipangkas oleh Super Admin.`,
        type: "success",
      });
    } else {
      setAuditToast({ message: res.error || "Gagal menghapus record", type: "error" });
    }
  };

  // Export Selected Audit JSON
  const handleExportSelectedJSON = () => {
    const selected = records.filter((r) => selectedRecordIds.includes(r.recordId));
    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      exportedBy: currentAccount.address,
      exportedRole: currentAccount.role,
      totalRecords: selected.length,
      records: selected,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `MNEMA_AUDIT_PACKAGE_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Reset to Genesis (Super Admin)
  const handleResetLedger = async () => {
    if (currentAccount.role !== "Super Admin") {
      setAuditToast({
        message: "Akses Ditolak: Hanya Super Admin yang dapat me-reset ledger.",
        type: "error",
      });
      return;
    }
    const res = await resetLedgerToGenesis();
    if (res.success) {
      setIsResetConfirmModalOpen(false);
      setSelectedRecordIds([]);
      setAuditToast({
        message: "Ledger berhasil di-reset kembali ke Genesis State.",
        type: "success",
      });
    } else {
      setAuditToast({ message: res.error || "Gagal reset", type: "error" });
    }
  };

  // Clear Event Stream (Super Admin)
  const handleClearLogs = async () => {
    if (currentAccount.role !== "Super Admin") {
      setAuditToast({
        message: "Akses Ditolak: Hanya Super Admin yang dapat membersihkan event stream.",
        type: "error",
      });
      return;
    }
    const res = await clearAuditEvents();
    if (res.success) {
      setAuditToast({
        message: "Riwayat Event Stream audit trail berhasil dibersihkan.",
        type: "success",
      });
    } else {
      setAuditToast({ message: res.error || "Gagal membersihkan log", type: "error" });
    }
  };

  // Load Active Template into Form
  const loadTemplate = async (template: SampleTemplate) => {
    selectTemplate(template);
    setFile(null);
    setDocTitle(template.suggestedTitle);
    setManualText(template.content);
    setIsHashing(true);
    const hash = await calculateSHA256(template.content);
    setCalculatedHash(hash);
    setIpfsCID(template.ipfsCID);
    setIsHashing(false);
  };

  // Handle File Input and Client-side Hash
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      selectTemplate(null);
      if (!docTitle) setDocTitle(selected.name);
      setIsHashing(true);
      const hash = await calculateSHA256(selected);
      setCalculatedHash(hash);
      setIpfsCID(generateSimulatedCID(hash));
      setIsHashing(false);
    }
  };

  // Handle Manual Text Hash
  const handleTextChange = async (text: string) => {
    setManualText(text);
    if (text.trim().length > 0) {
      setIsHashing(true);
      const hash = await calculateSHA256(text);
      setCalculatedHash(hash);
      setIpfsCID(generateSimulatedCID(hash));
      setIsHashing(false);
    } else {
      setCalculatedHash("");
      setIpfsCID("");
    }
  };

  // Handle Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculatedHash) {
      setSubmitResult({ success: false, msg: "Silakan pilih berkas atau masukkan teks untuk membuat hash." });
      return;
    }
    setIsSubmitting(true);
    setSubmitResult(null);

    const res = await createRecord(calculatedHash, docTitle, ipfsCID);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitResult({
        success: true,
        msg: `Record #${res.recordId} berhasil dicatat secara permanen di blockchain!`,
        txHash: res.txHash,
      });
      setFile(null);
      setManualText("");
      setDocTitle("");
      setCalculatedHash("");
      setIpfsCID("");
      selectTemplate(null);
    } else {
      setSubmitResult({
        success: false,
        msg: res.error || "Gagal mencatat transaksi.",
      });
    }
  };

  // Handle Delegating Access
  const handleExecuteGrant = async () => {
    if (!activeGrantModalRecordId) return;
    const res = await grantAccess(grantRecipient, activeGrantModalRecordId, grantDuration);
    if (res.success) {
      setGrantResult(`Izin akses Record #${activeGrantModalRecordId} berhasil didelegasikan selama ${grantDuration} detik!`);
      setTimeout(() => {
        setActiveGrantModalRecordId(null);
        setGrantResult(null);
      }, 1800);
    } else {
      setGrantResult(res.error || "Gagal memberikan izin akses.");
    }
  };

  // Handle Status Update
  const handleExecuteStatusUpdate = async () => {
    if (!statusModalRecordId) return;
    const res = await updateRecordStatus(statusModalRecordId, newStatus, statusReason);
    if (res.success) {
      setStatusModalRecordId(null);
    } else {
      alert(res.error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      {/* Top Technical Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-200 dark:border-obsidian-700 pb-6 gap-4">
        <div className="w-full">
          <div className="flex items-center gap-2 text-xs font-mono-code text-blue-600 dark:text-signalLilac uppercase tracking-wider font-semibold">
            <IconShield className="w-4 h-4 text-memoryBlue" />
            <span>Decentralized Evidence Vault &amp; Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-coldWhite mt-1">
            MNEMA Provenance Ledger
          </h1>
          <p className="text-sm text-slate-700 dark:text-silverMist mt-1 max-w-2xl font-normal leading-relaxed">
            Pencatatan sidik jari digital (SHA-256) on-chain dengan penegakan kontrol akses berbasis waktu (Time-Locked Access) dan penyimpanan desentralisasi IPFS.
          </p>
        </div>

        {/* System Vitals Card */}
        <div className="w-full lg:w-auto bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-700 p-3.5 sm:p-4 rounded-2xl text-xs shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-3 sm:gap-4 divide-y sm:divide-y-0 divide-slate-100 dark:divide-obsidian-800/80">
            <div className="flex items-center justify-between sm:block">
              <div className="text-slate-500 dark:text-silverMist text-[11px] font-medium">Total Bukti On-Chain</div>
              <div className="font-mono-code font-bold text-base sm:text-lg text-slate-900 dark:text-coldWhite">{records.length} Records</div>
            </div>
            <div className="hidden lg:block h-8 w-px bg-slate-200 dark:bg-obsidian-700" />
            <div className="pt-2.5 sm:pt-0 sm:border-l sm:border-slate-200 sm:dark:border-obsidian-700 sm:pl-4 lg:border-l-0 lg:pl-0 flex items-center justify-between sm:block">
              <div className="text-slate-500 dark:text-silverMist text-[11px] font-medium">Kontrak Aktif</div>
              <div className="font-mono-code text-[11px] text-blue-600 dark:text-signalLilac font-semibold">
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </div>
            </div>
            <div className="hidden lg:block h-8 w-px bg-slate-200 dark:bg-obsidian-700" />
            <div className="pt-2.5 sm:pt-0 sm:border-l sm:border-slate-200 sm:dark:border-obsidian-700 sm:pl-4 lg:border-l-0 lg:pl-0 flex items-center justify-between sm:block">
              <div className="text-slate-500 dark:text-silverMist text-[11px] font-medium">Status Jaringan</div>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isPaused ? "Paused" : "Live (EVM)"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Realistic Sample Templates Hub */}
      <div className="glass-panel p-5 border border-slate-200 dark:border-obsidian-700 shadow-sm space-y-3.5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-obsidian-800 pb-3">
          <div className="flex items-center gap-2">
            <IconFolder className="w-4 h-4 text-memoryBlue" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-coldWhite">
              Pusat Template Bukti Audit Kasus Nyata (Multi-Format Testing)
            </h2>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-silverMist font-medium">
            Pilih template resmi untuk pengujian simulasi cepat
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {SAMPLE_TEMPLATES.map((tmpl) => {
            const isSelected = activeTemplate?.id === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => loadTemplate(tmpl)}
                className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50/80 dark:bg-memoryBlue/20 border-memoryBlue shadow-md ring-1 ring-memoryBlue"
                    : "bg-white dark:bg-obsidian-950/70 border-slate-200 dark:border-obsidian-800 hover:border-memoryBlue/60 hover:shadow-sm"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-obsidian-800 text-slate-800 dark:text-silverMist border border-slate-200 dark:border-obsidian-700">
                      {tmpl.fileType} • {tmpl.fileSize}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-signalLilac font-bold uppercase tracking-wide">
                      {tmpl.category}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-coldWhite line-clamp-1 mt-1">
                    {tmpl.name}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-silverMist line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-obsidian-800 flex items-center justify-between text-[11px]">
                  <span className="font-mono-code text-[10px] text-slate-500 dark:text-silverMist/70 truncate max-w-[120px]">
                    {tmpl.fileName}
                  </span>
                  <span className="text-memoryBlue dark:text-signalLilac font-bold flex items-center gap-1">
                    <IconSparkles className="w-3.5 h-3.5" />
                    <span>Gunakan</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form Left, Table Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Evidence Registration Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 border border-slate-200 dark:border-obsidian-700 shadow-sm rounded-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-obsidian-800">
              <div className="flex items-center gap-2">
                <IconUpload className="w-4 h-4 text-memoryBlue" />
                <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-coldWhite uppercase">
                  Registrasi Bukti Baru (Direct)
                </h2>
              </div>
              <span className="text-[11px] font-mono-code px-2 py-0.5 rounded-md bg-blue-50 dark:bg-memoryBlue/20 text-blue-700 dark:text-signalLilac font-bold border border-blue-200 dark:border-memoryBlue/30">
                {currentAccount.role}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              {/* Title Input */}
              <div>
                <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1.5">
                  Nama Dokumen / Bukti Audit
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Contoh: Laporan Penilaian Kepatuhan Keamanan 2026"
                  required
                  className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite text-xs focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 transition-all placeholder:text-slate-400 dark:placeholder:text-silverMist/40 shadow-sm"
                />
              </div>

              {/* Upload or Manual Text */}
              <div>
                <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1.5">
                  Unggah Berkas Fisik (Client-Side SHA-256)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-obsidian-700 rounded-xl p-5 bg-slate-50/70 dark:bg-obsidian-950/60 text-center hover:border-memoryBlue transition-all group cursor-pointer">
                  <input
                    type="file"
                    id="evidence-file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="evidence-file"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-memoryBlue/10 flex items-center justify-center text-memoryBlue group-hover:scale-110 transition-transform">
                      <IconFile className="w-5 h-5" />
                    </div>
                    <span className="text-slate-900 dark:text-coldWhite font-bold text-xs mt-1">
                      {file ? file.name : "Klik untuk memilih berkas audit fisik"}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-silverMist">
                      PDF, JSON, CSV, atau Log Forensik (Dihash lokal via Web Crypto API)
                    </span>
                  </label>
                </div>
              </div>

              {/* Alternative Text / Payload */}
              <div>
                <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1.5">
                  Isi Dokumen / Metadata Mentah
                </label>
                <textarea
                  rows={3}
                  value={manualText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Ketik isi data yang ingin diverifikasi integritasnya atau pilih template di atas..."
                  className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite text-xs font-mono-code focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 transition-all placeholder:text-slate-400 dark:placeholder:text-silverMist/40 shadow-sm"
                />
              </div>

              {/* Hash Preview (Readonly) */}
              {calculatedHash && (
                <div className="bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-obsidian-800 rounded-xl p-3.5 space-y-2 shadow-inner">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-silverMist font-semibold">
                      SHA-256 Fingerprint (On-Chain)
                    </span>
                    <div className="font-mono-code text-[11px] text-blue-600 dark:text-signalLilac font-bold break-all flex items-center justify-between mt-0.5">
                      <span>{calculatedHash}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(calculatedHash)}
                        className="text-slate-400 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite ml-2 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-obsidian-800 transition-colors"
                        title="Copy Hash"
                      >
                        <IconCopy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-silverMist font-semibold">
                      IPFS CIDv1 (Off-Chain Reference)
                    </span>
                    <div className="font-mono-code text-[11px] text-slate-700 dark:text-silverMist break-all mt-0.5 font-medium">
                      {ipfsCID}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Feedback */}
              {submitResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs border ${
                    submitResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                      : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300"
                  }`}
                >
                  <div className="font-bold">{submitResult.msg}</div>
                  {submitResult.txHash && (
                    <div className="font-mono-code text-[10px] mt-1 break-all text-emerald-700 dark:text-emerald-400 font-semibold">
                      Tx: {submitResult.txHash}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isHashing}
                className="w-full py-3 px-4 bg-memoryBlue hover:bg-memoryBlue-light disabled:opacity-50 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-memoryBlue/25 rounded-xl flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <IconRefresh className="w-4 h-4 animate-spin" />
                    <span>Memproses Transaksi EVM...</span>
                  </>
                ) : (
                  <>
                    <IconShield className="w-4 h-4" />
                    <span>Catat Bukti ke Ledger (On-Chain)</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-500 dark:text-silverMist text-center mt-2 leading-relaxed">
                Memerlukan otorisasi <span className="font-mono-code text-blue-600 dark:text-signalLilac font-bold">AUDITOR_ROLE</span>. Gunakan mode Commit-Reveal bila bukti memerlukan proteksi anti-front running.
              </div>
            </form>
          </div>

          {/* Quick Info Box */}
          <div className="border border-slate-200 dark:border-obsidian-800 p-4 bg-white dark:bg-obsidian-900/50 rounded-2xl space-y-2 text-xs shadow-sm">
            <div className="font-bold text-slate-900 dark:text-coldWhite flex items-center gap-2">
              <IconKey className="w-4 h-4 text-memoryBlue dark:text-signalLilac" />
              <span>Prinsip Keamanan Data (Zero-Leak)</span>
            </div>
            <p className="text-slate-600 dark:text-silverMist text-[11px] leading-relaxed">
              MNEMA tidak pernah mengirim berkas dokumen fisik Anda ke blockchain. Hanya fingerprint kriptografis 32-byte (SHA-256) yang dicatat on-chain untuk menjamin integritas permanen tanpa melanggar privasi data (UU PDP / GDPR).
            </p>
          </div>
        </div>

        {/* Right Column: Live Ledger Table & Audit Events (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Records List */}
          <div className="glass-panel border border-slate-200 dark:border-obsidian-700 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-obsidian-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <IconFile className="w-4 h-4 text-memoryBlue dark:text-signalLilac" />
                <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-coldWhite uppercase">
                  Daftar Bukti Terdaftar (Live Ledger State)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {currentAccount.role === "Super Admin" && (
                  <button
                    onClick={() => setIsResetConfirmModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-red-300 dark:border-red-800 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 transition-colors"
                    title="Kembalikan ledger ke kondisi genesis default (Khusus Super Admin)"
                  >
                    <IconRefresh className="w-3 h-3" />
                    <span>Reset Ledger</span>
                  </button>
                )}
                <span className="text-xs text-blue-600 dark:text-signalLilac font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-memoryBlue/10 border border-blue-200 dark:border-memoryBlue/20">
                  {records.length} Total Records
                </span>
              </div>
            </div>

            {/* Batch Action Toolbar when 1 or more records are selected */}
            {selectedRecordIds.length > 0 && (
              <div className="bg-blue-50/90 dark:bg-obsidian-850 border-b border-blue-200 dark:border-obsidian-700 p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-memoryBlue text-white text-[10px] font-bold">
                    {selectedRecordIds.length}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-coldWhite">
                    Bukti Dipilih untuk Operasi Audit
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Batch Verify Button */}
                  <button
                    onClick={handleBatchVerify}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
                    title="Audit dan verifikasi integritas hash seluruh record terpilih"
                  >
                    <IconCheckCircle className="w-3.5 h-3.5" />
                    <span>Verifikasi Massal</span>
                  </button>

                  {/* Batch Status Button */}
                  {(currentAccount.role === "Super Admin" || currentAccount.role === "Auditor") && (
                    <button
                      onClick={() => setIsBatchStatusModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-obsidian-900 border border-slate-300 dark:border-obsidian-700 text-slate-800 dark:text-coldWhite hover:bg-slate-100 font-semibold transition-colors"
                      title="Ubah status siklus hidup seluruh record terpilih"
                    >
                      <IconEdit className="w-3.5 h-3.5 text-memoryBlue" />
                      <span>Ubah Status</span>
                    </button>
                  )}

                  {/* Export Selected JSON */}
                  <button
                    onClick={handleExportSelectedJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-obsidian-900 border border-slate-300 dark:border-obsidian-700 text-slate-800 dark:text-coldWhite hover:bg-slate-100 font-semibold transition-colors"
                    title="Unduh paket audit terenkripsi dari record terpilih"
                  >
                    <IconDownload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ekspor JSON</span>
                  </button>

                  {/* Delete Selected (Super Admin Only) */}
                  {currentAccount.role === "Super Admin" && (
                    <button
                      onClick={() => setIsDeleteConfirmModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-xs"
                      title="Pangkas record terpilih dari ledger (Super Admin)"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                      <span>Hapus Terpilih</span>
                    </button>
                  )}

                  {/* Deselect All */}
                  <button
                    onClick={() => setSelectedRecordIds([])}
                    className="px-2.5 py-1.5 text-slate-500 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite text-xs font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-obsidian-800 text-slate-600 dark:text-silverMist uppercase text-[10px] tracking-wider bg-slate-50/80 dark:bg-obsidian-950/60 font-semibold">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={records.length > 0 && selectedRecordIds.length === records.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-memoryBlue focus:ring-memoryBlue/30 w-3.5 h-3.5 cursor-pointer"
                        title="Pilih / Batalkan Semua Record"
                      />
                    </th>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Judul &amp; Hash Bukti</th>
                    <th className="py-3 px-4">Creator</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-obsidian-800/60">
                  {records.map((r) => {
                    const isSelected = selectedRecordIds.includes(r.recordId);
                    const statusColors = {
                      Active: "text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700",
                      Superseded: "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700",
                      Deprecated: "text-slate-700 dark:text-silverMist bg-slate-100 dark:bg-obsidian-800 border-slate-300 dark:border-obsidian-700",
                      Revoked: "text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-700",
                    }[r.status];

                    return (
                      <tr
                        key={r.recordId}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-blue-50/50 dark:bg-obsidian-800/70"
                            : "hover:bg-slate-50/80 dark:hover:bg-obsidian-800/40"
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRecord(r.recordId)}
                            className="rounded border-slate-300 text-memoryBlue focus:ring-memoryBlue/30 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-3 font-mono-code font-extrabold text-slate-900 dark:text-coldWhite">
                          #{r.recordId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${statusColors}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-coldWhite truncate">{r.title}</div>
                          <div className="font-mono-code text-[10px] text-blue-600 dark:text-signalLilac truncate flex items-center gap-1.5 mt-0.5 font-medium">
                            <span>{r.docHash.slice(0, 14)}...{r.docHash.slice(-8)}</span>
                            <button
                              onClick={() => copyToClipboard(r.docHash)}
                              className="text-slate-400 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite p-0.5 rounded hover:bg-slate-200 dark:hover:bg-obsidian-800"
                              title="Salin Hash Lengkap"
                            >
                              <IconCopy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-silverMist/70 truncate">
                            IPFS: {r.ipfsCID.slice(0, 16)}...
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono-code text-[11px] text-slate-600 dark:text-silverMist font-medium">
                          {r.creator.slice(0, 6)}...{r.creator.slice(-4)}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Delegate Access Button */}
                          <button
                            onClick={() => setActiveGrantModalRecordId(r.recordId)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-obsidian-800 dark:hover:bg-obsidian-700 border border-blue-200 dark:border-obsidian-700 rounded-lg text-[11px] font-semibold text-blue-700 dark:text-coldWhite transition-colors"
                            title="Delegasikan Akses Berbatas Waktu"
                          >
                            Delegasi
                          </button>

                          {/* Status Management Button */}
                          <button
                            onClick={() => setStatusModalRecordId(r.recordId)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-800 dark:hover:bg-obsidian-700 border border-slate-200 dark:border-obsidian-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite transition-colors"
                            title="Ubah Status Siklus Hidup"
                          >
                            Status
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Emitted Events Log Feed */}
          <div className="glass-panel border border-slate-200 dark:border-obsidian-700 p-4 sm:p-5 space-y-3.5 shadow-sm rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-obsidian-800 pb-2.5">
              <div className="flex items-center gap-2">
                <IconActivity className="w-4 h-4 text-memoryBlue" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-coldWhite">
                  Audit Trail &amp; On-Chain Event Stream
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {currentAccount.role === "Super Admin" && events.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-obsidian-700 bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-800 dark:hover:bg-obsidian-750 text-slate-600 dark:text-silverMist transition-colors"
                    title="Bersihkan riwayat log audit event (Khusus Super Admin)"
                  >
                    <IconTrash className="w-3 h-3 text-red-500" />
                    <span>Bersihkan Log</span>
                  </button>
                )}
                <span className="text-[10px] font-mono-code text-slate-500 dark:text-silverMist font-semibold">
                  {events.length} Events Logged
                </span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-silverMist/60 font-mono-code">
                  Log event audit trail kosong. Transaksi baru akan muncul secara otomatis di sini.
                </div>
              ) : (
                events.slice(0, 8).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-white dark:bg-obsidian-950 border border-slate-200 dark:border-obsidian-800 rounded-xl text-xs flex items-start justify-between gap-3 font-mono-code shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-signalLilac font-bold">{evt.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-silverMist">Block #{evt.blockNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-900 dark:text-coldWhite/90 font-medium">{evt.details}</div>
                      <div className="text-[10px] text-slate-400 dark:text-silverMist/60 break-all">Tx: {evt.txHash}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-silverMist shrink-0 font-medium" suppressHydrationWarning>{evt.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Time-Locked Access Delegation */}
      {activeGrantModalRecordId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 dark:bg-obsidian-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-700 max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-obsidian-800 pb-3">
              <div className="flex items-center gap-2">
                <IconClock className="w-5 h-5 text-memoryBlue" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-coldWhite">
                  Delegasi Akses Berbatas Waktu (Time-Lock)
                </h3>
              </div>
              <button
                onClick={() => setActiveGrantModalRecordId(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-coldWhite text-xl p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-silverMist leading-relaxed">
              Menetapkan izin inspeksi dokumen untuk Record #{activeGrantModalRecordId}. Izin ini akan kedaluwarsa secara otomatis di smart contract tanpa memerlukan biaya gas pencabutan manual.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1">
                  Alamat Penerima Izin (User Address)
                </label>
                <input
                  type="text"
                  value={grantRecipient}
                  onChange={(e) => setGrantRecipient(e.target.value)}
                  className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite font-mono-code text-xs focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1">
                  Durasi Masa Berlaku Izin
                </label>
                <select
                  value={grantDuration}
                  onChange={(e) => setGrantDuration(Number(e.target.value))}
                  className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite text-xs focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-sm"
                >
                  <option value={30}>30 Detik (Demonstrasi Cepat)</option>
                  <option value={60}>60 Detik (1 Menit)</option>
                  <option value={3600}>1 Jam (Audit Standar)</option>
                  <option value={86400}>24 Jam (Inspeksi Khusus)</option>
                  <option value={2592000}>30 Hari (Kontrak Enterprise)</option>
                </select>
              </div>

              {grantResult && (
                <div className="p-3 bg-blue-50 dark:bg-obsidian-950 border border-blue-300 dark:border-memoryBlue rounded-xl text-slate-900 dark:text-coldWhite text-xs font-medium">
                  {grantResult}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-obsidian-800">
              <button
                onClick={() => setActiveGrantModalRecordId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-700 rounded-xl text-xs font-bold text-slate-700 dark:text-silverMist transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteGrant}
                className="px-4 py-2 bg-memoryBlue hover:bg-memoryBlue-light text-xs font-bold text-white rounded-xl shadow-md shadow-memoryBlue/20 transition-all"
              >
                Terapkan Izin (On-Chain Grant)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Status Lifecycle Update */}
      {statusModalRecordId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 dark:bg-obsidian-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-700 max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-obsidian-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-coldWhite">
                Pembaruan Status Record #{statusModalRecordId}
              </h3>
              <button
                onClick={() => setStatusModalRecordId(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-coldWhite text-xl p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1">
                  Pilih Status Baru
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite text-xs focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-sm"
                >
                  <option value="Active">Active (Sah &amp; Berlaku)</option>
                  <option value="Superseded">Superseded (Diganti Versi Baru)</option>
                  <option value="Deprecated">Deprecated (Masa Berlaku Habis)</option>
                  <option value="Revoked">Revoked (Dicabut / Cacat Hukum)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1">
                  Alasan Audit (Mandatory Audit Reason)
                </label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Ketikkan alasan perubahan status..."
                  required
                  className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite text-xs focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-obsidian-800">
              <button
                onClick={() => setStatusModalRecordId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-700 rounded-xl text-xs font-bold text-slate-700 dark:text-silverMist transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteStatusUpdate}
                className="px-4 py-2 bg-memoryBlue hover:bg-memoryBlue-light text-xs font-bold text-white rounded-xl shadow-md shadow-memoryBlue/20 transition-all"
              >
                Simpan Perubahan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Status Update */}
      {isBatchStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 dark:bg-obsidian-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-700 max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl rounded-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-obsidian-800 pb-3">
              <div className="flex items-center gap-2">
                <IconEdit className="w-5 h-5 text-memoryBlue" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-coldWhite">
                  Ubah Status Massal ({selectedRecordIds.length} Record Dipilih)
                </h3>
              </div>
              <button
                onClick={() => setIsBatchStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-coldWhite text-xl p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-silverMist leading-relaxed">
              Memperbarui status siklus hidup untuk ID: <span className="font-mono-code font-bold text-blue-600 dark:text-signalLilac">#{selectedRecordIds.join(", #")}</span> sekaligus secara batch.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1">
                  Pilih Status Baru
                </label>
                <select
                  value={batchTargetStatus}
                  onChange={(e) => setBatchTargetStatus(e.target.value as any)}
                  className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite text-xs focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-sm"
                >
                  <option value="Active">Active (Sah &amp; Berlaku)</option>
                  <option value="Superseded">Superseded (Diganti Versi Baru)</option>
                  <option value="Deprecated">Deprecated (Masa Berlaku Habis)</option>
                  <option value="Revoked">Revoked (Dicabut / Cacat Hukum)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1">
                  Alasan Audit Kolektif
                </label>
                <input
                  type="text"
                  value={batchReason}
                  onChange={(e) => setBatchReason(e.target.value)}
                  placeholder="Ketikkan alasan perubahan status massal..."
                  required
                  className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite text-xs focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-obsidian-800">
              <button
                onClick={() => setIsBatchStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-700 rounded-xl text-xs font-bold text-slate-700 dark:text-silverMist transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleBatchStatusSubmit}
                className="px-4 py-2 bg-memoryBlue hover:bg-memoryBlue-light text-xs font-bold text-white rounded-xl shadow-md shadow-memoryBlue/20 transition-all"
              >
                Terapkan Status Massal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Selected Confirmation (Super Admin Only) */}
      {isDeleteConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 dark:bg-obsidian-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-obsidian-900 border border-red-200 dark:border-red-900/60 max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl rounded-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-obsidian-800 pb-3">
              <div className="flex items-center gap-2">
                <IconTrash className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-coldWhite">
                  Konfirmasi Pemangkasan Record (Super Admin)
                </h3>
              </div>
              <button
                onClick={() => setIsDeleteConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-coldWhite text-xl p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-900 dark:text-red-300 leading-relaxed space-y-1">
              <p className="font-bold">Perhatian Pemeliharaan Ledger:</p>
              <p>
                Anda akan menghapus secara permanen <strong className="font-mono-code font-bold">{selectedRecordIds.length}</strong> record terpilih (ID: #{selectedRecordIds.join(", #")}).
              </p>
              <p className="text-[11px] text-red-700 dark:text-red-400">
                Operasi ini hanya diizinkan untuk peran Super Admin guna pembersihan data uji/maintenance simulasi.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-obsidian-800">
              <button
                onClick={() => setIsDeleteConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-700 rounded-xl text-xs font-bold text-slate-700 dark:text-silverMist transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-bold text-white rounded-xl shadow-md shadow-red-600/20 transition-all"
              >
                Ya, Hapus {selectedRecordIds.length} Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset Ledger Confirmation (Super Admin Only) */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 dark:bg-obsidian-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-obsidian-900 border border-red-200 dark:border-red-900/60 max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl rounded-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-obsidian-800 pb-3">
              <div className="flex items-center gap-2">
                <IconRefresh className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-coldWhite">
                  Reset Ledger ke Genesis State
                </h3>
              </div>
              <button
                onClick={() => setIsResetConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-coldWhite text-xl p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-silverMist leading-relaxed">
              Apakah Anda yakin ingin mengembalikan seluruh ledger ke kondisi awal genesis (2 initial records &amp; genesis events)? Seluruh bukti tambahan yang dibuat selama sesi simulasi akan dibersihkan.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-obsidian-800">
              <button
                onClick={() => setIsResetConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-700 rounded-xl text-xs font-bold text-slate-700 dark:text-silverMist transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleResetLedger}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-bold text-white rounded-xl shadow-md shadow-red-600/20 transition-all"
              >
                Ya, Reset Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Verification Results */}
      {verifyModalRecords !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 dark:bg-obsidian-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-700 max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl rounded-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-obsidian-800 pb-3">
              <div className="flex items-center gap-2">
                <IconCheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-coldWhite">
                  Hasil Audit &amp; Verifikasi Integritas Massal
                </h3>
              </div>
              <button
                onClick={() => setVerifyModalRecords(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-coldWhite text-xl p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 font-medium">
              Sebanyak <strong>{verifyModalRecords.filter((r) => r.isValid).length}</strong> dari <strong>{verifyModalRecords.length}</strong> bukti terpilih dinyatakan <strong>VALID &amp; SAH</strong> sesuai stempel blok on-chain.
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {verifyModalRecords.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-obsidian-800 bg-slate-50 dark:bg-obsidian-950 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate">
                    <span className="font-mono-code font-bold text-blue-600 dark:text-signalLilac mr-2">
                      #{item.id}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-coldWhite truncate">
                      {item.title}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                      item.isValid
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                        : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-700"
                    }`}
                  >
                    {item.isValid ? "TERVERIFIKASI" : "TIDAK SAH"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-obsidian-800">
              <button
                onClick={() => setVerifyModalRecords(null)}
                className="px-4 py-2 bg-memoryBlue hover:bg-memoryBlue-light text-white text-xs font-bold rounded-xl shadow-md shadow-memoryBlue/20 transition-all"
              >
                Tutup Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {auditToast && (
        <div className="fixed bottom-5 right-4 left-4 sm:left-auto sm:right-5 z-50 max-w-md flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl bg-white dark:bg-obsidian-900 text-xs font-semibold animate-slideUp border-slate-200 dark:border-obsidian-700 text-slate-900 dark:text-coldWhite">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              auditToast.type === "success"
                ? "bg-emerald-500"
                : auditToast.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          />
          <span>{auditToast.message}</span>
          <button
            onClick={() => setAuditToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-silverMist ml-1 text-sm leading-none"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
