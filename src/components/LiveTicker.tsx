import { useRecentPaints } from "@/hooks/useRecentPaints";
import { formatWalletDisplayName } from "@/lib/wallet-display";
import { useWallet } from "@/hooks/useWallet";

/** Persistent scrolling marquee with recent live activity. */
export function LiveTicker() {
  const { paints, displayNamesByWallet } = useRecentPaints(20);
  const { wallet } = useWallet();
  const items =
    paints.length > 0
      ? paints
      : Array.from({ length: 6 }).map((_, i) => ({
          id: -i,
          wallet: "0xseeding-canvas",
          new_color: "#3affb5",
          painted_at: new Date().toISOString(),
        }));
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-border bg-card/80 supports-[backdrop-filter]:bg-card/55 md:backdrop-blur">
      <div className="absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent pointer-events-none sm:w-24" />
      <div className="absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none sm:w-24" />
      <div className="flex animate-ticker whitespace-nowrap py-2" style={{ width: "max-content" }}>
        {doubled.map((paint, i) => (
          <span key={`${paint.id}-${i}`} className="inline-flex items-center gap-2 px-4 font-mono text-[11px] text-muted-foreground sm:px-6 sm:text-xs">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ background: paint.new_color, boxShadow: `0 0 8px ${paint.new_color}88` }}
            />
            <span className="text-foreground/85 max-w-[16rem] truncate">
              {formatWalletDisplayName({
                wallet: paint.wallet,
                displayName: displayNamesByWallet[paint.wallet] ?? null,
                currentWallet: wallet?.address,
                shortenFallback: true,
              })}
            </span>
            <span>painted</span>
            <span className="text-accent">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
