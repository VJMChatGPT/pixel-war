import { Link } from "react-router-dom";

import { APP_CONFIG } from "@/config/app";
import { tokenTicker } from "@/config/brand";

import { PixlMark } from "./PixlMark";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card/30">
      <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <PixlMark size={34} alt={`${APP_CONFIG.name} mark`} />
            <div className="font-display font-bold text-lg">{APP_CONFIG.name}</div>
          </div>
          <p className="text-sm text-muted-foreground">
            A live Solana territory game. Hold {tokenTicker}, paint territory, defend your pixels, and grow by points.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-3">App</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><span className="text-foreground/80">Buy {tokenTicker}</span></li>
            <li><Link to="/canvas" className="hover:text-foreground">Canvas</Link></li>
            <li><Link to="/leaderboard" className="hover:text-foreground">Leaderboard</Link></li>
            <li><Link to="/profile" className="hover:text-foreground">Profile</Link></li>
            <li><Link to="/rules" className="hover:text-foreground">Rules</Link></li>
            <li><Link to="/litepaper" className="hover:text-foreground">Litepaper</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-3">Token</h4>
          <ul className="space-y-2 text-sm text-muted-foreground font-mono">
            <li><span className="text-foreground/80">CA: HVaWAjjHvtFvxBs51RDxfChiGdgfcQXfz9zVGJtEpump</span></li>
            <li>Network: Solana</li>
            <li>Supply: 1,000,000,000</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-3">Community</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                className="hover:text-foreground"
                href="https://x.com/pixelbattlecoin"
                target="_blank"
                rel="noopener noreferrer"
              >
                X / Twitter
              </a>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 text-muted-foreground/90">
                <span>Telegram Bot</span>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                  Soon
                </span>
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col gap-2 py-4 text-xs font-mono text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {APP_CONFIG.name}</span>
          <span className="font-pixel text-[8px] hidden sm:inline">PRESS START TO PAINT</span>
        </div>
      </div>
    </footer>
  );
}
