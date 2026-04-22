
-- PIXELS TABLE: one row per cell of the 100x100 canvas
CREATE TABLE public.pixels (
  id BIGSERIAL PRIMARY KEY,
  x INTEGER NOT NULL CHECK (x >= 0 AND x < 100),
  y INTEGER NOT NULL CHECK (y >= 0 AND y < 100),
  color TEXT NOT NULL DEFAULT '#0a0a14',
  owner_wallet TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (x, y)
);

CREATE INDEX idx_pixels_owner ON public.pixels(owner_wallet);
CREATE INDEX idx_pixels_active ON public.pixels(active);

-- WALLET STATE TABLE
CREATE TABLE public.wallet_state (
  wallet TEXT PRIMARY KEY,
  pixels_allowed INTEGER NOT NULL DEFAULT 0,
  pixels_used INTEGER NOT NULL DEFAULT 0,
  last_balance NUMERIC NOT NULL DEFAULT 0,
  last_paint_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PAINT HISTORY (append-only log)
CREATE TABLE public.paint_history (
  id BIGSERIAL PRIMARY KEY,
  wallet TEXT NOT NULL,
  pixel_id BIGINT NOT NULL REFERENCES public.pixels(id) ON DELETE CASCADE,
  old_color TEXT,
  new_color TEXT NOT NULL,
  painted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paint_history_wallet ON public.paint_history(wallet);
CREATE INDEX idx_paint_history_painted_at ON public.paint_history(painted_at DESC);

-- LEADERBOARD VIEW
CREATE VIEW public.leaderboard AS
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
WHERE ws.pixels_used > 0
ORDER BY controlled_pixels DESC;

-- ENABLE RLS
ALTER TABLE public.pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paint_history ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (canvas is public)
CREATE POLICY "Pixels are publicly readable"
  ON public.pixels FOR SELECT
  USING (true);

CREATE POLICY "Wallet states are publicly readable"
  ON public.wallet_state FOR SELECT
  USING (true);

CREATE POLICY "Paint history is publicly readable"
  ON public.paint_history FOR SELECT
  USING (true);

-- NO write policies = only service role / edge functions can write.

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.pixels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paint_history;

ALTER TABLE public.pixels REPLICA IDENTITY FULL;
ALTER TABLE public.wallet_state REPLICA IDENTITY FULL;
ALTER TABLE public.paint_history REPLICA IDENTITY FULL;
