/**
 * App-level constants and config.
 *
 * ---------------------------------------------------------------------------
 * ENVIRONMENT VARIABLES
 * ---------------------------------------------------------------------------
 * This project uses Vite, so PUBLIC client-side env vars are prefixed with
 * `VITE_` and exposed via `import.meta.env`. The Supabase client is auto-
 * generated at `src/integrations/supabase/client.ts` and reads:
 *
 *   VITE_SUPABASE_URL              (public, safe in client)
 *   VITE_SUPABASE_PUBLISHABLE_KEY  (public anon key, safe in client)
 *   VITE_SUPABASE_PROJECT_ID       (public)
 *
 * If you migrate to Next.js or another framework, the equivalent public vars
 * would be NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * ---------------------------------------------------------------------------
 * SERVER-SIDE ONLY SECRETS (never imported into client code)
 * ---------------------------------------------------------------------------
 * Future server-only secrets — used only inside Supabase Edge Functions
 * (`supabase/functions/<name>/index.ts`). Add them via the Lovable Cloud
 * Secrets manager. They are NEVER read from the frontend.
 *
 *   SUPABASE_SERVICE_ROLE_KEY   (full admin access — edge functions only)
 *   SOLANA_RPC_URL              (token balance reads, rate-limited keys)
 *   TOKEN_MINT_ADDRESS          (the project's SPL token mint)
 *   ALLOWED_APP_ORIGINS         (comma-separated allowed browser origins)
 *   WALLET_SESSION_TTL_SECONDS  (optional wallet session lifetime)
 */

const SUPPLY_PERCENT_PER_PIXEL = 0.01;
const TOTAL_SUPPLY_PERCENT = 100;
const TOTAL_PIXELS = Math.floor(TOTAL_SUPPLY_PERCENT / SUPPLY_PERCENT_PER_PIXEL);
const CANVAS_WIDTH = Math.floor(Math.sqrt(TOTAL_PIXELS));
const CANVAS_HEIGHT = Math.ceil(TOTAL_PIXELS / CANVAS_WIDTH);

export const APP_CONFIG = {
  name: "Pixel War",
  tagline: "Paint territory. Win the war.",

  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    totalPixels: TOTAL_PIXELS,
  },

  rules: {
    supplyPercentPerPixel: SUPPLY_PERCENT_PER_PIXEL,
    /** 0.01% of supply = 1 allowed pixel → 100% supply = 10,000 pixels. */
    pixelsPerPercentBP: 1, // 1 pixel per 0.01% (1 basis point)
    cooldownMs: 15 * 60 * 1000, // 15 minutes
  },

  /** Curated violet/lavender palette — Phantom-inspired, no rainbow. */
  palette: [
    "#f3e8ff", "#e0c8ff", "#c9a8ff", "#a78bff",
    "#9d4dff", "#8a4dff", "#7b2dff", "#5b2dba",
    "#3d1d7a", "#1a0b2e", "#ffffff", "#c4b5d9",
    "#8b7da8", "#ff6fae", "#9bd9ff", "#ffd16a",
  ] as const,
} as const;

export type HexColor = string;
