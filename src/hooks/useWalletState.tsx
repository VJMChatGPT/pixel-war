/* eslint-disable react-refresh/only-export-components */
import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { fetchWalletState, type PublicWalletStateRow } from "@/services/pixels";
import { estimatePointsPerSecond } from "@/lib/format";
import { useWallet } from "@/hooks/useWallet";

interface WalletStateContextValue {
  walletState: PublicWalletStateRow | null;
  walletStateLoading: boolean;
  walletStateError: string | null;
  refreshWalletState: () => Promise<PublicWalletStateRow | null>;
  invalidateWalletState: () => Promise<PublicWalletStateRow | null>;
  setWalletStateData: (nextState: PublicWalletStateRow | null) => void;
  pointsSnapshotAtMs: number;
  pointsNowMs: number;
}

const WalletStateContext = createContext<WalletStateContextValue | null>(null);

export function WalletStateProvider({ children }: { children: ReactNode }) {
  const { wallet } = useWallet();
  const [walletState, setWalletState] = useState<PublicWalletStateRow | null>(null);
  const [walletStateLoading, setWalletStateLoading] = useState(false);
  const [walletStateError, setWalletStateError] = useState<string | null>(null);
  const [pointsSnapshotAtMs, setPointsSnapshotAtMs] = useState(() => Date.now());
  const [pointsNowMs, setPointsNowMs] = useState(() => Date.now());
  const requestIdRef = useRef(0);

  const setWalletStateData = useCallback((nextState: PublicWalletStateRow | null) => {
    setWalletState(nextState);
    setWalletStateError(null);
    setPointsSnapshotAtMs(Date.now());
  }, []);

  const refreshWalletState = useCallback(async () => {
    const walletAddress = wallet?.address;
    const requestId = ++requestIdRef.current;

    if (!walletAddress) {
      setWalletStateLoading(false);
      setWalletStateError(null);
      setWalletStateData(null);
      return null;
    }

    setWalletStateLoading(true);
    setWalletStateError(null);

    try {
      const nextState = await fetchWalletState(walletAddress);
      if (requestIdRef.current !== requestId) {
        return nextState;
      }

      setWalletStateData(nextState);
      return nextState;
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setWalletStateError(error instanceof Error ? error.message : "Could not load wallet state.");
      }
      return null;
    } finally {
      if (requestIdRef.current === requestId) {
        setWalletStateLoading(false);
      }
    }
  }, [setWalletStateData, wallet?.address]);

  const invalidateWalletState = useCallback(async () => refreshWalletState(), [refreshWalletState]);

  useEffect(() => {
    if (!wallet?.address) {
      requestIdRef.current += 1;
      setWalletStateLoading(false);
      setWalletStateError(null);
      setWalletStateData(null);
      return;
    }

    void refreshWalletState();
  }, [refreshWalletState, setWalletStateData, wallet?.address, wallet?.balance, wallet?.totalSupply]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPointsNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const value: WalletStateContextValue = {
    walletState,
    walletStateLoading,
    walletStateError,
    refreshWalletState,
    invalidateWalletState,
    setWalletStateData,
    pointsSnapshotAtMs,
    pointsNowMs,
  };

  return createElement(WalletStateContext.Provider, { value }, children);
}

export function useWalletState() {
  const value = useContext(WalletStateContext);
  if (!value) {
    throw new Error("useWalletState must be used within WalletStateProvider.");
  }

  return value;
}

export function useAnimatedWalletPoints(fallbackPixelsUsed = 0) {
  const { walletState, pointsSnapshotAtMs, pointsNowMs } = useWalletState();
  const pixelsUsed = Math.max(Number(walletState?.pixels_used ?? 0), Math.max(0, fallbackPixelsUsed));
  const pointsPerSecond =
    walletState?.points_per_second && walletState.points_per_second > 0
      ? walletState.points_per_second
      : estimatePointsPerSecond(pixelsUsed);
  const animatedPointsTotal =
    Number(walletState?.total_points ?? 0) + Math.max(0, (pointsNowMs - pointsSnapshotAtMs) / 1000) * pointsPerSecond;

  return {
    animatedPointsTotal,
    pointsPerSecond,
  };
}
