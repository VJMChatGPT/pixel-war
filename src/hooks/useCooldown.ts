import { useEffect, useState } from "react";
import { APP_CONFIG } from "@/config/app";

/**
 * useCooldown — returns the remaining ms until the wallet can paint again,
 * given the timestamp of the last paint. Updates every second.
 */
export function useCooldown(lastPaintAt: string | Date | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!lastPaintAt) return { remainingMs: 0, ready: true, progress: 1 };

  const last = typeof lastPaintAt === "string" ? new Date(lastPaintAt).getTime() : lastPaintAt.getTime();
  const elapsed = now - last;
  const remainingMs = Math.max(0, APP_CONFIG.rules.cooldownMs - elapsed);
  const progress = Math.min(1, elapsed / APP_CONFIG.rules.cooldownMs);

  return { remainingMs, ready: remainingMs <= 0, progress };
}
