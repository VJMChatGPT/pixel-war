import { Link } from "react-router-dom";
import { ArrowRight, BookOpenText, Crown, Flag, Hourglass, Radar, Shield, Sparkles, Trophy, Wallet, Zap } from "lucide-react";

import { Layout } from "@/components/Layout";
import { NeonCard } from "@/components/NeonCard";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]" />
      {children}
    </div>
  );
}

function SectionBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border/60 py-16 first:border-t-0 first:pt-0">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      </div>
      <div className="space-y-4 text-base leading-7 text-muted-foreground md:text-lg">{children}</div>
    </section>
  );
}

export default function Litepaper() {
  return (
    <Layout>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />
        <div className="absolute inset-0 bg-radial-glow opacity-50 pointer-events-none" />

        <div className="container relative py-12 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <Eyebrow>litepaper</Eyebrow>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
                Pixel Battle Litepaper
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
                A live public canvas for territory, painted with $PIXL.
              </p>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                Pixel Battle turns token ownership into visible territory on a public 100x100 canvas. Hold to claim, paint to mark, defend to keep, grow to lead.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="h-13 rounded-xl bg-gradient-neon px-7 text-primary-foreground glow-primary">
                  <Link to="/canvas">
                    Enter the Canvas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-13 rounded-xl px-7">
                  <Link to="/rules">Read the Rules</Link>
                </Button>
              </div>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {[
                { label: "Board", value: "100 x 100", sub: "10,000 live pixels" },
                { label: "Formula", value: `${APP_CONFIG.rules.supplyPercentPerPixel}%`, sub: "of supply = 1 pixel" },
                { label: "Capacity", value: "Wallet-based", sub: "More $PIXL = more territory" },
              ].map((item) => (
                <NeonCard key={item.label} className="p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">{item.label}</div>
                  <div className="mt-3 font-display text-3xl font-bold tracking-tight">{item.value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{item.sub}</div>
                </NeonCard>
              ))}
            </div>

            <div className="mt-14">
              <SectionBlock icon={BookOpenText} title="Core Idea">
                <p>
                  Buy $PIXL. Claim pixels. Paint the board. Earn points. Climb the leaderboard.
                </p>
                <p>
                  Pixel Battle takes token ownership and makes it visible. The result is not a hidden wallet game or a private score counter. It is a public board where control is contested in real time.
                </p>
              </SectionBlock>

              <SectionBlock icon={Flag} title="The Canvas">
                <p>
                  The board has {APP_CONFIG.canvas.totalPixels.toLocaleString()} pixels. Every pixel can be claimed, painted, lost, and contested.
                </p>
                <p>
                  Territory is not permanent. Other players can paint over your cells, which keeps the canvas alive and contested instead of freezing into a static snapshot.
                </p>
              </SectionBlock>

              <SectionBlock icon={Wallet} title="Token to Territory">
                <p>
                  The core formula is simple: {APP_CONFIG.rules.supplyPercentPerPixel}% of supply unlocks 1 pixel. 100% of supply maps to the full {APP_CONFIG.canvas.totalPixels.toLocaleString()}-pixel board.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <NeonCard className="p-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent/80">board</div>
                    <div className="mt-2 font-display text-3xl font-bold">100 x 100</div>
                  </NeonCard>
                  <NeonCard className="p-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent/80">total pixels</div>
                    <div className="mt-2 font-display text-3xl font-bold">{APP_CONFIG.canvas.totalPixels.toLocaleString()}</div>
                  </NeonCard>
                  <NeonCard className="p-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent/80">per pixel</div>
                    <div className="mt-2 font-display text-3xl font-bold">{APP_CONFIG.rules.supplyPercentPerPixel}%</div>
                  </NeonCard>
                </div>
              </SectionBlock>

              <SectionBlock icon={Radar} title="Territory Mechanics">
                <p>
                  Your wallet balance determines your Territory Cap. That cap is the maximum number of pixels you can control on the live board at once.
                </p>
                <p>
                  Controlled Now means the pixels you currently own on the board. If another player paints over you, your visible territory drops. Your balance still defines the maximum capacity you are allowed to hold.
                </p>
                <p>
                  If you buy more $PIXL, your capacity rises. If you sell $PIXL, your capacity falls, and territory above the new limit can no longer be kept.
                </p>
              </SectionBlock>

              <SectionBlock icon={Sparkles} title="Points">
                <p>
                  Territory earns points over time. More controlled territory means stronger point generation.
                </p>
                <p>
                  Points are the social score of Pixel Battle. They power leaderboard position, visible status, and long-term competition. They are not financial rewards and they are not presented as yield.
                </p>
              </SectionBlock>

              <SectionBlock icon={Trophy} title="Leaderboard and Status">
                <p>
                  Pixel Battle is public by design. Wallets compete for visible dominance, leaderboard rank, and the status that comes from holding space on a live board everyone can inspect.
                </p>
                <p>
                  The point is not only to own territory. The point is to be seen owning it.
                </p>
              </SectionBlock>

              <SectionBlock icon={Hourglass} title="Future Vision">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">Planned, not live</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    "6-hour rounds",
                    "Winner homepage slot",
                    "Canvas archive / museum",
                    "Telegram alerts when your pixels are attacked",
                    "Better sharing to X",
                  ].map((item) => (
                    <NeonCard key={item} className="p-5">
                      <div className="flex items-center gap-3">
                        <Crown className="h-4 w-4 text-accent" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    </NeonCard>
                  ))}
                </div>
              </SectionBlock>

              <SectionBlock icon={Shield} title="Safety and Fairness">
                <p>
                  Painting actions are verified server-side. Wallet sessions are required, balance is checked on-chain, and rate limits protect the board from abuse.
                </p>
                <p>
                  No-op paints should not consume paint power. The goal is a canvas that feels competitive without feeling arbitrary.
                </p>
              </SectionBlock>

              <section className="border-t border-border/60 py-16">
                <NeonCard className="overflow-hidden p-8 md:p-10">
                  <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                        <Zap className="h-3.5 w-3.5" />
                        closing
                      </div>
                      <h2 className="mt-5 font-display text-4xl font-bold leading-tight md:text-5xl">
                        The canvas is public. The board is live. Your territory is visible.
                      </h2>
                    </div>
                    <Button asChild size="lg" className="h-13 rounded-xl bg-gradient-neon px-7 text-primary-foreground glow-primary">
                      <Link to="/canvas">
                        Enter the Canvas
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </NeonCard>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
