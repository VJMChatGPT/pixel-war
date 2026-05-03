-- Make the points leaderboard resilient after manual resets or older paint
-- functions left wallets with pixels but zero points_per_second.

UPDATE public.wallet_state
SET points_per_second = public.calculate_points_per_second(pixels_used),
    last_points_update_at = COALESCE(last_points_update_at, updated_at, now()),
    updated_at = now()
WHERE pixels_used > 0
  AND COALESCE(points_per_second, 0) <= 0;

DROP VIEW IF EXISTS public.leaderboard;
DROP VIEW IF EXISTS public.public_wallet_state;

CREATE VIEW public.public_wallet_state AS
WITH effective_wallet_state AS (
  SELECT
    wallet,
    display_name,
    pixels_allowed,
    pixels_used,
    CASE
      WHEN COALESCE(points_per_second, 0) > 0 THEN points_per_second
      ELSE public.calculate_points_per_second(pixels_used)
    END AS effective_points_per_second,
    total_points,
    last_points_update_at,
    last_paint_at,
    updated_at
  FROM public.wallet_state
)
SELECT
  wallet,
  display_name,
  pixels_allowed,
  pixels_used,
  public.project_wallet_points(
    total_points,
    effective_points_per_second,
    last_points_update_at
  ) AS total_points,
  effective_points_per_second AS points_per_second,
  last_points_update_at,
  last_paint_at,
  updated_at
FROM effective_wallet_state;

CREATE VIEW public.leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY pws.pixels_used DESC, pws.updated_at ASC) AS rank,
  pws.wallet,
  pws.display_name,
  pws.pixels_used AS controlled_pixels,
  pws.pixels_allowed,
  CASE
    WHEN pws.pixels_used > 0 THEN (pws.pixels_used::numeric / 10000.0) * 100.0
    ELSE 0
  END AS supply_percentage,
  pws.last_paint_at AS last_active
FROM public.public_wallet_state pws
WHERE pws.pixels_used > 0;

GRANT SELECT ON public.public_wallet_state TO anon, authenticated, service_role;
GRANT SELECT ON public.leaderboard TO anon, authenticated, service_role;
