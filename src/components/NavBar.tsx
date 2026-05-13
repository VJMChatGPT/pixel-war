import { Link, NavLink, useLocation } from "react-router-dom";
import { PixlMark } from "./PixlMark";
import { WalletConnectButton } from "./WalletConnectButton";
import { HeaderShareOnXButton } from "./HeaderShareOnXButton";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/config/app";
import { tokenTicker } from "@/config/brand";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const BUY_URL = "https://pump.fun/coin/HVaWAjjHvtFvxBs51RDxfChiGdgfcQXfz9zVGJtEpump";

const links = [
  { to: "/", label: "Home" },
  { to: "/canvas", label: "Canvas" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/profile", label: "Profile" },
  { to: "/#prize", label: "Prize" },
  { to: "/rules", label: "Rules" },
];

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
      <div className="container flex h-14 items-center justify-between md:h-20">
        <Link to="/" className="group flex min-w-0 items-center gap-3">
          <PixlMark size={36} alt={`${APP_CONFIG.name} mark`} />
          <div className="min-w-0 leading-none">
            <div className="truncate font-display text-lg font-bold tracking-tight sm:text-xl">
              {APP_CONFIG.name}
            </div>
            <div className="mt-0.5 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
              {APP_CONFIG.tagline}
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={() =>
                cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  (l.to === "/#prize"
                    ? location.pathname === "/" && location.hash === "#prize"
                    : location.pathname === l.to)
                    ? "text-foreground bg-muted/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )
              }
            >
              {l.label}
              {((l.to === "/#prize" && location.pathname === "/" && location.hash === "#prize") ||
                (l.to !== "/#prize" && location.pathname === l.to)) && (
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
            className="h-11 rounded-xl px-5 font-semibold bg-gradient-neon text-primary-foreground shadow-[0_10px_30px_rgba(168,85,247,0.28)]"
          >
            <a href={BUY_URL} target="_blank" rel="noopener noreferrer">
              <span>Buy {tokenTicker}</span>
            </a>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger className="rounded-lg p-2 hover:bg-muted/40">
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="right" className="border-border bg-background px-5">
              <div className="mt-8 flex flex-col gap-2">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-xl bg-gradient-neon px-5 font-semibold text-primary-foreground"
                >
                  <a href={BUY_URL} target="_blank" rel="noopener noreferrer">
                    <span>Buy {tokenTicker}</span>
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-xl px-5"
                >
                  <Link to="/canvas">View Canvas</Link>
                </Button>
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={() =>
                      cn(
                        "rounded-lg px-4 py-3 font-medium",
                        ((l.to === "/#prize" && location.pathname === "/" && location.hash === "#prize") ||
                          (l.to !== "/#prize" && location.pathname === l.to))
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground"
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                <div className="mt-4 space-y-3">
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    Wallet and sharing
                  </div>
                  <HeaderShareOnXButton />
                  <WalletConnectButton className="h-12 w-full justify-center" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
