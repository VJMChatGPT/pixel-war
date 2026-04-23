import {
  HttpError,
  assertAllowedOrigin,
  createServiceClient,
  enforceRateLimit,
  getClientIp,
  getUserAgent,
  getWalletSnapshot,
  json,
  preflight,
  randomToken,
  requireSession,
  revokeSessionByToken,
  sha256Hex,
  verifySolanaAddress,
  verifySolanaSignature,
} from "../_shared/security.ts";

type AuthRequest =
  | {
      action?: "challenge";
      wallet?: string;
    }
  | {
      action?: "verify";
      wallet?: string;
      nonce?: string;
      signature?: string;
    }
  | {
      action?: "refresh" | "revoke";
    };

const CHALLENGE_TTL_SECONDS = 5 * 60;
const DEFAULT_SESSION_TTL_SECONDS = 24 * 60 * 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflight(req);
  }

  try {
    assertAllowedOrigin(req);

    if (req.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Use POST.");
    }

    const supabase = createServiceClient();
    const body = (await req.json()) as AuthRequest;
    const action = body?.action ?? "challenge";

    switch (action) {
      case "challenge":
        return await issueChallenge(req, supabase, body);
      case "verify":
        return await verifyChallenge(req, supabase, body);
      case "refresh":
        return await refreshSession(req, supabase);
      case "revoke":
        return await revokeSession(req, supabase);
      default:
        throw new HttpError(400, "INVALID_ACTION", "Unknown wallet auth action.");
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return json(req, { ok: false, code: error.code, message: error.message, ...error.details }, error.status);
    }

    const message = error instanceof Error ? error.message : "Unexpected wallet auth error.";
    return json(req, { ok: false, code: "UNEXPECTED_ERROR", message }, 500);
  }
});

async function issueChallenge(
  req: Request,
  supabase: ReturnType<typeof createServiceClient>,
  body: AuthRequest,
) {
  const wallet = body.wallet?.trim() ?? "";
  if (!verifySolanaAddress(wallet)) {
    throw new HttpError(400, "INVALID_WALLET", "Invalid Solana wallet address.");
  }

  const clientIp = getClientIp(req);
  await enforceRateLimit(supabase, `challenge:ip:${clientIp}`, 12, 60);
  await enforceRateLimit(supabase, `challenge:wallet:${wallet}`, 8, 300);

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_SECONDS * 1000);
  const nonce = crypto.randomUUID();
  const origin = req.headers.get("origin") ?? "unknown-origin";
  const message = [
    "PixelDAO wallet login",
    `Origin: ${origin}`,
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expires At: ${expiresAt.toISOString()}`,
    "",
    "Sign this message to authenticate with PixelDAO.",
  ].join("\n");

  const { error } = await supabase.from("wallet_auth_nonces").insert({
    wallet,
    nonce,
    message,
    expires_at: expiresAt.toISOString(),
    created_ip: clientIp,
    user_agent: getUserAgent(req),
  });

  if (error) {
    throw new HttpError(500, "NONCE_STORE_FAILED", error.message);
  }

  return json(req, {
    ok: true,
    wallet,
    nonce,
    message,
    expiresAt: expiresAt.toISOString(),
  });
}

async function verifyChallenge(
  req: Request,
  supabase: ReturnType<typeof createServiceClient>,
  body: AuthRequest,
) {
  const wallet = body.wallet?.trim() ?? "";
  const nonce = body.nonce?.trim() ?? "";
  const signature = body.signature?.trim() ?? "";

  if (!verifySolanaAddress(wallet)) {
    throw new HttpError(400, "INVALID_WALLET", "Invalid Solana wallet address.");
  }
  if (!nonce || !signature) {
    throw new HttpError(400, "INVALID_CHALLENGE", "Nonce and signature are required.");
  }

  const clientIp = getClientIp(req);
  await enforceRateLimit(supabase, `verify:ip:${clientIp}`, 10, 300);
  await enforceRateLimit(supabase, `verify:wallet:${wallet}`, 6, 300);

  const { data, error } = await supabase
    .from("wallet_auth_nonces")
    .select("id, message, expires_at, consumed_at")
    .eq("wallet", wallet)
    .eq("nonce", nonce)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "NONCE_LOOKUP_FAILED", error.message);
  }

  if (!data || data.consumed_at || new Date(data.expires_at).getTime() <= Date.now()) {
    throw new HttpError(401, "CHALLENGE_EXPIRED", "This login challenge has expired.");
  }

  if (!verifySolanaSignature(wallet, data.message, signature)) {
    throw new HttpError(401, "BAD_SIGNATURE", "Wallet signature verification failed.");
  }

  const { error: consumeError } = await supabase
    .from("wallet_auth_nonces")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", data.id)
    .is("consumed_at", null);

  if (consumeError) {
    throw new HttpError(500, "NONCE_CONSUME_FAILED", consumeError.message);
  }

  const snapshot = await getWalletSnapshot(wallet);
  const sessionToken = randomToken(32);
  const sessionHash = await sha256Hex(sessionToken);
  const sessionExpiresAt = new Date(
    Date.now() + getSessionTtlSeconds() * 1000,
  ).toISOString();

  const { error: sessionError } = await supabase.from("wallet_sessions").insert({
    wallet,
    token_hash: sessionHash,
    expires_at: sessionExpiresAt,
    created_ip: clientIp,
    user_agent: getUserAgent(req),
  });

  if (sessionError) {
    throw new HttpError(500, "SESSION_CREATE_FAILED", sessionError.message);
  }

  return json(req, {
    ok: true,
    wallet,
    balance: snapshot.balance,
    totalSupply: snapshot.totalSupply,
    sessionToken,
    sessionExpiresAt,
  });
}

async function refreshSession(req: Request, supabase: ReturnType<typeof createServiceClient>) {
  const clientIp = getClientIp(req);
  await enforceRateLimit(supabase, `refresh:ip:${clientIp}`, 30, 60);

  const session = await requireSession(req, supabase);
  const snapshot = await getWalletSnapshot(session.wallet);

  return json(req, {
    ok: true,
    wallet: session.wallet,
    balance: snapshot.balance,
    totalSupply: snapshot.totalSupply,
    sessionExpiresAt: session.expiresAt,
  });
}

async function revokeSession(req: Request, supabase: ReturnType<typeof createServiceClient>) {
  const session = await requireSession(req, supabase);
  await revokeSessionByToken(supabase, session.token);

  return json(req, { ok: true });
}

function getSessionTtlSeconds() {
  const raw = Number(Deno.env.get("WALLET_SESSION_TTL_SECONDS") ?? DEFAULT_SESSION_TTL_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_SESSION_TTL_SECONDS;
}
