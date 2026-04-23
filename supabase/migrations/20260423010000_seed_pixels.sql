-- Seed the full 100x100 canvas so every coordinate can be updated in place.
INSERT INTO public.pixels (x, y)
SELECT x, y
FROM generate_series(0, 99) AS x
CROSS JOIN generate_series(0, 99) AS y
ON CONFLICT (x, y) DO NOTHING;
