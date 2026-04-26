import { Layout } from "@/components/Layout";
import { PixlMascot } from "@/components/PixlMascot";
import { LiveTicker } from "@/components/LiveTicker";
import { NeonCard } from "@/components/NeonCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Wallet,
  Trophy,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Crown,
  Eye,
} from "lucide-react";
import { useCanvas } from "@/hooks/useCanvas";
import { APP_CONFIG } from "@/config/app";
import { CanvasGrid } from "@/components/CanvasGrid";
import { useWallet } from "@/hooks/useWallet";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useMemo, useRef } from "react";
import { shortAddress, walletGradient } from "@/lib/format";

export default function Landing() {
  const { pixels, revision } = useCanvas();
  const { connect, connecting, isConnected } = useWallet();

  const stats = useMemo(() => {
    const painted = pixels.filter((p) => p && p.owner_wallet).length;
    const owners = new Set(
      pixels.filter((p) => p?.owner_wallet).map((p) => p!.owner_wallet),
    ).size;

    // Top wallets by controlled pixels — for the territory section.
    const counts = new Map<string, number>();
    for (const p of pixels) {
      if (!p?.owner_wallet) continue;
      counts.set(p.owner_wallet, (counts.get(p.owner_wallet) ?? 0) + 1);
    }
    const top = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([wallet, count]) => ({ wallet, count }));

    return { painted, owners, top };
  }, [pixels, revision]);

  // === Section 2: scroll-driven zoom-out from 1 pixel → cluster → board ===
  const zoomSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: zoomProgress } = useScroll({
    target: zoomSectionRef,
    offset: ["start start", "end end"],
  });
  const smoothZoom = useSpring(zoomProgress, { stiffness: 80, damping: 20, mass: 0.4 });
  // 1 pixel filling viewport → full 100x100 board
  const boardScale = useTransform(smoothZoom, [0, 0.4, 1], [40, 8, 1]);
  const boardOpacity = useTransform(smoothZoom, [0, 0.05, 1], [0, 1, 1]);
  const labelPixel = useTransform(smoothZoom, [0, 0.15, 0.25], [1, 1, 0]);
  const labelCluster = useTransform(smoothZoom, [0.2, 0.4, 0.55], [0, 1, 0]);
  const labelTerritory = useTransform(smoothZoom, [0.5, 0.7, 0.85], [0, 1, 0]);
  const labelBoard = useTransform(smoothZoom, [0.8, 0.95, 1], [0, 1, 1]);

  return (
    <Layout>
      <LiveTicker />

      {/* ============================================================ */}
      {/* 1. HERO — first impression                                    */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-[0.08] pointer-events-none" />
        <div className="container relative pt-16 pb-24 md:pt-24 md:pb-32 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              live · 100 × 100 · on-chain canvas
            </div>
            <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-[5.25rem] leading-[0.95] tracking-tight">
              Turn tokens into
              <br />
              <span className="text-gradient-hero">territory.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              $PIXL is a live competitive canvas. Every{" "}
              <span className="text-foreground font-semibold">
                {APP_CONFIG.rules.supplyPercentPerPixel}% of supply
              </span>{" "}
              you hold gives you control of one pixel. Paint it. Defend it. Make the whole canvas see you.
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
                  Claim your territory
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
                <Link to="/canvas">
                  <Eye className="w-5 h-5" /> View live board
                </Link>
              </Button>
            </div>

            {/* Stat chips */}
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              {[
                {
                  label: "pixels claimed",
                  value: stats.painted.toLocaleString(),
                  icon: Target,
                },
                {
                  label: "active holders",
                  value: stats.owners.toLocaleString(),
                  icon: Activity,
                },
                {
                  label: "total territory",
                  value: APP_CONFIG.canvas.totalPixels.toLocaleString(),
                  icon: Crown,
                },
              ].map((s) => (
                <NeonCard key={s.label} className="p-4">
                  <s.icon className="w-4 h-4 text-primary mb-2" />
                  <div className="font-mono font-bold text-2xl tabular-nums">{s.value}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                    {s.label}
                  </div>
                </NeonCard>
              ))}
            </div>
          </motion.div>

          {/* Live canvas hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <NeonCard shimmer className="aspect-square p-3 glow-primary">
              <CanvasGrid pixels={pixels} revision={revision} className="rounded-md" />
            </NeonCard>
            <div className="absolute -bottom-6 -left-6 hidden md:block">
              <PixlMascot mood="wave" size={120} />
            </div>
            <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_hsl(var(--accent)/0.5)]">
              live
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. SCROLL ZOOM — pixel → cluster → territory → full board    */}
      {/* ============================================================ */}
      <section ref={zoomSectionRef} className="relative" style={{ height: "320vh" }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-60" />

          {/* Caption stack */}
          <div className="absolute top-24 left-0 right-0 text-center z-10 px-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-3">
              scroll to zoom out
            </div>
            <div className="relative h-20">
              <motion.h2
                style={{ opacity: labelPixel }}
                className="absolute inset-0 font-display font-bold text-4xl md:text-6xl"
              >
                One pixel.
              </motion.h2>
              <motion.h2
                style={{ opacity: labelCluster }}
                className="absolute inset-0 font-display font-bold text-4xl md:text-6xl"
              >
                A cluster.
              </motion.h2>
              <motion.h2
                style={{ opacity: labelTerritory }}
                className="absolute inset-0 font-display font-bold text-4xl md:text-6xl"
              >
                Your <span className="text-gradient-hero">territory.</span>
              </motion.h2>
              <motion.h2
                style={{ opacity: labelBoard }}
                className="absolute inset-0 font-display font-bold text-4xl md:text-6xl"
              >
                The whole <span className="text-gradient-hero">canvas.</span>
              </motion.h2>
            </div>
          </div>

          {/* Animated scaling board */}
          <motion.div
            style={{ scale: boardScale, opacity: boardOpacity }}
            className="aspect-square w-[min(70vh,70vw)] origin-center"
          >
            <div className="w-full h-full rounded-md bg-white shadow-[0_30px_120px_-30px_hsl(268_90%_65%/0.5)] ring-1 ring-border overflow-hidden">
              <CanvasGrid pixels={pixels} revision={revision} className="rounded-md" />
            </div>
          </motion.div>

          {/* Bottom hint */}
          <div className="absolute bottom-8 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            10,000 pixels · public · permanent · competitive
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. HOW IT WORKS — visual three-step                           */}
      {/* ============================================================ */}
      <section className="container py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-3">
            how it works
          </div>
          <h2 className="font-display font-bold text-4xl md:text-6xl tracking-tight">
            Three steps. <span className="text-gradient-hero">Total control.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              n: "01",
              title: "Hold $PIXL",
              desc: `Every ${APP_CONFIG.rules.supplyPercentPerPixel}% of supply unlocks 1 pixel of canvas territory.`,
              mood: "idle" as const,
              icon: Wallet,
            },
            {
              n: "02",
              title: "Get pixel control",
              desc: "Connect your wallet. Your token balance becomes your brush capacity in real time.",
              mood: "paint" as const,
              icon: Target,
            },
            {
              n: "03",
              title: "Paint and defend",
              desc: "Claim cells, color your zone, and hold your ground while the canvas evolves.",
              mood: "cheer" as const,
              icon: Trophy,
            },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <NeonCard className="p-7 h-full hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start justify-between mb-6">
                  <span className="font-pixel text-[10px] text-primary">{step.n}</span>
                  <PixlMascot size={56} mood={step.mood} />
                </div>
                <step.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-display font-bold text-2xl mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </NeonCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. TERRITORY / DOMINANCE — top wallets owning the board       */}
      {/* ============================================================ */}
      <section className="relative py-28 border-y border-border bg-card/20">
        <div className="absolute inset-0 grid-bg opacity-[0.05]" />
        <div className="container relative">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-3">
                live dominance
              </div>
              <h2 className="font-display font-bold text-4xl md:text-6xl tracking-tight">
                Who owns the
                <br />
                <span className="text-gradient-hero">board right now.</span>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                Every painted cell is on-chain ownership made visible. The biggest holders carve out the largest zones — and everyone can see it.
              </p>

              <div className="mt-8 space-y-3">
                {stats.top.length === 0
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
                    ))
                  : stats.top.map((entry, i) => {
                      const [c1, c2] = walletGradient(entry.wallet);
                      const pct = (entry.count / APP_CONFIG.canvas.totalPixels) * 100;
                      return (
                        <motion.div
                          key={entry.wallet}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: i * 0.08 }}
                          className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card/40 backdrop-blur"
                        >
                          <div className="font-pixel text-[10px] text-muted-foreground w-6">
                            #{i + 1}
                          </div>
                          <div
                            className="w-10 h-10 rounded-md ring-1 ring-border"
                            style={{
                              background: `linear-gradient(135deg, ${c1}, ${c2})`,
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm truncate">
                              {shortAddress(entry.wallet)}
                            </div>
                            <div className="h-1.5 mt-1.5 rounded-full bg-muted/50 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${Math.min(100, pct * 4)}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.2 + i * 0.08 }}
                                className="h-full rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, ${c1}, ${c2})`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-lg tabular-nums">
                              {entry.count.toLocaleString()}
                            </div>
                            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                              pixels
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
              </div>

              <div className="mt-8">
                <Button asChild variant="outline" size="lg" className="rounded-xl">
                  <Link to="/leaderboard">
                    <Trophy className="w-4 h-4" /> Full leaderboard
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <NeonCard className="aspect-square p-3">
                <CanvasGrid
                  pixels={pixels}
                  revision={revision}
                  highlightWallet={stats.top[0]?.wallet ?? null}
                  className="rounded-md"
                />
              </NeonCard>
              <div className="absolute -top-3 left-3 px-3 py-1.5 rounded-full bg-card border border-border font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <Crown className="w-3 h-3 inline mr-1.5 text-primary" />
                top wallet zone
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. BUY / SELL — token mechanic visualized                     */}
      {/* ============================================================ */}
      <section className="container py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-3">
            the mechanic
          </div>
          <h2 className="font-display font-bold text-4xl md:text-6xl tracking-tight">
            Buy more, control more.
            <br />
            <span className="text-gradient-hero">Sell, and lose ground.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <NeonCard className="p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary font-mono text-[10px] uppercase tracking-[0.2em]">
                  <TrendingUp className="w-3 h-3" /> buy
                </div>
                <PixlMascot size={56} mood="cheer" />
              </div>
              <h3 className="font-display font-bold text-3xl mb-3">Expand your territory</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Every additional 0.01% of supply you accumulate unlocks one more pixel. Stack the bag, paint the wall, dominate the grid.
              </p>
              {/* Mini grid showing territory growing */}
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 60 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.012 }}
                    className="aspect-square rounded-[2px]"
                    style={{
                      background:
                        i < 45
                          ? `hsl(${268 + (i % 8) * 3} 90% ${55 + (i % 4) * 5}%)`
                          : "hsl(var(--muted) / 0.3)",
                    }}
                  />
                ))}
              </div>
            </NeonCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <NeonCard className="p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/15 text-destructive font-mono text-[10px] uppercase tracking-[0.2em]">
                  <TrendingDown className="w-3 h-3" /> sell
                </div>
                <PixlMascot size={56} mood="shock" />
              </div>
              <h3 className="font-display font-bold text-3xl mb-3">Lose the wall</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Sell, and your pixel allowance shrinks. Your territory becomes vulnerable — and someone bigger paints right over it.
              </p>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 60 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1 }}
                    whileInView={{ opacity: i < 18 ? 1 : 0.15 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.012 }}
                    className="aspect-square rounded-[2px]"
                    style={{
                      background:
                        i < 18
                          ? `hsl(${268 + (i % 6) * 3} 70% 55%)`
                          : "hsl(var(--muted) / 0.4)",
                    }}
                  />
                ))}
              </div>
            </NeonCard>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FINAL CTA                                                  */}
      {/* ============================================================ */}
      <section className="container pb-24">
        <NeonCard shimmer className="p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-70" />
          <div className="relative">
            <PixlMascot mood="cheer" size={100} className="mx-auto mb-5" />
            <h2 className="font-display font-bold text-4xl md:text-6xl mb-5 tracking-tight">
              Claim your <span className="text-gradient-hero">corner of the canvas.</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg">
              {APP_CONFIG.canvas.totalPixels.toLocaleString()} pixels. One canvas. Your territory holds as long as you hold $PIXL.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {!isConnected ? (
                <Button
                  size="lg"
                  onClick={() => connect()}
                  disabled={connecting}
                  className="h-14 px-8 bg-gradient-neon glow-primary rounded-xl text-primary-foreground font-semibold"
                >
                  <Wallet className="w-5 h-5" />
                  Connect wallet
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 bg-gradient-neon glow-primary rounded-xl text-primary-foreground font-semibold"
                >
                  <Link to="/canvas">
                    Enter the canvas <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-xl">
                <Link to="/leaderboard">
                  <Trophy className="w-5 h-5" /> See leaders
                </Link>
              </Button>
            </div>
          </div>
        </NeonCard>
      </section>
    </Layout>
  );
}
