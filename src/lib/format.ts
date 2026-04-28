/** Truncate a wallet address: 7xKX...gAsU */
export function shortAddress(addr: string | null | undefined, head = 4, tail = 4): string {
  if (!addr) return "—";
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

/** Format a number with k/M suffixes. */
export function compactNumber(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export function formatPoints(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat("en", {
    minimumFractionDigits: value > 0 && value < 10 ? Math.min(1, maximumFractionDigits) : 0,
    maximumFractionDigits,
  }).format(value);
}

/** Render mm:ss countdown from milliseconds. */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Relative time: "12s ago", "4m ago", "3h ago", "2d ago". */
export function timeAgo(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/** Generate a deterministic vibrant gradient pair from a wallet address. */
export function walletGradient(addr: string): [string, string] {
  let h = 0;
  for (let i = 0; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 60 + (h % 90)) % 360;
  return [`hsl(${a} 95% 60%)`, `hsl(${b} 95% 55%)`];
}
