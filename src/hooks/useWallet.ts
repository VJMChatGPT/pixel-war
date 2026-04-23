import { useEffect, useState } from "react";
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

/**
 * useWallet — single source of truth for the connected wallet across the app.
 * Persists the connection across reloads via localStorage so the demo feels
 * real. Replace the adapter call with Phantom when ready.
 */
export function useWallet() {
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

  return {
    wallet,
    isConnected: !!wallet,
    connecting,
    connect,
    disconnect,
    refreshBalance,
    allowedPixels,
    supplyPercent,
  };
}
