import { APP_CONFIG } from "@/config/app";

type WalletMode = "auto" | "phantom" | "mock";

type PhantomPublicKey = {
  toString(): string;
};

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PhantomPublicKey | null;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PhantomPublicKey }>;
  disconnect(): Promise<void>;
  signMessage?(message: Uint8Array, display?: "utf8" | "hex"): Promise<{
    publicKey: PhantomPublicKey;
    signature: Uint8Array;
  }>;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export interface WalletInfo {
  address: string;
  /** Token balance in token units. */
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
  /** Returns true if this wallet adapter can connect. */
  isAvailable(): boolean;
}

const MOCK_TOTAL_SUPPLY = 1_000_000_000;
const MOCK_ADDRESSES = [
  "8vKp2nF5XqW3rT9mJfH7sZcL4yDgB6aE2uKxN1jR8vQwPmCq",
  "FvP6Yk9X1nT5R8mQ3wL2cHzVgK7sDpJ4xBnE6yU8aWqMaXyZ",
];

const configuredWalletMode = ((import.meta.env.VITE_WALLET_MODE as string | undefined) ?? "auto").toLowerCase();
const WALLET_MODE: WalletMode = ["auto", "phantom", "mock"].includes(configuredWalletMode)
  ? (configuredWalletMode as WalletMode)
  : "auto";

export const mockWalletAdapter: WalletAdapter = {
  isAvailable: () => true,
  async connect() {
    await delay(450);
    const address = MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];
    const balance = deterministicDemoBalance(address);
    return { address, balance, totalSupply: MOCK_TOTAL_SUPPLY };
  },
  async disconnect() {
    await delay(120);
  },
  async getBalance(address: string) {
    await delay(120);
    return deterministicDemoBalance(address);
  },
  async getTotalSupply() {
    return MOCK_TOTAL_SUPPLY;
  },
};

export const phantomWalletAdapter: WalletAdapter = {
  isAvailable: () => typeof window !== "undefined" && !!window.solana?.isPhantom,
  async connect() {
    const provider = getPhantomProvider();
    const { publicKey } = await provider.connect();
    const address = publicKey.toString();
    const totalSupply = await this.getTotalSupply();
    const balance = await this.getBalance(address);

    return { address, balance, totalSupply };
  },
  async disconnect() {
    const provider = getPhantomProvider();
    await provider.disconnect();
  },
  async getBalance(address: string) {
    await delay(120);

    // Demo balance until the Edge Function verifies the real SPL token balance
    // from a server-side Solana RPC call.
    return deterministicDemoBalance(address);
  },
  async getTotalSupply() {
    return MOCK_TOTAL_SUPPLY;
  },
};

export function getWalletAdapter(): WalletAdapter {
  if (WALLET_MODE === "mock") return mockWalletAdapter;
  if (phantomWalletAdapter.isAvailable()) return phantomWalletAdapter;
  if (WALLET_MODE === "phantom") {
    throw new Error("Phantom wallet not found. Install Phantom or set VITE_WALLET_MODE=mock for local demo mode.");
  }

  return mockWalletAdapter;
}

export function computeAllowedPixels(balance: number, totalSupply: number): number {
  if (totalSupply <= 0 || balance <= 0) return 0;
  const pct = balance / totalSupply;
  return Math.floor(pct * APP_CONFIG.canvas.totalPixels);
}

function getPhantomProvider(): PhantomProvider {
  const provider = typeof window !== "undefined" ? window.solana : undefined;
  if (!provider?.isPhantom) {
    throw new Error("Phantom wallet not found. Install Phantom to connect a real wallet.");
  }
  return provider;
}

function deterministicDemoBalance(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  }

  const minPct = 0.003;
  const rangePct = 0.008;
  const normalized = (hash % 10_000) / 10_000;

  return Math.floor(MOCK_TOTAL_SUPPLY * (minPct + normalized * rangePct));
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
