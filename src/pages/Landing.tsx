import { Layout } from "@/components/Layout";
import { PixlMascot } from "@/components/PixlMascot";
import { LiveTicker } from "@/components/LiveTicker";
import { NeonCard } from "@/components/NeonCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet, Trophy, TrendingUp, TrendingDown, MousePointerClick, Zap, Crown, Eye } from "lucide-react";
import { useCanvas } from "@/hooks/useCanvas";
import { APP_CONFIG } from "@/config/app";
import { CanvasGrid } from "@/components/CanvasGrid";
import { ScrollStoryCanvas } from "@/components/ScrollStoryCanvas";
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
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
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
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
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
              <span className="font-mono text-[10px] text-muted-foreground w-6">
                {i === 0 ? <Crown className="w-3 h-3 text-accent inline" /> : `#${i + 1}`}
              </span>
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

/* ------------------------------------------------------------------ */
/* Cinematic stage — pinned scroll, single canvas zooming through     */
/* progressively revealed scales (pixel → cluster → board → dom)      */
/* ------------------------------------------------------------------ */
const STAGES = [
  { key: "pixel", label: "01 · Pixel", title: "One pixel.", sub: "0.01% of supply. A single on-chain cell, yours to color." },
  { key: "cluster", label: "02 · Cluster", title: "A cluster.", sub: "Stack tokens. Stack pixels. Build a recognizable mark." },
  { key: "territory", label: "03 · Territory", title: "Territory.", sub: "Hundreds of cells. A region of the board with your name on it." },
  { key: "board", label: "04 · The Board", title: "The board.", sub: "10,000 pixels. One public, live, contestable canvas." },
  { key: "dominance", label: "05 · Dominance", title: "Dominance.", sub: "The biggest wallet rules the most pixels — until someone takes them." },
];

function CinematicNarrative() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // 5 stages → scale from 18x (single pixel zoom) → 1x (whole board) → 0.95x
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.25, 0.55, 0.8, 1], [22, 8, 2.2, 1, 0.95]), {
    stiffness: 60,
    damping: 24,
  });
  // Pan slightly while zooming
  const x = useTransform(scrollYProgress, [0, 1], ["18%", "0%"]);
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "0%"]);
  const vignette = useTransform(scrollYProgress, [0, 0.3, 1], [0.85, 0.5, 0.25]);
  const stageIndex = useTransform(scrollYProgress, (v) => Math.min(STAGES.length - 1, Math.floor(v * STAGES.length * 0.999)));

  return (
    <section ref={ref} className="relative" style={{ height: `${STAGES.length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        {/* ambient grid */}
        <div className="absolute inset-0 grid-bg opacity-[0.05]" />
        <div className="absolute inset-0 bg-radial-glow opacity-40" />

        {/* the zooming canvas */}
        <motion.div
          style={{ scale, x, y }}
          className="absolute inset-0 flex items-center justify-center will-change-transform"
        >
          <div className="aspect-square w-[min(82vh,82vw)] rounded-md overflow-hidden ring-1 ring-primary/30 shadow-[0_0_120px_hsl(var(--primary)/0.35)] bg-[#06040d]">
            <ScrollStoryCanvas />
          </div>
        </motion.div>

        {/* vignette overlay (deep at the closest zoom for cinematic feel) */}
        <motion.div
          style={{ opacity: vignette }}
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,hsl(var(--background))_85%)]" />
        </motion.div>

        {/* HUD — top */}
        <div className="absolute top-6 left-0 right-0 px-6 md:px-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground z-10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            story · field
          </div>
          <motion.div>
            {STAGES.map((s, i) => (
              <motion.span
                key={s.key}
                style={{ opacity: useTransform(stageIndex, (v) => (v === i ? 1 : 0.25)) }}
                className="ml-3 first:ml-0"
              >
                {s.label.split(" ")[0]}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* HUD — bottom: stage title */}
        <div className="absolute bottom-0 left-0 right-0 pb-12 md:pb-16 px-6 md:px-12 z-10">
          <div className="container">
            {STAGES.map((s, i) => {
              const opacity = useTransform(stageIndex, (v) => (v === i ? 1 : 0));
              const yOff = useTransform(stageIndex, (v) => (v === i ? 0 : 16));
              return (
                <motion.div
                  key={s.key}
                  style={{ opacity, y: yOff, position: "absolute", left: 0, right: 0, bottom: 48 }}
                  className="px-6 md:px-12"
                >
                  <div className="container">
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">{s.label}</div>
                    <h3 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight max-w-4xl">
                      {s.title}
                    </h3>
                    <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl">{s.sub}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* progress rail */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3 z-10">
          {STAGES.map((s, i) => (
            <motion.span
              key={s.key}
              style={{
                opacity: useTransform(stageIndex, (v) => (v === i ? 1 : 0.25)),
                scaleY: useTransform(stageIndex, (v) => (v === i ? 1 : 0.6)),
              }}
              className="block w-px h-8 bg-foreground origin-center"
            />
          ))}
        </div>
      </div>
    </section>
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
  const heroCanvasScale = useSpring(useTransform(heroProgress, [0, 1], [1, 1.35]), { stiffness: 80, damping: 20 });
  const heroCanvasY = useTransform(heroProgress, [0, 1], [0, -120]);
  const heroTextY = useTransform(heroProgress, [0, 1], [0, -180]);
  const heroTextOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);
  const heroGlowOpacity = useTransform(heroProgress, [0, 1], [0.7, 0.05]);
  const heroBgY = useTransform(heroProgress, [0, 1], [0, 200]);

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
      {/* 1. HERO — full-bleed cinematic                              */}
      {/* ============================================================ */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] overflow-hidden border-b border-border/60 flex items-center"
      >
        {/* ambient layers */}
        <motion.div style={{ opacity: heroGlowOpacity, y: heroBgY }} className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-[0.06] pointer-events-none" />
        <motion.div
          style={{ opacity: heroGlowOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[920px] h-[920px] rounded-full bg-primary/15 blur-[160px] pointer-events-none"
        />

        {/* drifting pixel particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-[1px]"
              style={{
                backgroundColor: APP_CONFIG.palette[i % APP_CONFIG.palette.length],
                left: `${(i * 73) % 100}%`,
                top: `${(i * 41) % 100}%`,
                boxShadow: `0 0 10px ${APP_CONFIG.palette[i % APP_CONFIG.palette.length]}`,
              }}
              animate={{ y: [0, -40, 0], opacity: [0.15, 0.7, 0.15] }}
              transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="container relative grid lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] gap-12 lg:gap-20 items-center py-20">
          {/* LEFT — message */}
          <motion.div style={{ y: heroTextY, opacity: heroTextOpacity }} className="relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <SectionEyebrow>
                live · solana · {APP_CONFIG.canvas.totalPixels.toLocaleString()} pixels
              </SectionEyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 font-display font-bold text-[3.2rem] sm:text-7xl lg:text-[7.5rem] leading-[0.88] tracking-[-0.03em]"
            >
              Your wallet.
              <br />
              <span className="text-gradient-hero">Your territory.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="mt-7 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
            >
              A live, on-chain canvas where <span className="text-foreground font-semibold">$PIXL</span> becomes
              public dominance. Every {APP_CONFIG.rules.supplyPercentPerPixel}% of supply = 1 pixel you own,
              recolor, and defend.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.75 }}
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
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ scale: heroCanvasScale, y: heroCanvasY }}
            className="relative mx-auto w-full max-w-[640px]"
          >
            <div className="absolute -top-3 left-6 z-20 px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_24px_hsl(var(--accent)/0.55)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-foreground mr-1.5 animate-pulse" />
              live · public
            </div>

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

            <div className="mt-3 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>100 × 100 board</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                updating in real time
              </span>
            </div>

            {/* MASCOT — UNCHANGED */}
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
          <span>scroll to enter</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-primary to-transparent"
          />
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/* 2. CINEMATIC NARRATIVE — pinned scroll-zoom through stages  */}
      {/* ============================================================ */}
      <CinematicNarrative />

      {/* ============================================================ */}
      {/* 3. HOW IT WORKS — visual 3-step                              */}
      {/* ============================================================ */}
      <section className="relative border-t border-border/60 py-32">
        <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />
        <div className="container relative">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-20">
              <SectionEyebrow>how it works</SectionEyebrow>
              <h2 className="mt-5 font-display font-bold text-5xl md:text-7xl leading-[0.95] tracking-tight">
                Three moves.
                <br />
                <span className="text-gradient-hero">Claim the board.</span>
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
                  <div className="relative mt-6 aspect-square rounded-md bg-white border border-border overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-12 gap-px p-2">
                      {Array.from({ length: 144 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
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
                      <MousePointerClick className="w-6 h-6 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
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
                    <Eye className="w-4 h-4 text-accent/70" />
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
      <section className="relative border-t border-border/60 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow opacity-40" />
        <div className="container relative grid lg:grid-cols-[minmax(0,520px)_1fr] gap-14 items-center">
          <Reveal>
            <div>
              <SectionEyebrow>dominance</SectionEyebrow>
              <h2 className="mt-5 font-display font-bold text-5xl md:text-7xl leading-[0.95] tracking-tight">
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
      <section ref={mechanicRef} className="relative border-t border-border/60 py-32">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <SectionEyebrow>token mechanic</SectionEyebrow>
              <h2 className="mt-5 font-display font-bold text-5xl md:text-7xl leading-[0.95] tracking-tight">
                Buy. Hold. <span className="text-gradient-hero">Win territory.</span>
              </h2>
              <p className="mt-5 text-muted-foreground text-lg">
                Or sell — and watch your pixels go back to the void.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
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
      {/* 6. FINAL CTA — full bleed                                    */}
      {/* ============================================================ */}
      <section className="relative border-t border-border/60 min-h-[90svh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow opacity-80" />
        <div className="absolute inset-0 grid-bg opacity-[0.05]" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full border border-primary/10"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full border border-accent/10"
        />

        <div className="container relative text-center py-24">
          <Reveal>
            {/* MASCOT — UNCHANGED */}
            <PixlMascot mood="cheer" size={120} className="mx-auto mb-8" />

            <SectionEyebrow>the canvas is live</SectionEyebrow>

            <h2 className="mt-6 font-display font-bold text-6xl md:text-8xl lg:text-9xl leading-[0.88] tracking-[-0.03em]">
              Ten thousand pixels.
              <br />
              <span className="text-gradient-hero">One king.</span>
            </h2>
            <p className="mt-8 text-muted-foreground max-w-xl mx-auto text-lg md:text-xl">
              Connect your wallet. Take your pixels. Defend them in front of everyone.
            </p>

            <div className="mt-12 flex flex-wrap gap-3 justify-center">
              {!isConnected ? (
                <Button
                  onClick={() => connect()}
                  disabled={connecting}
                  size="lg"
                  className="h-16 px-10 text-base bg-gradient-neon glow-primary rounded-xl text-primary-foreground font-semibold"
                >
                  <Wallet className="w-5 h-5" /> Connect wallet
                </Button>
              ) : (
                <Button asChild size="lg" className="h-16 px-10 text-base bg-gradient-neon glow-primary rounded-xl text-primary-foreground font-semibold">
                  <Link to="/canvas"><Zap className="w-5 h-5" /> Enter the canvas</Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="h-16 px-10 text-base rounded-xl">
                <Link to="/leaderboard"><Trophy className="w-5 h-5" /> Leaderboard</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
