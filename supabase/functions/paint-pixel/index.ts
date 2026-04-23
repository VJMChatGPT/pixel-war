import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.0";

const CANVAS_PIXELS = 10_000;
const COOLDOWN_SECONDS = 15 * 60;
const ALLOWED_COLORS = new Set([
  "#f3e8ff",
  "#e0c8ff",
  "#c9a8ff",
  "#a78bff",
  "#9d4dff",
  "#8a4dff",
  "#7b2dff",
  "#5b2dba",
  "#3d1d7a",
  "#1a0b2e",
  "#ffffff",
  "#c4b5d9",
  "#8b7da8",
  "#ff6fae",
  "#9bd9ff",
  "#ffd16a",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PaintRequest = {
  wallet?: string;
  x?: number;
  y?: number;
  color?: string;
  balance?: number;
  totalSupply?: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, code: "METHOD_NOT_ALLOWED", message: "Use POST." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      { ok: false, code: "SERVER_NOT_CONFIGURED", message: "Missing Supabase function secrets." },
      500,
    );
  }

  let body: PaintRequest;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, code: "INVALID_JSON", message: "Request body must be JSON." }, 400);
  }

  const wallet = body.wallet?.trim();
  const x = Number(body.x);
  const y = Number(body.y);
  const color = body.color?.trim().toLowerCase();
  const balance = Number(body.balance);
  const totalSupply = Number(body.totalSupply);

  if (!wallet || wallet.length < 8) {
    return json({ ok: false, code: "INVALID_WALLET", message: "Wallet is required." }, 400);
  }

  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= 100 || y < 0 || y >= 100) {
    return json({ ok: false, code: "OUT_OF_BOUNDS", message: "Pixel coordinates are outside the canvas." }, 400);
  }

  if (!color || !/^#[0-9a-f]{6}$/.test(color) || !ALLOWED_COLORS.has(color)) {
    return json({ ok: false, code: "INVALID_COLOR", message: "Choose a valid palette color." }, 400);
  }

  if (!Number.isFinite(balance) || !Number.isFinite(totalSupply) || balance <= 0 || totalSupply <= 0) {
    return json({ ok: false, code: "INSUFFICIENT_BALANCE", message: "Token balance is required to paint." }, 400);
  }

  // Demo mode: this comes from the mock wallet. Phantom/on-chain validation should
  // replace these body fields before production.
  const pixelsAllowed = Math.floor((balance / totalSupply) * CANVAS_PIXELS);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("paint_pixel_transaction", {
    p_wallet: wallet,
    p_x: x,
    p_y: y,
    p_color: color,
    p_balance: balance,
    p_pixels_allowed: pixelsAllowed,
    p_cooldown_seconds: COOLDOWN_SECONDS,
  });

  if (error) {
    return json({ ok: false, code: "DATABASE_ERROR", message: error.message }, 500);
  }

  const result = data as Record<string, unknown>;
  if (!result?.ok) {
    const status = result?.code === "COOLDOWN_ACTIVE" || result?.code === "PIXEL_LIMIT_REACHED" ? 409 : 400;
    return json(result, status);
  }

  return json(result, 200);
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
