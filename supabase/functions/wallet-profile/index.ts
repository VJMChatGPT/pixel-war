import {
  HttpError,
  assertAllowedOrigin,
  createServiceClient,
  json,
  preflight,
  requireSession,
} from "../_shared/security.ts";

type ProfileRequest = {
  displayName?: string | null;
};

const MAX_DISPLAY_NAME_LENGTH = 32;

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
    const session = await requireSession(req, supabase);
    const body = (await req.json()) as ProfileRequest;

    const normalizedDisplayName = normalizeDisplayName(body.displayName);

    const { data, error } = await supabase
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
      )
      .select("wallet, display_name, pixels_allowed, pixels_used, last_paint_at, updated_at")
      .single();

    if (error) {
      throw new HttpError(500, "PROFILE_UPDATE_FAILED", error.message);
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
