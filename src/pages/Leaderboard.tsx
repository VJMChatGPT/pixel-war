import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { NeonCard } from "@/components/NeonCard";
import { PixlMascot } from "@/components/PixlMascot";
import {
  fetchLeaderboard,
  fetchPointsLeaderboard,
  type LeaderboardRow,
  type PointsLeaderboardRow,
} from "@/services/pixels";
import { compactNumber, formatPoints, shortAddress, timeAgo, walletGradient } from "@/lib/format";
import { formatWalletDisplayName } from "@/lib/wallet-display";
import { useWallet } from "@/hooks/useWallet";
import { Trophy, Crown, Medal, Search, Sparkles, Boxes } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PointsBoardEntry = PointsLeaderboardRow & {
  rank: number;
};

type WalletDisplayRow = {
  wallet: string | null;
  displayName?: string | null;
  display_name?: string | null;
};

function getRowDisplayName(row: WalletDisplayRow) {
  return row.displayName ?? row.display_name ?? null;
}

function filterWalletRows<T extends WalletDisplayRow>(rows: T[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) => {
    const walletMatch = row.wallet?.toLowerCase().includes(query);
    const displayNameMatch = getRowDisplayName(row)?.trim().toLowerCase().includes(query);
    return walletMatch || displayNameMatch;
  });
}

function WalletIdentity({
  wallet,
  displayName,
  currentWallet,
  compact = false,
}: {
  wallet: string | null;
  displayName?: string | null;
  currentWallet?: string | null;
  compact?: boolean;
}) {
  const hasDisplayName = !!displayName?.trim();
  const primaryLabel = formatWalletDisplayName({
    wallet,
    displayName,
    currentWallet,
    shortenFallback: true,
  });
  const addressLabel = shortAddress(wallet ?? "");

  return (
    <div className="min-w-0">
      <div className={cn("font-mono truncate", compact ? "text-sm font-semibold mb-1" : "")}>
        {primaryLabel}
      </div>
      {hasDisplayName && (
        <div className="font-mono text-[10px] text-muted-foreground truncate">
          {addressLabel}
        </div>
      )}
    </div>
  );
}

function Podium({
  rows,
  metricLabel,
  metricValue,
  currentWallet,
}: {
  rows: Array<{
    wallet: string | null;
    rank: number | null;
    displayName?: string | null;
    display_name?: string | null;
  }>;
  metricLabel: string;
  metricValue: (row: {
    wallet: string | null;
    rank: number | null;
    displayName?: string | null;
    display_name?: string | null;
  }) => string;
  currentWallet?: string | null;
}) {
  const podium = rows.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 0, 2].map((order, idx) => {
        const row = podium[order];
        if (!row) return <div key={idx} />;

        const [a, b] = walletGradient(row.wallet ?? "x");
        const heights = [1, 0, 2].map((i) => (i === 0 ? "md:translate-y-0" : "md:translate-y-6"));
        const icons = [Crown, Medal, Medal];
        const colors = ["text-neon-gold", "text-neon-violet", "text-neon-coral"];
        const Icon = icons[order];

        return (
          <motion.div
            key={`${row.wallet}-${row.rank}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={cn("relative", heights[idx])}
          >
            <NeonCard shimmer={order === 0} glow={order === 0 ? "primary" : "none"} className="p-6 text-center h-full">
              <Icon className={cn("w-10 h-10 mx-auto mb-3", colors[order])} />
              <div className="font-pixel text-xs text-muted-foreground mb-3">RANK #{row.rank}</div>
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-3 shadow-xl"
                style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
              />
              <WalletIdentity
                wallet={row.wallet}
                displayName={getRowDisplayName(row)}
                currentWallet={currentWallet}
                compact
              />
              <div className="font-display font-bold text-3xl text-gradient-neon mt-3">
                {metricValue(row)}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{metricLabel}</div>
            </NeonCard>
          </motion.div>
        );
      })}
    </div>
  );
}

function LeaderboardTable({
  rows,
  currentWallet,
  metricHeader,
  secondaryHeader,
}: {
  rows: Array<{
    wallet: string | null;
    rank: number | null;
    displayName?: string | null;
    last_active?: string | null;
    metric: string;
    secondaryMetric: string;
  }>;
  currentWallet?: string | null;
  metricHeader: string;
  secondaryHeader: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <th className="px-4 py-3 w-12">#</th>
            <th className="px-4 py-3">wallet</th>
            <th className="px-4 py-3 text-right">{metricHeader}</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">{secondaryHeader}</th>
            <th className="px-4 py-3 text-right hidden md:table-cell">last active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const [a, b] = walletGradient(row.wallet ?? "x");
            const isMe = !!currentWallet && row.wallet === currentWallet;

            return (
              <tr key={`${row.wallet}-${row.rank}`} className={cn("border-t border-border hover:bg-muted/30 transition-colors", isMe && "bg-primary/10")}>
                <td className="px-4 py-3 font-mono font-bold text-muted-foreground">{row.rank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-md shrink-0" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
                    <WalletIdentity wallet={row.wallet} displayName={row.displayName} currentWallet={currentWallet} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{row.metric}</td>
                <td className="px-4 py-3 text-right font-mono text-secondary hidden sm:table-cell tabular-nums">
                  {row.secondaryMetric}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                  {timeAgo(row.last_active ?? null)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Leaderboard() {
  const [pixelRows, setPixelRows] = useState<LeaderboardRow[]>([]);
  const [pointsRows, setPointsRows] = useState<PointsBoardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { wallet } = useWallet();

  useEffect(() => {
    Promise.all([fetchLeaderboard(100), fetchPointsLeaderboard(100)])
      .then(([pixelsData, pointsData]) => {
        setPixelRows(pixelsData);
        setPointsRows(
          pointsData.map((row, index) => ({
            ...row,
            rank: index + 1,
          }))
        );
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredPixelRows = useMemo(() => filterWalletRows(pixelRows, search), [pixelRows, search]);
  const filteredPointsRows = useMemo(() => filterWalletRows(pointsRows, search), [pointsRows, search]);
  const pixelPodium = filteredPixelRows.slice(0, 3);
  const pointsPodium = filteredPointsRows.slice(0, 3);
  const pixelTableRows = filteredPixelRows.slice(3);
  const pointsTableRows = filteredPointsRows.slice(3);
  const myPixelRank = wallet ? pixelRows.find((row) => row.wallet === wallet.address) : null;
  const myPointsRank = wallet ? pointsRows.find((row) => row.wallet === wallet.address) : null;

  return (
    <Layout>
      <div className="container py-10 md:py-16">
        <div className="text-center mb-12">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-3 flex items-center justify-center gap-2">
            <Trophy className="w-3 h-3" /> dual leaderboard
          </div>
          <h1 className="font-display font-bold text-4xl md:text-6xl">
            The <span className="text-gradient-neon">Biggest Marks</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Two ways to lead the board: total points earned over time, and the amount of territory you control right now.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 border-destructive/40 bg-destructive/10 text-left">
            <AlertTitle>Leaderboard failed to load</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <NeonCard className="p-2 md:p-4 mb-8">
          <div className="flex items-center gap-3 p-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by wallet address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 font-mono text-sm"
            />
          </div>
        </NeonCard>

        {loading ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-10 w-48 bg-muted/30 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="aspect-[3/4] bg-muted/30 rounded-2xl animate-pulse" />
                  ))}
                </div>
                <div className="h-72 bg-muted/30 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl">Top by Points</h2>
                  <p className="text-sm text-muted-foreground">Lifetime passive progress from holding territory over time.</p>
                </div>
              </div>

              <Podium
                rows={pointsPodium}
                metricLabel="total points"
                metricValue={(row) => compactNumber(Number((row as PointsBoardEntry).total_points) ?? 0)}
                currentWallet={wallet?.address}
              />

              <NeonCard className="p-2 md:p-4">
                <LeaderboardTable
                  rows={pointsTableRows.map((row) => ({
                    wallet: row.wallet,
                    rank: row.rank,
                    displayName: row.display_name,
                    last_active: row.last_paint_at,
                    metric: formatPoints(Number(row.total_points ?? 0), 1),
                    secondaryMetric: formatPoints(Number(row.points_per_second ?? 0), 2),
                  }))}
                  currentWallet={wallet?.address}
                  metricHeader="points"
                  secondaryHeader="pts / sec"
                />
                {!loading && filteredPointsRows.length === 0 && (
                  <div className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">
                    No point earners yet - claim territory and start the first streak.
                  </div>
                )}
              </NeonCard>
            </section>

            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                  <Boxes className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl">Top by Pixels</h2>
                  <p className="text-sm text-muted-foreground">Current live control of the board, ranked in real time.</p>
                </div>
              </div>

              <Podium
                rows={pixelPodium}
                metricLabel="pixels controlled"
                metricValue={(row) => compactNumber(Number((row as LeaderboardRow).controlled_pixels) ?? 0)}
                currentWallet={wallet?.address}
              />

              <NeonCard className="p-2 md:p-4">
                <LeaderboardTable
                  rows={pixelTableRows.map((row) => ({
                    wallet: row.wallet,
                    rank: row.rank,
                    displayName: row.display_name,
                    last_active: row.last_active,
                    metric: String(Number(row.controlled_pixels ?? 0)),
                    secondaryMetric: `${Number(row.supply_percentage ?? 0).toFixed(3)}%`,
                  }))}
                  currentWallet={wallet?.address}
                  metricHeader="pixels"
                  secondaryHeader="% supply"
                />
                {!loading && filteredPixelRows.length === 0 && (
                  <div className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">
                    No marks on the board yet - be the first to paint.
                  </div>
                )}
              </NeonCard>
            </section>
          </div>
        )}

        {(myPointsRank || myPixelRank) && (
          <div className="sticky bottom-4 mt-6">
            <NeonCard glow="primary" className="p-4 flex items-center gap-4">
              <Trophy className="w-5 h-5 text-primary" />
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">your points rank</div>
                  <div className="font-display font-bold text-lg">
                    {myPointsRank ? `#${myPointsRank.rank} · ${formatPoints(Number(myPointsRank.total_points ?? 0), 1)} points` : "Unranked"}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">your pixels rank</div>
                  <div className="font-display font-bold text-lg">
                    {myPixelRank ? `#${myPixelRank.rank} · ${Number(myPixelRank.controlled_pixels ?? 0)} pixels` : "Unranked"}
                  </div>
                </div>
              </div>
              <PixlMascot mood="cheer" size={40} />
            </NeonCard>
          </div>
        )}
      </div>
    </Layout>
  );
}

