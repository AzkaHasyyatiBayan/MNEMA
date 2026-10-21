import { ethers } from "ethers";

/**
 * Client-Side SHA-256 calculation using Web Crypto API.
 * Ensures zero raw document data leaks to network or blockchain.
 */
export async function calculateSHA256(fileOrText: File | string): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  if (typeof fileOrText === "string") {
    const encoder = new TextEncoder();
    arrayBuffer = encoder.encode(fileOrText).buffer;
  } else {
    arrayBuffer = await fileOrText.arrayBuffer();
  }

  const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hashHex}`;
}

/**
 * Generate cryptographically secure random salt for Commit-Reveal.
 */
export function generateRandomSalt(): string {
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}`;
}

/**
 * Compute commitment hash for Commit-Reveal Scheme:
 * commitment = keccak256(abi.encodePacked(docHash, salt, creatorAddress))
 */
export function computeCommitmentHash(
  docHash: string,
  salt: string,
  creatorAddress: string
): string {
  try {
    return ethers.keccak256(
      ethers.solidityPacked(
        ["bytes32", "bytes32", "address"],
        [docHash, salt, creatorAddress]
      )
    );
  } catch {
    return ethers.id(`${docHash}:${salt}:${creatorAddress}`);
  }
}

/**
 * Generate simulated IPFS CIDv1 for local/offline testing.
 */
export function generateSimulatedCID(docHash: string): string {
  const short = docHash.replace("0x", "").slice(0, 32);
  return `bafybeig${short.toLowerCase()}mnema7`;
}
