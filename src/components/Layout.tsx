import { NavBar } from "./NavBar";
import { Footer } from "./Footer";
import { LiveTicker } from "./LiveTicker";
import { PointsPulseBar } from "./PointsPulseBar";

export function Layout({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="sticky top-16 md:top-20 z-30">
        <LiveTicker />
        <PointsPulseBar />
      </div>
      <main className="flex-1">{children}</main>
      {footer && <Footer />}
    </div>
  );
}
