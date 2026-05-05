import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/hooks/useWallet";
import { WalletStateProvider } from "@/hooks/useWalletState";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();
const Landing = lazy(() => import("./pages/Landing.tsx"));
const CanvasPage = lazy(() => import("./pages/Canvas.tsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Rules = lazy(() => import("./pages/Rules.tsx"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-primary/25 bg-card/70 px-8 py-10 text-center shadow-[0_0_60px_hsl(var(--primary)/0.12)] backdrop-blur">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary/80">loading route</div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Bringing the canvas into view.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We&apos;re streaming in this part of the app so the first load stays lighter.
          </p>
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WalletProvider>
        <WalletStateProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/canvas" element={<CanvasPage />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/rules" element={<Rules />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Analytics />
        </WalletStateProvider>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
