/**
 * RoundSystem - UI-only presentation of the current competition.
 *
 * Round 1 is intentionally pinned as the active round until the real round
 * loop is enabled. This component does not reset points, pixels, or backend
 * state; it only presents the current game framing.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crown, Flame, Trophy } from "lucide-react";
import { NeonCard } from "@/components/NeonCard";
import { Button } from "@/components/ui/button";
import {
  WINNER_PRIZE_BADGE,
  WINNER_PRIZE_HEADLINE,
  WINNER_PRIZE_SUBLINE,
} from "@/config/brand";
import { WinnerPrizeFees } from "@/components/WinnerPrizeFees";

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

export function WinnerAdSlot() {
  const { roundNumber } = useCurrentRound();

  return (
    <NeonCard
      id="prize"
      shimmer
      glow="accent"
      className="relative overflow-hidden border-accent/30 bg-gradient-to-br from-accent/10 via-card to-background"
    >
      {/* TODO: verify or automate the 50% dev-fee payout to the winner wallet before treating this as fully enforced on-chain/backend logic. */}
      <div className="absolute inset-0 bg-radial-glow opacity-35 pointer-events-none" />
      <div className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        round #{roundNumber}
      </div>
      <div className="relative p-8 md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
          <Crown className="h-3.5 w-3.5" />
          {WINNER_PRIZE_BADGE}
        </div>
        <h3 className="mt-5 max-w-3xl font-display text-3xl font-bold leading-[1] tracking-tight md:text-5xl">
          {WINNER_PRIZE_HEADLINE}
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
          {WINNER_PRIZE_SUBLINE}
        </p>
        <WinnerPrizeFees />
        <div className="mt-8">
          <Button asChild variant="outline" className="h-11 rounded-xl">
            <Link to="/rules#winner-prize">View rules</Link>
          </Button>
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
    <section
      className="relative overflow-hidden border-t border-border/60 py-28 md:py-32"
      style={{ contentVisibility: "auto", containIntrinsicSize: "820px" }}
    >
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
      </div>
    </section>
  );
}
