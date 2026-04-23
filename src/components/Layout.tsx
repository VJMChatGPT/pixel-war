import { NavBar } from "./NavBar";
import { Footer } from "./Footer";

export function Layout({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
      {footer && <Footer />}
    </div>
  );
}
