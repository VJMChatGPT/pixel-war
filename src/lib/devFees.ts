export type DevFeeEstimate = {
  totalDevFeesSol: number | null;
  winnerShareSol: number | null;
  lastUpdated: string | null;
  source: "estimated" | "onchain" | "unavailable";
};

export async function getEstimatedDevFeesForRound(): Promise<DevFeeEstimate> {
  // TODO: connect this to Pump.fun/PumpSwap trade data or an on-chain indexer.
  // TODO: calculate creator fees only, not protocol fees or LP fees.
  // TODO: verify final amount on-chain at round end before payout.
  return {
    totalDevFeesSol: null,
    winnerShareSol: null,
    lastUpdated: null,
    source: "unavailable",
  };
}
