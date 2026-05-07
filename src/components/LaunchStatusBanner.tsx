import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLaunchState } from "@/hooks/useLaunchState";
import { cn } from "@/lib/utils";

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

export function LaunchStatusBanner({ compact = false }: { compact?: boolean }) {
  const launch = useLaunchState();
  const isLive = launch.canPaint;

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-border/60 bg-card/88 md:bg-card/55 md:backdrop-blur-md",
        isLive && "border-accent/40 bg-accent/10",
      )}
    >
      <div className="absolute inset-0 bg-radial-glow opacity-35 pointer-events-none" />
      <div className={cn("container relative flex flex-col gap-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", compact ? "md:py-3" : "md:py-4")}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("relative flex h-2.5 w-2.5", isLive ? "text-accent" : "text-primary")}>
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isLive ? "bg-accent animate-ping" : "bg-primary/70")} />
            <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", isLive ? "bg-accent" : "bg-primary")} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-bold md:text-base">{launch.title}</span>
              <span className="rounded-full border border-border/70 bg-background/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {launch.phase}
              </span>
              {launch.loading && (
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">loading</span>
              )}
              {launch.error && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-destructive">
                  <AlertTriangle className="h-3 w-3" /> state unavailable
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground md:text-sm">
              {launch.error ? "Could not load current backend launch state." : launch.description}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-background/70 px-3 py-2 md:bg-background/55">
            <Timer className="h-4 w-4 text-primary" />
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                {isLive ? "time left" : "6-hour window"}
              </div>
              <div className="font-mono text-sm font-semibold tabular-nums">
                {isLive ? formatCountdown(launch.remainingMs) : "Not started"}
              </div>
            </div>
          </div>

          {isLive ? (
            <Button asChild size="sm" className="h-11 w-full rounded-xl bg-gradient-neon text-primary-foreground sm:h-10 sm:w-auto">
              <Link to="/canvas">
                <Zap className="h-4 w-4" /> Paint your pixels
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="h-11 w-full rounded-xl sm:h-10 sm:w-auto">
              <Link to="/rules">
                Launch rules <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
