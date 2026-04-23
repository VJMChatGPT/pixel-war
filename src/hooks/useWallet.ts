import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { getWalletAdapter, computeAllowedPixels, type WalletInfo } from "@/services/wallet";

const STORAGE_KEY = "pixeldao.wallet";

interface StoredWallet {
  address: string;
  balance: number;
  totalSupply: number;
  sessionToken?: string;
  sessionExpiresAt?: string;
  isMock?: boolean;
}

interface WalletContextValue {
  wallet: WalletInfo | null;
  isConnected: boolean;
  connecting: boolean;
  connect: () => Promise<WalletInfo>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  allowedPixels: number;
  supplyPercent: number;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * WalletProvider — single source of truth for the connected wallet across the app.
 * Persists the connection across reloads via localStorage so the demo feels
 * real. Replace the adapter call with Phantom when ready.
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredWallet) : null;
    } catch {
      return null;
    }
  });
  const [connecting, setConnecting] = useState(false);
  const [restoredSessionChecked, setRestoredSessionChecked] = useState(false);

  useEffect(() => {
    if (wallet) localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    else localStorage.removeItem(STORAGE_KEY);
  }, [wallet]);

  useEffect(() => {
    if (!wallet || wallet.isMock) return;
    if (restoredSessionChecked) return;

    let cancelled = false;
    getWalletAdapter(wallet)
      .connect(wallet)
      .then((nextWallet) => {
        if (!cancelled) {
          setWallet(nextWallet);
          setRestoredSessionChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWallet(null);
          setRestoredSessionChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [restoredSessionChecked, wallet]);

  const connect = async () => {
    setConnecting(true);
    try {
      const info = await getWalletAdapter(wallet).connect(wallet);
      setWallet(info);
      setRestoredSessionChecked(true);
      return info;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    await getWalletAdapter(wallet).disconnect(wallet);
    setWallet(null);
    setRestoredSessionChecked(true);
  };

  const refreshBalance = async () => {
    if (!wallet) return;
    const adapter = getWalletAdapter(wallet);
    const [balance, totalSupply] = await Promise.all([
      adapter.getBalance(wallet),
      adapter.getTotalSupply(wallet),
    ]);
    setWallet((w) => (w ? { ...w, balance, totalSupply } : w));
  };

  const allowedPixels = wallet ? computeAllowedPixels(wallet.balance, wallet.totalSupply) : 0;
  const supplyPercent = wallet ? (wallet.balance / wallet.totalSupply) * 100 : 0;

  const value: WalletContextValue = {
    wallet,
    isConnected: !!wallet,
    connecting,
    connect,
    disconnect,
    refreshBalance,
    allowedPixels,
    supplyPercent,
  };

  return createElement(WalletContext.Provider, { value }, children);
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) {
    throw new Error("useWallet must be used within WalletProvider.");
  }

  return value;
}
