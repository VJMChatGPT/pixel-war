import { useRecentPaints } from "@/hooks/useRecentPaints";
import { shortAddress } from "@/lib/format";

/** Scrolling marquee at the top of the landing page. */
export function LiveTicker() {
  const { paints } = useRecentPaints(20);
  const items = paints.length > 0 ? paints : Array.from({ length: 6 }).map((_, i) => ({
    id: -i,
    wallet: "0xseeding…canvas",
    new_color: "#3affb5",
    painted_at: new Date().toISOString(),
  } as any));
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-border bg-card/40 backdrop-blur">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex animate-ticker py-3 whitespace-nowrap" style={{ width: "max-content" }}>
        {doubled.map((p, i) => (
          <span key={`${p.id}-${i}`} className="inline-flex items-center gap-2 px-6 font-mono text-xs text-muted-foreground">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ background: p.new_color, boxShadow: `0 0 8px ${p.new_color}88` }}
            />
            <span className="text-foreground/80">{shortAddress(p.wallet)}</span>
            <span>painted</span>
            <span className="text-accent">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
