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
    <div className="relative overflow-hidden border-b border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/45">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex animate-ticker py-2.5 whitespace-nowrap" style={{ width: "max-content" }}>
        {doubled.map((paint, i) => (
          <span key={`${paint.id}-${i}`} className="inline-flex items-center gap-2 px-6 font-mono text-xs text-muted-foreground">
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
