/**
 * RoundSystem — UI-only presentation of PIXL's round-based competitive loop.
 *
 * Pure presentation. No backend logic, no real timers driving product state,
 * no real winner calculation, no real ad submission. The countdown shown
 * here is a local visual countdown that resets every 6h purely to make the
 * UI feel alive. All winner / museum / ad data is mock.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crown, Trophy, Timer, Sparkles, Archive, ArrowRight, Megaphone, Flame, ExternalLink } from "lucide-react";
import { NeonCard } from "@/components/NeonCard";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";

/* ============================================================
   Local visual countdown (UI-only, not product state)
   ============================================================ */
const ROUND_MS = 6 * 60 * 60 * 1000;
const ROUND_START_REFERENCE = Date.UTC(2026, 0, 1, 0, 0, 0); // arbitrary anchor

function useRoundCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const elapsed = (now - ROUND_START_REFERENCE) % ROUND_MS;
  const remaining = ROUND_MS - elapsed;
  const roundNumber = 12 + Math.floor((now - ROUND_START_REFERENCE) / ROUND_MS) % 999; // mock #
  const progress = elapsed / ROUND_MS;
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  return {
    roundNumber,
    progress,
    parts: {
      h: h.toString().padStart(2, "0"),
      m: m.toString().padStart(2, "0"),
      s: s.toString().padStart(2, "0"),
    },
  };
}

/* ============================================================
   Compact sticky-style banner — slots into the top of the page
   ============================================================ */
export function RoundCountdownBanner() {
  const { roundNumber, parts, progress } = useRoundCountdown();
  return (
    <div className="relative border-b border-border/60 bg-card/40 backdrop-blur-md overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />
      <div className="container relative flex flex-wrap items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            round
          </span>
          <span className="font-pixel text-[11px] text-foreground">#{roundNumber}</span>
          <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            · live
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Timer className="w-3.5 h-3.5 text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground hidden sm:inline">
            ends in
          </span>
          <div className="flex items-center gap-1 font-mono tabular-nums text-base md:text-lg font-semibold">
            <span className="px-2 py-0.5 rounded bg-background/60 border border-border">{parts.h}</span>
            <span className="text-muted-foreground">:</span>
            <span className="px-2 py-0.5 rounded bg-background/60 border border-border">{parts.m}</span>
            <span className="text-muted-foreground">:</span>
            <span className="px-2 py-0.5 rounded bg-background/60 border border-border text-accent">{parts.s}</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3 min-w-[200px]">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">progress</span>
          <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden min-w-[120px]">
            <div
              className="h-full bg-gradient-neon shadow-[0_0_10px_hsl(var(--primary)/0.6)] transition-all duration-1000"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Hero countdown card — the centerpiece "current round" block
   ============================================================ */
export function CurrentRoundHero() {
  const { roundNumber, parts, progress } = useRoundCountdown();
  return (
    <NeonCard glow="primary" className="p-6 md:p-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none" />

      <div className="relative flex items-center justify-between mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/40 bg-accent/10 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
          <Flame className="w-3 h-3" />
          live round
        </div>
        <div className="font-pixel text-[11px] text-muted-foreground">ROUND #{roundNumber}</div>
      </div>

      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
          canvas resets in
        </div>
        <div className="flex items-end gap-2 md:gap-3 font-display font-bold tabular-nums">
          {[
            { v: parts.h, l: "hours" },
            { v: parts.m, l: "minutes" },
            { v: parts.s, l: "seconds" },
          ].map((u, i) => (
            <div key={u.l} className="flex items-end gap-2">
              <div className="flex flex-col items-center">
                <motion.span
                  key={u.v + u.l}
                  initial={{ y: -6, opacity: 0.4 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="text-5xl md:text-7xl leading-none text-gradient-hero"
                >
                  {u.v}
                </motion.span>
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
                  {u.l}
                </span>
              </div>
              {i < 2 && <span className="text-4xl md:text-6xl text-muted-foreground/50 pb-6">:</span>}
            </div>
          ))}
        </div>

        <div className="mt-6 h-2 bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-neon shadow-[0_0_14px_hsl(var(--primary)/0.7)] transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span>round started · {Math.round(progress * 100)}% elapsed</span>
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-accent" /> winner gets the ad slot
          </span>
        </div>
      </div>
    </NeonCard>
  );
}

/* ============================================================
   "How the round works" — visual 4-step timeline
   ============================================================ */
const STEPS = [
  {
    n: "01",
    icon: <Timer className="w-5 h-5" />,
    title: "Compete for 6 hours",
    desc: "Every round lasts exactly 6 hours. Paint, defend, climb the board.",
  },
  {
    n: "02",
    icon: <Sparkles className="w-5 h-5" />,
    title: "Earn the most points",
    desc: "Owning pixels accrues points in real time. Bigger territory, faster gains.",
  },
  {
    n: "03",
    icon: <Megaphone className="w-5 h-5" />,
    title: "Win the homepage ad",
    desc: "The wallet with the most points wins the public ad slot above.",
  },
  {
    n: "04",
    icon: <Archive className="w-5 h-5" />,
    title: "Enter the museum",
    desc: "When the canvas resets, the finished round is preserved forever.",
  },
];

export function HowTheRoundWorks() {
  return (
    <div className="relative">
      {/* timeline rail */}
      <div className="absolute left-0 right-0 top-7 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent hidden md:block" />
      <div className="grid md:grid-cols-4 gap-5">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-4 z-10 w-6 h-6 rounded-full bg-background border border-primary/60 items-center justify-center shadow-[0_0_12px_hsl(var(--primary)/0.5)]">
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <NeonCard className="p-6 h-full mt-12 md:mt-14">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-primary">
                  {s.icon}
                  <span className="font-pixel text-[10px]">{s.n}</span>
                </div>
                {i === 3 && <Archive className="w-4 h-4 text-accent/70" />}
                {i === 2 && <Crown className="w-4 h-4 text-accent" />}
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </NeonCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Winner ad slot — premium homepage placement
   ============================================================ */
export function WinnerAdSlot() {
  const { roundNumber } = useRoundCountdown();
  const previousRound = roundNumber - 1;
  return (
    <NeonCard shimmer glow="accent" className="relative overflow-hidden">
      {/* corner brackets */}
      {[
        "top-0 left-0 border-t-2 border-l-2",
        "top-0 right-0 border-t-2 border-r-2",
        "bottom-0 left-0 border-b-2 border-l-2",
        "bottom-0 right-0 border-b-2 border-r-2",
      ].map((c) => (
        <span key={c} className={`absolute w-5 h-5 border-accent/70 ${c} z-10`} />
      ))}

      <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_hsl(var(--accent)/0.5)]">
        <Crown className="w-3 h-3" /> winner ad slot
      </div>
      <div className="absolute top-3 right-3 z-20 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        round #{previousRound}
      </div>

      <div className="grid md:grid-cols-[1fr_minmax(0,300px)] gap-0">
        {/* MOCK AD CONTENT */}
        <div className="relative p-8 md:p-12 min-h-[260px] flex flex-col justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
            promoted by the round winner
          </div>
          <h3 className="font-display font-bold text-3xl md:text-5xl leading-[0.95] tracking-tight">
            Your project, <span className="text-gradient-hero">on the homepage.</span>
          </h3>
          <p className="mt-3 text-muted-foreground max-w-md text-sm md:text-base">
            Win a round and your message appears here, in front of every visitor, until the next reset.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Button size="sm" variant="outline" className="rounded-lg" disabled>
              <ExternalLink className="w-3.5 h-3.5" /> Visit promoted link
            </Button>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              placeholder · awarded automatically
            </span>
          </div>
        </div>

        {/* WINNER CARD */}
        <div className="relative p-6 md:p-8 border-t md:border-t-0 md:border-l border-border/60 bg-background/40 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
              current champion
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg ring-2 ring-accent/60"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))",
                }}
              />
              <div className="min-w-0">
                <div className="font-mono text-sm text-foreground truncate">7xKx…q9Asu</div>
                <div className="font-mono text-[10px] text-muted-foreground">412 pixels held</div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                <div className="font-display font-bold text-2xl text-gradient-hero tabular-nums">8,412</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mt-1">
                  points
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                <div className="font-display font-bold text-2xl text-accent tabular-nums">#1</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mt-1">
                  rank
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              ad rotates next reset
            </span>
          </div>
        </div>
      </div>
    </NeonCard>
  );
}

/* ============================================================
   Museum / archive — past rounds gallery
   ============================================================ */
type MuseumRound = {
  n: number;
  winner: string;
  points: number;
  date: string;
  ad: string;
  seed: number;
};

const MUSEUM: MuseumRound[] = [
  { n: 11, winner: "9aEEf…canvas", points: 9_124, date: "Apr 28 · 18:00", ad: "skyforge.xyz", seed: 17 },
  { n: 10, winner: "4f1AB…holder", points: 8_077, date: "Apr 28 · 12:00", ad: "moonpunks.io", seed: 41 },
  { n: 9,  winner: "77c2D…pixel",  points: 7_812, date: "Apr 28 · 06:00", ad: "lattice.fi",   seed: 73 },
  { n: 8,  winner: "12abC…dao",    points: 7_204, date: "Apr 28 · 00:00", ad: "voidcats.art", seed: 9  },
  { n: 7,  winner: "deAd…beef",    points: 6_988, date: "Apr 27 · 18:00", ad: "soltrip.gg",   seed: 53 },
  { n: 6,  winner: "ab12…face",    points: 6_512, date: "Apr 27 · 12:00", ad: "pixelgang.so", seed: 28 },
];

function MuseumThumb({ seed }: { seed: number }) {
  // Deterministic mock canvas thumbnail using the curated palette.
  const cells = useMemo(() => {
    const out: string[] = [];
    let s = seed * 9301 + 49297;
    for (let i = 0; i < 144; i++) {
      s = (s * 9301 + 49297) % 233280;
      const r = s / 233280;
      if (r < 0.55) {
        out.push(APP_CONFIG.palette[Math.floor(r * 100) % APP_CONFIG.palette.length]);
      } else {
        out.push("transparent");
      }
    }
    return out;
  }, [seed]);
  return (
    <div className="relative aspect-square rounded-md bg-white overflow-hidden border border-border/60">
      <div className="absolute inset-0 grid grid-cols-12 gap-px p-1">
        {cells.map((c, i) => (
          <div key={i} className="rounded-[1px]" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
    </div>
  );
}

export function MuseumArchive() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {MUSEUM.map((r, i) => (
        <motion.div
          key={r.n}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <NeonCard className="p-5 h-full group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="font-pixel text-[10px] text-primary">ROUND #{r.n}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {r.date}
              </div>
            </div>

            <MuseumThumb seed={r.seed} />

            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-1">
                  <Crown className="w-3 h-3" /> winner
                </div>
                <div className="font-mono text-sm text-foreground truncate">{r.winner}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-xl text-gradient-hero tabular-nums leading-none">
                  {r.points.toLocaleString()}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mt-1">
                  points
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mb-0.5">
                  ad won
                </div>
                <div className="font-mono text-xs text-foreground/90 truncate">{r.ad}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg h-8 px-3 text-xs opacity-80 group-hover:opacity-100"
                disabled
              >
                View round <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </NeonCard>
        </motion.div>
      ))}
    </div>
  );
}

/* ============================================================
   Section eyebrow (mirrors Landing's helper)
   ============================================================ */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
      <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
      {children}
    </div>
  );
}

/* ============================================================
   Combined "Round" section to drop into the landing flow
   ============================================================ */
export function RoundSystemSection() {
  return (
    <section className="relative border-t border-border/60 py-28 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-50 pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none" />

      <div className="container relative">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Eyebrow>round system · resets every 6h</Eyebrow>
          <h2 className="mt-5 font-display font-bold text-5xl md:text-7xl leading-[0.95] tracking-tight">
            Every 6 hours,
            <br />
            <span className="text-gradient-hero">the canvas resets.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-base md:text-lg">
            One round. One winner. One ad slot on the homepage. Then it all begins again.
          </p>
        </div>

        {/* Live countdown + ad slot side-by-side */}
        <div className="grid lg:grid-cols-[minmax(0,460px)_1fr] gap-6 mb-20">
          <CurrentRoundHero />
          <WinnerAdSlot />
        </div>

        {/* How it works timeline */}
        <div className="mb-20">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <Eyebrow>how a round works</Eyebrow>
              <h3 className="mt-4 font-display font-bold text-3xl md:text-5xl leading-tight tracking-tight">
                Four steps. <span className="text-gradient-hero">Six hours.</span>
              </h3>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground max-w-xs">
              compete · win · advertise · archive
            </div>
          </div>
          <HowTheRoundWorks />
        </div>

        {/* Museum */}
        <div>
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <Eyebrow>the museum · past rounds</Eyebrow>
              <h3 className="mt-4 font-display font-bold text-3xl md:text-5xl leading-tight tracking-tight">
                Every canvas, <span className="text-gradient-hero">preserved.</span>
              </h3>
              <p className="mt-3 text-muted-foreground max-w-lg">
                Finished rounds become permanent exhibits. Browse the history of who ruled the board.
              </p>
            </div>
            <Button asChild variant="outline" className="h-11 rounded-xl" disabled>
              <Link to="#">
                <Archive className="w-4 h-4" /> Open the museum
              </Link>
            </Button>
          </div>
          <MuseumArchive />
        </div>
      </div>
    </section>
  );
}
