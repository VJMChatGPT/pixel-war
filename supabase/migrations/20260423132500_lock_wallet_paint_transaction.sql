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
  v_pixel public.pixels%ROWTYPE;
  v_wallet_state public.wallet_state%ROWTYPE;
  v_old_color TEXT;
  v_old_owner TEXT;
  v_current_used INTEGER;
  v_remaining_ms INTEGER;
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

  -- Serialize every paint attempt for this wallet. This closes the race where
  -- two first-time paints found no wallet_state row to lock and both passed.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_wallet, 0));

  SELECT *
  INTO v_wallet_state
  FROM public.wallet_state
  WHERE wallet = p_wallet
  FOR UPDATE;

  IF FOUND
     AND v_wallet_state.last_paint_at IS NOT NULL
     AND v_wallet_state.last_paint_at > v_now - make_interval(secs => p_cooldown_seconds) THEN
    v_remaining_ms := ceil(
      EXTRACT(EPOCH FROM (v_wallet_state.last_paint_at + make_interval(secs => p_cooldown_seconds) - v_now)) * 1000
    )::INTEGER;

    RETURN jsonb_build_object(
      'ok', false,
      'code', 'COOLDOWN_ACTIVE',
      'message', 'Cooldown is still active.',
      'remainingMs', greatest(v_remaining_ms, 0)
    );
  END IF;

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

  v_old_color := v_pixel.color;
  v_old_owner := v_pixel.owner_wallet;

  SELECT count(*)::INTEGER
  INTO v_current_used
  FROM public.pixels
  WHERE owner_wallet = p_wallet
    AND active = true;

  IF v_old_owner IS DISTINCT FROM p_wallet AND v_current_used >= p_pixels_allowed THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'PIXEL_LIMIT_REACHED',
      'message', 'This wallet has already used its available pixel allowance.'
    );
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
    UPDATE public.wallet_state
    SET pixels_used = greatest(pixels_used - 1, 0),
        updated_at = v_now
    WHERE wallet = v_old_owner;
  END IF;

  SELECT count(*)::INTEGER
  INTO v_current_used
  FROM public.pixels
  WHERE owner_wallet = p_wallet
    AND active = true;

  INSERT INTO public.wallet_state (
    wallet,
    pixels_allowed,
    pixels_used,
    last_balance,
    last_paint_at,
    updated_at
  )
  VALUES (
    p_wallet,
    p_pixels_allowed,
    v_current_used,
    p_balance,
    v_now,
    v_now
  )
  ON CONFLICT (wallet) DO UPDATE
  SET pixels_allowed = EXCLUDED.pixels_allowed,
      pixels_used = EXCLUDED.pixels_used,
      last_balance = EXCLUDED.last_balance,
      last_paint_at = EXCLUDED.last_paint_at,
      updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object(
    'ok', true,
    'code', 'PAINT_OK',
    'pixel', jsonb_build_object(
      'id', v_pixel.id,
      'x', v_pixel.x,
      'y', v_pixel.y,
      'color', v_pixel.color,
      'owner_wallet', v_pixel.owner_wallet,
      'updated_at', v_pixel.updated_at
    ),
    'walletState', jsonb_build_object(
      'wallet', p_wallet,
      'pixels_allowed', p_pixels_allowed,
      'pixels_used', v_current_used,
      'last_balance', p_balance,
      'last_paint_at', v_now,
      'updated_at', v_now
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.paint_pixel_transaction(TEXT, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.paint_pixel_transaction(TEXT, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER, INTEGER) TO service_role;
