import { Layout } from "@/components/Layout";
import { PixlMascot } from "@/components/PixlMascot";
import { NeonCard } from "@/components/NeonCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet, Trophy, TrendingUp, TrendingDown, MousePointerClick, Zap, Crown, Eye } from "lucide-react";
import { useCanvas } from "@/hooks/useCanvas";
import { APP_CONFIG } from "@/config/app";
import { CanvasPreview } from "@/components/CanvasPreview";
import { ScrollStoryCanvas } from "@/components/ScrollStoryCanvas";
import { LaunchStatusBanner } from "@/components/LaunchStatusBanner";
import { RoundSystemSection } from "@/components/RoundSystem";
import { useWallet } from "@/hooks/useWallet";
import { useLaunchState } from "@/hooks/useLaunchState";
import { getWalletConnectionErrorMessage } from "@/services/wallet";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, useSpring, useInView, type MotionValue } from "framer-motion";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { shortAddress } from "@/lib/format";
import type { PixelRow } from "@/services/pixels";
import { toast } from "sonner";

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
/* progressively revealed scales (pixel → foothold → board → dom)     */
/* ------------------------------------------------------------------ */
const STAGES = [
  { key: "pixel", label: "01 · Pixel", title: "One pixel.", sub: "0.01% of supply. A single on-chain cell, yours to color and defend." },
  { key: "foothold", label: "02 · Foothold", title: "A foothold.", sub: "Stack tokens. Stack pixels. Build a position the whole board can recognize." },
  { key: "territory", label: "03 · Territory", title: "Territory.", sub: "Hundreds of cells under one wallet. A region of the canvas with your name on it." },
  { key: "board", label: "04 · The Board", title: "The board.", sub: "10,000 pixels. One public, live, contestable canvas for every round." },
  { key: "dominance", label: "05 · The Prize", title: "Win the spotlight.", sub: "Whoever rules the most pixels wins a real ad slot on the homepage. Real visibility. Real exposure. Promote your project to everyone who lands on Pixel Battle." },
];

const MOBILE_STORY_CARDS = [
  {
    number: "01",
    title: "Pixel",
    copy: `0.01% of supply gives you 1 pixel of territory.`,
  },
  {
    number: "02",
    title: "Foothold",
    copy: "Buy more $PIXL to expand your position.",
  },
  {
    number: "03",
    title: "Territory",
    copy: "Your pixels become visible public land.",
  },
  {
    number: "04",
    title: "The Board",
    copy: `10,000 pixels. One live canvas.`,
  },
  {
    number: "05",
    title: "The Prize",
    copy: "Top players earn status, leaderboard position and visibility.",
  },
] as const;

const MECHANIC_PIXEL_COUNT = 60;
const MECHANIC_PIXEL_INDICES = Array.from({ length: MECHANIC_PIXEL_COUNT }, (_, index) => index);

function MechanicPixelCell({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const opacity = useTransform(progress, (value) => (index / MECHANIC_PIXEL_COUNT < value ? 1 : 0.08));

  return (
    <motion.div
      style={{
        opacity,
        backgroundColor: APP_CONFIG.palette[index % APP_CONFIG.palette.length],
      }}
      className="aspect-square rounded-[1px]"
    />
  );
}

const CINEMATIC_STAGE_HEIGHT_VH = 128;

const CinematicNarrative = memo(function CinematicNarrative() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [activeStage, setActiveStage] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const [isMobileNarrative, setIsMobileNarrative] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 1024px), (pointer: coarse)");
    const update = () => setIsMobileNarrative(mediaQuery.matches);
    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  const lightweightMode = prefersReducedMotion || isMobileNarrative;

  // Smooth the raw scroll progress first — produces buttery motion across all derived values
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: lightweightMode ? 88 : 104,
    damping: lightweightMode ? 25 : 30,
    mass: lightweightMode ? 0.45 : 0.52,
    restDelta: 0.0005,
  });

  // 5 stages → focused on a single cell → foothold → territory → board → settled wide
  // Curve eased for cinematic deceleration as we pull back
  const scaleRaw = useTransform(
    smoothProgress,
    [0, 0.18, 0.4, 0.62, 0.82, 1],
    lightweightMode ? [2.05, 1.7, 1.34, 1.08, 0.98, 0.94] : [2.45, 1.96, 1.46, 1.12, 0.98, 0.9],
  );
  const scale = useSpring(scaleRaw, {
    stiffness: lightweightMode ? 60 : 68,
    damping: lightweightMode ? 23 : 25,
    mass: lightweightMode ? 0.4 : 0.48,
  });

  const x = useTransform(smoothProgress, [0, 0.45, 1], lightweightMode ? ["5%", "1%", "0%"] : ["8%", "2%", "0%"]);
  const y = useTransform(smoothProgress, [0, 0.45, 1], lightweightMode ? ["-5%", "-1%", "0%"] : ["-8%", "-2%", "0%"]);
  const haloOpacity = useTransform(smoothProgress, [0, 0.16, 0.75, 1], lightweightMode ? [0.08, 0.14, 0.12, 0.06] : [0.14, 0.24, 0.18, 0.1]);
  const currentStage = STAGES[activeStage];

  useMotionValueEvent(smoothProgress, "change", (value) => {
    const nextStage = Math.min(STAGES.length - 1, Math.floor(value * STAGES.length * 0.999));
    setActiveStage((prev) => (prev === nextStage ? prev : nextStage));
  });

  return (
    <section ref={ref} className="relative isolate" style={{ height: `${STAGES.length * (lightweightMode ? 112 : CINEMATIC_STAGE_HEIGHT_VH)}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background isolate">
        {/* ambient grid */}
        <div className="absolute inset-0 grid-bg opacity-[0.04]" />
        <div className={lightweightMode ? "absolute inset-0 bg-radial-glow opacity-20" : "absolute inset-0 bg-radial-glow opacity-28"} />

        {/* the zooming canvas */}
        <motion.div
          style={{ scale, x, y, willChange: "transform", backfaceVisibility: "hidden" }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center transform-gpu"
        >
          <motion.div
            style={{ opacity: haloOpacity, willChange: "opacity" }}
            className={`absolute aspect-square rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.22)_0%,hsl(var(--accent)/0.14)_38%,transparent_72%)] ${lightweightMode ? "hidden" : "w-[min(76vh,76vw)] blur-[26px]"}`}
            aria-hidden
          />
          <div className={`scanlines relative aspect-square w-[min(82vh,82vw)] overflow-hidden rounded-md bg-[#06040d] ring-1 ring-primary/35 [backface-visibility:hidden] [contain:layout_paint_style] transform-gpu ${lightweightMode ? "shadow-[0_0_16px_hsl(var(--accent)/0.12)]" : "shadow-[0_0_22px_hsl(var(--accent)/0.16),0_0_54px_hsl(var(--primary)/0.18)]"}`}>
            <ScrollStoryCanvas />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_54%,hsl(var(--background)/0.42)_100%)]" aria-hidden />
            <div className={`pointer-events-none absolute inset-2 rounded border border-white/10 ${lightweightMode ? "" : "shadow-[inset_0_0_16px_hsl(var(--primary)/0.1)]"}`} aria-hidden />
            <div className="pointer-events-none absolute left-4 top-4 h-10 w-10 border-l border-t border-accent/70" aria-hidden />
            <div className="pointer-events-none absolute right-4 top-4 h-10 w-10 border-r border-t border-accent/70" aria-hidden />
            <div className="pointer-events-none absolute bottom-4 left-4 h-10 w-10 border-b border-l border-accent/70" aria-hidden />
            <div className="pointer-events-none absolute bottom-4 right-4 h-10 w-10 border-b border-r border-accent/70" aria-hidden />
          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,hsl(var(--background)/0.88)_100%)]" aria-hidden />

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background via-background/75 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/75 to-transparent"
          aria-hidden
        />

        {/* HUD — top */}
        <div className="absolute top-6 left-0 right-0 px-6 md:px-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground z-10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            story · field
          </div>
          <div>
            {STAGES.map((s, i) => (
              <span
                key={s.key}
                style={{ opacity: activeStage === i ? 1 : 0.25 }}
                className="ml-3 first:ml-0 transition-opacity duration-200"
              >
                {s.label.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>

        {/* Center text scrim — stronger, keeps copy crisply readable over the board */}
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_70%_55%_at_50%_50%,hsl(var(--background)/0.92)_0%,hsl(var(--background)/0.78)_38%,hsl(var(--background)/0.4)_65%,transparent_82%)]"
          aria-hidden
        />

        {/* HERO STAGE TEXT — centered, dominant */}
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 md:px-12">
          <motion.div
            key={currentStage.key}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: lightweightMode ? 0.34 : 0.46, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-3xl px-4 py-5 text-center"
          >
            {/* Soft solid backing panel directly behind text for guaranteed legibility */}
            <div
              aria-hidden
              className={`pointer-events-none absolute -inset-x-10 -inset-y-8 md:-inset-x-16 md:-inset-y-12 -z-10 rounded-[2rem] ring-1 ring-white/5 ${lightweightMode ? "bg-background/76" : "bg-background/68 shadow-[0_18px_42px_-24px_hsl(var(--background))]"}`}
              style={{ maskImage: "radial-gradient(ellipse at center, black 55%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 55%, transparent 100%)" }}
            />
            <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.4em] text-accent drop-shadow-[0_0_12px_hsl(var(--accent)/0.6)] md:text-xs">
              {currentStage.label}
            </div>
            <h3
              className={`font-display font-bold tracking-tight text-gradient-hero ${lightweightMode ? "text-5xl leading-[0.95] md:text-7xl lg:text-[7rem]" : "text-6xl leading-[0.92] md:text-8xl lg:text-[8.5rem]"}`}
              style={{
                textShadow: lightweightMode
                  ? "0 2px 12px hsl(var(--background) / 0.92), 0 0 14px hsl(var(--accent) / 0.18), 0 0 24px hsl(var(--primary) / 0.34), 0 0 42px hsl(var(--primary) / 0.18)"
                  : "0 2px 16px hsl(var(--background) / 0.94), 0 0 18px hsl(var(--accent) / 0.22), 0 0 34px hsl(var(--primary) / 0.46), 0 0 68px hsl(var(--primary) / 0.24)",
              }}
            >
              {currentStage.title}
            </h3>
            <p
              className="mx-auto mt-7 max-w-2xl text-lg font-medium leading-snug text-foreground md:text-2xl"
              style={{ textShadow: lightweightMode ? "0 1px 2px hsl(var(--background)), 0 0 18px hsl(var(--background) / 0.9)" : "0 1px 2px hsl(var(--background)), 0 2px 16px hsl(var(--background) / 0.95), 0 0 32px hsl(var(--background))" }}
            >
              {currentStage.sub}
            </p>
            {currentStage.key === "dominance" && (
              <div className={`mt-8 inline-flex items-center gap-2 rounded-full border border-accent/50 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-accent md:text-xs ${lightweightMode ? "bg-background/74 shadow-[0_0_14px_hsl(var(--accent)/0.18)]" : "bg-background/72 shadow-[0_0_18px_hsl(var(--accent)/0.22)]"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                winner gets the homepage ad slot
              </div>
            )}
          </motion.div>
        </div>

        {/* progress rail */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3 z-10">
          {STAGES.map((stage, i) => (
            <span
              key={stage.key}
              style={{ opacity: activeStage === i ? 1 : 0.25, transform: `scaleY(${activeStage === i ? 1 : 0.6})` }}
              className="block w-px h-8 bg-foreground origin-center transition-opacity duration-200"
            />
          ))}
        </div>
      </div>
    </section>
  );
});

function MobileStoryCards() {
  return (
    <section
      className="relative border-t border-border/60 py-16 md:py-20"
      style={{ contentVisibility: "auto", containIntrinsicSize: "920px" }}
    >
      <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />
      <div className="container relative">
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <SectionEyebrow>from token to territory</SectionEyebrow>
            <h2 className="mt-5 font-display text-4xl font-bold leading-[0.96] tracking-tight sm:text-5xl">
              Five steps.
              <br />
              <span className="text-gradient-hero">One live board.</span>
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              The mobile version explains the territory game fast. Desktop is where painting really opens up.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 space-y-4">
          {MOBILE_STORY_CARDS.map((card, index) => (
            <Reveal key={card.number} delay={index * 0.05} y={18}>
              <NeonCard className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    {card.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent)/0.6)]" />
                      <h3 className="font-display text-2xl font-bold tracking-tight">{card.title}</h3>
                    </div>
                    <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                      {card.copy}
                    </p>
                  </div>
                </div>
              </NeonCard>
            </Reveal>
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
  const launch = useLaunchState();
  const prefersReducedMotion = useReducedMotion();
  const [lightweightHero, setLightweightHero] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 1024px), (pointer: coarse)");
    const update = () => setLightweightHero(mediaQuery.matches || prefersReducedMotion);
    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, [prefersReducedMotion]);

  const heroParticles = useMemo(
    () => Array.from({ length: lightweightHero ? 5 : 12 }, (_, index) => index),
    [lightweightHero],
  );

  const stats = useMemo(() => {
    const painted = pixels.filter((p) => p && p.owner_wallet).length;
    const owners = new Set(pixels.filter((p) => p?.owner_wallet).map((p) => p!.owner_wallet)).size;
    return { painted, owners, pct: (painted / APP_CONFIG.canvas.totalPixels) * 100 };
  }, [pixels]);

  /* ---- HERO scroll-driven parallax ---- */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroCanvasScale = useSpring(useTransform(heroProgress, [0, 1], lightweightHero ? [1, 1.18] : [1, 1.28]), { stiffness: 78, damping: 22 });
  const heroCanvasY = useTransform(heroProgress, [0, 1], [0, lightweightHero ? -72 : -96]);
  const heroTextY = useTransform(heroProgress, [0, 1], [0, lightweightHero ? -120 : -160]);
  const heroTextOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);
  const heroGlowOpacity = useTransform(heroProgress, [0, 1], lightweightHero ? [0.32, 0.08] : [0.52, 0.08]);
  const heroBgY = useTransform(heroProgress, [0, 1], [0, lightweightHero ? 96 : 140]);

  /* ---- BUY/SELL mechanic scroll ---- */
  const mechanicRef = useRef<HTMLElement>(null);
  const { scrollYProgress: mechanicProgress } = useScroll({
    target: mechanicRef,
    offset: ["start end", "end start"],
  });
  const buyBars = useTransform(mechanicProgress, [0.2, 0.6], [0.2, 1]);
  const sellBars = useTransform(mechanicProgress, [0.4, 0.8], [1, 0.15]);

  const handleConnectClick = async () => {
    try {
      const connectedWallet = await connect();
      toast.success("Wallet connected", {
        description: shortAddress(connectedWallet.address),
      });
    } catch (error) {
      toast.error("Failed to connect", {
        description: getWalletConnectionErrorMessage(error),
      });
    }
  };

  return (
    <Layout>
      {/* ============================================================ */}
      {/* 0. ROUND COUNTDOWN BANNER — round-system intro                */}
      {/* ============================================================ */}
      <LaunchStatusBanner />

      {/* ============================================================ */}
      {/* 1. HERO — full-bleed cinematic                              */}
      {/* ============================================================ */}
      <section
        ref={heroRef}
        className="relative flex min-h-[calc(100svh-3.5rem)] items-center overflow-hidden border-b border-border/60 md:min-h-[100svh]"
      >
        {/* ambient layers */}
        <motion.div style={{ opacity: heroGlowOpacity, y: heroBgY }} className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-[0.06] pointer-events-none" />
        <motion.div
          style={{ opacity: heroGlowOpacity }}
          className={lightweightHero
            ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full bg-primary/10 blur-[88px] pointer-events-none"
            : "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full bg-primary/12 blur-[104px] pointer-events-none"}
        />

        {/* drifting pixel particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {heroParticles.map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-[1px]"
              style={{
                width: lightweightHero ? 4 : 6,
                height: lightweightHero ? 4 : 6,
                backgroundColor: APP_CONFIG.palette[i % APP_CONFIG.palette.length],
                left: `${(i * 73) % 100}%`,
                top: `${(i * 41) % 100}%`,
                boxShadow: lightweightHero ? "none" : `0 0 6px ${APP_CONFIG.palette[i % APP_CONFIG.palette.length]}`,
              }}
              animate={{ y: [0, lightweightHero ? -18 : -28, 0], opacity: [0.12, lightweightHero ? 0.34 : 0.52, 0.12] }}
              transition={{ duration: 7 + (i % 4), repeat: Infinity, delay: i * 0.28, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="container relative grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] lg:gap-20 lg:py-20">
          {/* LEFT — message */}
          <motion.div style={{ y: heroTextY, opacity: heroTextOpacity }} className="relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <SectionEyebrow>
                {lightweightHero ? "live today" : `live · solana · ${APP_CONFIG.canvas.totalPixels.toLocaleString()} pixels`}
              </SectionEyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 font-display font-bold text-5xl leading-[0.9] tracking-[-0.03em] sm:text-6xl md:text-7xl lg:text-[7.5rem]"
            >
              {lightweightHero ? (
                <>
                  Enter the
                  <br />
                  <span className="text-gradient-hero">Pixel Battle.</span>
                </>
              ) : (
                <>
                  Your wallet.
                  <br />
                  <span className="text-gradient-hero">Your territory.</span>
                </>
              )}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Official Launch Today
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg md:text-xl"
            >
              {lightweightHero ? (
                <>
                  Buy <span className="font-semibold text-foreground">$PIXL</span>. Claim territory. Paint the board.
                  Climb the leaderboard.
                </>
              ) : (
                <>
                  A live, on-chain canvas where <span className="text-foreground font-semibold">$PIXL</span> becomes
                  territory, territory becomes points, and points become public dominance. Every {APP_CONFIG.rules.supplyPercentPerPixel}% of supply = 1 pixel you own,
                  recolor, and defend.
                </>
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              {lightweightHero ? (
                <>
                  <Button
                    size="lg"
                    disabled
                    className="h-12 w-full rounded-xl bg-gradient-neon px-6 text-base font-semibold text-primary-foreground opacity-80 sm:w-auto"
                  >
                    Buy $PIXL
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="h-12 w-full rounded-xl border-border px-6 hover:bg-muted/40 sm:w-auto"
                  >
                    <Link to="/canvas">View Canvas</Link>
                  </Button>
                </>
              ) : (
                <>
                  {!isConnected ? (
                    <Button
                      size="lg"
                      onClick={() => void handleConnectClick()}
                      disabled={connecting}
                      className="group h-14 px-8 text-base font-semibold bg-gradient-neon text-primary-foreground rounded-xl glow-primary hover:scale-[1.03] active:scale-[0.98] transition-all"
                    >
                      <Wallet className="w-5 h-5" />
                      Claim your pixels
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  ) : launch.canPaint ? (
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
                  ) : (
                    <Button
                      size="lg"
                      disabled
                      className="h-14 px-8 text-base font-semibold rounded-xl"
                    >
                      {launch.title}
                    </Button>
                  )}
                  <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-xl border-border hover:bg-muted/40">
                    <Link to="/rules">How it works</Link>
                  </Button>
                </>
              )}
            </motion.div>

            {lightweightHero && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.62 }}
                className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                Best experienced on desktop for painting.
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.68 }}
              className="mt-4 max-w-full rounded-xl border border-border/70 bg-card/65 px-4 py-3 font-mono text-[11px] leading-5 text-muted-foreground"
            >
              <span className="uppercase tracking-[0.2em] text-accent">Launching soon</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.75 }}
              className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-x-10"
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
            <div className="absolute -top-3 left-4 z-20 rounded-md bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-foreground shadow-[0_0_18px_hsl(var(--accent)/0.42)] sm:left-6">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-foreground mr-1.5 animate-pulse" />
              {lightweightHero ? "mobile preview" : "live · public"}
            </div>

            {[
              "top-0 left-0 border-t-2 border-l-2",
              "top-0 right-0 border-t-2 border-r-2",
              "bottom-0 left-0 border-b-2 border-l-2",
              "bottom-0 right-0 border-b-2 border-r-2",
            ].map((c) => (
              <span key={c} className={`absolute w-4 h-4 border-primary/70 ${c}`} />
            ))}

            <NeonCard shimmer={!lightweightHero} className="aspect-square p-2 sm:p-2.5 lg:glow-primary">
              <CanvasPreview pixels={pixels} revision={revision} className="rounded-md" />
            </NeonCard>

            <div className="mt-3 flex items-center justify-between gap-3 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>100 × 100 board</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                {lightweightHero ? "view first" : "updating in real time"}
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
        {!lightweightHero && (
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
        )}
      </section>

      {/* ============================================================ */}
      {/* 2. CINEMATIC NARRATIVE — pinned scroll-zoom through stages  */}
      {/* ============================================================ */}
      {lightweightHero ? <MobileStoryCards /> : <CinematicNarrative />}

      {/* ============================================================ */}
      {/* 2.5 ROUND SYSTEM — countdown · winner ad · how it works · museum */}
      {/* ============================================================ */}
      <RoundSystemSection />

      {/* ============================================================ */}
      {/* 3. HOW IT WORKS — visual 3-step                              */}
      {/* ============================================================ */}
      <section
        className="relative border-t border-border/60 py-16 md:py-32"
        style={{ contentVisibility: "auto", containIntrinsicSize: "1100px" }}
      >
        <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />
        <div className="container relative">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center md:mb-20">
              <SectionEyebrow>how it works</SectionEyebrow>
              <h2 className="mt-5 font-display text-4xl font-bold leading-[0.95] tracking-tight md:text-7xl">
                Three moves.
                <br />
                <span className="text-gradient-hero">Claim the board.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
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
                title: "Earn points & dominate",
                desc: "Pixels are territory. Points are the score. Hold more area to earn faster and climb the leaderboard.",
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
      <section
        className="relative overflow-hidden border-t border-border/60 py-16 md:py-32"
        style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}
      >
        <div className="absolute inset-0 bg-radial-glow opacity-40" />
        <div className="container relative grid items-center gap-10 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-14">
          <Reveal>
            <div>
              <SectionEyebrow>dominance</SectionEyebrow>
              <h2 className="mt-5 font-display text-4xl font-bold leading-[0.95] tracking-tight md:text-7xl">
                The score has
                <br />
                <span className="text-gradient-hero">a king.</span>
              </h2>
              <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-md">
                Every wallet's grip on the canvas creates passive points. Pixels show territory, but points decide who
                is really leading.
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
      <section
        ref={mechanicRef}
        className="relative border-t border-border/60 py-16 md:py-32"
        style={{ contentVisibility: "auto", containIntrinsicSize: "980px" }}
      >
        <div className="container">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
              <SectionEyebrow>token mechanic</SectionEyebrow>
              <h2 className="mt-5 font-display text-4xl font-bold leading-[0.95] tracking-tight md:text-7xl">
                Buy. Hold. <span className="text-gradient-hero">Win territory.</span>
              </h2>
              <p className="mt-5 text-muted-foreground text-lg">
                Or sell, and watch your pixels go back to the void.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
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
                  {MECHANIC_PIXEL_INDICES.map((i) => (
                    <MechanicPixelCell key={i} progress={buyBars} index={i} />
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
                  {MECHANIC_PIXEL_INDICES.map((i) => (
                    <MechanicPixelCell key={i} progress={sellBars} index={i} />
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
      <section
        className="relative flex min-h-[72svh] items-center overflow-hidden border-t border-border/60 md:min-h-[90svh]"
        style={{ contentVisibility: "auto", containIntrinsicSize: "960px" }}
      >
        <div className="absolute inset-0 bg-radial-glow opacity-80 pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full border border-primary/10 pointer-events-none"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full border border-accent/10 pointer-events-none"
        />

        <div className="container relative z-10 py-16 text-center md:py-24">
          <Reveal>
            {/* MASCOT — UNCHANGED */}
            <PixlMascot mood="cheer" size={120} className="mx-auto mb-8" />

            <SectionEyebrow>the canvas is live</SectionEyebrow>

            <h2 className="mt-6 font-display text-5xl font-bold leading-[0.9] tracking-[-0.03em] md:text-8xl lg:text-9xl">
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
                  onClick={() => void handleConnectClick()}
                  disabled={connecting}
                  size="lg"
                  className="h-16 px-10 text-base bg-gradient-neon glow-primary rounded-xl text-primary-foreground font-semibold"
                >
                  <Wallet className="w-5 h-5" /> Connect wallet
                </Button>
              ) : launch.canPaint ? (
                <Button asChild size="lg" className="h-16 px-10 text-base bg-gradient-neon glow-primary rounded-xl text-primary-foreground font-semibold">
                  <Link to="/canvas"><Zap className="w-5 h-5" /> Enter the canvas</Link>
                </Button>
              ) : (
                <Button disabled size="lg" className="h-16 px-10 text-base rounded-xl font-semibold">
                  {launch.title}
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

