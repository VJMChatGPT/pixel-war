import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  Blocks,
  Brush,
  CalendarClock,
  ChevronRight,
  CircleDot,
  Crown,
  Eye,
  Flag,
  Flame,
  Gauge,
  Gem,
  Megaphone,
  MousePointerClick,
  Palette,
  Radar,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { Layout } from "@/components/Layout";
import { NeonCard } from "@/components/NeonCard";
import { PixlMascot } from "@/components/PixlMascot";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";
import { cn } from "@/lib/utils";

const conceptTabs = [
  { id: "pulse", label: "Pulse", icon: Activity },
  { id: "territory", label: "Territory", icon: Radar },
  { id: "roundroom", label: "Round Room", icon: Crown },
] as const;

const feedItems = [
  { wallet: "0x9aeef...c12", action: "claimed 12 cells", tone: "primary", time: "12s" },
  { wallet: "0x4f1ab...90d", action: "overtook rank #3", tone: "gold", time: "46s" },
  { wallet: "0x77c2d...a03", action: "repainted a border", tone: "coral", time: "1m" },
  { wallet: "0x12abc...7ef", action: "earned 4.8k points", tone: "accent", time: "3m" },
];

const leaderboard = [
  { rank: 1, wallet: "0x9aeef...c12", value: "42.8k", delta: "+8%" },
  { rank: 2, wallet: "0x4f1ab...90d", value: "39.1k", delta: "+3%" },
  { rank: 3, wallet: "0x77c2d...a03", value: "31.6k", delta: "+12%" },
  { rank: 4, wallet: "0x12abc...7ef", value: "28.2k", delta: "+1%" },
];

const heatmap = Array.from({ length: 144 }, (_, index) => {
  const paletteIndex = (index * 7 + Math.floor(index / 12)) % APP_CONFIG.palette.length;
  const isQuiet = index % 5 === 0 || index % 17 === 0;
  return {
    color: isQuiet ? "hsl(var(--muted) / 0.45)" : APP_CONFIG.palette[paletteIndex],
    opacity: isQuiet ? 0.28 : 0.9,
  };
});

const zones = [
  { title: "North reef", cells: 86, status: "stable", color: "text-primary" },
  { title: "Mint trench", cells: 42, status: "contested", color: "text-neon-gold" },
  { title: "Coral edge", cells: 18, status: "at risk", color: "text-neon-coral" },
];

function ConceptShell({
  number,
  title,
  summary,
  children,
}: {
  number: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/45 p-4 shadow-[0_30px_80px_-50px_hsl(var(--primary)/0.45)] md:p-6">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.035]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_68%)]" />
      <div className="relative mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-primary/80">
            prueba {number}
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-5xl">
            {title}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-right">
          {summary}
        </p>
      </div>
      {children}
    </section>
  );
}

function PixelField({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-1 rounded-2xl border border-primary/25 bg-background/80 p-2 shadow-[inset_0_0_30px_hsl(var(--primary)/0.08)]",
        compact ? "aspect-[4/3]" : "aspect-square"
      )}
    >
      {heatmap.map((cell, index) => (
        <span
          key={index}
          className="rounded-[3px]"
          style={{
            backgroundColor: cell.color,
            opacity: cell.opacity,
            boxShadow: index % 19 === 0 ? `0 0 12px ${cell.color}` : undefined,
          }}
        />
      ))}
    </div>
  );
}

function PulseView() {
  return (
    <ConceptShell
      number="01"
      title="Live Pulse"
      summary="Una vista tipo feed para entrar rapido: actividad reciente, misiones cortas y momento caliente del canvas."
    >
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <NeonCard shimmer className="overflow-hidden p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">live pulse</div>
              <h3 className="mt-1 font-display text-2xl font-bold">What is moving now</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <ScanLine className="h-5 w-5" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <PixelField compact />
            <div className="space-y-3">
              {feedItems.map((item, index) => (
                <motion.div
                  key={item.wallet}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/45 p-3"
                >
                  <span
                    className={cn(
                      "h-9 w-9 rounded-lg border",
                      item.tone === "gold" && "border-neon-gold/40 bg-neon-gold/10",
                      item.tone === "coral" && "border-neon-coral/40 bg-neon-coral/10",
                      item.tone === "accent" && "border-accent/40 bg-accent/10",
                      item.tone === "primary" && "border-primary/40 bg-primary/10"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-xs font-semibold">{item.wallet}</div>
                    <div className="truncate text-sm text-muted-foreground">{item.action}</div>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{item.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </NeonCard>

        <div className="grid gap-5">
          <NeonCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">missions</div>
                <h3 className="mt-1 font-display text-xl font-bold">Next best moves</h3>
              </div>
              <MousePointerClick className="h-5 w-5 text-accent" />
            </div>
            <div className="space-y-3">
              {[
                ["Paint a border pixel", "Protect a contested edge", Brush],
                ["Recruit one holder", "Share your mark on X", Megaphone],
                ["Hold for 15 minutes", "Earn passive streak points", CalendarClock],
              ].map(([title, copy, Icon]) => (
                <div key={title} className="flex items-center gap-3 rounded-xl bg-muted/25 p-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{title}</div>
                    <div className="text-xs text-muted-foreground">{copy}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </NeonCard>

          <NeonCard glow="primary" className="p-5">
            <div className="flex items-start gap-4">
              <PixlMascot mood="cheer" size={74} />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">hot moment</div>
                <h3 className="mt-1 font-display text-2xl font-bold">Mint trench is open</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A top wallet sold down. 28 cells are newly contestable for wallets with spare cap.
                </p>
                <Button asChild className="mt-4 h-10 rounded-xl bg-gradient-neon text-primary-foreground">
                  <Link to="/canvas">
                    Jump to canvas <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </NeonCard>
        </div>
      </div>
    </ConceptShell>
  );
}

function TerritoryView() {
  return (
    <ConceptShell
      number="02"
      title="Territory Intel"
      summary="Una pagina de perfil mas estrategica: mapa propio, riesgo por zonas, progreso y acciones defensivas."
    >
      <div className="grid gap-5 xl:grid-cols-[320px_1fr_300px]">
        <NeonCard className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">wallet</div>
              <div className="truncate font-display text-2xl font-bold">0x9aeef...c12</div>
              <div className="mt-1 text-sm text-muted-foreground">Rank #4 by points</div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["126", "controlled"],
              ["148", "cap"],
              ["8.4k", "points"],
              ["2.8", "pts/sec"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-border/70 bg-background/45 p-3">
                <div className="font-display text-2xl font-bold text-gradient-neon">{value}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <Button asChild className="mt-5 h-11 w-full rounded-xl bg-gradient-neon text-primary-foreground">
            <Link to="/profile">
              Open profile <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </NeonCard>

        <NeonCard shimmer className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">territory map</div>
              <h3 className="mt-1 font-display text-2xl font-bold">Owned cells and pressure</h3>
            </div>
            <Radar className="h-5 w-5 text-accent" />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_210px]">
            <PixelField />
            <div className="space-y-3">
              {zones.map((zone) => (
                <div key={zone.title} className="rounded-xl border border-border/70 bg-background/45 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{zone.title}</div>
                    <CircleDot className={cn("h-4 w-4", zone.color)} />
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold">{zone.cells}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{zone.status}</div>
                </div>
              ))}
            </div>
          </div>
        </NeonCard>

        <div className="grid gap-5">
          <NeonCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl font-bold">Defense queue</h3>
            </div>
            <div className="space-y-3">
              {[
                ["Patch gap", "x41 y08", "high"],
                ["Retake edge", "x33 y77", "med"],
                ["Color sync", "12 cells", "low"],
              ].map(([title, meta, risk]) => (
                <div key={title} className="flex items-center justify-between rounded-xl bg-muted/25 px-3 py-3">
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{meta}</div>
                  </div>
                  <span className="rounded-md border border-primary/25 px-2 py-1 font-mono text-[10px] uppercase text-primary">
                    {risk}
                  </span>
                </div>
              ))}
            </div>
          </NeonCard>

          <NeonCard glow="accent" className="p-5">
            <div className="flex items-center gap-3">
              <Gem className="h-5 w-5 text-accent" />
              <div>
                <div className="font-display text-xl font-bold">Next unlock</div>
                <div className="text-sm text-muted-foreground">+1 pixel at 0.01% more supply</div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-muted">
              <div className="h-full w-[68%] rounded-full bg-gradient-neon" />
            </div>
          </NeonCard>
        </div>
      </div>
    </ConceptShell>
  );
}

function RoundRoomView() {
  const roundStats = useMemo(
    () => [
      ["Prize pool", "50% fees", BadgeDollarSign],
      ["Live wallets", "1,482", Users],
      ["Paint rate", "92/min", Gauge],
      ["Ad slot", "00:42:18", Flag],
    ],
    []
  );

  return (
    <ConceptShell
      number="03"
      title="Round Room"
      summary="Una sala de control para la ronda: countdown, bolsa del ganador, carrera de wallets y preview del anuncio del vencedor."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <NeonCard shimmer glow="primary" className="overflow-hidden p-5 md:p-6">
          <div className="grid gap-6 md:grid-cols-[1fr_240px]">
            <div>
              <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                <Flame className="h-4 w-4" /> round 08 live
              </div>
              <h3 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
                The homepage slot is still in play.
              </h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Make the round feel like an event: the current winner, prize mechanics, and pressure on the top three stay visible.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {roundStats.map(([label, value, Icon]) => (
                  <div key={label} className="rounded-xl border border-border/70 bg-background/45 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em]">{label}</span>
                    </div>
                    <div className="mt-2 font-display text-2xl font-bold">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-2xl border border-accent/35 bg-gradient-to-br from-accent/20 via-primary/10 to-background p-4">
              <div className="absolute right-4 top-4 rounded-md bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                winner ad
              </div>
              <PixlMascot mood="cheer" size={112} className="mx-auto mt-8" />
              <div className="mt-5 rounded-xl bg-background/70 p-4 text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">sponsored by</div>
                <div className="mt-1 font-display text-2xl font-bold">Mint Trench DAO</div>
                <div className="mt-2 text-xs text-muted-foreground">Preview of the next homepage takeover.</div>
              </div>
            </div>
          </div>
        </NeonCard>

        <div className="grid gap-5">
          <NeonCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Live race</h3>
              <Trophy className="h-5 w-5 text-neon-gold" />
            </div>
            <div className="space-y-3">
              {leaderboard.map((row) => (
                <div key={row.rank} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl bg-muted/25 p-3">
                  <div className="font-mono text-sm font-bold text-muted-foreground">#{row.rank}</div>
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs font-semibold">{row.wallet}</div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-neon"
                        style={{ width: `${96 - row.rank * 13}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold">{row.value}</div>
                    <div className="font-mono text-[10px] text-primary">{row.delta}</div>
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>

          <NeonCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Swords className="h-5 w-5 text-accent" />
              <h3 className="font-display text-xl font-bold">Round actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Paint", Palette],
                ["Scout", Eye],
                ["Boost", Zap],
                ["Rules", Blocks],
              ].map(([label, Icon]) => (
                <button
                  key={label}
                  className="flex h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/45 text-sm font-semibold transition-colors hover:border-primary/50 hover:bg-primary/10"
                  type="button"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  {label}
                </button>
              ))}
            </div>
          </NeonCard>
        </div>
      </div>
    </ConceptShell>
  );
}

export default function ViewConcepts() {
  const [active, setActive] = useState<(typeof conceptTabs)[number]["id"]>("pulse");
  const [searchParams] = useSearchParams();
  const framedView = searchParams.get("view");
  const isFramedView = conceptTabs.some((tab) => tab.id === framedView);

  if (isFramedView) {
    return (
      <Layout>
        <div className="container py-8 md:py-12">
          {framedView === "pulse" && <PulseView />}
          {framedView === "territory" && <TerritoryView />}
          {framedView === "roundroom" && <RoundRoomView />}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.24em] text-primary">mobbin-inspired concept pass</div>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[0.94] tracking-tight md:text-7xl">
              Three possible new views for Pixel Battle.
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
              Prototipos visuales basados en patrones de apps de producto: feed de actividad, perfil estrategico y sala de control de ronda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/55 p-2">
            {conceptTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActive(tab.id);
                    document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors",
                    active === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          <div id="pulse">
            <PulseView />
          </div>
          <div id="territory">
            <TerritoryView />
          </div>
          <div id="roundroom">
            <RoundRoomView />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Estos son mockups navegables para decidir direccion antes de convertir una opcion en pantalla real.
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/canvas">Back to canvas</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
