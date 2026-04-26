import { Layout } from "@/components/Layout";
import { PixlMascot } from "@/components/PixlMascot";
import { LiveTicker } from "@/components/LiveTicker";
import { NeonCard } from "@/components/NeonCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet, Palette, Trophy, Zap, Activity } from "lucide-react";
import { useCanvas } from "@/hooks/useCanvas";
import { APP_CONFIG } from "@/config/app";
import { CanvasGrid } from "@/components/CanvasGrid";
import { useWallet } from "@/hooks/useWallet";
import { motion } from "framer-motion";
import { useMemo } from "react";

export default function Landing() {
  const { pixels, revision } = useCanvas();
  const { connect, connecting, isConnected } = useWallet();

  const stats = useMemo(() => {
    const painted = pixels.filter((p) => p && p.owner_wallet).length;
    const owners = new Set(pixels.filter((p) => p?.owner_wallet).map((p) => p!.owner_wallet)).size;
    return { painted, owners };
  }, [pixels, revision]);

  return (
    <Layout>
      <LiveTicker />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-radial-glow opacity-60 pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-[0.07] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <div className="container relative pt-14 pb-20 md:pt-20 md:pb-28 grid lg:grid-cols-[1fr_minmax(0,560px)] gap-10 lg:gap-16 items-center">
          {/* LEFT — message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-7">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </span>
              live · solana · {APP_CONFIG.canvas.totalPixels.toLocaleString()} pixels
            </div>

            <h1 className="font-display font-bold text-[2.75rem] sm:text-6xl lg:text-[5.25rem] leading-[0.95] tracking-tight">
              Turn tokens into
              <br />
              <span className="text-gradient-hero">territory.</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              A live collaborative canvas where your <span className="text-foreground font-semibold">$PIXL</span> balance becomes pixels you control.
              Every {APP_CONFIG.rules.supplyPercentPerPixel}% of supply = 1 pixel of public, on-chain dominance.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {!isConnected ? (
                <Button
                  size="lg"
                  onClick={() => connect()}
                  disabled={connecting}
                  className="h-14 px-8 text-base font-semibold bg-gradient-neon text-primary-foreground rounded-xl glow-primary hover:scale-[1.03] active:scale-[0.98] transition-all"
                >
                  <Wallet className="w-5 h-5" />
                  Claim your pixels
                </Button>
              ) : (
                <Button
                  size="lg"
                  asChild
                  className="h-14 px-8 text-base font-semibold bg-gradient-neon text-primary-foreground rounded-xl glow-primary hover:scale-[1.03] transition-all"
                >
                  <Link to="/canvas">
                    Enter the canvas <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-14 px-8 rounded-xl border-border hover:bg-muted/40"
              >
                <Link to="/rules">How it works</Link>
              </Button>
            </div>

            {/* Inline live stats — compact, single row */}
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                <span className="font-mono tabular-nums text-foreground font-semibold text-base">{stats.painted.toLocaleString()}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">painted</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
                <span className="font-mono tabular-nums text-foreground font-semibold text-base">{stats.owners.toLocaleString()}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">holders</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/60" />
                <span className="font-mono tabular-nums text-foreground font-semibold text-base">{APP_CONFIG.canvas.totalPixels.toLocaleString()}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">total cells</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — live canvas, hero focus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-[560px]"
          >
            {/* floating "live" tag */}
            <div className="absolute -top-3 left-6 z-20 px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_hsl(var(--accent)/0.45)]">
              ● live
            </div>

            {/* canvas card */}
            <NeonCard shimmer className="aspect-square p-2.5 glow-primary">
              <CanvasGrid pixels={pixels} revision={revision} className="rounded-md" />
            </NeonCard>

            {/* meta strip under the canvas */}
            <div className="mt-3 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>100 × 100 board</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                updating in real time
              </span>
            </div>

            {/* mascot — UNCHANGED */}
            <div className="absolute -bottom-4 -left-6 hidden md:block">
              <PixlMascot mood="wave" size={110} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-3">how it works</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl">
            Four steps to <span className="text-gradient-neon">leave your mark</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          {[
            { n: "01", title: "Hold $PIXL", desc: `Every ${APP_CONFIG.rules.supplyPercentPerPixel}% of supply unlocks 1 pixel you can control on the canvas.`, mood: "idle" as const },
            { n: "02", title: "Connect wallet", desc: "Sign in with your Solana wallet. Your balance becomes your brush size.", mood: "wave" as const },
            { n: "03", title: "Paint your claim", desc: "Pick a color, click a cell, and watch your mark land in real time.", mood: "paint" as const },
            { n: "04", title: "Defend your space", desc: "Use your paint slots, hold your ground, and climb the leaderboard.", mood: "sleep" as const },
          ].map((step, i) => (
            <NeonCard key={step.n} className="p-6 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-start justify-between mb-4">
                <span className="font-pixel text-xs text-primary">{step.n}</span>
                <PixlMascot size={48} mood={step.mood} />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </NeonCard>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="container pb-20">
        <NeonCard shimmer className="p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-60" />
          <div className="relative">
            <PixlMascot mood="cheer" size={90} className="mx-auto mb-4" />
            <h2 className="font-display font-bold text-3xl md:text-5xl mb-4">
              Ready to leave your mark?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              {APP_CONFIG.canvas.totalPixels.toLocaleString()} pixels. One canvas. Forever on-chain. Your pixels stay yours as long as you hold.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="h-14 px-8 bg-gradient-neon glow-primary rounded-xl text-primary-foreground font-semibold">
                <Link to="/canvas">Leave your mark <ArrowRight className="w-5 h-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-xl">
                <Link to="/leaderboard"><Trophy className="w-5 h-5" /> Leaderboard</Link>
              </Button>
            </div>
          </div>
        </NeonCard>
      </section>
    </Layout>
  );
}
