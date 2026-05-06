import { Link, NavLink, useLocation } from "react-router-dom";
import { PixlMascot } from "./PixlMascot";
import { WalletConnectButton } from "./WalletConnectButton";
import { HeaderShareOnXButton } from "./HeaderShareOnXButton";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/config/app";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowUpRight, Menu } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/canvas", label: "Canvas" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/profile", label: "Profile" },
  { to: "/rules", label: "Rules" },
];

const TRADE_URL = "https://trade.padre.gg/trade/solana/3q6JVmScnth28vmLtagB5EirPG64K6mjZSKSn9NeDcq1";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled ? "backdrop-blur-xl bg-background/70 border-b border-border" : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-3 group">
          <PixlMascot size={40} mood="idle" />
          <div className="leading-none">
            <div className="font-display font-bold text-xl tracking-tight">
              {APP_CONFIG.name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
              paint territory. win the war.
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  isActive
                    ? "text-foreground bg-muted/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )
              }
            >
              {l.label}
              {location.pathname === l.to && (
                <span className="absolute -bottom-px left-1/2 -translate-x-1/2 h-px w-8 bg-gradient-neon" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <HeaderShareOnXButton />
          <WalletConnectButton />
          <Button
            asChild
            size="lg"
            className="h-11 rounded-xl px-5 font-semibold bg-gradient-neon text-primary-foreground shadow-[0_10px_30px_rgba(168,85,247,0.28)] hover:opacity-95"
          >
            <a href={TRADE_URL} target="_blank" rel="noopener noreferrer">
              <span>Buy $PIXL</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger className="p-2 rounded-lg hover:bg-muted/40">
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border">
              <div className="flex flex-col gap-2 mt-8">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={({ isActive }) =>
                      cn(
                        "px-4 py-3 rounded-lg font-medium",
                        isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                <div className="mt-4 space-y-3">
                  <HeaderShareOnXButton />
                  <WalletConnectButton />
                  <Button
                    asChild
                    size="lg"
                    className="w-full h-11 rounded-xl px-5 font-semibold bg-gradient-neon text-primary-foreground shadow-[0_10px_30px_rgba(168,85,247,0.28)] hover:opacity-95"
                  >
                    <a href={TRADE_URL} target="_blank" rel="noopener noreferrer">
                      <span>Buy $PIXL</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
