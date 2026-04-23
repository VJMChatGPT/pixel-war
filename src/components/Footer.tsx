import { Link } from "react-router-dom";
import { PixlMascot } from "./PixlMascot";

export function Footer() {
  return (
    <footer className="border-t border-border mt-20 bg-card/30">
      <div className="container py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <PixlMascot size={36} mood="cheer" />
            <div className="font-display font-bold text-lg">
              Pixel<span className="text-gradient-neon">DAO</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            A collaborative on-chain canvas. Hold the token, paint the future.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-3">App</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/canvas" className="hover:text-foreground">Canvas</Link></li>
            <li><Link to="/leaderboard" className="hover:text-foreground">Leaderboard</Link></li>
            <li><Link to="/profile" className="hover:text-foreground">Profile</Link></li>
            <li><Link to="/rules" className="hover:text-foreground">Rules</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-3">Token</h4>
          <ul className="space-y-2 text-sm text-muted-foreground font-mono">
            <li>Mint: <span className="text-foreground/70">PIXLxxxx…xxxx</span></li>
            <li>Network: Solana</li>
            <li>Supply: 1,000,000,000</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-3">Community</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a className="hover:text-foreground" href="#">X / Twitter</a></li>
            <li><a className="hover:text-foreground" href="#">Discord</a></li>
            <li><a className="hover:text-foreground" href="#">Telegram</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-4 flex justify-between text-xs font-mono text-muted-foreground">
          <span>© {new Date().getFullYear()} PixelDAO</span>
          <span className="font-pixel text-[8px] hidden sm:inline">PRESS START TO PAINT</span>
        </div>
      </div>
    </footer>
  );
}
