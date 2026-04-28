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
export type PublicWalletStateRow = {
  wallet: string;
  pixels_allowed: number;
  pixels_used: number;
  last_paint_at: string | null;
  updated_at: string;
};
export type PaintResultPixel = Omit<PixelRow, "active">;

/** Load only painted pixels. Empty cells are represented as null client-side. */
export async function fetchAllPixels(): Promise<PixelRow[]> {
  const { data, error } = await supabase
    .from("pixels")
    .select("*")
    .not("owner_wallet", "is", null)
    .order("y", { ascending: true })
    .order("x", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchWalletState(wallet: string): Promise<PublicWalletStateRow | null> {
  const { data, error } = await (supabase as any)
    .from("public_wallet_state")
    .select("*")
    .eq("wallet", wallet)
    .maybeSingle();
  if (error) throw error;
  return data as PublicWalletStateRow | null;
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

export async function paintPixel(params: {
  x: number;
  y: number;
  color: string;
  sessionToken: string;
}): Promise<{
  ok: boolean;
  code?: string;
  changed?: boolean;
  message?: string;
  remainingMs?: number;
  pixel?: PaintResultPixel;
  evictedPixel?: PaintResultPixel | null;
  walletState?: WalletStateRow;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke("paint-pixel", {
    body: {
      x: params.x,
      y: params.y,
      color: params.color,
    },
    headers: {
      Authorization: `Bearer ${params.sessionToken}`,
    },
  });

  if (error) {
    return readFunctionError(error);
  }

  return data as {
    ok: boolean;
    code?: string;
    changed?: boolean;
    message?: string;
    remainingMs?: number;
    pixel?: PaintResultPixel;
    evictedPixel?: PaintResultPixel | null;
    walletState?: WalletStateRow;
  };
}

async function readFunctionError(error: Error): Promise<{
  ok: false;
  code?: string;
  message: string;
  remainingMs?: number;
  error: string;
}> {
  const context = (error as { context?: Response }).context;

  if (context) {
    try {
      const payload = await context.clone().json();
      if (payload && typeof payload === "object") {
        const body = payload as { code?: string; message?: string; remainingMs?: number };
        return {
          ok: false,
          code: body.code,
          message: body.message ?? error.message,
          remainingMs: body.remainingMs,
          error: error.message,
        };
      }
    } catch {
      // Fall back to the SDK error message below.
    }
  }

  return { ok: false, error: error.message, message: error.message };
}
