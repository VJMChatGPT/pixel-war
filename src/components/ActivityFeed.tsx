import { useRecentPaints } from "@/hooks/useRecentPaints";
import { shortAddress, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  className?: string;
  limit?: number;
}

export function ActivityFeed({ className, limit = 12 }: Props) {
  const { paints, loading } = useRecentPaints(limit);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Live activity
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          realtime
        </span>
      </div>
      {loading && Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-muted/30 animate-pulse" />
      ))}
      <AnimatePresence initial={false}>
        {paints.map((p) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <div className="flex gap-0.5">
              <span className="w-3 h-3 rounded-sm border border-border" style={{ background: p.old_color ?? "#0a0a14" }} />
              <span className="w-3 h-3 rounded-sm border border-border" style={{ background: p.new_color, boxShadow: `0 0 6px ${p.new_color}66` }} />
            </div>
            <span className="font-mono text-xs flex-1 truncate">{shortAddress(p.wallet)}</span>
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {timeAgo(p.painted_at)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      {!loading && paints.length === 0 && (
        <div className="text-center py-6 text-xs text-muted-foreground font-mono">
          no paints yet — be the first
        </div>
      )}
    </div>
  );
}
