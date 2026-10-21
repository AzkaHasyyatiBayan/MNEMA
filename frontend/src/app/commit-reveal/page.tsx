"use client";

import React, { useState, useEffect } from "react";
import { useLedger } from "../../lib/LedgerContext";
import { calculateSHA256, generateRandomSalt, computeCommitmentHash, generateSimulatedCID } from "../../lib/crypto";
import { SAMPLE_TEMPLATES, SampleTemplate } from "../../lib/sampleTemplates";
import {
  IconLock,
  IconUnlock,
  IconClock,
  IconShield,
  IconCheckCircle,
  IconAlert,
  IconRefresh,
  IconFolder,
  IconSparkles,
} from "../../lib/icons";

export default function CommitRevealWorkshopPage() {
  const {
    commitMemory,
    revealMemory,
    currentAccount,
  } = useLedger();

  // Step 1: Input & Salt
  const [docTitle, setDocTitle] = useState("Laporan Penyelidikan Forensik Korupsi (Confidential)");
  const [docContent, setDocContent] = useState("Temuan transaksi mencurigakan senilai Rp 14.500.000.000 pada rekening escrow.");
  const [docHash, setDocHash] = useState("");
  const [salt, setSalt] = useState("");
  const [commitmentHash, setCommitmentHash] = useState("");

  // Step 2: Commit Status & Timer
  const [hasCommitted, setHasCommitted] = useState(false);
  const [commitTimestamp, setCommitTimestamp] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isSubmittingCommit, setIsSubmittingCommit] = useState(false);
  const [isSubmittingReveal, setIsSubmittingReveal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    success: boolean;
    msg: string;
    txHash?: string;
  } | null>(null);

  // Initialize Salt & Hashes
  useEffect(() => {
    const initHashes = async () => {
      const generatedSalt = generateRandomSalt();
      setSalt(generatedSalt);
      const hash = await calculateSHA256(docContent);
      setDocHash(hash);
      const comm = computeCommitmentHash(hash, generatedSalt, currentAccount.address);
      setCommitmentHash(comm);
    };
    initHashes();
  }, [docContent, currentAccount.address]);

  // Recalculate Commitment when Hash or Salt changes
  const handleRegenerateSalt = () => {
    const newSalt = generateRandomSalt();
    setSalt(newSalt);
    if (docHash) {
      setCommitmentHash(computeCommitmentHash(docHash, newSalt, currentAccount.address));
    }
  };

  // Timer countdown for minCommitDelay (15 seconds)
  useEffect(() => {
    if (!commitTimestamp) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - commitTimestamp;
      const remaining = Math.max(0, 15 - elapsed);
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [commitTimestamp]);

  // Handle Phase 1: Commit
  const handleExecuteCommit = async () => {
    setIsSubmittingCommit(true);
    setActionFeedback(null);
    const res = await commitMemory(commitmentHash);
    setIsSubmittingCommit(false);

    if (res.success) {
      setHasCommitted(true);
      const now = Math.floor(Date.now() / 1000);
      setCommitTimestamp(now);
      setSecondsRemaining(15);
      setActionFeedback({
        success: true,
        msg: "Fase 1 (Commit) Berhasil! Hash komitmen rahasia tersimpan di state kontrak. Menunggu jeda anti front-running.",
        txHash: res.txHash,
      });
    } else {
      setActionFeedback({
        success: false,
        msg: res.error || "Gagal melakukan commit.",
      });
    }
  };

  // Handle Phase 2: Reveal
  const handleExecuteReveal = async () => {
    setIsSubmittingReveal(true);
    setActionFeedback(null);
    const res = await revealMemory(
      docHash,
      salt,
      docTitle,
      generateSimulatedCID(docHash)
    );
    setIsSubmittingReveal(false);

    if (res.success) {
      setActionFeedback({
        success: true,
        msg: `Fase 2 (Reveal) Sukses! Dokumen resmi terdaftar sebagai Record #${res.recordId}. Bukti terlindungi penuh dari risiko front-running mempool.`,
        txHash: res.txHash,
      });
      setHasCommitted(false);
      setCommitTimestamp(null);
    } else {
      setActionFeedback({
        success: false,
        msg: res.error || "Gagal melakukan reveal.",
      });
    }
  };

  // Test Simulation: Front-run early attack
  const handleSimulateEarlyAttack = async () => {
    setActionFeedback(null);
    const res = await revealMemory(
      docHash,
      salt,
      "Simulasi Penyerang Early Reveal",
      ""
    );
    if (!res.success) {
      setActionFeedback({
        success: false,
        msg: `Pertahanan Berhasil! Smart Contract menolak percobaan: "${res.error}"`,
      });
    }
  };

  // Load Template
  const handleSelectTemplate = async (tmpl: SampleTemplate) => {
    setDocTitle(tmpl.suggestedTitle);
    setDocContent(tmpl.content);
    setHasCommitted(false);
    setCommitTimestamp(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-obsidian-700 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono-code text-blue-600 dark:text-signalLilac uppercase tracking-wider font-semibold">
          <IconShield className="w-4 h-4 text-memoryBlue" />
          <span>Advanced Security Engine — Project 1 &amp; 3</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-coldWhite mt-1">
          Commit-Reveal Workshop (Anti Front-Running)
        </h1>
        <p className="text-sm text-slate-700 dark:text-silverMist mt-1 leading-relaxed">
          Eksperimen langsung skema perlindungan transaksi dua fase. Mencegah pihak ketiga atau bot MEV memata-matai mempool publik untuk mencuri atau mendahului pendaftaran bukti audit rahasia.
        </p>
      </div>

      {/* Template Quick Selection */}
      <div className="p-3.5 bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 rounded-2xl flex flex-wrap items-center gap-2 text-xs shadow-sm">
        <span className="text-slate-700 dark:text-silverMist text-[11px] font-bold flex items-center gap-1.5 mr-1">
          <IconFolder className="w-4 h-4 text-memoryBlue" />
          <span>Pilih Kasus Uji Nyata:</span>
        </span>
        {SAMPLE_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => handleSelectTemplate(tmpl)}
            className="px-3 py-1 bg-slate-100 dark:bg-obsidian-850 hover:bg-slate-200 dark:hover:bg-obsidian-800 border border-slate-200 dark:border-obsidian-700 rounded-lg text-[11px] text-slate-800 dark:text-silverMist font-medium transition-colors truncate max-w-[180px] sm:max-w-none"
            title={tmpl.name}
          >
            {tmpl.name.slice(0, 26)}...
          </button>
        ))}
      </div>

      {/* Architecture Explanation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-code">
        <div className="p-4 bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 rounded-2xl shadow-sm space-y-1.5">
          <div className="text-blue-600 dark:text-signalLilac font-bold flex items-center gap-1.5">
            <IconLock className="w-4 h-4 text-memoryBlue" />
            <span className="uppercase tracking-wider">Fase 1: Commit (Penyegelan)</span>
          </div>
          <p className="text-slate-600 dark:text-silverMist text-[11px] font-sans leading-relaxed">
            Pengguna hanya mengirim hash komitmen rahasia: <br />
            <code className="text-slate-900 dark:text-coldWhite font-mono-code font-semibold">keccak256(docHash + salt + creator)</code>. Penyerang di mempool tidak tahu dokumen apa yang sedang didaftarkan.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 rounded-2xl shadow-sm space-y-1.5">
          <div className="text-emerald-700 dark:text-signalLilac font-bold flex items-center gap-1.5">
            <IconUnlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="uppercase tracking-wider">Fase 2: Reveal (Pembukaan Bukti)</span>
          </div>
          <p className="text-slate-600 dark:text-silverMist text-[11px] font-sans leading-relaxed">
            Setelah melewati jeda waktu minimum (&gt;= 15 detik), pengguna membuka hash dokumen dan salt. Kontrak memvalidasi kecocokan komitmen sebelum mencatatnya ke ledger.
          </p>
        </div>
      </div>

      {/* Two-Column Interactive Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Data & Salt Configuration (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 border border-slate-200 dark:border-obsidian-700 shadow-sm rounded-2xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-obsidian-800 pb-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-900 dark:text-coldWhite">
              1. Parameter Bukti Audit
            </h2>
            <span className="text-[11px] font-mono-code px-2 py-0.5 rounded-md bg-blue-50 dark:bg-memoryBlue/20 text-blue-700 dark:text-signalLilac font-bold border border-blue-200 dark:border-memoryBlue/30">
              Actor: {currentAccount.role}
            </span>
          </div>

          <div>
            <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1.5">
              Judul Bukti Rahasia
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite text-xs focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-slate-800 dark:text-silverMist font-semibold mb-1.5">
              Isi Dokumen Mentah (Payload)
            </label>
            <textarea
              rows={3}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-coldWhite text-xs font-mono-code focus:outline-none focus:border-memoryBlue focus:ring-2 focus:ring-memoryBlue/20 shadow-sm"
            />
          </div>

          <div className="bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-obsidian-800 rounded-xl p-3.5 space-y-2.5 font-mono-code shadow-xs">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-silverMist uppercase font-semibold">Doc Fingerprint (docHash)</span>
              <div className="text-blue-600 dark:text-signalLilac text-[11px] font-bold break-all mt-0.5">{docHash}</div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-obsidian-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-silverMist uppercase font-semibold">Kunci Acak Rahasia (Salt)</span>
                <div className="text-slate-900 dark:text-coldWhite text-[11px] font-semibold break-all mt-0.5">{salt.slice(0, 16)}...</div>
              </div>
              <button
                type="button"
                onClick={handleRegenerateSalt}
                className="px-2.5 py-1 bg-white dark:bg-obsidian-800 hover:bg-slate-100 dark:hover:bg-obsidian-700 text-slate-700 dark:text-silverMist text-[10px] font-semibold border border-slate-200 dark:border-obsidian-700 rounded-lg flex items-center gap-1 transition-colors"
              >
                <IconRefresh className="w-3 h-3" />
                <span>Ganti Salt</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-obsidian-900">
              <span className="text-[10px] text-slate-500 dark:text-silverMist uppercase font-semibold">Commitment Hash (On-Chain Target)</span>
              <div className="text-emerald-700 dark:text-emerald-400 text-[11px] break-all mt-0.5 font-extrabold">{commitmentHash}</div>
            </div>
          </div>
        </div>

        {/* Right Step Execution (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 border border-slate-200 dark:border-obsidian-700 shadow-sm rounded-2xl space-y-5 text-xs">
          <div className="border-b border-slate-100 dark:border-obsidian-800 pb-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-900 dark:text-coldWhite">
              2. Eksekusi Protokol Dua Tahap
            </h2>
          </div>

          {/* Step 1 Button */}
          <div className="space-y-2.5 p-4 bg-white dark:bg-obsidian-950/80 border border-slate-200 dark:border-obsidian-800 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-memoryBlue/20 text-blue-700 dark:text-memoryBlue font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <span className="font-bold text-slate-900 dark:text-coldWhite">Tahap 1: Kirim Komitmen (Commit)</span>
              </div>
              {hasCommitted && (
                <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-mono-code flex items-center gap-1 font-bold">
                  <IconCheckCircle className="w-3.5 h-3.5" />
                  <span>Committed</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
              Menyimpan hash komitmen di kontrak. Data dokumen dan salt tetap tersimpan secara rahasia di perangkat Anda.
            </p>
            <button
              onClick={handleExecuteCommit}
              disabled={isSubmittingCommit || hasCommitted}
              className="w-full py-2.5 bg-memoryBlue hover:bg-memoryBlue-light disabled:opacity-50 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-memoryBlue/20 rounded-xl flex items-center justify-center gap-2 mt-2"
            >
              {isSubmittingCommit ? (
                <>
                  <IconRefresh className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim Transaksi Commit...</span>
                </>
              ) : (
                <>
                  <IconLock className="w-3.5 h-3.5" />
                  <span>{hasCommitted ? "Komitmen Aktif On-Chain" : "Eksekusi Commit Transaksi"}</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2 Reveal Card */}
          <div className={`space-y-3 p-4 border rounded-xl transition-all ${
            hasCommitted
              ? "bg-white dark:bg-obsidian-950/80 border-memoryBlue/50 shadow-md ring-1 ring-memoryBlue/30"
              : "bg-slate-50/50 dark:bg-obsidian-950/30 border-slate-200 dark:border-obsidian-800 opacity-60"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <span className="font-bold text-slate-900 dark:text-coldWhite">Tahap 2: Buka Rahasia (Reveal)</span>
              </div>

              {hasCommitted && (
                <div className="flex items-center gap-1 text-[11px] font-mono-code text-blue-600 dark:text-signalLilac font-bold">
                  <IconClock className="w-3.5 h-3.5" />
                  <span>
                    {secondsRemaining > 0 ? `Jeda Waktu: ${secondsRemaining}s` : "Siap di-Reveal!"}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-600 dark:text-silverMist leading-relaxed">
              Mengirimkan docHash dan salt asli. Kontrak akan mencocokkan komitmen awal. Reveal hanya diizinkan setelah jeda anti-front running (15 detik).
            </p>

            <button
              onClick={handleExecuteReveal}
              disabled={!hasCommitted || secondsRemaining > 0 || isSubmittingReveal}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-emerald-600/20 rounded-xl flex items-center justify-center gap-2"
            >
              {isSubmittingReveal ? (
                <>
                  <IconRefresh className="w-3.5 h-3.5 animate-spin" />
                  <span>Memverifikasi Komitmen On-Chain...</span>
                </>
              ) : (
                <>
                  <IconUnlock className="w-3.5 h-3.5" />
                  <span>
                    {secondsRemaining > 0
                      ? `Menunggu Jeda Waktu (${secondsRemaining}s)...`
                      : "Buka Komitmen & Daftarkan Bukti"}
                  </span>
                </>
              )}
            </button>

            {/* Negative test demonstration */}
            {hasCommitted && secondsRemaining > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-obsidian-900">
                <button
                  type="button"
                  onClick={handleSimulateEarlyAttack}
                  className="w-full py-1.5 text-[11px] bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 font-mono-code rounded-lg transition-colors font-semibold"
                >
                  Uji Serangan: Coba Reveal Terlalu Dini (Kasus Negatif)
                </button>
              </div>
            )}
          </div>

          {/* Action Feedback Display */}
          {actionFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs border ${
                actionFeedback.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300"
              }`}
            >
              <div className="font-bold">{actionFeedback.msg}</div>
              {actionFeedback.txHash && (
                <div className="font-mono-code text-[10px] mt-1 break-all text-emerald-700 dark:text-emerald-400 font-semibold">
                  Tx: {actionFeedback.txHash}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
