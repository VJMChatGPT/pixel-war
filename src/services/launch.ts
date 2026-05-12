import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LaunchConfigRow = Database["public"]["Tables"]["launch_config"]["Row"];
export type LaunchPhase = LaunchConfigRow["phase"];

export type LaunchStatus = {
  config: LaunchConfigRow | null;
  phase: LaunchPhase | "unknown";
  mechanicsEnabled: boolean;
  startsAtMs: number | null;
  endsAtMs: number | null;
  remainingMs: number;
  isLiveWindow: boolean;
  canPaint: boolean;
  title: string;
  description: string;
};

export async function fetchLaunchConfig(): Promise<LaunchConfigRow | null> {
  const { data, error } = await supabase
    .from("launch_config")
    .select("*")
    .eq("id", "global")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function getLaunchStatus(config: LaunchConfigRow | null, nowMs = Date.now()): LaunchStatus {
  const phase = config?.phase ?? "unknown";
  const mechanicsEnabled = Boolean(config?.mechanics_enabled);
  const startsAtMs = config?.countdown_started_at ? Date.parse(config.countdown_started_at) : null;
  const endsAtMs = config?.countdown_ends_at ? Date.parse(config.countdown_ends_at) : null;
  const hasValidWindow =
    typeof startsAtMs === "number" &&
    Number.isFinite(startsAtMs) &&
    typeof endsAtMs === "number" &&
    Number.isFinite(endsAtMs) &&
    endsAtMs > startsAtMs;
  const isLiveWindow = phase === "live" && hasValidWindow && nowMs >= startsAtMs! && nowMs < endsAtMs!;
  const canPaint = isLiveWindow && mechanicsEnabled;
  const remainingMs = hasValidWindow ? Math.max(0, endsAtMs! - nowMs) : 0;

  if (canPaint) {
    return {
      config,
      phase,
      mechanicsEnabled,
      startsAtMs,
      endsAtMs,
      remainingMs,
      isLiveWindow,
      canPaint,
      title: "Pixel Battle is live",
      description: "6-hour war window. Connect wallet, paint your pixels, and fight for points.",
    };
  }

  if (phase === "live" && !mechanicsEnabled) {
    return {
      config,
      phase,
      mechanicsEnabled,
      startsAtMs,
      endsAtMs,
      remainingMs,
      isLiveWindow,
      canPaint,
      title: "Mechanics disabled",
      description: "The launch window exists, but painting is currently disabled by backend launch state.",
    };
  }

  if (phase === "ended") {
    return {
      config,
      phase,
      mechanicsEnabled,
      startsAtMs,
      endsAtMs,
      remainingMs,
      isLiveWindow,
      canPaint,
      title: "Launch window ended",
      description: "Painting is locked until Pixel Battle is reopened from the backend launch state.",
    };
  }

  return {
    config,
    phase,
    mechanicsEnabled,
    startsAtMs,
    endsAtMs,
    remainingMs,
    isLiveWindow,
    canPaint,
    title: "Launch preparation",
      description: "The backend countdown has not started yet. Painting will unlock when Pixel Battle goes live.",
  };
}
