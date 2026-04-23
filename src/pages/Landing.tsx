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
  const { pixels } = useCanvas();
  const { connect, connecting, isConnected } = useWallet();

  const stats = useMemo(() => {
    const painted = pixels.filter((p) => p && p.owner_wallet).length;
    const owners = new Set(pixels.filter((p) => p?.owner_wallet).map((p) => p!.owner_wallet)).size;
    return { painted, owners };
  }, [pixels]);

  return (
    <Layout>
      <LiveTicker />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <div className="container relative pt-16 pb-24 md:pt-24 md:pb-32 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              live on solana · 100×100 canvas
            </div>
            <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight">
              Own the pixels.<br />
              <span className="text-gradient-hero">Paint the future.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              A collaborative on-chain canvas where your token balance becomes your brush.
              Hold <span className="text-foreground font-semibold">$PIXL</span>, claim your pixels, paint together.
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
                  Connect Wallet
                </Button>
              ) : (
                <Button
                  size="lg"
                  asChild
                  className="h-14 px-8 text-base font-semibold bg-gradient-neon text-primary-foreground rounded-xl glow-primary hover:scale-[1.03] transition-all"
                >
                  <Link to="/canvas">
                    Open Canvas <ArrowRight className="w-5 h-5" />
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

            {/* Stat chips */}
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              {[
                { label: "pixels painted", value: stats.painted.toLocaleString(), icon: Palette },
                { label: "active holders", value: stats.owners.toLocaleString(), icon: Activity },
                { label: "total canvas", value: APP_CONFIG.canvas.totalPixels.toLocaleString(), icon: Zap },
              ].map((s, i) => (
                <NeonCard key={s.label} className="p-4">
                  <s.icon className="w-4 h-4 text-primary mb-2" />
                  <div className="font-mono font-bold text-2xl tabular-nums">{s.value}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">{s.label}</div>
                </NeonCard>
              ))}
            </div>
          </motion.div>

          {/* Mini live canvas + mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <NeonCard shimmer className="aspect-square p-3 glow-primary">
              <CanvasGrid pixels={pixels} className="rounded-md" />
            </NeonCard>
            <div className="absolute -bottom-6 -left-6 hidden md:block">
              <PixlMascot mood="wave" size={110} />
            </div>
            <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_hsl(var(--accent)/0.5)]">
              live
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-3">how it works</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl">
            Four steps to <span className="text-gradient-neon">claim your art</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          {[
            { n: "01", title: "Hold $PIXL", desc: `Every ${APP_CONFIG.rules.supplyPercentPerPixel}% of supply unlocks 1 pixel of canvas territory.`, mood: "idle" as const },
            { n: "02", title: "Connect wallet", desc: "Sign in with your Solana wallet. Your balance becomes your brush size.", mood: "wave" as const },
            { n: "03", title: "Paint a pixel", desc: "Pick a color. Click any cell. Watch it land in real-time.", mood: "paint" as const },
            { n: "04", title: "Wait 15 min", desc: "Cooldown resets. Paint again. Climb the leaderboard.", mood: "sleep" as const },
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
                <Link to="/canvas">Enter the canvas <ArrowRight className="w-5 h-5" /></Link>
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
