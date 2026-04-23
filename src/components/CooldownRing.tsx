import { formatCountdown } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  remainingMs: number;
  totalMs: number;
  size?: number;
  className?: string;
  label?: string;
}

/** Animated SVG ring with monospace countdown in the center. */
export function CooldownRing({ remainingMs, totalMs, size = 140, className, label = "next paint" }: Props) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 1;
  const offset = c * (1 - progress);
  const ready = remainingMs <= 0;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {ready && (
        <span
          className="absolute inset-0 rounded-full border-2 border-accent animate-pulse-ring"
          style={{ boxShadow: "0 0 20px hsl(var(--accent) / 0.5)" }}
        />
      )}
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ready ? "hsl(var(--accent))" : "url(#ring-grad)"}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className={cn("font-mono font-bold tabular-nums", size >= 140 ? "text-3xl" : "text-xl")}>
          {ready ? "READY" : formatCountdown(remainingMs)}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
          {ready ? "paint now" : label}
        </div>
      </div>
    </div>
  );
}
