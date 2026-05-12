import { useQuery } from "@tanstack/react-query";

import {
  WINNER_PRIZE_FEE_DISCLAIMER,
  WINNER_PRIZE_FEE_LABEL,
  WINNER_PRIZE_SHARE_LABEL,
} from "@/config/brand";
import { getEstimatedDevFeesForRound } from "@/lib/devFees";

function formatSol(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(3)} SOL`;
}

function formatLastUpdated(value: string | null) {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export function WinnerPrizeFees() {
  const query = useQuery({
    queryKey: ["winner-prize-dev-fees"],
    queryFn: getEstimatedDevFeesForRound,
    staleTime: 30_000,
    refetchInterval: (queryState) =>
      queryState.state.data?.source === "unavailable" ? false : 45_000,
  });

  const data = query.data;
  const isUnavailable = !data || data.source === "unavailable";
  const lastUpdated = formatLastUpdated(data?.lastUpdated ?? null);

  return (
    <div className="mt-6 rounded-2xl border border-accent/20 bg-background/55 px-4 py-4 md:px-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-primary/20 bg-primary/8 px-3 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/80">
            {WINNER_PRIZE_FEE_LABEL}
          </div>
          <div className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
            {formatSol(data?.totalDevFeesSol ?? null)}
          </div>
          {!isUnavailable && (
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              50% of dev fees
            </div>
          )}
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/8 px-3 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent/80">
            {WINNER_PRIZE_SHARE_LABEL}
          </div>
          <div className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
            {formatSol(data?.winnerShareSol ?? null)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            50% of dev fees
          </div>
        </div>
      </div>

      {isUnavailable ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Live fee tracking will appear here once the data source is connected.
        </p>
      ) : lastUpdated ? (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {WINNER_PRIZE_FEE_DISCLAIMER}
      </p>
    </div>
  );
}
