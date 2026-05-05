-- Pixel War launch reset.
-- RUN MANUALLY ONLY AT LAUNCH.
--
-- This script prepares the board for a real launch rehearsal or token launch.
-- Automatic reset is intentionally not implemented yet.
-- Review the target Supabase project before running.

BEGIN;

-- Reset paint history.
TRUNCATE TABLE public.paint_history RESTART IDENTITY;

-- Reset the 100x100 canvas while preserving pre-created pixel rows.
UPDATE public.pixels
SET
  color = '#0a0a14',
  owner_wallet = NULL,
  active = true,
  updated_at = now();

-- Reset wallet scoring and territory state.
TRUNCATE TABLE public.wallet_state RESTART IDENTITY;

-- Revoke/delete all active authentication state.
TRUNCATE TABLE public.wallet_sessions RESTART IDENTITY;
TRUNCATE TABLE public.wallet_auth_nonces RESTART IDENTITY;

-- Clear rate-limit buckets so launch starts from a clean operational window.
TRUNCATE TABLE public.request_rate_limits;

-- Return the backend launch state to a safe prelaunch state.
UPDATE public.launch_config
SET
  phase = 'prelaunch',
  countdown_started_at = NULL,
  countdown_ends_at = NULL,
  mechanics_enabled = false
WHERE id = 'global';

COMMIT;

-- To start a 6-hour live launch window manually after the reset, run:
--
-- UPDATE public.launch_config
-- SET
--   phase = 'live',
--   countdown_started_at = now(),
--   countdown_ends_at = now() + interval '6 hours',
--   mechanics_enabled = true
-- WHERE id = 'global';
--
-- To end/lock the rehearsal manually:
--
-- UPDATE public.launch_config
-- SET
--   phase = 'ended',
--   mechanics_enabled = false
-- WHERE id = 'global';
