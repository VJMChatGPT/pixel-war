import { APP_CONFIG } from "@/config/app";
import { supabase } from "@/integrations/supabase/client";

type WalletMode = "auto" | "phantom" | "mock";

export type SupportedWalletId = "phantom" | "solflare" | "backpack";
export type WalletId = SupportedWalletId | "mock";

type SolanaPublicKey = {
  toString(): string;
};

type SolanaProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  publicKey?: SolanaPublicKey | null;
  providers?: SolanaProvider[];
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: SolanaPublicKey }>;
  disconnect(): Promise<void>;
  signMessage?(message: Uint8Array, display?: "utf8" | "hex"): Promise<{
    publicKey: SolanaPublicKey;
    signature: Uint8Array;
  }>;
};

declare global {
  interface Window {
    phantom?: {
      solana?: SolanaProvider;
    };
    solflare?: {
      solana?: SolanaProvider;
    };
    backpack?: {
      solana?: SolanaProvider;
    };
    solana?: SolanaProvider;
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
  walletId?: WalletId;
}

export interface WalletOption {
  id: SupportedWalletId;
  label: string;
  available: boolean;
}

export interface WalletAdapter {
  id: WalletId;
  connect(existing?: WalletInfo | null): Promise<WalletInfo>;
  disconnect(wallet?: WalletInfo | null): Promise<void>;
  getBalance(wallet: WalletInfo): Promise<number>;
  getTotalSupply(wallet: WalletInfo): Promise<number>;
  isAvailable(): boolean;
}

type WalletProviderDescriptor = {
  id: SupportedWalletId;
  label: string;
  detect: () => SolanaProvider | undefined;
};

const MOCK_TOTAL_SUPPLY = 1_000_000_000;
const MOCK_ADDRESSES = [
  "8vKp2nF5XqW3rT9mJfH7sZcL4yDgB6aE2uKxN1jR8vQwPmCq",
  "FvP6Yk9X1nT5R8mQ3wL2cHzVgK7sDpJ4xBnE6yU8aWqMaXyZ",
];

const configuredWalletMode = ((import.meta.env.VITE_WALLET_MODE as string | undefined) ?? "auto").toLowerCase();
const WALLET_MODE: WalletMode = ["auto", "phantom", "mock"].includes(configuredWalletMode)
  ? (configuredWalletMode as WalletMode)
  : "auto";

const WALLET_PROVIDERS: WalletProviderDescriptor[] = [
  {
    id: "phantom",
    label: "Phantom",
    detect: () => {
      if (typeof window === "undefined") return undefined;
      if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
      if (window.solana?.isPhantom) return window.solana;
      return window.solana?.providers?.find((provider) => provider?.isPhantom);
    },
  },
  {
    id: "solflare",
    label: "Solflare",
    detect: () => {
      if (typeof window === "undefined") return undefined;
      if (window.solflare?.solana?.isSolflare) return window.solflare.solana;
      if (window.solana?.isSolflare) return window.solana;
      return window.solana?.providers?.find((provider) => provider?.isSolflare);
    },
  },
  {
    id: "backpack",
    label: "Backpack",
    detect: () => {
      if (typeof window === "undefined") return undefined;
      if (window.backpack?.solana?.isBackpack) return window.backpack.solana;
      if (window.solana?.isBackpack) return window.solana;
      return window.solana?.providers?.find((provider) => provider?.isBackpack);
    },
  },
];

export const mockWalletAdapter: WalletAdapter = {
  id: "mock",
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
      walletId: "mock",
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

function createInjectedWalletAdapter(walletId: SupportedWalletId): WalletAdapter {
  return {
    id: walletId,
    isAvailable: () => !!getProviderDescriptor(walletId)?.detect(),
    async connect(existing) {
      const provider = getSolanaProvider(walletId);
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
          walletId,
        };
      }

      let publicKey: SolanaPublicKey | null | undefined;
      try {
        const connectResult = await provider.connect();
        publicKey = connectResult?.publicKey ?? provider.publicKey;
      } catch (error) {
        publicKey = provider.publicKey;
        if (!publicKey?.toString()) {
          throw normalizeSolanaConnectError(error, walletId);
        }
      }

      if (!publicKey?.toString()) {
        throw new Error("Selected wallet connected without returning a public address.");
      }

      const address = publicKey.toString();
      const challenge = await requestWalletChallenge(address);

      if (!provider.signMessage) {
        throw new Error("Selected wallet does not support message signing.");
      }

      const encodedMessage = new TextEncoder().encode(challenge.message);
      let signed: { publicKey: SolanaPublicKey; signature: Uint8Array };
      try {
        signed = await provider.signMessage(encodedMessage, "utf8");
      } catch (error) {
        throw normalizeWalletError(error, "Selected wallet could not sign the authentication message.");
      }

      const signature = encodeBase64(signed.signature);
      const verified = await verifyWalletChallenge(address, challenge.nonce, signature);

      return {
        address: verified.wallet,
        balance: verified.balance,
        totalSupply: verified.totalSupply,
        sessionToken: verified.sessionToken,
        sessionExpiresAt: verified.sessionExpiresAt,
        walletId,
      };
    },
    async disconnect(wallet) {
      if (wallet?.sessionToken) {
        await revokeWalletSession(wallet.sessionToken).catch(() => undefined);
      }

      const provider = getProviderDescriptor(walletId)?.detect();
      if (provider) {
        await provider.disconnect().catch(() => undefined);
      }
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
}

export const phantomWalletAdapter = createInjectedWalletAdapter("phantom");
export const solflareWalletAdapter = createInjectedWalletAdapter("solflare");
export const backpackWalletAdapter = createInjectedWalletAdapter("backpack");

const walletAdapters: Record<WalletId, WalletAdapter> = {
  phantom: phantomWalletAdapter,
  solflare: solflareWalletAdapter,
  backpack: backpackWalletAdapter,
  mock: mockWalletAdapter,
};

export function getSupportedWallets(): WalletOption[] {
  return WALLET_PROVIDERS.map((provider) => ({
    id: provider.id,
    label: provider.label,
    available: !!provider.detect(),
  }));
}

export function getWalletAdapter(preferredWallet?: WalletInfo | null, requestedWalletId?: WalletId): WalletAdapter {
  if (preferredWallet?.isMock || requestedWalletId === "mock" || WALLET_MODE === "mock") {
    return mockWalletAdapter;
  }

  const desiredWalletId = requestedWalletId ?? preferredWallet?.walletId ?? "phantom";
  const adapter = walletAdapters[desiredWalletId];

  if (!adapter) {
    throw new Error("Selected wallet is not supported.");
  }

  if (adapter.isAvailable()) {
    return adapter;
  }

  if (desiredWalletId === "phantom" && !requestedWalletId && !preferredWallet?.walletId && WALLET_MODE === "auto") {
    if (hasLikelyNonSolanaWalletInstalled()) {
      throw new Error("This app only supports Solana wallets. A non-Solana wallet appears to be installed or active. Please use a Solana-compatible wallet.");
    }

    throw new Error("Selected wallet was not detected.");
  }

  if (hasLikelyNonSolanaWalletInstalled()) {
    throw new Error("This app only supports Solana wallets. A non-Solana wallet appears to be installed or active. Please use a Solana-compatible wallet.");
  }

  throw new Error("Selected wallet was not detected.");
}

export function computeAllowedPixels(balance: number, totalSupply: number): number {
  if (totalSupply <= 0 || balance <= 0) return 0;
  const pct = balance / totalSupply;
  return Math.floor(pct * APP_CONFIG.canvas.totalPixels);
}

export function getWalletConnectionErrorMessage(error: unknown) {
  const normalized = normalizeWalletError(error, "Wallet connection failed before authentication started.");
  const message = normalized.message.trim();

  if (message === "Selected wallet was not detected.") {
    return "Selected wallet was not detected. Install or enable it, then try again.";
  }

  if (isUserRejectedMessage(message)) {
    return "Connection rejected. Unlock your wallet and approve the request to continue.";
  }

  if (isLockedWalletMessage(message)) {
    return "Wallet connection failed before authentication. Unlock your wallet first, then try again.";
  }

  if (message === "Selected wallet does not support message signing.") {
    return "Selected wallet does not support message signing. Please use a Solana wallet that supports signMessage.";
  }

  if (message.includes("Unexpected error")) {
    return hasMultipleSolanaProviders()
      ? "Multiple wallet extensions may be interfering. Try disabling other wallet extensions and use one Solana wallet at a time."
      : "Wallet connection failed before authentication. Make sure you are using a Solana wallet and try again.";
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

function getProviderDescriptor(walletId: SupportedWalletId) {
  return WALLET_PROVIDERS.find((provider) => provider.id === walletId);
}

function getSolanaProvider(walletId: SupportedWalletId): SolanaProvider {
  const descriptor = getProviderDescriptor(walletId);
  const provider = descriptor?.detect();

  if (!provider) {
    if (hasLikelyNonSolanaWalletInstalled()) {
      throw new Error("This app only supports Solana wallets. A non-Solana wallet appears to be installed or active. Please use a Solana-compatible wallet.");
    }

    throw new Error("Selected wallet was not detected.");
  }

  if (typeof provider.connect !== "function") {
    throw new Error("Selected wallet was not detected.");
  }

  return provider;
}

function hasMultipleSolanaProviders() {
  if (typeof window === "undefined") return false;

  const providers = window.solana?.providers;
  if (Array.isArray(providers) && providers.filter(Boolean).length > 1) {
    return true;
  }

  return getSupportedWallets().filter((wallet) => wallet.available).length > 1;
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

function normalizeSolanaConnectError(error: unknown, walletId: SupportedWalletId) {
  const normalized = normalizeWalletError(error, "Wallet connection failed before authentication started.");

  if (normalized.message === "Unexpected error") {
    return new Error(
      hasMultipleSolanaProviders()
        ? `Selected wallet returned "Unexpected error" before wallet-auth could start. Multiple wallet extensions may be interfering.`
        : `${getWalletLabel(walletId)} returned "Unexpected error" before wallet-auth could start.`,
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

function isUserRejectedMessage(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("user rejected") ||
    lower.includes("rejected the request") ||
    lower.includes("cancelled") ||
    lower.includes("canceled") ||
    lower.includes("declined")
  );
}

function getWalletLabel(walletId: SupportedWalletId) {
  return getProviderDescriptor(walletId)?.label ?? walletId;
}
