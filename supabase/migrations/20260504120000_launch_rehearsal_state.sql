CREATE TABLE IF NOT EXISTS public.launch_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  phase TEXT NOT NULL DEFAULT 'prelaunch',
  countdown_started_at TIMESTAMPTZ,
  countdown_ends_at TIMESTAMPTZ,
  mechanics_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT launch_config_singleton CHECK (id = 'global'),
  CONSTRAINT launch_config_phase_check CHECK (phase IN ('prelaunch', 'live', 'ended')),
  CONSTRAINT launch_config_countdown_order CHECK (
    countdown_started_at IS NULL
    OR countdown_ends_at IS NULL
    OR countdown_ends_at > countdown_started_at
  )
);

INSERT INTO public.launch_config (id, phase, mechanics_enabled)
VALUES ('global', 'prelaunch', false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_launch_config_updated_at ON public.launch_config;
CREATE TRIGGER touch_launch_config_updated_at
BEFORE UPDATE ON public.launch_config
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.launch_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'launch_config'
      AND policyname = 'Launch state is publicly readable'
  ) THEN
    CREATE POLICY "Launch state is publicly readable"
    ON public.launch_config
    FOR SELECT
    USING (id = 'global');
  END IF;
END;
$$;

GRANT SELECT ON public.launch_config TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cleanup_operational_tables(
  p_rate_limit_max_age INTERVAL DEFAULT INTERVAL '24 hours',
  p_nonce_max_age INTERVAL DEFAULT INTERVAL '24 hours'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nonce_count INTEGER := 0;
  v_session_count INTEGER := 0;
  v_rate_limit_count INTEGER := 0;
BEGIN
  DELETE FROM public.wallet_auth_nonces
  WHERE consumed_at IS NOT NULL
    OR expires_at < now()
    OR issued_at < now() - p_nonce_max_age;
  GET DIAGNOSTICS v_nonce_count = ROW_COUNT;

  DELETE FROM public.wallet_sessions
  WHERE revoked_at IS NOT NULL
    OR expires_at < now();
  GET DIAGNOSTICS v_session_count = ROW_COUNT;

  DELETE FROM public.request_rate_limits
  WHERE updated_at < now() - p_rate_limit_max_age;
  GET DIAGNOSTICS v_rate_limit_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'wallet_auth_nonces_deleted', v_nonce_count,
    'wallet_sessions_deleted', v_session_count,
    'request_rate_limits_deleted', v_rate_limit_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_operational_tables(INTERVAL, INTERVAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_operational_tables(INTERVAL, INTERVAL) TO service_role;
