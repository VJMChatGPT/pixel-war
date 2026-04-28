import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchRecentPaints, fetchWalletDisplayNames, type PaintHistoryRow } from "@/services/pixels";

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
      const walletMap = await fetchWalletDisplayNames(rows.map((row) => row.wallet));
      if (mounted) {
        setDisplayNamesByWallet(walletMap);
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
