import { Layout } from "@/components/Layout";
import { PixlMascot } from "@/components/PixlMascot";
import { LiveTicker } from "@/components/LiveTicker";
import { NeonCard } from "@/components/NeonCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet, Trophy, TrendingUp, TrendingDown, Sparkles, MousePointerClick, Zap } from "lucide-react";
import { useCanvas } from "@/hooks/useCanvas";
import { APP_CONFIG } from "@/config/app";
import { CanvasGrid } from "@/components/CanvasGrid";
import { useWallet } from "@/hooks/useWallet";
import { motion, useScroll, useTransform, useSpring, useInView, MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";
import { shortAddress } from "@/lib/format";
import type { PixelRow } from "@/services/pixels";

/* ------------------------------------------------------------------ */
/* Section heading helper                                             */
/* ------------------------------------------------------------------ */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
      <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal wrapper — fade + lift on enter                              */
/* ------------------------------------------------------------------ */
function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Mini grid — animated pixel cluster used in scroll-storytelling     */
/* ------------------------------------------------------------------ */
function PixelCluster({ progress }: { progress: MotionValue<number> }) {
  // 10x10 abstract cluster that grows / colors-in as user scrolls
  const cells = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);
  const palette = APP_CONFIG.palette;
  return (
    <div className="grid grid-cols-10 gap-[2px] w-full max-w-[420px] aspect-square mx-auto">
      {cells.map((i) => {
        const threshold = (i * 7919) % 100; // pseudo-random distribution
        const opacity = useTransform(progress, [0, 1], [0.05, 1]);
        const scale = useTransform(progress, [0, 1], [0.4, 1]);
        const colorIndex = i % palette.length;
        const fill = palette[colorIndex];
        return (
          <motion.div
            key={i}
            style={{
              backgroundColor: fill,
              opacity: useTransform(progress, (v) => (v * 100 > threshold ? 0.85 : 0.05)),
              scale,
            }}
            className="rounded-[1px]"
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top-holders dominance bars — derived from real pixel data          */
/* ------------------------------------------------------------------ */
function DominanceBoard({ pixels }: { pixels: (PixelRow | null)[] }) {
  const top = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pixels) {
      if (!p?.owner_wallet) continue;
      map.set(p.owner_wallet, (map.get(p.owner_wallet) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [pixels]);

  const seed = top.length > 0
    ? top
    : ([
        ["0x9aeef…canvas", 412],
        ["0x4f1ab…holder", 287],
        ["0x77c2d…pixel", 198],
        ["0x12abc…dao", 142],
        ["0xdead…beef", 96],
      ] as [string, number][]);

  const max = seed[0][1];

  return (
    <div className="space-y-3">
      {seed.map(([wallet, count], i) => {
        const pct = (count / max) * 100;
        return (
          <Reveal key={wallet} delay={i * 0.06}>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground w-6">#{i + 1}</span>
              <span className="font-mono text-xs text-foreground/90 w-32 truncate">{shortAddress(wallet)}</span>
              <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-neon shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                />
              </div>
              <span className="font-mono tabular-nums text-sm text-foreground font-semibold w-16 text-right">
                {count.toLocaleString()}
              </span>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* LANDING                                                            */
/* ================================================================== */
export default function Landing() {
  const { pixels, revision } = useCanvas();
  const { connect, connecting, isConnected } = useWallet();

  const stats = useMemo(() => {
    const painted = pixels.filter((p) => p && p.owner_wallet).length;
    const owners = new Set(pixels.filter((p) => p?.owner_wallet).map((p) => p!.owner_wallet)).size;
    return { painted, owners, pct: (painted / APP_CONFIG.canvas.totalPixels) * 100 };
  }, [pixels, revision]);

  /* ---- HERO scroll-driven parallax ---- */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroCanvasScale = useSpring(useTransform(heroProgress, [0, 1], [1, 1.18]), { stiffness: 80, damping: 20 });
  const heroCanvasY = useTransform(heroProgress, [0, 1], [0, -60]);
  const heroTextY = useTransform(heroProgress, [0, 1], [0, -120]);
  const heroTextOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);
  const heroGlowOpacity = useTransform(heroProgress, [0, 1], [0.7, 0.1]);

  /* ---- NARRATIVE section: pixel → cluster → territory → board ---- */
  const narrativeRef = useRef<HTMLElement>(null);
  const { scrollYProgress: narrativeProgress } = useScroll({
    target: narrativeRef,
    offset: ["start end", "end start"],
  });
  const clusterProgress = useSpring(useTransform(narrativeProgress, [0.1, 0.65], [0, 1]), { stiffness: 60, damping: 22 });
  const zoomScale = useTransform(narrativeProgress, [0, 0.5, 1], [4, 1, 0.85]);
  const zoomLabelStep = useTransform(narrativeProgress, [0, 0.25, 0.5, 0.75, 1], [0, 1, 2, 3, 4]);

  /* ---- BUY/SELL mechanic scroll ---- */
  const mechanicRef = useRef<HTMLElement>(null);
  const { scrollYProgress: mechanicProgress } = useScroll({
    target: mechanicRef,
    offset: ["start end", "end start"],
  });
  const buyBars = useTransform(mechanicProgress, [0.2, 0.6], [0.2, 1]);
  const sellBars = useTransform(mechanicProgress, [0.4, 0.8], [1, 0.15]);

  return (
    <Layout>
      <LiveTicker />

      {/* ============================================================ */}
      {/* 1. HERO — full-screen, parallax, live canvas as the moment  */}
      {/* ============================================================ */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] overflow-hidden border-b border-border/60 flex items-center"
      >
        {/* ambient layers */}
        <motion.div style={{ opacity: heroGlowOpacity }} className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-[0.06] pointer-events-none" />
        <motion.div
          style={{ opacity: heroGlowOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] rounded-full bg-primary/15 blur-[140px] pointer-events-none"
        />
        {/* drifting pixel particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-[1px]"
              style={{
                backgroundColor: APP_CONFIG.palette[i % APP_CONFIG.palette.length],
                left: `${(i * 73) % 100}%`,
                top: `${(i * 41) % 100}%`,
                boxShadow: `0 0 10px ${APP_CONFIG.palette[i % APP_CONFIG.palette.length]}`,
              }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="container relative grid lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] gap-12 lg:gap-20 items-center py-20">
          {/* LEFT — message */}
          <motion.div style={{ y: heroTextY, opacity: heroTextOpacity }} className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <SectionEyebrow>
                live · solana · {APP_CONFIG.canvas.totalPixels.toLocaleString()} pixels
              </SectionEyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 font-display font-bold text-[3rem] sm:text-7xl lg:text-[6.5rem] leading-[0.92] tracking-tight"
            >
              Your wallet.
              <br />
              <span className="text-gradient-hero">Your territory.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-7 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
            >
              A live, on-chain canvas where <span className="text-foreground font-semibold">$PIXL</span> becomes
              public dominance. Every {APP_CONFIG.rules.supplyPercentPerPixel}% of supply = 1 pixel you own,
              recolor, and defend.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              {!isConnected ? (
                <Button
                  size="lg"
                  onClick={() => connect()}
                  disabled={connecting}
                  className="group h-14 px-8 text-base font-semibold bg-gradient-neon text-primary-foreground rounded-xl glow-primary hover:scale-[1.03] active:scale-[0.98] transition-all"
                >
                  <Wallet className="w-5 h-5" />
                  Claim your pixels
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  asChild
                  className="group h-14 px-8 text-base font-semibold bg-gradient-neon text-primary-foreground rounded-xl glow-primary hover:scale-[1.03] transition-all"
                >
                  <Link to="/canvas">
                    Enter the canvas
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-xl border-border hover:bg-muted/40">
                <Link to="/rules">How it works</Link>
              </Button>
            </motion.div>

            {/* live stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-pulse" />
                <span className="font-mono tabular-nums text-foreground font-semibold text-xl">{stats.painted.toLocaleString()}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">painted</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
                <span className="font-mono tabular-nums text-foreground font-semibold text-xl">{stats.owners.toLocaleString()}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">holders</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/60" />
                <span className="font-mono tabular-nums text-foreground font-semibold text-xl">{stats.pct.toFixed(1)}%</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">claimed</span>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT — live canvas, parallax */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ scale: heroCanvasScale, y: heroCanvasY }}
            className="relative mx-auto w-full max-w-[640px]"
          >
            {/* live tag */}
            <div className="absolute -top-3 left-6 z-20 px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_24px_hsl(var(--accent)/0.55)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-foreground mr-1.5 animate-pulse" />
              live · public
            </div>

            {/* corner ticks */}
            {[
              "top-0 left-0 border-t-2 border-l-2",
              "top-0 right-0 border-t-2 border-r-2",
              "bottom-0 left-0 border-b-2 border-l-2",
              "bottom-0 right-0 border-b-2 border-r-2",
            ].map((c) => (
              <span key={c} className={`absolute w-4 h-4 border-primary/70 ${c}`} />
            ))}

            <NeonCard shimmer className="aspect-square p-2.5 glow-primary">
              <CanvasGrid pixels={pixels} revision={revision} className="rounded-md" />
            </NeonCard>

            {/* meta strip */}
            <div className="mt-3 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>100 × 100 board</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                updating in real time
              </span>
            </div>

            {/* MASCOT — UNCHANGED, repositioned */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-8 hidden md:block"
            >
              <PixlMascot mood="wave" size={120} />
            </motion.div>
          </motion.div>
        </div>

        {/* scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground font-mono text-[10px] uppercase tracking-[0.3em]"
        >
          <span>scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-primary to-transparent"
          />
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/* 2. NARRATIVE — pixel → cluster → territory → board → dom    */}
      {/* ============================================================ */}
      <section ref={narrativeRef} className="relative">
        <div className="sticky top-0 h-[100svh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-30" />
          <div className="container relative grid lg:grid-cols-2 gap-10 items-center">
            {/* LEFT — animated visual */}
            <div className="relative flex items-center justify-center min-h-[420px]">
              <motion.div style={{ scale: zoomScale }} className="relative">
                <PixelCluster progress={clusterProgress} />
              </motion.div>
              {/* corner crosshair */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/20" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20" />
              </div>
            </div>

            {/* RIGHT — labels that step through */}
            <div className="space-y-6">
              <SectionEyebrow>the unfold</SectionEyebrow>
              <h2 className="font-display font-bold text-4xl md:text-6xl leading-[0.95] tracking-tight">
                One pixel.
                <br />
                <span className="text-gradient-hero">A whole territory.</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                Watch how a single token holder turns into a visible, on-chain force on the canvas — pixel by pixel.
              </p>

              <div className="space-y-2 pt-4">
                {["Pixel", "Cluster", "Territory", "Board", "Dominance"].map((label, i) => {
                  const active = useTransform(zoomLabelStep, (v) => Math.round(v) === i);
                  return (
                    <motion.div
                      key={label}
                      style={{ opacity: useTransform(active, (a) => (a ? 1 : 0.35)) }}
                      className="flex items-center gap-3"
                    >
                      <motion.span
                        style={{ scaleX: useTransform(active, (a) => (a ? 1 : 0.4)) }}
                        className="origin-left h-px w-12 bg-gradient-neon"
                      />
                      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-foreground">{label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* spacer to give scroll runway */}
        <div className="h-[120vh]" />
      </section>

      {/* ============================================================ */}
      {/* 3. HOW IT WORKS — visual 3-step                              */}
      {/* ============================================================ */}
      <section className="relative border-t border-border/60 py-28">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <SectionEyebrow>how it works</SectionEyebrow>
              <h2 className="mt-5 font-display font-bold text-4xl md:text-6xl leading-tight">
                Three moves to <span className="text-gradient-hero">claim the board</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                icon: <Wallet className="w-5 h-5" />,
                title: "Hold $PIXL",
                desc: `Every ${APP_CONFIG.rules.supplyPercentPerPixel}% of supply unlocks 1 pixel of public territory.`,
                visual: (
                  <div className="grid grid-cols-6 gap-1 mt-6">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.4 }}
                        whileInView={{ opacity: i < 8 ? 1 : 0.2, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.02 }}
                        className="aspect-square rounded-[2px]"
                        style={{
                          backgroundColor: i < 8 ? APP_CONFIG.palette[i % APP_CONFIG.palette.length] : "hsl(var(--muted))",
                          boxShadow: i < 8 ? `0 0 8px ${APP_CONFIG.palette[i % APP_CONFIG.palette.length]}55` : "none",
                        }}
                      />
                    ))}
                  </div>
                ),
              },
              {
                n: "02",
                icon: <MousePointerClick className="w-5 h-5" />,
                title: "Paint your claim",
                desc: "Pick a color, click a cell. Your mark lands instantly on a public, on-chain board.",
                visual: (
                  <div className="relative mt-6 aspect-square rounded-md bg-card/40 border border-border overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-12 gap-px p-2">
                      {Array.from({ length: 144 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ backgroundColor: "transparent" }}
                          whileInView={{ backgroundColor: APP_CONFIG.palette[(i * 3) % APP_CONFIG.palette.length] }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.2, delay: i * 0.008 }}
                          className="rounded-[1px]"
                        />
                      ))}
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 }}
                      className="absolute bottom-3 right-3"
                    >
                      <MousePointerClick className="w-6 h-6 text-accent drop-shadow-[0_0_8px_hsl(var(--accent))]" />
                    </motion.div>
                  </div>
                ),
              },
              {
                n: "03",
                icon: <Trophy className="w-5 h-5" />,
                title: "Defend & dominate",
                desc: "Hold to keep your pixels. Sell and lose them. Climb the public leaderboard.",
                visual: (
                  <div className="mt-6 space-y-2">
                    {[80, 60, 38, 22].map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground w-4">#{i + 1}</span>
                        <div className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${w}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full bg-gradient-neon"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <NeonCard className="p-7 h-full hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-primary">
                      {s.icon}
                      <span className="font-pixel text-[10px]">{s.n}</span>
                    </div>
                    <Sparkles className="w-4 h-4 text-accent/70" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  {s.visual}
                </NeonCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. DOMINANCE — top wallets, real data                        */}
      {/* ============================================================ */}
      <section className="relative border-t border-border/60 py-28 overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow opacity-40" />
        <div className="container relative grid lg:grid-cols-[minmax(0,520px)_1fr] gap-14 items-center">
          <Reveal>
            <div>
              <SectionEyebrow>dominance</SectionEyebrow>
              <h2 className="mt-5 font-display font-bold text-4xl md:text-6xl leading-tight">
                The board has
                <br />
                <span className="text-gradient-hero">a king.</span>
              </h2>
              <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-md">
                Every wallet's grip on the canvas is public, visible, and contestable. The biggest holders own the
                biggest zones — until someone takes them.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 px-6 rounded-xl bg-gradient-neon text-primary-foreground glow-primary">
                  <Link to="/leaderboard"><Trophy className="w-4 h-4" /> See the leaderboard</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6 rounded-xl">
                  <Link to="/canvas">View live board</Link>
                </Button>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <NeonCard className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">top holders</div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  live
                </div>
              </div>
              <DominanceBoard pixels={pixels} />
            </NeonCard>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. BUY/SELL MECHANIC                                         */}
      {/* ============================================================ */}
      <section ref={mechanicRef} className="relative border-t border-border/60 py-28">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <SectionEyebrow>token mechanic</SectionEyebrow>
              <h2 className="mt-5 font-display font-bold text-4xl md:text-6xl leading-tight">
                Buy. Hold. <span className="text-gradient-hero">Win territory.</span>
              </h2>
              <p className="mt-5 text-muted-foreground text-lg">
                Or sell — and watch your pixels go back to the void.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* BUY */}
            <Reveal>
              <NeonCard glow="primary" className="p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.25em]">
                    <TrendingUp className="w-4 h-4" /> buy more
                  </div>
                  <span className="font-pixel text-[9px] text-primary">+control</span>
                </div>
                <h3 className="font-display font-bold text-3xl mb-2">More tokens, more pixels.</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Each {APP_CONFIG.rules.supplyPercentPerPixel}% of supply you accumulate adds another claimable cell to your wallet.
                </p>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <motion.div
                      key={i}
                      style={{
                        opacity: useTransform(buyBars, (v) => (i / 60 < v ? 1 : 0.08)),
                        backgroundColor: APP_CONFIG.palette[i % APP_CONFIG.palette.length],
                      }}
                      className="aspect-square rounded-[1px]"
                    />
                  ))}
                </div>
              </NeonCard>
            </Reveal>

            {/* SELL */}
            <Reveal delay={0.1}>
              <NeonCard className="p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-destructive font-mono text-xs uppercase tracking-[0.25em]">
                    <TrendingDown className="w-4 h-4" /> sell
                  </div>
                  <span className="font-pixel text-[9px] text-destructive">-territory</span>
                </div>
                <h3 className="font-display font-bold text-3xl mb-2">Sell, and the board forgets you.</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Drop below the threshold and your pixels become claimable again. Territory you can't defend, you don't keep.
                </p>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <motion.div
                      key={i}
                      style={{
                        opacity: useTransform(sellBars, (v) => (i / 60 < v ? 1 : 0.08)),
                        backgroundColor: APP_CONFIG.palette[i % APP_CONFIG.palette.length],
                      }}
                      className="aspect-square rounded-[1px]"
                    />
                  ))}
                </div>
              </NeonCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FINAL CTA                                                 */}
      {/* ============================================================ */}
      <section className="container py-28">
        <Reveal>
          <NeonCard shimmer className="relative overflow-hidden p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-radial-glow opacity-70" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full border border-primary/10"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full border border-accent/10"
            />

            <div className="relative">
              {/* MASCOT — UNCHANGED */}
              <PixlMascot mood="cheer" size={100} className="mx-auto mb-6" />

              <h2 className="font-display font-bold text-4xl md:text-6xl leading-tight">
                Ten thousand pixels.
                <br />
                <span className="text-gradient-hero">One canvas. One king.</span>
              </h2>
              <p className="mt-5 text-muted-foreground max-w-lg mx-auto text-lg">
                Connect your wallet. Take your pixels. Defend them in front of everyone.
              </p>

              <div className="mt-10 flex flex-wrap gap-3 justify-center">
                {!isConnected ? (
                  <Button
                    onClick={() => connect()}
                    disabled={connecting}
                    size="lg"
                    className="h-14 px-8 bg-gradient-neon glow-primary rounded-xl text-primary-foreground font-semibold"
                  >
                    <Wallet className="w-5 h-5" /> Connect wallet
                  </Button>
                ) : (
                  <Button asChild size="lg" className="h-14 px-8 bg-gradient-neon glow-primary rounded-xl text-primary-foreground font-semibold">
                    <Link to="/canvas"><Zap className="w-5 h-5" /> Enter the canvas</Link>
                  </Button>
                )}
                <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-xl">
                  <Link to="/leaderboard"><Trophy className="w-5 h-5" /> Leaderboard</Link>
                </Button>
              </div>
            </div>
          </NeonCard>
        </Reveal>
      </section>
    </Layout>
  );
}
