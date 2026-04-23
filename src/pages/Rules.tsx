import { Layout } from "@/components/Layout";
import { NeonCard } from "@/components/NeonCard";
import { PixlMascot } from "@/components/PixlMascot";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { APP_CONFIG } from "@/config/app";
import { Calculator, Clock, TrendingDown, Wallet } from "lucide-react";

export default function Rules() {
  const [percent, setPercent] = useState("0.5");
  const pct = Math.max(0, Math.min(100, parseFloat(percent) || 0));
  const allowed = Math.floor((pct / 100) * APP_CONFIG.canvas.totalPixels);

  return (
    <Layout>
      <div className="container py-10 md:py-16 max-w-5xl">
        <div className="text-center mb-12">
          <PixlMascot mood="idle" size={80} className="mx-auto mb-4" />
          <h1 className="font-display font-bold text-4xl md:text-6xl">
            The <span className="text-gradient-neon">Rules</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            How pixels, holdings, cooldowns, and the canvas all work together.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {[
            { icon: Wallet, title: "Hold to paint", desc: "Your pixel allowance is calculated from your CURRENT token balance, refreshed every action.", mood: "wave" as const },
            { icon: Calculator, title: "0.01% = 1 pixel", desc: "Every basis point of supply unlocks one pixel. The canvas has 10,000 pixels in total.", mood: "idle" as const },
            { icon: Clock, title: "15-min cooldown", desc: "Between paints, your wallet sleeps for 15 minutes. Cooldown is enforced server-side.", mood: "sleep" as const },
            { icon: TrendingDown, title: "Sell = lose pixels", desc: "If your balance drops below your active pixel count, the excess pixels can be reclaimed by the system.", mood: "shock" as const },
          ].map((r) => (
            <NeonCard key={r.title} className="p-6 flex gap-4">
              <div className="shrink-0">
                <PixlMascot mood={r.mood} size={64} />
              </div>
              <div>
                <r.icon className="w-5 h-5 text-primary mb-2" />
                <h3 className="font-display font-bold text-lg mb-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            </NeonCard>
          ))}
        </div>

        {/* Live calculator */}
        <NeonCard shimmer className="p-8 mb-10">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-primary mb-2">live calculator</div>
          <h2 className="font-display font-bold text-2xl mb-6">How many pixels do you control?</h2>
          <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">% of supply held</label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  className="font-mono text-2xl h-14 bg-background border-border"
                />
                <span className="font-display font-bold text-2xl text-muted-foreground">%</span>
              </div>
            </div>
            <div className="text-center font-pixel text-primary text-sm hidden sm:block">→</div>
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">your pixels</label>
              <div className="font-display font-bold text-5xl text-gradient-neon tabular-nums mt-2">
                {allowed.toLocaleString()}
              </div>
              <div className="font-mono text-xs text-muted-foreground">of {APP_CONFIG.canvas.totalPixels.toLocaleString()}</div>
            </div>
          </div>
        </NeonCard>

        {/* FAQ */}
        <h2 className="font-display font-bold text-2xl mb-4">FAQ</h2>
        <NeonCard className="p-2">
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "Which wallets are supported?", a: "Phantom is the primary supported wallet. Solflare and Backpack support is planned." },
              { q: "What happens if I sell some tokens?", a: "Your pixel allowance recalculates from your current balance. If you sell to the point that your used pixels exceed your allowance, the oldest pixels can be reclaimed by the system and become paintable by other holders." },
              { q: "Are pixels permanent?", a: "Pixels persist as long as you keep enough tokens. Other holders can also overpaint your pixels — the canvas is collaborative and competitive." },
              { q: "Can I bypass the 15-minute cooldown?", a: "No. The cooldown is enforced server-side via Supabase Edge Functions before any write hits the database." },
              { q: "Where is the data stored?", a: "Pixel state, wallet state and paint history live in a Postgres database with row-level security. Reads are public, writes go through a verified server action." },
              { q: "Is the canvas on-chain?", a: "Token balances are on-chain (Solana). The pixel state is stored off-chain for performance, anchored to wallet ownership which is on-chain." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="px-4 hover:no-underline font-display">{item.q}</AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </NeonCard>
      </div>
    </Layout>
  );
}
