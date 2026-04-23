import {
  HttpError,
  assertAllowedOrigin,
  createServiceClient,
  enforceRateLimit,
  getClientIp,
  getWalletSnapshot,
  json,
  preflight,
  requireSession,
} from "../_shared/security.ts";

const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 100;
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

type PaintRequest = {
  x?: number;
  y?: number;
  color?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflight(req);
  }

  try {
    assertAllowedOrigin(req);

    if (req.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Use POST.");
    }

    const supabase = createServiceClient();
    const session = await requireSession(req, supabase);
    const clientIp = getClientIp(req);

    await enforceRateLimit(supabase, `paint:ip:${clientIp}`, 20, 60);
    await enforceRateLimit(supabase, `paint:wallet:${session.wallet}`, 6, 900);

    const body = (await req.json()) as PaintRequest;
    const x = Number(body.x);
    const y = Number(body.y);
    const color = body.color?.trim().toLowerCase();

    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
      throw new HttpError(400, "OUT_OF_BOUNDS", "Pixel coordinates are outside the canvas.");
    }

    if (!color || !/^#[0-9a-f]{6}$/.test(color) || !ALLOWED_COLORS.has(color)) {
      throw new HttpError(400, "INVALID_COLOR", "Choose a valid palette color.");
    }

    const snapshot = await getWalletSnapshot(session.wallet);
    if (snapshot.pixelsAllowed <= 0) {
      throw new HttpError(403, "INSUFFICIENT_BALANCE", "Token balance is required to paint.");
    }

    const { data, error } = await supabase.rpc("paint_pixel_transaction", {
      p_wallet: session.wallet,
      p_x: x,
      p_y: y,
      p_color: color,
      p_balance: snapshot.balance,
      p_pixels_allowed: snapshot.pixelsAllowed,
      p_cooldown_seconds: COOLDOWN_SECONDS,
    });

    if (error) {
      throw new HttpError(500, "DATABASE_ERROR", error.message);
    }

    const result = data as Record<string, unknown>;
    if (!result?.ok) {
      const status = result?.code === "COOLDOWN_ACTIVE" || result?.code === "PIXEL_LIMIT_REACHED" ? 409 : 400;
      return json(req, result, status);
    }

    return json(req, result, 200);
  } catch (error) {
    if (error instanceof HttpError) {
      return json(req, { ok: false, code: error.code, message: error.message, ...error.details }, error.status);
    }

    const message = error instanceof Error ? error.message : "Unexpected paint error.";
    return json(req, { ok: false, code: "UNEXPECTED_ERROR", message }, 500);
  }
});
