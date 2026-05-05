# Pixel War Launch Rehearsal

This mode replicates the process intended for the real Pixel War launch.

## What This Rehearsal Covers

- A backend-controlled 6-hour countdown.
- Solana wallet connection and wallet message authentication.
- Real on-chain `$PIXL` token balance reads.
- Pixel allowance calculated from `TOKEN_MINT_ADDRESS`.
- Painting only during the live launch window.
- Canvas, activity feed, profile, and leaderboard using the same production paths.

Automatic round reset is intentionally not implemented yet. The launch reset is manual for now.

## Required Supabase Edge Function Secrets

Set these in Supabase Edge Function secrets before launch rehearsal:

```text
APP_ENV=production
DEMO_MODE=false
ALLOW_ALL_ORIGINS=false
ALLOWED_APP_ORIGINS=https://pixelwarcoin.com,https://www.pixelwarcoin.com
SOLANA_RPC_URL=<your production Solana RPC URL>
TOKEN_MINT_ADDRESS=<your SPL token mint>
WALLET_SESSION_TTL_SECONDS=<optional session ttl>
```

`TOKEN_MINT_ADDRESS` must only live in Supabase Edge Function secrets. Do not put the official token mint in frontend code.

## Production Safety

When `APP_ENV=production`, Edge Functions hard-fail if:

- `DEMO_MODE=true`
- `ALLOW_ALL_ORIGINS=true`

Production CORS should only allow:

- `https://pixelwarcoin.com`
- `https://www.pixelwarcoin.com`

Localhost origins are only allowed outside production.

## Backend Launch State

The active launch state is stored in `public.launch_config`.

Phases:

- `prelaunch`: countdown not started, painting disabled.
- `live`: countdown active. Painting is allowed only when `mechanics_enabled=true` and the server time is inside the configured window.
- `ended`: countdown finished, painting disabled unless reopened manually.

The frontend reads this state from Supabase. It does not invent the official countdown locally.

## Manual Reset Before Launch

Run this file manually in the Supabase SQL editor only when preparing launch:

```text
supabase/RUN_MANUALLY_ONLY_AT_LAUNCH.sql
```

It resets:

- `pixels`
- `paint_history`
- `wallet_state`
- `wallet_sessions`
- `wallet_auth_nonces`
- `request_rate_limits`

Pixel rows are preserved and reset to an empty board.

## Start The 6-Hour Live Window

After the manual reset, start the rehearsal with:

```sql
UPDATE public.launch_config
SET
  phase = 'live',
  countdown_started_at = now(),
  countdown_ends_at = now() + interval '6 hours',
  mechanics_enabled = true
WHERE id = 'global';
```

Painting is allowed only after this backend state is live.

## End The Window

```sql
UPDATE public.launch_config
SET
  phase = 'ended',
  mechanics_enabled = false
WHERE id = 'global';
```

## Operational Cleanup

The migration adds `public.cleanup_operational_tables(...)`.

It safely deletes expired, consumed, revoked, or old rows from:

- `wallet_auth_nonces`
- `wallet_sessions`
- `request_rate_limits`

It is safe to run repeatedly from a privileged context.

## Security Headers

`vercel.json` adds production security headers including CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `frame-ancestors 'none'`.

Inline styles are allowed because the current Vite/React UI and animation stack use runtime style attributes and CSS variables. Inline scripts are not allowed.

## Future Work

Automatic reset/rollover is intentionally left out of this rehearsal step. A future implementation should add a privileged scheduled backend job that:

- finalizes the current launch or round
- stores result snapshots
- resets active board state
- starts the next configured window safely
