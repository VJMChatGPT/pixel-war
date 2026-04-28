ALTER TABLE public.wallet_state
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.wallet_state
DROP CONSTRAINT IF EXISTS wallet_state_display_name_length;

ALTER TABLE public.wallet_state
ADD CONSTRAINT wallet_state_display_name_length
CHECK (
  display_name IS NULL OR
  (length(btrim(display_name)) >= 1 AND length(btrim(display_name)) <= 32)
);

DROP VIEW IF EXISTS public.leaderboard;
DROP VIEW IF EXISTS public.public_wallet_state;

CREATE VIEW public.public_wallet_state AS
SELECT
  wallet,
  display_name,
  pixels_allowed,
  pixels_used,
  last_paint_at,
  updated_at
FROM public.wallet_state;

CREATE VIEW public.leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY pws.pixels_used DESC, pws.updated_at ASC) AS rank,
  pws.wallet,
  pws.display_name,
  pws.pixels_used AS controlled_pixels,
  pws.pixels_allowed,
  CASE
    WHEN pws.pixels_allowed > 0 THEN (pws.pixels_allowed::numeric / 10000.0) * 100.0
    ELSE 0
  END AS supply_percentage,
  pws.last_paint_at AS last_active
FROM public.public_wallet_state pws
WHERE pws.pixels_used > 0;

GRANT SELECT ON public.public_wallet_state TO anon, authenticated, service_role;
GRANT SELECT ON public.leaderboard TO anon, authenticated, service_role;
