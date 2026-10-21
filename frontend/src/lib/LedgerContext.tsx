"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  MemoryRecord,
  CommitmentEntry,
  AccessGrantEntry,
  LedgerEvent,
  PRESET_ACCOUNTS,
  INITIAL_GENESIS_RECORDS,
  INITIAL_EVENTS,
  getContractConfig,
} from "./web3";
import { computeCommitmentHash, generateSimulatedCID } from "./crypto";

import { SampleTemplate, SAMPLE_TEMPLATES } from "./sampleTemplates";

interface LedgerContextType {
  mode: "simulator" | "metamask";
  setMode: (mode: "simulator" | "metamask") => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  activeTemplate: SampleTemplate | null;
  selectTemplate: (template: SampleTemplate | null) => void;
  currentAccount: (typeof PRESET_ACCOUNTS)[0];
  switchAccount: (address: string) => void;
  records: MemoryRecord[];
  commitments: CommitmentEntry[];
  accessGrants: AccessGrantEntry[];
  events: LedgerEvent[];
  isPaused: boolean;
  blockNumber: number;
  contractAddress: string;
  metaMaskAddress: string | null;
  metaMaskNetwork: string | null;
  metaMaskError: string | null;
  connectMetaMask: () => Promise<void>;
  createRecord: (
    docHash: string,
    title: string,
    ipfsCID?: string,
    metadataURI?: string
  ) => Promise<{ success: boolean; recordId?: number; error?: string; txHash?: string }>;
  commitMemory: (
    commitment: string
  ) => Promise<{ success: boolean; error?: string; txHash?: string }>;
  revealMemory: (
    docHash: string,
    salt: string,
    title: string,
    ipfsCID?: string,
    metadataURI?: string
  ) => Promise<{ success: boolean; recordId?: number; error?: string; txHash?: string }>;
  verifyRecord: (
    docHash: string
  ) => Promise<{ isValid: boolean; record?: MemoryRecord; error?: string }>;
  grantAccess: (
    user: string,
    recordId: number,
    durationSeconds: number
  ) => Promise<{ success: boolean; error?: string }>;
  revokeAccess: (
    user: string,
    recordId: number
  ) => Promise<{ success: boolean; error?: string }>;
  checkAccess: (
    user: string,
    recordId: number
  ) => { hasAccess: boolean; expiryTimestamp: number };
  updateRecordStatus: (
    recordId: number,
    newStatus: MemoryRecord["status"],
    reason: string
  ) => Promise<{ success: boolean; error?: string }>;
  togglePause: () => Promise<{ success: boolean; error?: string }>;
  deleteRecords: (recordIds: number[]) => Promise<{ success: boolean; error?: string; count?: number }>;
  batchUpdateRecordStatus: (
    recordIds: number[],
    newStatus: MemoryRecord["status"],
    reason: string
  ) => Promise<{ success: boolean; error?: string }>;
  clearAuditEvents: () => Promise<{ success: boolean; error?: string }>;
  resetLedgerToGenesis: () => Promise<{ success: boolean; error?: string }>;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"simulator" | "metamask">("simulator");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTemplate, setActiveTemplate] = useState<SampleTemplate | null>(null);
  const [currentAccount, setCurrentAccount] = useState(PRESET_ACCOUNTS[1]); // Default to Auditor
  const [records, setRecords] = useState<MemoryRecord[]>(INITIAL_GENESIS_RECORDS);
  const [commitments, setCommitments] = useState<CommitmentEntry[]>([]);
  const [accessGrants, setAccessGrants] = useState<AccessGrantEntry[]>([]);
  const [events, setEvents] = useState<LedgerEvent[]>(INITIAL_EVENTS);
  const [isPaused, setIsPaused] = useState(false);
  const [blockNumber, setBlockNumber] = useState(3);
  const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null);
  const [metaMaskNetwork, setMetaMaskNetwork] = useState<string | null>(null);
  const [metaMaskError, setMetaMaskError] = useState<string | null>(null);

  // Initialize theme from localStorage if available
  useEffect(() => {
    const savedTheme = localStorage.getItem("mnema_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("mnema_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const selectTemplate = (template: SampleTemplate | null) => {
    setActiveTemplate(template);
  };

  const contractConfig = getContractConfig();

  // Helper to add events
  const pushEvent = (name: string, txHash: string, details: string) => {
    const newEvent: LedgerEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      txHash,
      blockNumber: blockNumber + 1,
      timestamp: new Date().toLocaleTimeString(),
      details,
    };
    setEvents((prev) => [newEvent, ...prev]);
    setBlockNumber((b) => b + 1);
  };

  // Switch persona in simulator mode
  const switchAccount = (addr: string) => {
    const acc = PRESET_ACCOUNTS.find((a) => a.address.toLowerCase() === addr.toLowerCase());
    if (acc) {
      setCurrentAccount(acc);
    }
  };

  // Connect MetaMask
  const connectMetaMask = async () => {
    setMetaMaskError(null);
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setMetaMaskError("MetaMask tidak terdeteksi di browser. Silakan beralih ke Mode Simulator.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      if (accounts.length > 0) {
        setMetaMaskAddress(accounts[0]);
        setMetaMaskNetwork(`${network.name} (ChainId: ${network.chainId})`);
        setMode("metamask");
      }
    } catch (err: any) {
      setMetaMaskError(err.message || "Gagal menghubungkan MetaMask.");
    }
  };

  // Create Record
  const createRecord = async (
    docHash: string,
    title: string,
    ipfsCID?: string,
    metadataURI?: string
  ) => {
    if (isPaused) {
      return { success: false, error: "Transaksi ditolak: Kontrak dalam status PAUSED (Circuit Breaker)." };
    }

    const activeAddress = mode === "metamask" ? (metaMaskAddress || currentAccount.address) : currentAccount.address;

    // Check Role in simulator
    if (mode === "simulator") {
      if (currentAccount.role === "Unauthorized" || currentAccount.role === "Client") {
        return {
          success: false,
          error: `Akses Ditolak: Akun ${currentAccount.address.slice(0, 8)}... tidak memiliki AUDITOR_ROLE (Error: AccessControlUnauthorizedAccount).`,
        };
      }
    }

    if (!docHash || docHash === ethers.ZeroHash) {
      return { success: false, error: "Validasi Gagal: Document hash tidak boleh bernilai nol (Mnema__ZeroHashNotAllowed)." };
    }

    if (records.some((r) => r.docHash.toLowerCase() === docHash.toLowerCase())) {
      return { success: false, error: "Duplikasi Ditolak: Hash dokumen ini sudah terdaftar sebelumnya (Mnema__RecordAlreadyExists)." };
    }

    const newId = records.length + 1;
    const cid = ipfsCID || generateSimulatedCID(docHash);
    const txHash = ethers.hexlify(ethers.randomBytes(32));

    const newRecord: MemoryRecord = {
      recordId: newId,
      docHash,
      creator: activeAddress,
      timestamp: Math.floor(Date.now() / 1000),
      blockNumber: blockNumber + 1,
      status: "Active",
      ipfsCID: cid,
      title: title || `Bukti Forensik #${newId}`,
      metadataURI: metadataURI || `ipfs://${cid}/metadata.json`,
    };

    setRecords((prev) => [newRecord, ...prev]);
    pushEvent("MemoryRecordCreated", txHash, `Record #${newId} dibuat: "${newRecord.title}"`);

    return { success: true, recordId: newId, txHash };
  };

  // Commit Memory
  const commitMemory = async (commitment: string) => {
    if (isPaused) {
      return { success: false, error: "Sistem PAUSED oleh Circuit Breaker." };
    }
    if (!commitment || commitment === ethers.ZeroHash) {
      return { success: false, error: "Commitment hash tidak valid (Mnema__ZeroHashNotAllowed)." };
    }

    const activeAddress = mode === "metamask" ? (metaMaskAddress || currentAccount.address) : currentAccount.address;
    const txHash = ethers.hexlify(ethers.randomBytes(32));

    const newComm: CommitmentEntry = {
      commitmentHash: commitment,
      creator: activeAddress,
      commitTimestamp: Math.floor(Date.now() / 1000),
      isRevealed: false,
    };

    setCommitments((prev) => [newComm, ...prev.filter((c) => c.commitmentHash !== commitment)]);
    pushEvent("MemoryCommitted", txHash, `Commitment terdaftar: ${commitment.slice(0, 10)}... oleh ${activeAddress.slice(0, 8)}`);

    return { success: true, txHash };
  };

  // Reveal Memory
  const revealMemory = async (
    docHash: string,
    salt: string,
    title: string,
    ipfsCID?: string,
    metadataURI?: string
  ) => {
    if (isPaused) {
      return { success: false, error: "Sistem PAUSED oleh Circuit Breaker." };
    }

    const activeAddress = mode === "metamask" ? (metaMaskAddress || currentAccount.address) : currentAccount.address;

    // Verify creator has Auditor role
    if (mode === "simulator" && (currentAccount.role === "Unauthorized" || currentAccount.role === "Client")) {
      return {
        success: false,
        error: "Akses Ditolak: Akun Anda tidak memiliki AUDITOR_ROLE untuk melakukan reveal.",
      };
    }

    const computedCommitment = computeCommitmentHash(docHash, salt, activeAddress);
    const existing = commitments.find((c) => c.commitmentHash === computedCommitment);

    if (!existing) {
      return {
        success: false,
        error: "Komitmen Tidak Ditemukan: Hash salt atau data dokumen tidak cocok dengan data commit (Mnema__CommitmentNotFound).",
      };
    }

    if (existing.isRevealed) {
      return {
        success: false,
        error: "Replay Attack Dicegah: Komitmen ini sudah pernah di-reveal sebelumnya (Mnema__CommitmentAlreadyRevealed).",
      };
    }

    // Time Check
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - existing.commitTimestamp;
    const minDelay = 15; // 15 detik

    if (elapsed < minDelay) {
      return {
        success: false,
        error: `Reveal Terlalu Dini: Anda harus menunggu jeda anti front-running minimal 15 detik (Sisa waktu: ${minDelay - elapsed} detik) (Mnema__CommitmentTooEarly).`,
      };
    }

    if (elapsed > 86400) {
      return {
        success: false,
        error: "Komitmen Kedaluwarsa: Melebihi batas jendela waktu reveal 24 jam (Mnema__CommitmentExpired).",
      };
    }

    // Mark as revealed
    existing.isRevealed = true;
    setCommitments([...commitments]);

    // Create record
    const result = await createRecord(docHash, title, ipfsCID, metadataURI);
    if (result.success && result.recordId) {
      const txHash = ethers.hexlify(ethers.randomBytes(32));
      pushEvent("MemoryRevealed", txHash, `Commitment revealed untuk Record #${result.recordId}`);
    }

    return result;
  };

  // Verify Record
  const verifyRecord = async (docHash: string) => {
    const cleanHash = docHash.trim().toLowerCase();
    const found = records.find((r) => r.docHash.toLowerCase() === cleanHash);

    const txHash = ethers.hexlify(ethers.randomBytes(32));
    if (found) {
      const isValid = found.status === "Active";
      pushEvent("RecordVerified", txHash, `Verifikasi Hash: Record #${found.recordId} -> Status: ${found.status}`);
      return { isValid, record: found };
    } else {
      pushEvent("RecordVerified", txHash, `Verifikasi Gagal: Hash ${cleanHash.slice(0, 10)}... Tidak Ditemukan`);
      return { isValid: false, error: "Hash dokumen tidak terdaftar dalam ledger MNEMA." };
    }
  };

  // Grant Access
  const grantAccess = async (user: string, recordId: number, durationSeconds: number) => {
    if (isPaused) return { success: false, error: "Kontrak dalam status PAUSED." };
    const record = records.find((r) => r.recordId === recordId);
    if (!record) return { success: false, error: "Record ID tidak ditemukan." };

    const activeAddress = mode === "metamask" ? (metaMaskAddress || currentAccount.address) : currentAccount.address;

    // Only Creator or Admin can grant access
    if (
      mode === "simulator" &&
      activeAddress.toLowerCase() !== record.creator.toLowerCase() &&
      currentAccount.role !== "Super Admin"
    ) {
      return {
        success: false,
        error: "Otorisasi Ditolak: Hanya pembuat record atau Super Admin yang dapat memberikan izin akses (Mnema__NotRecordCreatorOrAdmin).",
      };
    }

    const expiryTimestamp = Math.floor(Date.now() / 1000) + durationSeconds;
    const newGrant: AccessGrantEntry = {
      recordId,
      user,
      granter: activeAddress,
      expiryTimestamp,
    };

    setAccessGrants((prev) => [
      newGrant,
      ...prev.filter((g) => !(g.recordId === recordId && g.user.toLowerCase() === user.toLowerCase())),
    ]);

    const txHash = ethers.hexlify(ethers.randomBytes(32));
    pushEvent(
      "AccessGranted",
      txHash,
      `Akses Record #${recordId} didelegasikan ke ${user.slice(0, 8)}... selama ${durationSeconds}s`
    );

    return { success: true };
  };

  // Revoke Access
  const revokeAccess = async (user: string, recordId: number) => {
    if (isPaused) return { success: false, error: "Kontrak dalam status PAUSED." };
    setAccessGrants((prev) =>
      prev.filter((g) => !(g.recordId === recordId && g.user.toLowerCase() === user.toLowerCase()))
    );

    const txHash = ethers.hexlify(ethers.randomBytes(32));
    pushEvent("AccessRevoked", txHash, `Izin akses Record #${recordId} dicabut untuk ${user.slice(0, 8)}...`);
    return { success: true };
  };

  // Check Access
  const checkAccess = (user: string, recordId: number) => {
    const record = records.find((r) => r.recordId === recordId);
    if (!record) return { hasAccess: false, expiryTimestamp: 0 };

    // Creator and Admin always have inherent access
    if (
      user.toLowerCase() === record.creator.toLowerCase() ||
      PRESET_ACCOUNTS[0].address.toLowerCase() === user.toLowerCase()
    ) {
      return { hasAccess: true, expiryTimestamp: Infinity };
    }

    const grant = accessGrants.find(
      (g) => g.recordId === recordId && g.user.toLowerCase() === user.toLowerCase()
    );

    if (!grant) return { hasAccess: false, expiryTimestamp: 0 };

    const now = Math.floor(Date.now() / 1000);
    const hasAccess = now <= grant.expiryTimestamp;
    return { hasAccess, expiryTimestamp: grant.expiryTimestamp };
  };

  // Update Record Status
  const updateRecordStatus = async (
    recordId: number,
    newStatus: MemoryRecord["status"],
    reason: string
  ) => {
    if (isPaused) return { success: false, error: "Kontrak dalam status PAUSED." };
    const record = records.find((r) => r.recordId === recordId);
    if (!record) return { success: false, error: "Record tidak ditemukan." };

    const activeAddress = mode === "metamask" ? (metaMaskAddress || currentAccount.address) : currentAccount.address;

    if (
      mode === "simulator" &&
      activeAddress.toLowerCase() !== record.creator.toLowerCase() &&
      currentAccount.role !== "Super Admin"
    ) {
      return {
        success: false,
        error: "Otorisasi Ditolak: Hanya pembuat record atau Super Admin yang dapat mengubah status (Mnema__NotRecordCreatorOrAdmin).",
      };
    }

    record.status = newStatus;
    setRecords([...records]);

    const txHash = ethers.hexlify(ethers.randomBytes(32));
    pushEvent(
      "RecordStatusUpdated",
      txHash,
      `Status Record #${recordId} diubah menjadi ${newStatus}: "${reason}"`
    );

    return { success: true };
  };

  // Toggle Circuit Breaker
  const togglePause = async () => {
    if (mode === "simulator" && currentAccount.role !== "Super Admin") {
      return { success: false, error: "Akses Ditolak: Hanya Super Admin yang dapat mengaktifkan Circuit Breaker." };
    }
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    const txHash = ethers.hexlify(ethers.randomBytes(32));
    pushEvent(nextPaused ? "Paused" : "Unpaused", txHash, `Circuit Breaker: Kontrak ${nextPaused ? "DIHENTIKAN" : "DILANJUTKAN"}`);
    return { success: true };
  };

  // Delete Records (Admin Maintenance / Purge)
  const deleteRecords = async (recordIds: number[]) => {
    if (mode === "simulator" && currentAccount.role !== "Super Admin") {
      return { success: false, error: "Akses Ditolak: Hanya Super Admin yang memiliki wewenang pemeliharaan / pemangkasan ledger." };
    }
    if (recordIds.length === 0) return { success: false, error: "Tidak ada record yang dipilih." };

    setRecords((prev) => prev.filter((r) => !recordIds.includes(r.recordId)));
    const txHash = ethers.hexlify(ethers.randomBytes(32));
    pushEvent(
      "AuditRecordsPurged",
      txHash,
      `Super Admin memangkas ${recordIds.length} bukti dari ledger (ID: #${recordIds.join(", #")})`
    );
    return { success: true, count: recordIds.length };
  };

  // Batch Update Record Status
  const batchUpdateRecordStatus = async (
    recordIds: number[],
    newStatus: MemoryRecord["status"],
    reason: string
  ) => {
    if (isPaused) return { success: false, error: "Kontrak dalam status PAUSED." };
    if (recordIds.length === 0) return { success: false, error: "Tidak ada record yang dipilih." };

    if (mode === "simulator" && currentAccount.role !== "Super Admin" && currentAccount.role !== "Auditor") {
      return {
        success: false,
        error: "Akses Ditolak: Hanya Auditor atau Super Admin yang dapat melakukan perubahan status massal.",
      };
    }

    setRecords((prev) =>
      prev.map((r) => {
        if (recordIds.includes(r.recordId)) {
          return { ...r, status: newStatus };
        }
        return r;
      })
    );

    const txHash = ethers.hexlify(ethers.randomBytes(32));
    pushEvent(
      "BatchStatusUpdated",
      txHash,
      `Status massal ${recordIds.length} bukti diubah menjadi ${newStatus}: "${reason}"`
    );
    return { success: true };
  };

  // Clear Audit Events
  const clearAuditEvents = async () => {
    if (mode === "simulator" && currentAccount.role !== "Super Admin") {
      return { success: false, error: "Akses Ditolak: Hanya Super Admin yang dapat membersihkan riwayat event audit." };
    }
    setEvents([]);
    return { success: true };
  };

  // Reset to Genesis State
  const resetLedgerToGenesis = async () => {
    if (mode === "simulator" && currentAccount.role !== "Super Admin") {
      return { success: false, error: "Akses Ditolak: Hanya Super Admin yang dapat me-reset ledger ke Genesis State." };
    }
    setRecords(INITIAL_GENESIS_RECORDS);
    setEvents(INITIAL_EVENTS);
    setCommitments([]);
    setAccessGrants([]);
    setBlockNumber(3);
    return { success: true };
  };

  return (
    <LedgerContext.Provider
      value={{
        mode,
        setMode,
        theme,
        toggleTheme,
        activeTemplate,
        selectTemplate,
        currentAccount,
        switchAccount,
        records,
        commitments,
        accessGrants,
        events,
        isPaused,
        blockNumber,
        contractAddress: contractConfig.address,
        metaMaskAddress,
        metaMaskNetwork,
        metaMaskError,
        connectMetaMask,
        createRecord,
        commitMemory,
        revealMemory,
        verifyRecord,
        grantAccess,
        revokeAccess,
        checkAccess,
        updateRecordStatus,
        deleteRecords,
        batchUpdateRecordStatus,
        clearAuditEvents,
        resetLedgerToGenesis,
        togglePause,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error("useLedger must be used within a LedgerProvider");
  }
  return context;
}
