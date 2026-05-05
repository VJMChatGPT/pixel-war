CREATE OR REPLACE FUNCTION public.get_wallet_cooldown_anchor(
  p_wallet TEXT,
  p_pixels_allowed INTEGER,
  p_window_start TIMESTAMPTZ
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_recent_paints INTEGER := 0;
  v_anchor_offset INTEGER := 0;
  v_anchor TIMESTAMPTZ;
BEGIN
  IF p_wallet IS NULL OR length(trim(p_wallet)) = 0 OR coalesce(p_pixels_allowed, 0) <= 0 THEN
    RETURN NULL;
  END IF;

  SELECT count(*)::INTEGER
  INTO v_recent_paints
  FROM public.paint_history
  WHERE wallet = p_wallet
    AND painted_at > p_window_start;

  IF v_recent_paints < p_pixels_allowed THEN
    RETURN NULL;
  END IF;

  v_anchor_offset := greatest(v_recent_paints - p_pixels_allowed, 0);

  SELECT painted_at
  INTO v_anchor
  FROM public.paint_history
  WHERE wallet = p_wallet
    AND painted_at > p_window_start
  ORDER BY painted_at ASC
  OFFSET v_anchor_offset
  LIMIT 1;

  RETURN v_anchor;
END;
$$;

CREATE OR REPLACE FUNCTION public.reconcile_wallet_capacity(
  p_wallet TEXT,
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
  v_target_allowed INTEGER := greatest(coalesce(p_pixels_allowed, 0), 0);
  v_state public.wallet_state%ROWTYPE;
  v_current_used INTEGER := 0;
  v_removed_pixels INTEGER := 0;
  v_last_paint_at TIMESTAMPTZ;
  v_points_per_second NUMERIC := 0;
BEGIN
  IF p_wallet IS NULL OR length(trim(p_wallet)) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_WALLET', 'message', 'Wallet is required.');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_wallet, 0));

  PERFORM public.settle_wallet_points(p_wallet, v_now);

  SELECT *
  INTO v_state
  FROM public.wallet_state
  WHERE wallet = p_wallet
  FOR UPDATE;

  SELECT count(*)::INTEGER
  INTO v_current_used
  FROM public.pixels
  WHERE owner_wallet = p_wallet
    AND active = true;

  IF v_current_used > v_target_allowed THEN
    WITH overflow AS (
      SELECT id
      FROM public.pixels
      WHERE owner_wallet = p_wallet
        AND active = true
      ORDER BY updated_at ASC, id ASC
      LIMIT (v_current_used - v_target_allowed)
      FOR UPDATE
    )
    UPDATE public.pixels
    SET color = '#0a0a14',
        owner_wallet = NULL,
        active = true,
        updated_at = v_now
    WHERE id IN (SELECT id FROM overflow);

    GET DIAGNOSTICS v_removed_pixels = ROW_COUNT;
  END IF;

  SELECT count(*)::INTEGER
  INTO v_current_used
  FROM public.pixels
  WHERE owner_wallet = p_wallet
    AND active = true;

  v_points_per_second := public.calculate_points_per_second(v_current_used);
  v_last_paint_at := public.get_wallet_cooldown_anchor(p_wallet, v_target_allowed, v_window_start);

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
    v_state.display_name,
    v_target_allowed,
    v_current_used,
    coalesce(v_state.total_points, 0),
    v_points_per_second,
    v_now,
    coalesce(p_balance, 0),
    v_last_paint_at,
    v_now
  )
  ON CONFLICT (wallet) DO UPDATE
  SET display_name = wallet_state.display_name,
      pixels_allowed = EXCLUDED.pixels_allowed,
      pixels_used = EXCLUDED.pixels_used,
      total_points = coalesce(wallet_state.total_points, EXCLUDED.total_points),
      points_per_second = EXCLUDED.points_per_second,
      last_points_update_at = EXCLUDED.last_points_update_at,
      last_balance = EXCLUDED.last_balance,
      last_paint_at = EXCLUDED.last_paint_at,
      updated_at = EXCLUDED.updated_at
  RETURNING * INTO v_state;

  RETURN jsonb_build_object(
    'ok', true,
    'removedPixels', v_removed_pixels,
    'walletState', jsonb_build_object(
      'wallet', p_wallet,
      'display_name', v_state.display_name,
      'pixels_allowed', v_state.pixels_allowed,
      'pixels_used', v_state.pixels_used,
      'total_points', public.project_wallet_points(v_state.total_points, v_state.points_per_second, v_state.last_points_update_at, v_now),
      'points_per_second', v_state.points_per_second,
      'last_points_update_at', v_state.last_points_update_at,
      'last_balance', v_state.last_balance,
      'last_paint_at', v_state.last_paint_at,
      'updated_at', v_state.updated_at
    )
  );
END;
$$;

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
  PERFORM public.reconcile_wallet_capacity(p_wallet, p_balance, p_pixels_allowed, p_cooldown_seconds);

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
  WHERE wallet = p_wallet
  FOR UPDATE;

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

  v_last_paint_at := public.get_wallet_cooldown_anchor(p_wallet, p_pixels_allowed, v_window_start);

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

  IF v_last_paint_at IS NOT NULL THEN
    v_remaining_ms := ceil(
      EXTRACT(EPOCH FROM (v_last_paint_at + make_interval(secs => p_cooldown_seconds) - v_now)) * 1000
    )::INTEGER;

    IF v_remaining_ms > 0 THEN
      RETURN jsonb_build_object(
        'ok', false,
        'code', 'COOLDOWN_ACTIVE',
        'message', 'All paint slots are currently in use.',
        'remainingMs', greatest(v_remaining_ms, 0)
      );
    END IF;
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

  v_last_paint_at := public.get_wallet_cooldown_anchor(p_wallet, p_pixels_allowed, v_window_start);

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

REVOKE ALL ON FUNCTION public.get_wallet_cooldown_anchor(TEXT, INTEGER, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reconcile_wallet_capacity(TEXT, NUMERIC, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.paint_pixel_transaction(TEXT, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_wallet_cooldown_anchor(TEXT, INTEGER, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_wallet_capacity(TEXT, NUMERIC, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.paint_pixel_transaction(TEXT, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER, INTEGER) TO service_role;
