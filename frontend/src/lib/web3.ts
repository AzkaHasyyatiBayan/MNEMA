import { ethers } from "ethers";
import contractDetails from "./contractDetails.json";

export interface MemoryRecord {
  recordId: number;
  docHash: string;
  creator: string;
  timestamp: number;
  blockNumber: number;
  status: "Active" | "Superseded" | "Deprecated" | "Revoked";
  ipfsCID: string;
  title: string;
  metadataURI: string;
}

export interface CommitmentEntry {
  commitmentHash: string;
  creator: string;
  commitTimestamp: number;
  isRevealed: boolean;
}

export interface AccessGrantEntry {
  recordId: number;
  user: string;
  granter: string;
  expiryTimestamp: number;
}

export interface LedgerEvent {
  id: string;
  name: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  details: string;
}

export const PRESET_ACCOUNTS = [
  {
    role: "Super Admin",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    label: "Regulator / Admin (Full Privileges)",
  },
  {
    role: "Auditor",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    label: "Lead Evidence Auditor (Can Commit & Create)",
  },
  {
    role: "Verifier",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    label: "Third-Party Inspector (Public Verification)",
  },
  {
    role: "Client",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    label: "External Recipient (Time-Locked Access)",
  },
  {
    role: "Unauthorized",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    label: "Untrusted Guest Account",
  },
];

// Initial Genesis Records corresponding to Deployment_Record.md
export const INITIAL_GENESIS_RECORDS: MemoryRecord[] = [
  {
    recordId: 1,
    docHash: "0x892a065c71be399fdb60d4b1a5bc3b9487fa83be313c41cf3ce3f46f554ea388",
    creator: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    timestamp: 1729432800,
    blockNumber: 1,
    status: "Active",
    ipfsCID: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    title: "Laporan Audit Forensik Smart Contract & Data Privacy 2026",
    metadataURI: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/metadata.json",
  },
  {
    recordId: 2,
    docHash: "0xd7643b95764d99f7d235cfa3f2c52fb58f79110091217743b174241d6b051268",
    creator: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    timestamp: 1729436400,
    blockNumber: 2,
    status: "Active",
    ipfsCID: "bafybeihdwdcefgh4dqkjv67eycm2t6bfikxvf72mb5acaxsqvir5v5t7lu",
    title: "Verifikasi Bukti Kepatuhan GDPR & Regulasi UU PDP",
    metadataURI: "ipfs://bafybeihdwdcefgh4dqkjv67eycm2t6bfikxvf72mb5acaxsqvir5v5t7lu/compliance.json",
  },
];

export const INITIAL_EVENTS: LedgerEvent[] = [
  {
    id: "tx-init-1",
    name: "MemoryRecordCreated",
    txHash: "0x77cdf17343a090e78c02e09697077292dfe2c013ecf3b66c9bee23d06c5da673",
    blockNumber: 1,
    timestamp: "10:15:00",
    details: "Record #1 registered: Laporan Audit Forensik",
  },
  {
    id: "tx-init-2",
    name: "MemoryRecordCreated",
    txHash: "0x438f4dac2858a95162317a614aaea49f46f57e97f45a66b5a9d964587c9ffaef",
    blockNumber: 2,
    timestamp: "10:45:00",
    details: "Record #2 registered: Verifikasi Kepatuhan GDPR",
  },
];

export function getContractConfig() {
  return {
    address: contractDetails.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    abi: contractDetails.abi,
    chainId: contractDetails.chainId || 31337,
  };
}
