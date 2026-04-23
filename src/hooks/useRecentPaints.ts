import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchRecentPaints, type PaintHistoryRow } from "@/services/pixels";

/** useRecentPaints — live activity feed. */
export function useRecentPaints(limit = 20) {
  const [paints, setPaints] = useState<PaintHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchRecentPaints(limit).then((data) => {
      if (!mounted) return;
      setPaints(data);
      setLoading(false);
    });

    const channel = supabase
      .channel("paint-history-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paint_history" },
        (payload) => {
          setPaints((prev) => [payload.new as PaintHistoryRow, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { paints, loading };
}
