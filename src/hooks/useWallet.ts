import { useEffect, useState } from "react";
import { getWalletAdapter, computeAllowedPixels, type WalletInfo } from "@/services/wallet";

const STORAGE_KEY = "pixeldao.wallet";

interface StoredWallet {
  address: string;
  balance: number;
  totalSupply: number;
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

  useEffect(() => {
    if (wallet) localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    else localStorage.removeItem(STORAGE_KEY);
  }, [wallet]);

  const connect = async () => {
    setConnecting(true);
    try {
      const info = await getWalletAdapter().connect();
      setWallet(info);
      return info;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    await getWalletAdapter().disconnect();
    setWallet(null);
  };

  const refreshBalance = async () => {
    if (!wallet) return;
    const balance = await getWalletAdapter().getBalance(wallet.address);
    setWallet((w) => (w ? { ...w, balance } : w));
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
