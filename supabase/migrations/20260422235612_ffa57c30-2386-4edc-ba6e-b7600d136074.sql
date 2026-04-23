
DROP VIEW IF EXISTS public.leaderboard;

CREATE VIEW public.leaderboard
WITH (security_invoker = true) AS
SELECT
  ROW_NUMBER() OVER (ORDER BY ws.pixels_used DESC, ws.updated_at ASC) AS rank,
  ws.wallet,
  ws.pixels_used AS controlled_pixels,
  ws.pixels_allowed,
  CASE WHEN ws.pixels_allowed > 0
       THEN (ws.pixels_allowed::numeric / 10000.0) * 100.0
       ELSE 0
  END AS supply_percentage,
  ws.last_paint_at AS last_active
FROM public.wallet_state ws
WHERE ws.pixels_used > 0;
