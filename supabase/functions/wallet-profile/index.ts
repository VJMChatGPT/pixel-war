import {
  HttpError,
  assertProductionSafety,
  assertAllowedOrigin,
  createServiceClient,
  enforceRateLimit,
  getClientIp,
  getEnvInt,
  json,
  preflight,
  requireSession,
} from "../_shared/security.ts";

type ProfileRequest = {
  displayName?: string | null;
};

const MAX_DISPLAY_NAME_LENGTH = 32;
const PROFILE_IP_LIMIT = "RATE_LIMIT_PROFILE_IP_MAX";
const PROFILE_IP_WINDOW = "RATE_LIMIT_PROFILE_IP_WINDOW_SECONDS";
const PROFILE_WALLET_LIMIT = "RATE_LIMIT_PROFILE_WALLET_MAX";
const PROFILE_WALLET_WINDOW = "RATE_LIMIT_PROFILE_WALLET_WINDOW_SECONDS";

Deno.serve(async (req) => {
  try {
    assertProductionSafety();
  } catch (error) {
    if (error instanceof HttpError) {
      return json(req, { ok: false, code: error.code, message: error.message, ...error.details }, error.status);
    }
    return json(req, { ok: false, code: "UNEXPECTED_ERROR", message: "Production safety check failed." }, 500);
  }

  if (req.method === "OPTIONS") {
    return preflight(req);
  }

  try {
    assertAllowedOrigin(req);

    if (req.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Use POST.");
    }

    const supabase = createServiceClient();
    const clientIp = getClientIp(req);

    await enforceRateLimit(
      supabase,
      `profile:ip:${clientIp}`,
      getEnvInt(PROFILE_IP_LIMIT, 120),
      getEnvInt(PROFILE_IP_WINDOW, 60),
    );

    const session = await requireSession(req, supabase);

    await enforceRateLimit(
      supabase,
      `profile:wallet:${session.wallet}`,
      getEnvInt(PROFILE_WALLET_LIMIT, 20),
      getEnvInt(PROFILE_WALLET_WINDOW, 300),
    );

    const body = (await req.json()) as ProfileRequest;

    const normalizedDisplayName = normalizeDisplayName(body.displayName);

    const { error } = await supabase
      .from("wallet_state")
      .upsert(
        {
          wallet: session.wallet,
          display_name: normalizedDisplayName,
        },
        {
          onConflict: "wallet",
          ignoreDuplicates: false,
        },
      );

    if (error) {
      throw new HttpError(500, "PROFILE_UPDATE_FAILED", error.message);
    }

    const { data, error: readError } = await supabase
      .from("public_wallet_state")
      .select("*")
      .eq("wallet", session.wallet)
      .single();

    if (readError) {
      throw new HttpError(500, "PROFILE_READ_FAILED", readError.message);
    }

    return json(req, {
      ok: true,
      walletState: data,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return json(req, { ok: false, code: error.code, message: error.message, ...error.details }, error.status);
    }

    const message = error instanceof Error ? error.message : "Unexpected profile update error.";
    return json(req, { ok: false, code: "UNEXPECTED_ERROR", message }, 500);
  }
});

function normalizeDisplayName(input: string | null | undefined) {
  if (input == null) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new HttpError(
      400,
      "DISPLAY_NAME_TOO_LONG",
      `Display names must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`,
    );
  }

  return trimmed;
}
