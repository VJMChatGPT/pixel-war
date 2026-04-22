/**
 * Wallet adapter — thin abstraction over the wallet provider.
 *
 * Today: returns a deterministic mock wallet so the app is fully usable
 * without Phantom installed.
 * Tomorrow: swap the implementation of `connect()` / `disconnect()` /
 * `getBalance()` for the real Phantom + on-chain reads. Components and
 * hooks below depend ONLY on this interface — they will not need to change.
 */

import { APP_CONFIG } from "@/config/app";

export interface WalletInfo {
  address: string;
  /** Token balance (raw, in token units). */
  balance: number;
  /** Total token supply used to compute pixel allowance. */
  totalSupply: number;
}

export interface WalletAdapter {
  connect(): Promise<WalletInfo>;
  disconnect(): Promise<void>;
  /** Fresh balance read for an address. */
  getBalance(address: string): Promise<number>;
  /** Returns the current total supply of the project token. */
  getTotalSupply(): Promise<number>;
  /** Returns true if a Phantom-compatible wallet is detected. */
  isAvailable(): boolean;
}

const MOCK_TOTAL_SUPPLY = 1_000_000_000;
const MOCK_ADDRESSES = [
  "8vKp2nF5XqW3rT9mJfH7sZcL4yDgB6aE2uKxN1jR8vQwPmCq",
  "FvP6Yk9X1nT5R8mQ3wL2cHzVgK7sDpJ4xBnE6yU8aWqMaXyZ",
];

/** ----- MOCK ADAPTER (active by default) ----- */
export const mockWalletAdapter: WalletAdapter = {
  isAvailable: () => true,
  async connect() {
    await delay(450);
    const address = MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];
    const balance = Math.floor(MOCK_TOTAL_SUPPLY * (0.003 + Math.random() * 0.008));
    return { address, balance, totalSupply: MOCK_TOTAL_SUPPLY };
  },
  async disconnect() {
    await delay(120);
  },
  async getBalance(_address: string) {
    await delay(120);
    return Math.floor(MOCK_TOTAL_SUPPLY * (0.003 + Math.random() * 0.008));
  },
  async getTotalSupply() {
    return MOCK_TOTAL_SUPPLY;
  },
};

/** ----- PHANTOM ADAPTER (placeholder — wire up later) -----
 *  When ready, implement these against `window.solana` and a Solana RPC
 *  call (e.g. via @solana/web3.js + getTokenAccountBalance for the project's
 *  token mint). Then export this instead of the mock from `getWalletAdapter()`.
 */
export const phantomWalletAdapter: WalletAdapter = {
  isAvailable: () => typeof window !== "undefined" && !!(window as any).solana?.isPhantom,
  async connect() {
    throw new Error("Phantom adapter not yet implemented — see src/services/wallet.ts");
  },
  async disconnect() {},
  async getBalance() { return 0; },
  async getTotalSupply() { return MOCK_TOTAL_SUPPLY; },
};

export function getWalletAdapter(): WalletAdapter {
  // Flip this when the Phantom integration is ready.
  return mockWalletAdapter;
}

/** ----- Pure pixel-allowance math (shared client + future server) ----- */
export function computeAllowedPixels(balance: number, totalSupply: number): number {
  if (totalSupply <= 0 || balance <= 0) return 0;
  const pct = balance / totalSupply; // 0..1
  return Math.floor(pct * APP_CONFIG.canvas.totalPixels);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
