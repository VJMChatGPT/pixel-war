import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchRecentPaints, type PaintHistoryRow } from "@/services/pixels";
import { getCachedWalletDisplayNames, resolveWalletDisplayNames } from "@/lib/wallet-display-cache";

/** useRecentPaints — live activity feed. */
export function useRecentPaints(limit = 20) {
  const [paints, setPaints] = useState<PaintHistoryRow[]>([]);
  const [displayNamesByWallet, setDisplayNamesByWallet] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelNameRef = useRef(`paint-history-stream-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const syncDisplayNames = async (rows: PaintHistoryRow[]) => {
      const wallets = rows.map((row) => row.wallet);
      const cachedWalletMap = getCachedWalletDisplayNames(wallets);

      if (mounted && Object.keys(cachedWalletMap).length > 0) {
        setDisplayNamesByWallet((prev) => ({ ...prev, ...cachedWalletMap }));
      }

      try {
        const resolvedWalletMap = await resolveWalletDisplayNames(wallets);
        if (mounted && Object.keys(resolvedWalletMap).length > 0) {
          setDisplayNamesByWallet((prev) => ({ ...prev, ...resolvedWalletMap }));
        }
      } catch {
        // Fall back to shortened wallet addresses when name lookups fail.
      }
    };

    fetchRecentPaints(limit)
      .then(async (data) => {
        if (!mounted) return;
        setPaints(data);
        await syncDisplayNames(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });

    const channel = supabase
      .channel(channelNameRef.current)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paint_history" },
        (payload) => {
          setPaints((prev) => {
            const nextPaints = [payload.new as PaintHistoryRow, ...prev].slice(0, limit);
            void syncDisplayNames(nextPaints);
            return nextPaints;
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [limit]);

  return { paints, displayNamesByWallet, loading, error };
}
