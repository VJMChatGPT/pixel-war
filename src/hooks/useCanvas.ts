import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllPixels, type PixelRow } from "@/services/pixels";
import { APP_CONFIG } from "@/config/app";

/**
 * useCanvas — loads all 10k pixels and stays in sync via realtime.
 * Returns a flat array indexed by `y * 100 + x` for O(1) lookups in the grid.
 */
export function useCanvas() {
  const pixelsRef = useRef<(PixelRow | null)[]>(
    new Array(APP_CONFIG.canvas.totalPixels).fill(null)
  );
  const loadingRef = useRef(true);
  const preLoadPatchedIndexesRef = useRef<Set<number>>(new Set());
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const patchPixel = useCallback((x: number, y: number, pixel: PixelRow | null) => {
    if (x < 0 || x >= APP_CONFIG.canvas.width || y < 0 || y >= APP_CONFIG.canvas.height) {
      return null;
    }

    const index = y * APP_CONFIG.canvas.width + x;
    const previous = pixelsRef.current[index];
    pixelsRef.current[index] = pixel;
    if (loadingRef.current) {
      preLoadPatchedIndexesRef.current.add(index);
    }
    setRevision((value) => value + 1);
    return previous;
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchAllPixels()
      .then((rows) => {
        if (!mounted) return;
        const arr: (PixelRow | null)[] = new Array(APP_CONFIG.canvas.totalPixels).fill(null);
        for (const p of rows) arr[p.y * APP_CONFIG.canvas.width + p.x] = p;
        for (const index of preLoadPatchedIndexesRef.current) {
          arr[index] = pixelsRef.current[index];
        }
        pixelsRef.current = arr;
        preLoadPatchedIndexesRef.current.clear();
        loadingRef.current = false;
        setRevision((value) => value + 1);
        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        loadingRef.current = false;
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
          patchPixel(row.x, row.y, payload.eventType === "DELETE" ? null : (payload.new as PixelRow));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [patchPixel]);

  return { pixels: pixelsRef.current, revision, loading, error, patchPixel };
}
