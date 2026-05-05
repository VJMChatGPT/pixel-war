import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/config/app";
import { fetchWalletPaintsInWindow, type PaintHistoryRow } from "@/services/pixels";

function getWindowStartIso(nowMs: number) {
  return new Date(nowMs - APP_CONFIG.rules.cooldownMs).toISOString();
}

function normalizeActivePaints(rows: Array<PaintHistoryRow | { painted_at: string }>, nowMs: number) {
  return [...new Set(rows.map((row) => row.painted_at))]
    .filter(Boolean)
    .filter((paintedAt) => nowMs - new Date(paintedAt).getTime() < APP_CONFIG.rules.cooldownMs)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

function getCooldownAnchorIndex(activePaintsCount: number, territoryCap: number) {
  if (activePaintsCount <= 0 || territoryCap <= 0) return -1;
  if (activePaintsCount < territoryCap) return 0;
  return Math.max(activePaintsCount - territoryCap, 0);
}

export function usePaintAvailability(walletAddress: string | null | undefined, territoryCap: number) {
  const [paintedAtEntries, setPaintedAtEntries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const channelNameRef = useRef(`paint-availability-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setPaintedAtEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    fetchWalletPaintsInWindow(walletAddress, getWindowStartIso(Date.now()))
      .then((rows) => {
        if (!mounted) return;
        setPaintedAtEntries(rows.map((row) => row.painted_at));
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const channel = supabase
      .channel(channelNameRef.current)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paint_history", filter: `wallet=eq.${walletAddress}` },
        (payload) => {
          const nextRow = payload.new as PaintHistoryRow;
          setPaintedAtEntries((prev) => [...prev, nextRow.painted_at]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [walletAddress]);

  const activePaints = useMemo(
    () => normalizeActivePaints(paintedAtEntries.map((painted_at) => ({ painted_at })), nowMs),
    [nowMs, paintedAtEntries],
  );

  const paintsSpent = activePaints.length;
  const paintsLeft = Math.max(territoryCap - paintsSpent, 0);
  const cooldownAnchorIndex = getCooldownAnchorIndex(activePaints.length, territoryCap);
  const nextPaintReadyAtMs = cooldownAnchorIndex >= 0
    ? new Date(activePaints[cooldownAnchorIndex]).getTime() + APP_CONFIG.rules.cooldownMs
    : null;
  const nextPaintReadyInMs = nextPaintReadyAtMs ? Math.max(0, nextPaintReadyAtMs - nowMs) : 0;
  const followingPaintReadyAtMs =
    cooldownAnchorIndex >= 0 && cooldownAnchorIndex + 1 < activePaints.length
      ? new Date(activePaints[cooldownAnchorIndex + 1]).getTime() + APP_CONFIG.rules.cooldownMs
      : null;
  const followingPaintReadyInMs = followingPaintReadyAtMs ? Math.max(0, followingPaintReadyAtMs - nowMs) : 0;

  const registerSuccessfulPaint = (paintedAt: string) => {
    setPaintedAtEntries((prev) => [...prev, paintedAt]);
  };

  return {
    loading,
    error,
    paintsSpent,
    paintsLeft,
    nextPaintReadyAtMs,
    nextPaintReadyInMs,
    followingPaintReadyAtMs,
    followingPaintReadyInMs,
    registerSuccessfulPaint,
  };
}
