import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { NavBar } from "./NavBar";
import { Footer } from "./Footer";
import { LiveTicker } from "./LiveTicker";
import { PointsPulseBar } from "./PointsPulseBar";

export function Layout({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="sticky top-14 z-30 md:top-20">
        <LiveTicker />
        <PointsPulseBar />
      </div>
      <main className="flex-1">{children}</main>
      {footer && <Footer />}
    </div>
  );
}
