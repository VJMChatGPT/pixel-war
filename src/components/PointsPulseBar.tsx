import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, Trophy } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useAnimatedWalletPoints, useWalletState } from "@/hooks/useWalletState";
import { formatPoints } from "@/lib/format";

export function PointsPulseBar() {
  const { wallet, isConnected } = useWallet();
  const { walletState } = useWalletState();
  const { animatedPointsTotal, pointsPerSecond } = useAnimatedWalletPoints();

  if (!isConnected || !wallet) return null;

  return (
    <div className="border-b border-primary/20 bg-gradient-to-r from-primary/12 via-card/90 to-accent/10 md:backdrop-blur-md">
      <div className="container flex flex-col gap-2 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">points are the score</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">total</span>
            <span className="font-semibold tabular-nums">{formatPoints(animatedPointsTotal, 1)}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted-foreground">rate</span>
            <span className="font-semibold tabular-nums">{formatPoints(pointsPerSecond, 2)} pts/s</span>
          </div>
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/45 px-2.5 py-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Trophy className="w-3.5 h-3.5 text-accent" />
            leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
