import { Layout } from "@/components/Layout";
import { NeonCard } from "@/components/NeonCard";
import { PixlMascot } from "@/components/PixlMascot";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { APP_CONFIG } from "@/config/app";
import { WINNER_PRIZE_RULES_COPY, tokenTicker } from "@/config/brand";
import { Calculator, Clock, Crown, TrendingDown, Wallet } from "lucide-react";

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
            { icon: Wallet, title: "Hold to paint", desc: "Your pixel allowance is calculated from your current token balance, refreshed every action.", mood: "wave" as const },
            { icon: Calculator, title: `${APP_CONFIG.rules.supplyPercentPerPixel}% = 1 pixel`, desc: `Every basis point of supply unlocks one pixel. The canvas has ${APP_CONFIG.canvas.totalPixels.toLocaleString()} pixels in total.`, mood: "idle" as const },
            { icon: Clock, title: "Rolling 15-min window", desc: "You can spend as many paints as your wallet allows inside each 15-minute window. Once every slot is in use, the oldest paint must expire before you can paint again.", mood: "sleep" as const },
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

        <NeonCard id="winner-prize" glow="accent" className="mb-10 p-8">
          {/* TODO: verify or automate the 50% dev-fee payout to the winner wallet before treating this as fully enforced on-chain/backend logic. */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                <Crown className="h-3.5 w-3.5" />
                Winner Prize
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Winner Prize
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                {WINNER_PRIZE_RULES_COPY}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                The live estimate shown on the homepage is informational. The final winner share is verified on-chain at round end.
              </p>
              <div className="mt-5 space-y-2 text-sm text-foreground">
                <div>- Homepage promotion slot</div>
                <div>- 50% of dev fees from the round</div>
              </div>
            </div>
            <div className="shrink-0">
              <PixlMascot mood="idle" size={88} />
            </div>
          </div>
        </NeonCard>

        <h2 className="font-display font-bold text-2xl mb-4">FAQ</h2>
        <NeonCard className="p-2">
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "Which wallets can I use?", a: "Any major Solana wallet should work. Connect your wallet, and your current balance determines how many pixels you can control." },
              { q: "How many times can I paint?", a: "You can paint as many times as your wallet allows inside each 15-minute window. If you still have paint slots left, you can keep going. Once you use them all, you wait for the oldest one to free up." },
              { q: "Can someone paint over my pixels?", a: "Yes. The canvas is competitive, so other holders can repaint your pixels. If you want to keep your spot, you need to defend it." },
              { q: "What happens if I sell my tokens?", a: "Your pixel allowance drops with your balance. If you end up controlling more pixels than your wallet now allows, some of that territory can be taken back." },
              { q: "Do my pixels stay there after I close the app?", a: "Yes. Painted pixels stay on the canvas and everyone can see them, even after you leave. They only change if someone paints over them or your allowance drops." },
              { q: `Why does holding more ${tokenTicker} matter?`, a: "The more of the supply you hold, the more pixels you can control. Bigger holders can claim more space and keep painting for longer before they run out of slots." },
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
