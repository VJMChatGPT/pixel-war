/**
 * RoundSystem - UI-only presentation of PIXL's current competition.
 *
 * Round 1 is intentionally pinned as the active round until the real round
 * loop is enabled. This component does not reset points, pixels, or backend
 * state; it only presents the current game framing.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Archive, Crown, Flame, Megaphone, Sparkles, Timer, Trophy } from "lucide-react";
import { NeonCard } from "@/components/NeonCard";
import { Button } from "@/components/ui/button";

const CURRENT_ROUND_NUMBER = 1;

function useCurrentRound() {
  return {
    roundNumber: CURRENT_ROUND_NUMBER,
    progress: 1,
  };
}

export function RoundCountdownBanner() {
  const { roundNumber, progress } = useCurrentRound();

  return (
    <div className="relative border-b border-border/60 bg-card/40 backdrop-blur-md overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />
      <div className="container relative flex flex-wrap items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">round</span>
          <span className="font-pixel text-[11px] text-foreground">#{roundNumber}</span>
          <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            permanent
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Trophy className="w-3.5 h-3.5 text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground hidden sm:inline">
            current race
          </span>
          <div className="flex items-center gap-1 font-mono tabular-nums text-sm md:text-base font-semibold">
            <span className="px-2 py-0.5 rounded bg-background/60 border border-border">ROUND 1</span>
            <span className="px-2 py-0.5 rounded bg-primary/15 border border-primary/40 text-primary">POINTS</span>
            <span className="px-2 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent">LIVE</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3 min-w-[200px]">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">score focus</span>
          <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden min-w-[120px]">
            <div
              className="h-full bg-gradient-neon shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CurrentRoundHero() {
  const { roundNumber, progress } = useCurrentRound();

  return (
    <NeonCard glow="primary" className="p-6 md:p-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none" />

      <div className="relative flex items-center justify-between mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/40 bg-accent/10 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
          <Flame className="w-3 h-3" />
          live points race
        </div>
        <div className="font-pixel text-[11px] text-muted-foreground">ROUND #{roundNumber}</div>
      </div>

      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
          current competition
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <motion.span
            initial={{ y: -6, opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold text-6xl md:text-8xl leading-none text-gradient-hero"
          >
            Round 1
          </motion.span>
          <span className="mb-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            points matter
          </span>
        </div>

        <div className="mt-6 h-2 bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-neon shadow-[0_0_14px_hsl(var(--primary)/0.7)]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span>no reset scheduled</span>
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-accent" /> highest points leads
          </span>
        </div>
      </div>
    </NeonCard>
  );
}

const STEPS = [
  {
    n: "01",
    icon: <Timer className="w-5 h-5" />,
    title: "Compete in Round 1",
    desc: "Round 1 stays active until we deliberately enable the next phase.",
  },
  {
    n: "02",
    icon: <Sparkles className="w-5 h-5" />,
    title: "Earn points every second",
    desc: "Pixels generate points over time. Points are the main score.",
  },
  {
    n: "03",
    icon: <Megaphone className="w-5 h-5" />,
    title: "Climb by score",
    desc: "Pixels matter because they produce points. The points leaderboard is the race.",
  },
  {
    n: "04",
    icon: <Archive className="w-5 h-5" />,
    title: "Archive comes later",
    desc: "Museum and history will arrive after the real round loop is enabled.",
  },
];

export function HowTheRoundWorks() {
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-7 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent hidden md:block" />
      <div className="grid md:grid-cols-4 gap-5">
        {STEPS.map((step, index) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-4 z-10 w-6 h-6 rounded-full bg-background border border-primary/60 items-center justify-center shadow-[0_0_12px_hsl(var(--primary)/0.5)]">
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <NeonCard className="p-6 h-full mt-12 md:mt-14">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-primary">
                  {step.icon}
                  <span className="font-pixel text-[10px]">{step.n}</span>
                </div>
                {index === 3 && <Archive className="w-4 h-4 text-accent/70" />}
                {index === 2 && <Crown className="w-4 h-4 text-accent" />}
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </NeonCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function WinnerAdSlot() {
  const { roundNumber } = useCurrentRound();

  return (
    <NeonCard shimmer glow="accent" className="relative overflow-hidden">
      {[
        "top-0 left-0 border-t-2 border-l-2",
        "top-0 right-0 border-t-2 border-r-2",
        "bottom-0 left-0 border-b-2 border-l-2",
        "bottom-0 right-0 border-b-2 border-r-2",
      ].map((corner) => (
        <span key={corner} className={`absolute w-5 h-5 border-accent/70 ${corner} z-10`} />
      ))}

      <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_hsl(var(--accent)/0.5)]">
        <Crown className="w-3 h-3" /> winner promotion slot
      </div>
      <div className="absolute top-3 right-3 z-20 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        round #{roundNumber}
      </div>

      <div className="relative grid gap-6 p-8 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] md:p-12 min-h-[320px] bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent">
        <div className="flex flex-col justify-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
            win the round. own the spotlight.
          </div>
          <h3 className="font-display font-bold text-3xl md:text-5xl leading-[0.95] tracking-tight">
            Top the board.
            <br />
            <span className="text-gradient-hero">Claim the featured slot.</span>
          </h3>
          <p className="mt-4 max-w-lg text-sm md:text-base text-muted-foreground">
            The winner claims this entire homepage feature block.
          </p>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            this whole area becomes the winner spot
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              homepage visibility
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              full section reward
            </div>
          </div>
        </div>

        <div className="relative flex items-center">
          <div className="w-full rounded-2xl border border-accent/35 bg-background/70 p-4 shadow-[0_0_40px_hsl(var(--accent)/0.14)] backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">featured winner</div>
                <div className="mt-1 font-display text-xl font-bold">Winner gets this slot</div>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-right">
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">reward</div>
                <div className="font-display text-lg font-bold text-gradient-hero">Front Page</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-background via-card to-background/80 p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                winner promo preview
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-display text-3xl font-bold leading-none text-gradient-hero">
                    Your brand here
                  </div>
                  <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                    homepage feature
                  </div>
                </div>
                <div className="grid h-16 w-16 shrink-0 grid-cols-4 gap-1 rounded-lg border border-border/60 bg-card/70 p-2">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <span
                      key={index}
                      className="rounded-[2px]"
                      style={{
                        background:
                          index % 5 === 0
                            ? "hsl(var(--accent))"
                            : index % 3 === 0
                              ? "hsl(var(--primary))"
                              : "hsl(var(--muted))",
                        boxShadow: index % 5 === 0 ? "0 0 10px hsl(var(--accent) / 0.45)" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                full winner feature block
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                <Megaphone className="h-3 w-3" />
                exposure reward
              </div>
            </div>
          </div>
        </div>
      </div>
    </NeonCard>
  );
}

export function MuseumArchive() {
  return (
    <NeonCard className="p-8 md:p-10">
      <div className="max-w-2xl">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-3">
          museum archive
        </div>
        <h4 className="font-display font-bold text-3xl md:text-4xl leading-tight">
          The first archive is not open yet.
        </h4>
        <p className="mt-3 text-muted-foreground text-sm md:text-base leading-relaxed">
          Round 1 is still the active race. Finished boards and winners will appear here once the archive system exists.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          first exhibit coming later
        </div>
      </div>
    </NeonCard>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
      <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
      {children}
    </div>
  );
}

export function RoundSystemSection() {
  return (
    <section className="relative border-t border-border/60 py-28 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-50 pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none" />

      <div className="container relative">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Eyebrow>round system - round 1 live</Eyebrow>
          <h2 className="mt-5 font-display font-bold text-5xl md:text-7xl leading-[0.95] tracking-tight">
            Round 1 is live.
            <br />
            <span className="text-gradient-hero">Points decide status.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-base md:text-lg">
            This round stays open until we change it. Paint territory, generate points, and climb the score race.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,460px)_1fr] gap-6 mb-20">
          <CurrentRoundHero />
          <WinnerAdSlot />
        </div>

        <div className="mb-20">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <Eyebrow>how points win</Eyebrow>
              <h3 className="mt-4 font-display font-bold text-3xl md:text-5xl leading-tight tracking-tight">
                Four steps. <span className="text-gradient-hero">One score.</span>
              </h3>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground max-w-xs">
              paint - earn points - climb - defend
            </div>
          </div>
          <HowTheRoundWorks />
        </div>

        <div>
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <Eyebrow>the museum - later</Eyebrow>
              <h3 className="mt-4 font-display font-bold text-3xl md:text-5xl leading-tight tracking-tight">
                Archive later. <span className="text-gradient-hero">Score now.</span>
              </h3>
              <p className="mt-3 text-muted-foreground max-w-lg">
                No archived canvases yet. For now, Round 1 is the only race and points are the visible status signal.
              </p>
            </div>
            <Button asChild variant="outline" className="h-11 rounded-xl" disabled>
              <Link to="#">
                <Archive className="w-4 h-4" /> Museum coming later
              </Link>
            </Button>
          </div>
          <MuseumArchive />
        </div>
      </div>
    </section>
  );
}
