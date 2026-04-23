import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { NeonCard } from "@/components/NeonCard";
import { PixlMascot } from "@/components/PixlMascot";
import { fetchLeaderboard, type LeaderboardRow } from "@/services/pixels";
import { compactNumber, shortAddress, timeAgo, walletGradient } from "@/lib/format";
import { useWallet } from "@/hooks/useWallet";
import { Trophy, Crown, Medal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { wallet } = useWallet();

  useEffect(() => {
    fetchLeaderboard(100)
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3).filter((r) => r.wallet?.toLowerCase().includes(search.toLowerCase()));
  const myRank = wallet ? rows.find((r) => r.wallet === wallet.address) : null;

  return (
    <Layout>
      <div className="container py-10 md:py-16">
        <div className="text-center mb-12">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-3 flex items-center justify-center gap-2">
            <Trophy className="w-3 h-3" /> top holders
          </div>
          <h1 className="font-display font-bold text-4xl md:text-6xl">
            The <span className="text-gradient-neon">Biggest Marks</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            The wallets leaving the biggest mark on the canvas, ranked in real time.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 border-destructive/40 bg-destructive/10 text-left">
            <AlertTitle>Leaderboard failed to load</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Podium */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[0,1,2].map(i => <div key={i} className="aspect-[3/4] bg-muted/30 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[1, 0, 2].map((order, idx) => {
              const r = podium[order];
              if (!r) return <div key={idx} />;
              const heights = [1, 0, 2].map(i => i === 0 ? "md:translate-y-0" : "md:translate-y-6");
              const icons = [Crown, Medal, Medal];
              const Icon = icons[order];
              const colors = ["text-neon-gold", "text-neon-violet", "text-neon-coral"];
              const [a, b] = walletGradient(r.wallet ?? "x");
              return (
                <motion.div
                  key={r.wallet}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.16,1,0.3,1] }}
                  className={cn("relative", heights[idx])}
                >
                  <NeonCard shimmer={order === 0} glow={order === 0 ? "primary" : "none"} className="p-6 text-center h-full">
                    <Icon className={cn("w-10 h-10 mx-auto mb-3", colors[order])} />
                    <div className="font-pixel text-xs text-muted-foreground mb-3">RANK #{r.rank}</div>
                    <div
                      className="w-20 h-20 rounded-2xl mx-auto mb-3 shadow-xl"
                      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
                    />
                    <div className="font-mono font-semibold text-sm mb-1">{shortAddress(r.wallet ?? "")}</div>
                    <div className="font-display font-bold text-3xl text-gradient-neon mt-3">
                      {compactNumber(Number(r.controlled_pixels) ?? 0)}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">pixels controlled</div>
                    <div className="mt-3 font-mono text-xs">
                      <span className="text-secondary">{Number(r.supply_percentage).toFixed(2)}%</span> of supply
                    </div>
                  </NeonCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Mascot cheer */}
        <div className="hidden md:flex justify-center mb-8 -mt-6">
          <PixlMascot mood="cheer" size={70} />
        </div>

        {/* Table */}
        <NeonCard className="p-2 md:p-4">
          <div className="flex items-center gap-3 p-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by wallet address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 font-mono text-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">wallet</th>
                  <th className="px-4 py-3 text-right">pixels</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">% supply</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">last active</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((r) => {
                  const [a, b] = walletGradient(r.wallet ?? "x");
                  const isMe = wallet && r.wallet === wallet.address;
                  return (
                    <tr key={r.wallet} className={cn("border-t border-border hover:bg-muted/30 transition-colors", isMe && "bg-primary/10")}>
                      <td className="px-4 py-3 font-mono font-bold text-muted-foreground">{r.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-md" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
                          <span className="font-mono">{shortAddress(r.wallet ?? "")}</span>
                          {isMe && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary">you</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{Number(r.controlled_pixels)}</td>
                      <td className="px-4 py-3 text-right font-mono text-secondary hidden sm:table-cell tabular-nums">
                        {Number(r.supply_percentage).toFixed(3)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                        {timeAgo(r.last_active)}
                      </td>
                    </tr>
                  );
                })}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">No marks on the board yet — be the first to paint.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </NeonCard>

        {/* My rank sticky */}
        {myRank && (
          <div className="sticky bottom-4 mt-4">
            <NeonCard glow="primary" className="p-4 flex items-center gap-4">
              <Trophy className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">your rank</div>
                <div className="font-display font-bold text-lg">#{myRank.rank} · {Number(myRank.controlled_pixels)} pixels under your mark</div>
              </div>
              <PixlMascot mood="cheer" size={40} />
            </NeonCard>
          </div>
        )}
      </div>
    </Layout>
  );
}
