/**
 * Pixel data service — wraps Supabase reads and the (future) paint action.
 *
 * READS go straight through the Supabase client (RLS allows public select).
 * WRITES (paint) are routed through `paintPixel()`, which today writes
 * directly via the anon client for demo purposes BUT is the single seam
 * where you will later swap in a Supabase Edge Function call that:
 *   1. verifies the wallet signature,
 *   2. checks current on-chain token balance,
 *   3. enforces the 15-minute cooldown,
 *   4. updates pixels + paint_history + wallet_state atomically,
 *   5. uses the service role key (server-side only).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PixelRow = Database["public"]["Tables"]["pixels"]["Row"];
export type WalletStateRow = Database["public"]["Tables"]["wallet_state"]["Row"];
export type PaintHistoryRow = Database["public"]["Tables"]["paint_history"]["Row"];
export type LeaderboardRow = Database["public"]["Views"]["leaderboard"]["Row"];

/** Load the entire canvas (10k rows max). */
export async function fetchAllPixels(): Promise<PixelRow[]> {
  const { data, error } = await supabase
    .from("pixels")
    .select("*")
    .order("y", { ascending: true })
    .order("x", { ascending: true })
    .limit(10_000);
  if (error) throw error;
  return data ?? [];
}

export async function fetchWalletState(wallet: string): Promise<WalletStateRow | null> {
  const { data, error } = await supabase
    .from("wallet_state")
    .select("*")
    .eq("wallet", wallet)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchRecentPaints(limit = 20): Promise<PaintHistoryRow[]> {
  const { data, error } = await supabase
    .from("paint_history")
    .select("*")
    .order("painted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchLeaderboard(limit = 100): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("rank", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchWalletPaints(wallet: string, limit = 20): Promise<PaintHistoryRow[]> {
  const { data, error } = await supabase
    .from("paint_history")
    .select("*")
    .eq("wallet", wallet)
    .order("painted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/**
 * Paint a pixel — placeholder client-side implementation.
 *
 * In production this MUST move to an edge function so the cooldown,
 * balance check and signature verification cannot be bypassed. Until then
 * the UI calls this function and gets an immediate optimistic update via
 * the realtime subscription.
 *
 * NOTE: with the current RLS (no insert/update policies), this call will
 * be rejected by Supabase for unauthenticated clients — which is the
 * desired security posture. The UI handles that by surfacing an error
 * toast and explaining that the server action is not yet wired up.
 */
export async function paintPixel(params: {
  wallet: string;
  x: number;
  y: number;
  color: string;
}): Promise<{ ok: boolean; error?: string }> {
  // TODO: replace with `supabase.functions.invoke('paint-pixel', { body: params })`
  const { error } = await supabase
    .from("pixels")
    .update({ color: params.color, owner_wallet: params.wallet, updated_at: new Date().toISOString() })
    .eq("x", params.x)
    .eq("y", params.y);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
