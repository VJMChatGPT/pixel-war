import { useEffect, useState } from "react";
import { APP_CONFIG } from "@/config/app";

/**
 * Returns the remaining ms until the wallet regains one paint slot.
 * `cooldownAnchorAt` is the oldest paint still counting inside the current
 * rolling cooldown window; when it is null, the wallet can paint immediately.
 */
export function useCooldown(cooldownAnchorAt: string | Date | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!cooldownAnchorAt) return { remainingMs: 0, ready: true, progress: 1 };

  const anchor =
    typeof cooldownAnchorAt === "string"
      ? new Date(cooldownAnchorAt).getTime()
      : cooldownAnchorAt.getTime();
  const elapsed = now - anchor;
  const remainingMs = Math.max(0, APP_CONFIG.rules.cooldownMs - elapsed);
  const progress = Math.min(1, elapsed / APP_CONFIG.rules.cooldownMs);

  return { remainingMs, ready: remainingMs <= 0, progress };
}
