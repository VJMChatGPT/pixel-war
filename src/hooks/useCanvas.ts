import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllPixels, type PixelRow } from "@/services/pixels";
import { APP_CONFIG } from "@/config/app";

/**
 * useCanvas — loads all 10k pixels and stays in sync via realtime.
 * Returns a flat array indexed by `y * 100 + x` for O(1) lookups in the grid.
 */
export function useCanvas() {
  const [pixels, setPixels] = useState<(PixelRow | null)[]>(() =>
    new Array(APP_CONFIG.canvas.totalPixels).fill(null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchAllPixels()
      .then((rows) => {
        if (!mounted) return;
        const arr: (PixelRow | null)[] = new Array(APP_CONFIG.canvas.totalPixels).fill(null);
        for (const p of rows) arr[p.y * APP_CONFIG.canvas.width + p.x] = p;
        setPixels(arr);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });

    const channel = supabase
      .channel("pixels-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pixels" },
        (payload) => {
          const row = (payload.new ?? payload.old) as PixelRow | null;
          if (!row) return;
          setPixels((prev) => {
            const next = prev.slice();
            next[row.y * APP_CONFIG.canvas.width + row.x] =
              payload.eventType === "DELETE" ? null : (payload.new as PixelRow);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { pixels, loading, error };
}
