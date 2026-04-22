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
 *   TOKEN_TOTAL_SUPPLY          (or fetched on-chain)
 */

export const APP_CONFIG = {
  name: "PixelDAO",
  tagline: "Own the pixels. Paint the future.",

  canvas: {
    width: 100,
    height: 100,
    totalPixels: 10_000,
  },

  rules: {
    /** 0.01% of supply = 1 allowed pixel → 100% supply = 10,000 pixels. */
    pixelsPerPercentBP: 1, // 1 pixel per 0.01% (1 basis point)
    cooldownMs: 15 * 60 * 1000, // 15 minutes
  },

  /** Curated arcade neon palette for the pixel painter. */
  palette: [
    "#ff2d75", "#ff5e3a", "#ffb800", "#fff03a",
    "#b6ff3c", "#3affb5", "#00f0ff", "#3a8cff",
    "#9d4dff", "#ff3ad9", "#ffffff", "#a3a3b8",
    "#5b5b73", "#1a1a2e", "#0a0a14", "#e8e8f0",
  ] as const,
} as const;

export type HexColor = string;
