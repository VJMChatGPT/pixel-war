ALTER TABLE public.wallet_state
ADD COLUMN IF NOT EXISTS total_points NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_per_second NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_points_update_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.calculate_points_per_second(p_controlled_pixels INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_points_per_pixel CONSTANT NUMERIC := 0.05;
BEGIN
  RETURN greatest(coalesce(p_controlled_pixels, 0), 0)::NUMERIC * v_points_per_pixel;
END;
$$;

CREATE OR REPLACE FUNCTION public.project_wallet_points(
  p_total_points NUMERIC,
  p_points_per_second NUMERIC,
  p_last_points_update_at TIMESTAMPTZ,
  p_now TIMESTAMPTZ DEFAULT now()
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_elapsed_seconds NUMERIC := greatest(extract(epoch from (p_now - coalesce(p_last_points_update_at, p_now))), 0);
BEGIN
  RETURN coalesce(p_total_points, 0) + (coalesce(p_points_per_second, 0) * v_elapsed_seconds);
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_wallet_points(
  p_wallet TEXT,
  p_now TIMESTAMPTZ DEFAULT now()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wallet_state
  SET total_points = public.project_wallet_points(total_points, points_per_second, last_points_update_at, p_now),
      last_points_update_at = p_now
  WHERE wallet = p_wallet;
END;
$$;

DROP VIEW IF EXISTS public.leaderboard;
DROP VIEW IF EXISTS public.public_wallet_state;

CREATE VIEW public.public_wallet_state AS
SELECT
  wallet,
  display_name,
  pixels_allowed,
  pixels_used,
  public.project_wallet_points(total_points, points_per_second, last_points_update_at) AS total_points,
  points_per_second,
  last_points_update_at,
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

CREATE OR REPLACE FUNCTION public.paint_pixel_transaction(
  p_wallet TEXT,
  p_x INTEGER,
  p_y INTEGER,
  p_color TEXT,
  p_balance NUMERIC,
  p_pixels_allowed INTEGER,
  p_cooldown_seconds INTEGER DEFAULT 900
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_window_start TIMESTAMPTZ := v_now - make_interval(secs => p_cooldown_seconds);
  v_pixel public.pixels%ROWTYPE;
  v_evicted_pixel public.pixels%ROWTYPE;
  v_old_color TEXT;
  v_old_owner TEXT;
  v_current_used INTEGER;
  v_initial_used INTEGER;
  v_recent_paints INTEGER := 0;
  v_window_anchor TIMESTAMPTZ;
  v_remaining_ms INTEGER;
  v_last_paint_at TIMESTAMPTZ;
  v_actor_state public.wallet_state%ROWTYPE;
  v_actor_total_points NUMERIC := 0;
  v_actor_points_per_second NUMERIC := 0;
  v_actor_last_points_update_at TIMESTAMPTZ := v_now;
  v_current_total_points NUMERIC := 0;
BEGIN
  IF p_wallet IS NULL OR length(trim(p_wallet)) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_WALLET', 'message', 'Wallet is required.');
  END IF;

  IF p_x < 0 OR p_x >= 100 OR p_y < 0 OR p_y >= 100 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'OUT_OF_BOUNDS', 'message', 'Pixel coordinates are outside the canvas.');
  END IF;

  IF p_color IS NULL OR p_color !~ '^#[0-9a-fA-F]{6}$' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_COLOR', 'message', 'Color must be a 6-digit hex value.');
  END IF;

  IF p_pixels_allowed <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INSUFFICIENT_BALANCE', 'message', 'This wallet does not control any pixels.');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_wallet, 0));

  SELECT *
  INTO v_pixel
  FROM public.pixels
  WHERE x = p_x AND y = p_y
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.pixels (x, y)
    VALUES (p_x, p_y)
    RETURNING * INTO v_pixel;
  END IF;

  v_old_color := lower(v_pixel.color);
  v_old_owner := v_pixel.owner_wallet;

  SELECT count(*)::INTEGER
  INTO v_current_used
  FROM public.pixels
  WHERE owner_wallet = p_wallet
    AND active = true;

  v_initial_used := v_current_used;

  SELECT *
  INTO v_actor_state
  FROM public.wallet_state
  WHERE wallet = p_wallet;

  IF FOUND THEN
    v_current_total_points := public.project_wallet_points(
      v_actor_state.total_points,
      v_actor_state.points_per_second,
      v_actor_state.last_points_update_at,
      v_now
    );
  ELSE
    v_current_total_points := 0;
  END IF;

  SELECT count(*)::INTEGER, min(painted_at)
  INTO v_recent_paints, v_window_anchor
  FROM public.paint_history
  WHERE wallet = p_wallet
    AND painted_at > v_window_start;

  v_last_paint_at := CASE
    WHEN v_recent_paints >= p_pixels_allowed THEN v_window_anchor
    ELSE NULL
  END;

  IF v_old_owner = p_wallet AND v_old_color = lower(p_color) THEN
    RETURN jsonb_build_object(
      'ok', true,
      'code', 'NO_OP',
      'changed', false,
      'message', 'Pixel already matches the requested state.',
      'pixel', jsonb_build_object(
        'id', v_pixel.id,
        'x', v_pixel.x,
        'y', v_pixel.y,
        'color', v_pixel.color,
        'owner_wallet', v_pixel.owner_wallet,
        'updated_at', v_pixel.updated_at
      ),
      'evictedPixel', NULL,
      'walletState', jsonb_build_object(
        'wallet', p_wallet,
        'display_name', v_actor_state.display_name,
        'pixels_allowed', p_pixels_allowed,
        'pixels_used', v_current_used,
        'total_points', v_current_total_points,
        'points_per_second', coalesce(v_actor_state.points_per_second, public.calculate_points_per_second(v_current_used)),
        'last_points_update_at', coalesce(v_actor_state.last_points_update_at, v_now),
        'last_balance', p_balance,
        'last_paint_at', v_last_paint_at,
        'updated_at', coalesce(v_actor_state.updated_at, v_now)
      )
    );
  END IF;

  IF v_recent_paints >= p_pixels_allowed AND v_window_anchor IS NOT NULL THEN
    v_remaining_ms := ceil(
      EXTRACT(EPOCH FROM (v_window_anchor + make_interval(secs => p_cooldown_seconds) - v_now)) * 1000
    )::INTEGER;

    INSERT INTO public.wallet_state (
      wallet,
      pixels_allowed,
      pixels_used,
      total_points,
      points_per_second,
      last_points_update_at,
      last_balance,
      last_paint_at,
      updated_at
    )
    VALUES (
      p_wallet,
      p_pixels_allowed,
      v_current_used,
      coalesce(v_actor_state.total_points, 0),
      coalesce(v_actor_state.points_per_second, public.calculate_points_per_second(v_current_used)),
      coalesce(v_actor_state.last_points_update_at, v_now),
      p_balance,
      v_window_anchor,
      v_now
    )
    ON CONFLICT (wallet) DO UPDATE
    SET pixels_allowed = EXCLUDED.pixels_allowed,
        pixels_used = EXCLUDED.pixels_used,
        total_points = wallet_state.total_points,
        points_per_second = wallet_state.points_per_second,
        last_points_update_at = wallet_state.last_points_update_at,
        last_balance = EXCLUDED.last_balance,
        last_paint_at = EXCLUDED.last_paint_at,
        updated_at = EXCLUDED.updated_at;

    RETURN jsonb_build_object(
      'ok', false,
      'code', 'COOLDOWN_ACTIVE',
      'message', 'All paint slots are currently in use.',
      'remainingMs', greatest(v_remaining_ms, 0)
    );
  END IF;

  IF v_old_owner IS DISTINCT FROM p_wallet AND v_current_used >= p_pixels_allowed THEN
    SELECT *
    INTO v_evicted_pixel
    FROM public.pixels
    WHERE owner_wallet = p_wallet
      AND active = true
    ORDER BY updated_at ASC, id ASC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'ok', false,
        'code', 'PIXEL_LIMIT_REACHED',
        'message', 'This wallet has already used its available pixel allowance.'
      );
    END IF;

    UPDATE public.pixels
    SET color = '#0a0a14',
        owner_wallet = NULL,
        active = true,
        updated_at = v_now
    WHERE id = v_evicted_pixel.id
    RETURNING * INTO v_evicted_pixel;
  END IF;

  UPDATE public.pixels
  SET color = lower(p_color),
      owner_wallet = p_wallet,
      active = true,
      updated_at = v_now
  WHERE id = v_pixel.id
  RETURNING * INTO v_pixel;

  INSERT INTO public.paint_history (wallet, pixel_id, old_color, new_color, painted_at)
  VALUES (p_wallet, v_pixel.id, v_old_color, lower(p_color), v_now);

  IF v_old_owner IS NOT NULL AND v_old_owner <> p_wallet THEN
    PERFORM public.settle_wallet_points(v_old_owner, v_now);

    UPDATE public.wallet_state
    SET pixels_used = greatest(pixels_used - 1, 0),
        points_per_second = public.calculate_points_per_second(greatest(pixels_used - 1, 0)),
        last_points_update_at = v_now,
        updated_at = v_now
    WHERE wallet = v_old_owner;
  END IF;

  SELECT count(*)::INTEGER
  INTO v_current_used
  FROM public.pixels
  WHERE owner_wallet = p_wallet
    AND active = true;

  IF v_current_used <> v_initial_used THEN
    PERFORM public.settle_wallet_points(p_wallet, v_now);
    SELECT *
    INTO v_actor_state
    FROM public.wallet_state
    WHERE wallet = p_wallet;
  END IF;

  v_actor_total_points := coalesce(v_actor_state.total_points, 0);
  v_actor_points_per_second := public.calculate_points_per_second(v_current_used);
  v_actor_last_points_update_at := CASE
    WHEN v_current_used <> v_initial_used OR v_actor_state.wallet IS NULL THEN v_now
    ELSE coalesce(v_actor_state.last_points_update_at, v_now)
  END;

  SELECT count(*)::INTEGER, min(painted_at)
  INTO v_recent_paints, v_window_anchor
  FROM public.paint_history
  WHERE wallet = p_wallet
    AND painted_at > v_window_start;

  v_last_paint_at := CASE
    WHEN v_recent_paints >= p_pixels_allowed THEN v_window_anchor
    ELSE NULL
  END;

  INSERT INTO public.wallet_state (
    wallet,
    display_name,
    pixels_allowed,
    pixels_used,
    total_points,
    points_per_second,
    last_points_update_at,
    last_balance,
    last_paint_at,
    updated_at
  )
  VALUES (
    p_wallet,
    v_actor_state.display_name,
    p_pixels_allowed,
    v_current_used,
    v_actor_total_points,
    v_actor_points_per_second,
    v_actor_last_points_update_at,
    p_balance,
    v_last_paint_at,
    v_now
  )
  ON CONFLICT (wallet) DO UPDATE
  SET display_name = wallet_state.display_name,
      pixels_allowed = EXCLUDED.pixels_allowed,
      pixels_used = EXCLUDED.pixels_used,
      total_points = EXCLUDED.total_points,
      points_per_second = EXCLUDED.points_per_second,
      last_points_update_at = EXCLUDED.last_points_update_at,
      last_balance = EXCLUDED.last_balance,
      last_paint_at = EXCLUDED.last_paint_at,
      updated_at = EXCLUDED.updated_at
  RETURNING * INTO v_actor_state;

  RETURN jsonb_build_object(
    'ok', true,
    'code', 'PAINT_OK',
    'changed', true,
    'pixel', jsonb_build_object(
      'id', v_pixel.id,
      'x', v_pixel.x,
      'y', v_pixel.y,
      'color', v_pixel.color,
      'owner_wallet', v_pixel.owner_wallet,
      'updated_at', v_pixel.updated_at
    ),
    'evictedPixel', CASE
      WHEN v_evicted_pixel.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', v_evicted_pixel.id,
        'x', v_evicted_pixel.x,
        'y', v_evicted_pixel.y,
        'color', v_evicted_pixel.color,
        'owner_wallet', v_evicted_pixel.owner_wallet,
        'updated_at', v_evicted_pixel.updated_at
      )
    END,
    'walletState', jsonb_build_object(
      'wallet', p_wallet,
      'display_name', v_actor_state.display_name,
      'pixels_allowed', p_pixels_allowed,
      'pixels_used', v_current_used,
      'total_points', public.project_wallet_points(v_actor_state.total_points, v_actor_state.points_per_second, v_actor_state.last_points_update_at, v_now),
      'points_per_second', v_actor_state.points_per_second,
      'last_points_update_at', v_actor_state.last_points_update_at,
      'last_paint_at', v_last_paint_at,
      'updated_at', v_now
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_points_per_second(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.project_wallet_points(NUMERIC, NUMERIC, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_wallet_points(TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.paint_pixel_transaction(TEXT, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.calculate_points_per_second(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.project_wallet_points(NUMERIC, NUMERIC, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_wallet_points(TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.paint_pixel_transaction(TEXT, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER, INTEGER) TO service_role;
