import { APP_CONFIG } from "@/config/app";
import { supabase } from "@/integrations/supabase/client";

type WalletMode = "auto" | "phantom" | "mock";

type PhantomPublicKey = {
  toString(): string;
};

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PhantomPublicKey | null;
  providers?: PhantomProvider[];
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PhantomPublicKey }>;
  disconnect(): Promise<void>;
  signMessage?(message: Uint8Array, display?: "utf8" | "hex"): Promise<{
    publicKey: PhantomPublicKey;
    signature: Uint8Array;
  }>;
};

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
    solana?: PhantomProvider;
    sui?: unknown;
    suiWallet?: unknown;
    suiWallets?: unknown;
  }
}

export interface WalletInfo {
  address: string;
  balance: number;
  totalSupply: number;
  sessionToken?: string;
  sessionExpiresAt?: string;
  isMock?: boolean;
}

export interface WalletAdapter {
  connect(existing?: WalletInfo | null): Promise<WalletInfo>;
  disconnect(wallet?: WalletInfo | null): Promise<void>;
  getBalance(wallet: WalletInfo): Promise<number>;
  getTotalSupply(wallet: WalletInfo): Promise<number>;
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
  async connect(existing) {
    await delay(200);
    const address = existing?.address ?? MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];
    const balance = deterministicDemoBalance(address);
    return {
      address,
      balance,
      totalSupply: MOCK_TOTAL_SUPPLY,
      sessionToken: "mock-session",
      sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isMock: true,
    };
  },
  async disconnect() {
    await delay(80);
  },
  async getBalance(wallet) {
    await delay(80);
    return deterministicDemoBalance(wallet.address);
  },
  async getTotalSupply() {
    return MOCK_TOTAL_SUPPLY;
  },
};

export const phantomWalletAdapter: WalletAdapter = {
  isAvailable: () => !!getInjectedPhantomProvider(),
  async connect(existing) {
    const provider = getPhantomProvider();
    const restoredSession = existing?.sessionToken
      ? await resumeWalletSession(existing.sessionToken).catch(() => null)
      : null;

    if (restoredSession) {
      return {
        address: restoredSession.address,
        balance: restoredSession.balance,
        totalSupply: restoredSession.totalSupply,
        sessionToken: existing?.sessionToken,
        sessionExpiresAt: restoredSession.sessionExpiresAt,
      };
    }

    let publicKey: PhantomPublicKey | null | undefined;
    try {
      const connectResult = await provider.connect();
      publicKey = connectResult?.publicKey ?? provider.publicKey;
    } catch (error) {
      publicKey = provider.publicKey;
      if (!publicKey?.toString()) {
        throw normalizePhantomConnectError(error);
      }
    }

    if (!publicKey?.toString()) {
      throw new Error("Phantom connected without returning a wallet address.");
    }

    const address = publicKey.toString();
    const challenge = await requestWalletChallenge(address);

    if (!provider.signMessage) {
      throw new Error("Your wallet does not support message signing.");
    }

    const encodedMessage = new TextEncoder().encode(challenge.message);
    let signed: { publicKey: PhantomPublicKey; signature: Uint8Array };
    try {
      signed = await provider.signMessage(encodedMessage, "utf8");
    } catch (error) {
      throw normalizeWalletError(error, "Phantom could not sign the authentication message.");
    }
    const signature = encodeBase64(signed.signature);
    const verified = await verifyWalletChallenge(address, challenge.nonce, signature);

    return {
      address: verified.wallet,
      balance: verified.balance,
      totalSupply: verified.totalSupply,
      sessionToken: verified.sessionToken,
      sessionExpiresAt: verified.sessionExpiresAt,
    };
  },
  async disconnect(wallet) {
    if (wallet?.sessionToken) {
      await revokeWalletSession(wallet.sessionToken).catch(() => undefined);
    }

    const provider = getPhantomProvider();
    await provider.disconnect();
  },
  async getBalance(wallet) {
    if (!wallet.sessionToken) {
      throw new Error("Wallet session missing. Reconnect your wallet.");
    }

    const snapshot = await resumeWalletSession(wallet.sessionToken);
    return snapshot.balance;
  },
  async getTotalSupply(wallet) {
    if (!wallet.sessionToken) {
      throw new Error("Wallet session missing. Reconnect your wallet.");
    }

    const snapshot = await resumeWalletSession(wallet.sessionToken);
    return snapshot.totalSupply;
  },
};

export function getWalletAdapter(preferredWallet?: WalletInfo | null): WalletAdapter {
  if (preferredWallet?.isMock || WALLET_MODE === "mock") return mockWalletAdapter;
  if (phantomWalletAdapter.isAvailable()) return phantomWalletAdapter;
  if (WALLET_MODE === "phantom" || WALLET_MODE === "auto") {
    if (hasLikelyNonSolanaWalletInstalled()) {
      throw new Error("This app only supports Solana wallets. A non-Solana wallet appears to be installed or active. Please use Phantom or another Solana-compatible wallet.");
    }

    throw new Error("Phantom was not detected. Please install or enable Phantom. This app only supports Solana wallets.");
  }

  return mockWalletAdapter;
}

export function computeAllowedPixels(balance: number, totalSupply: number): number {
  if (totalSupply <= 0 || balance <= 0) return 0;
  const pct = balance / totalSupply;
  return Math.floor(pct * APP_CONFIG.canvas.totalPixels);
}

export function getWalletConnectionErrorMessage(error: unknown) {
  const normalized = normalizeWalletError(error, "Wallet connection failed before authentication started.");
  const message = normalized.message.trim();

  if (isMissingPhantomMessage(message)) {
    return hasLikelyNonSolanaWalletInstalled()
      ? "This app only supports Solana wallets. A non-Solana wallet appears to be installed or active. Please use Phantom or another Solana-compatible wallet."
      : "Phantom was not detected. Please install or enable Phantom. This app only supports Solana wallets.";
  }

  if (isUserRejectedMessage(message)) {
    return "Phantom is detected, but the connection was rejected or cancelled. Unlock Phantom and approve the Solana wallet connection request.";
  }

  if (isLockedWalletMessage(message)) {
    return "Phantom is installed but appears to be locked. Unlock Phantom first, then try connecting again.";
  }

  if (message === "Your wallet does not support message signing.") {
    return "This app only supports Solana wallets that can sign messages. Please use Phantom or another Solana-compatible wallet.";
  }

  if (message.includes("Unexpected error")) {
    return hasMultipleSolanaProviders()
      ? "Wallet connection failed before authentication. Multiple wallet extensions may be interfering. Try disabling other wallet extensions and use Phantom with a Solana wallet, not a Sui wallet."
      : "Wallet connection failed before authentication. Make sure you are using a Solana wallet, not a Sui wallet, and try again with Phantom.";
  }

  return message;
}

async function requestWalletChallenge(wallet: string) {
  const { data, error } = await supabase.functions.invoke("wallet-auth", {
    body: {
      action: "challenge",
      wallet,
    },
  });

  if (error) {
    throw await readFunctionError(error);
  }

  return data as {
    nonce: string;
    message: string;
    expiresAt: string;
  };
}

async function verifyWalletChallenge(wallet: string, nonce: string, signature: string) {
  const { data, error } = await supabase.functions.invoke("wallet-auth", {
    body: {
      action: "verify",
      wallet,
      nonce,
      signature,
    },
  });

  if (error) {
    throw await readFunctionError(error);
  }

  return data as {
    address: string;
    wallet: string;
    balance: number;
    totalSupply: number;
    sessionToken: string;
    sessionExpiresAt: string;
  };
}

export async function resumeWalletSession(sessionToken: string) {
  const { data, error } = await supabase.functions.invoke("wallet-auth", {
    body: { action: "refresh" },
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (error) {
    throw await readFunctionError(error);
  }

  const result = data as {
    wallet: string;
    balance: number;
    totalSupply: number;
    sessionExpiresAt: string;
  };

  return {
    address: result.wallet,
    balance: result.balance,
    totalSupply: result.totalSupply,
    sessionExpiresAt: result.sessionExpiresAt,
  };
}

async function revokeWalletSession(sessionToken: string) {
  const { error } = await supabase.functions.invoke("wallet-auth", {
    body: { action: "revoke" },
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (error) {
    throw await readFunctionError(error);
  }
}

function getPhantomProvider(): PhantomProvider {
  const provider = getInjectedPhantomProvider();
  if (!provider?.isPhantom) {
    if (hasLikelyNonSolanaWalletInstalled()) {
      throw new Error("This app only supports Solana wallets. A non-Solana wallet appears to be installed or active. Please use Phantom or another Solana-compatible wallet.");
    }

    throw new Error("Phantom was not detected. Please install or enable Phantom to connect a real wallet.");
  }

  if (typeof provider.connect !== "function") {
    throw new Error("The detected wallet provider does not expose a Solana connection API. Please use Phantom or another Solana-compatible wallet.");
  }

  return provider;
}

function getInjectedPhantomProvider() {
  if (typeof window === "undefined") return undefined;

  if (window.phantom?.solana?.isPhantom) {
    return window.phantom.solana;
  }

  if (window.solana?.isPhantom) {
    return window.solana;
  }

  return window.solana?.providers?.find((provider) => provider?.isPhantom);
}

function hasMultipleSolanaProviders() {
  if (typeof window === "undefined") return false;

  const providers = window.solana?.providers;
  return Array.isArray(providers) && providers.filter(Boolean).length > 1;
}

function hasLikelyNonSolanaWalletInstalled() {
  if (typeof window === "undefined") return false;

  return Boolean(window.suiWallet || window.sui || (Array.isArray(window.suiWallets) && window.suiWallets.length > 0));
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

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function readFunctionError(error: Error) {
  const context = (error as { context?: Response }).context;

  if (context) {
    try {
      const payload = await context.clone().json();
      if (payload && typeof payload === "object" && "message" in payload) {
        return new Error(String((payload as { message?: string }).message ?? error.message));
      }
    } catch {
      // Fall back to the original SDK error below.
    }
  }

  return error;
}

function normalizeWalletError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error;
  }

  if (typeof error === "string" && error.trim()) {
    return new Error(error);
  }

  if (error && typeof error === "object") {
    const message =
      readMessageField(error, "message") ??
      readMessageField(error, "error") ??
      readMessageField(error, "reason") ??
      readMessageField(error, "details");

    if (message) {
      return new Error(message);
    }

    try {
      return new Error(JSON.stringify(error));
    } catch {
      // Fall through to the fallback below.
    }
  }

  return new Error(fallbackMessage);
}

function normalizePhantomConnectError(error: unknown) {
  const normalized = normalizeWalletError(error, "Phantom connection failed before authentication started.");

  if (normalized.message === "Unexpected error") {
    return new Error(
      'Phantom returned "Unexpected error" before PixelDAO could start wallet-auth. This is coming from the Phantom provider, not Supabase. Make sure you are using a Solana wallet, not a Sui wallet, and try unlocking Phantom, refreshing the page, or temporarily disabling other wallet extensions.',
    );
  }

  return normalized;
}

function readMessageField(value: object, key: "message" | "error" | "reason" | "details") {
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" && field.trim() ? field : null;
}

function isLockedWalletMessage(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("locked") || lower.includes("unlock");
}

function isMissingPhantomMessage(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("phantom wallet not found") || lower.includes("phantom was not detected");
}

function isUserRejectedMessage(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("user rejected") ||
    lower.includes("rejected the request") ||
    lower.includes("cancelled") ||
    lower.includes("canceled")
  );
}
