"use client";

import React, { useState } from "react";
import { useLedger } from "../../lib/LedgerContext";
import { calculateSHA256 } from "../../lib/crypto";
import { SAMPLE_TEMPLATES, SampleTemplate } from "../../lib/sampleTemplates";
import {
  IconCheckCircle,
  IconSearch,
  IconShield,
  IconFile,
  IconLock,
  IconUnlock,
  IconCopy,
  IconAlert,
  IconFolder,
  IconSparkles,
} from "../../lib/icons";
import { MemoryRecord } from "../../lib/web3";

export default function VerifyPortalPage() {
  const { verifyRecord, checkAccess, currentAccount, records } = useLedger();

  const [inputHash, setInputHash] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    hasChecked: boolean;
    isValid: boolean;
    record?: MemoryRecord;
    error?: string;
  }>({
    hasChecked: false,
    isValid: false,
  });

  // Handle File Upload and Local Hashing
  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const hash = await calculateSHA256(selected);
      setInputHash(hash);
      performVerification(hash);
    }
  };

  const performVerification = async (hashToVerify: string) => {
    if (!hashToVerify.trim()) return;
    setIsVerifying(true);
    const res = await verifyRecord(hashToVerify.trim());
    setIsVerifying(false);
    setVerificationResult({
      hasChecked: true,
      isValid: res.isValid,
      record: res.record,
      error: res.error,
    });
  };

  const handleQuickSample = (record: MemoryRecord) => {
    setFile(null);
    setInputHash(record.docHash);
    performVerification(record.docHash);
  };

  const handleQuickTemplate = async (tmpl: SampleTemplate) => {
    setFile(null);
    const hash = await calculateSHA256(tmpl.content);
    setInputHash(hash);
    performVerification(hash);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const accessCheck = verificationResult.record
    ? checkAccess(currentAccount.address, verificationResult.record.recordId)
    : { hasAccess: false, expiryTimestamp: 0 };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-obsidian-700 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono-code text-blue-600 dark:text-signalLilac uppercase tracking-wider font-semibold">
          <IconShield className="w-4 h-4 text-memoryBlue" />
          <span>Independent Third-Party Verification Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-coldWhite mt-1">
          Verifikasi Bukti Kriptografis
        </h1>
        <p className="text-sm text-slate-700 dark:text-silverMist mt-1 leading-relaxed">
          Lakukan audit independen atas keaslian dokumen digital tanpa membocorkan data mentah. Kecocokan matematis diperiksa langsung terhadap state ledger on-chain.
        </p>
      </div>

      {/* Input Card */}
      <div className="glass-panel p-6 sm:p-7 border border-slate-200 dark:border-obsidian-700 shadow-sm space-y-5 rounded-2xl">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-coldWhite mb-2">
            Metode 1: Unggah Berkas untuk Dihitung Hash Otomatis
          </label>
          <div className="border-2 border-dashed border-slate-300 dark:border-obsidian-700 rounded-xl p-6 bg-slate-50/70 dark:bg-obsidian-950/60 text-center hover:border-memoryBlue transition-all group cursor-pointer">
            <input
              type="file"
              id="verify-file"
              onChange={handleFileDrop}
              className="hidden"
            />
            <label
              htmlFor="verify-file"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-memoryBlue/10 flex items-center justify-center text-memoryBlue group-hover:scale-110 transition-transform">
                <IconFile className="w-6 h-6" />
              </div>
              <span className="text-slate-900 dark:text-coldWhite font-bold text-xs mt-1">
                {file ? file.name : "Klik atau seret berkas ke area ini"}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-silverMist font-medium">
                File Anda diproses 100% di browser lokal (Zero Data Leak via Web Crypto API)
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-obsidian-800" />
          <span className="text-[11px] text-slate-400 dark:text-silverMist uppercase tracking-widest font-mono-code font-bold">
            ATAU
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-obsidian-800" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-coldWhite mb-2">
            Metode 2: Masukkan Sidik Jari Dokumen (SHA-256 Hash)
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              placeholder="0x892a065c71be399fdb60d4b1a5bc3b9487fa83be313c41cf3ce3f46f554ea388"
              className="flex-1 bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-xs font-mono-code text-slate-900 dark:text-coldWhite focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-sm"
            />
            <button
              onClick={() => performVerification(inputHash)}
              disabled={isVerifying || !inputHash.trim()}
              className="px-6 py-2.5 bg-memoryBlue hover:bg-memoryBlue-light disabled:opacity-50 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-memoryBlue/20 rounded-xl flex items-center justify-center gap-2"
            >
              <IconSearch className="w-4 h-4" />
              <span>Verifikasi</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Selector for Defense demo */}
        <div className="pt-3 border-t border-slate-100 dark:border-obsidian-800 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 dark:text-silverMist text-[11px] font-semibold">Uji Cepat Dokumen Terdaftar:</span>
            {records.slice(0, 3).map((rec) => (
              <button
                key={rec.recordId}
                type="button"
                onClick={() => handleQuickSample(rec)}
                className="px-2.5 py-1 bg-blue-50 dark:bg-obsidian-850 hover:bg-blue-100 dark:hover:bg-obsidian-800 border border-blue-200 dark:border-obsidian-700 rounded-lg text-[11px] text-blue-700 dark:text-signalLilac font-mono-code font-bold transition-colors"
              >
                Record #{rec.recordId}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 dark:text-silverMist text-[11px] font-semibold">Uji Template Dokumen:</span>
            {SAMPLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleQuickTemplate(tmpl)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-obsidian-850 hover:bg-slate-200 dark:hover:bg-obsidian-800 border border-slate-200 dark:border-obsidian-700 rounded-lg text-[11px] text-slate-800 dark:text-silverMist font-medium transition-colors truncate max-w-[170px] sm:max-w-none"
                title={tmpl.name}
              >
                {tmpl.name.slice(0, 24)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Output Section */}
      {verificationResult.hasChecked && (
        <div className="space-y-6">
          {verificationResult.isValid && verificationResult.record ? (
            /* VALID PROVENANCE CERTIFICATE */
            <div className="glass-panel p-6 sm:p-7 border border-emerald-500/50 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/20 relative space-y-6 shadow-xl rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-200 dark:border-emerald-900/40 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-400 dark:border-emerald-500/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                    <IconCheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-extrabold font-mono-code">
                      Sertifikat Keaslian Terverifikasi
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-coldWhite">
                      Proven by the Record
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 font-mono-code font-bold text-xs uppercase rounded-full">
                    Status: {verificationResult.record.status}
                  </span>
                </div>
              </div>

              {/* Certificate Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-code">
                <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-3.5 space-y-1 shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-silverMist uppercase font-semibold">Record Identifier</span>
                  <div className="font-extrabold text-slate-900 dark:text-coldWhite text-sm">
                    Record #{verificationResult.record.recordId}
                  </div>
                </div>

                <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-3.5 space-y-1 shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-silverMist uppercase font-semibold">Nama Dokumen Audit</span>
                  <div className="font-bold text-slate-900 dark:text-coldWhite truncate">
                    {verificationResult.record.title}
                  </div>
                </div>

                <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-3.5 space-y-1 md:col-span-2 shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-silverMist uppercase font-semibold">
                    SHA-256 Cryptographic Fingerprint
                  </span>
                  <div className="text-blue-600 dark:text-signalLilac font-bold break-all flex items-center justify-between">
                    <span>{verificationResult.record.docHash}</span>
                    <button
                      onClick={() => copyToClipboard(verificationResult.record!.docHash)}
                      className="text-slate-400 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite ml-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-obsidian-800"
                      title="Salin Hash"
                    >
                      <IconCopy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-3.5 space-y-1 shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-silverMist uppercase font-semibold">Penandatangan (Creator)</span>
                  <div className="text-slate-900 dark:text-coldWhite truncate font-semibold">
                    {verificationResult.record.creator}
                  </div>
                </div>

                <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-3.5 space-y-1 shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-silverMist uppercase font-semibold">Stempel Waktu Blok</span>
                  <div className="text-slate-900 dark:text-coldWhite font-semibold">
                    {new Date(verificationResult.record.timestamp * 1000).toLocaleString("id-ID")} (Block #{verificationResult.record.blockNumber})
                  </div>
                </div>

                <div className="bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl p-3.5 space-y-1 md:col-span-2 shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-silverMist uppercase font-semibold">IPFS Content Identifier (CIDv1)</span>
                  <div className="text-slate-700 dark:text-silverMist break-all flex items-center justify-between font-medium">
                    <span>{verificationResult.record.ipfsCID}</span>
                    <span className="text-[10px] text-blue-600 dark:text-signalLilac font-bold">Off-Chain Storage</span>
                  </div>
                </div>
              </div>

              {/* Time-Locked Access Evaluation for Current Account */}
              <div className="border-t border-emerald-200 dark:border-emerald-900/40 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  {accessCheck.hasAccess ? (
                    <IconUnlock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    <IconLock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  )}
                  <span className="text-slate-700 dark:text-silverMist font-medium">
                    Hak Akses Detail ({currentAccount.role}):{" "}
                    <strong className={accessCheck.hasAccess ? "text-emerald-800 dark:text-emerald-300 font-bold" : "text-amber-800 dark:text-amber-300 font-bold"}>
                      {accessCheck.hasAccess ? "Diberikan (Authorized)" : "Dibatasi (Time-Locked Restricted)"}
                    </strong>
                  </span>
                </div>

                {accessCheck.hasAccess && accessCheck.expiryTimestamp !== Infinity && (
                  <span className="text-slate-600 dark:text-silverMist font-mono-code text-[11px] font-semibold" suppressHydrationWarning>
                    Berlaku hingga: {new Date(accessCheck.expiryTimestamp * 1000).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* INVALID / NOT FOUND RESULT */
            <div className="glass-panel p-6 sm:p-7 border border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20 text-center space-y-3 shadow-md rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-400 dark:border-red-500/50 flex items-center justify-center text-red-700 dark:text-red-400 mx-auto">
                <IconAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-coldWhite">
                Bukti Tidak Sah atau Tidak Terdaftar
              </h2>
              <p className="text-xs text-slate-600 dark:text-silverMist max-w-md mx-auto leading-relaxed">
                Hash dokumen <span className="font-mono-code text-red-700 dark:text-red-300 font-bold">{inputHash.slice(0, 16)}...</span> tidak ditemukan dalam ledger MNEMA, atau statusnya telah dibatalkan (Revoked).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
