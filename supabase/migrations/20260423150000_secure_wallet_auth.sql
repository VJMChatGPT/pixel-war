CREATE TABLE public.wallet_auth_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_ip TEXT,
  user_agent TEXT
);

CREATE INDEX idx_wallet_auth_nonces_wallet ON public.wallet_auth_nonces(wallet);
CREATE INDEX idx_wallet_auth_nonces_expires_at ON public.wallet_auth_nonces(expires_at);

CREATE TABLE public.wallet_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_ip TEXT,
  user_agent TEXT
);

CREATE INDEX idx_wallet_sessions_wallet ON public.wallet_sessions(wallet);
CREATE INDEX idx_wallet_sessions_expires_at ON public.wallet_sessions(expires_at);

CREATE TABLE public.request_rate_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket TEXT,
  p_max_hits INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_row public.request_rate_limits%ROWTYPE;
  v_retry_after INTEGER := 0;
BEGIN
  IF p_bucket IS NULL OR length(trim(p_bucket)) = 0 THEN
    RETURN jsonb_build_object('ok', true, 'remaining', p_max_hits);
  END IF;

  IF p_max_hits <= 0 OR p_window_seconds <= 0 THEN
    RETURN jsonb_build_object('ok', true, 'remaining', p_max_hits);
  END IF;

  SELECT *
  INTO v_row
  FROM public.request_rate_limits
  WHERE bucket = p_bucket
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.request_rate_limits (bucket, hits, window_started_at, updated_at)
    VALUES (p_bucket, 1, v_now, v_now);

    RETURN jsonb_build_object('ok', true, 'remaining', greatest(p_max_hits - 1, 0));
  END IF;

  IF v_row.window_started_at <= v_now - make_interval(secs => p_window_seconds) THEN
    UPDATE public.request_rate_limits
    SET hits = 1,
        window_started_at = v_now,
        updated_at = v_now
    WHERE bucket = p_bucket;

    RETURN jsonb_build_object('ok', true, 'remaining', greatest(p_max_hits - 1, 0));
  END IF;

  IF v_row.hits >= p_max_hits THEN
    v_retry_after := ceil(
      EXTRACT(EPOCH FROM (v_row.window_started_at + make_interval(secs => p_window_seconds) - v_now))
    )::INTEGER;

    RETURN jsonb_build_object(
      'ok', false,
      'remaining', 0,
      'retryAfterSeconds', greatest(v_retry_after, 0)
    );
  END IF;

  UPDATE public.request_rate_limits
  SET hits = hits + 1,
      updated_at = v_now
  WHERE bucket = p_bucket;

  RETURN jsonb_build_object('ok', true, 'remaining', greatest(p_max_hits - v_row.hits - 1, 0));
END;
$$;

REVOKE ALL ON TABLE public.wallet_auth_nonces FROM PUBLIC;
REVOKE ALL ON TABLE public.wallet_sessions FROM PUBLIC;
REVOKE ALL ON TABLE public.request_rate_limits FROM PUBLIC;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

DROP POLICY IF EXISTS "Wallet states are publicly readable" ON public.wallet_state;

DROP VIEW IF EXISTS public.leaderboard;
DROP VIEW IF EXISTS public.public_wallet_state;

CREATE VIEW public.public_wallet_state AS
SELECT
  wallet,
  pixels_allowed,
  pixels_used,
  last_paint_at,
  updated_at
FROM public.wallet_state;

CREATE VIEW public.leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY pws.pixels_used DESC, pws.updated_at ASC) AS rank,
  pws.wallet,
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
