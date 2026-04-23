import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.0";
import bs58 from "https://esm.sh/bs58@6.0.0";
import nacl from "https://esm.sh/tweetnacl@1.0.3";

const CANVAS_PIXELS = 10_000;
const DEFAULT_ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

let cachedSupply:
  | {
      raw: bigint;
      ui: number;
      expiresAt: number;
    }
  | null = null;

export function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase function secrets.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function json(req: Request, payload: unknown, status = 200) {
  const origin = req.headers.get("origin");
  return new Response(JSON.stringify(payload), {
    status,
    headers: buildCorsHeaders(origin),
  });
}

export function assertAllowedOrigin(req: Request) {
  if (shouldAllowAllOrigins()) return;

  const origin = req.headers.get("origin");
  if (!origin) return;

  if (!isAllowedOrigin(origin)) {
    throw new HttpError(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed.");
  }
}

export function buildCorsHeaders(origin: string | null) {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    Vary: "Origin",
  });

  if (shouldAllowAllOrigins()) {
    headers.set("Access-Control-Allow-Origin", "*");
    return headers;
  }

  if (origin && isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

export function preflight(req: Request) {
  if (shouldAllowAllOrigins()) {
    return new Response("ok", { headers: buildCorsHeaders(req.headers.get("origin")) });
  }

  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return new Response("forbidden", { status: 403, headers: buildCorsHeaders(origin) });
  }

  return new Response("ok", { headers: buildCorsHeaders(origin) });
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return req.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export function getUserAgent(req: Request) {
  return req.headers.get("user-agent")?.slice(0, 512) ?? "unknown";
}

export function randomToken(bytes = 32) {
  const random = crypto.getRandomValues(new Uint8Array(bytes));
  return toBase64Url(random);
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function decodeBase64(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const raw = atob(normalized + padding);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export function verifySolanaAddress(wallet: string) {
  try {
    const decoded = bs58.decode(wallet);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

export function verifySolanaSignature(wallet: string, message: string, signatureBase64: string) {
  const publicKey = bs58.decode(wallet);
  const signature = decodeBase64(signatureBase64);
  const messageBytes = new TextEncoder().encode(message);
  return nacl.sign.detached.verify(messageBytes, signature, publicKey);
}

export async function requireSession(req: Request, supabase: ReturnType<typeof createServiceClient>) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    throw new HttpError(401, "AUTH_REQUIRED", "Connect your wallet again to continue.");
  }

  const tokenHash = await sha256Hex(token);
  const { data, error } = await supabase
    .from("wallet_sessions")
    .select("id, wallet, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "SESSION_LOOKUP_FAILED", error.message);
  }

  if (!data || data.revoked_at || new Date(data.expires_at).getTime() <= Date.now()) {
    throw new HttpError(401, "SESSION_EXPIRED", "Your wallet session has expired.");
  }

  await supabase
    .from("wallet_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id);

  return {
    token,
    wallet: data.wallet,
    expiresAt: data.expires_at,
    sessionId: data.id,
  };
}

export async function revokeSessionByToken(
  supabase: ReturnType<typeof createServiceClient>,
  token: string,
) {
  const tokenHash = await sha256Hex(token);
  await supabase
    .from("wallet_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .is("revoked_at", null);
}

export async function enforceRateLimit(
  supabase: ReturnType<typeof createServiceClient>,
  bucket: string,
  maxHits: number,
  windowSeconds: number,
) {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new HttpError(500, "RATE_LIMIT_FAILED", error.message);
  }

  const result = data as { ok?: boolean; retryAfterSeconds?: number };
  if (!result?.ok) {
    throw new HttpError(
      429,
      "RATE_LIMITED",
      "Too many requests. Slow down and try again.",
      result?.retryAfterSeconds ? { retryAfterSeconds: result.retryAfterSeconds } : undefined,
    );
  }
}

export function getEnvInt(name: string, fallback: number) {
  const raw = Number(Deno.env.get(name) ?? `${fallback}`);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

export async function getWalletSnapshot(wallet: string) {
  if (isDemoModeEnabled()) {
    return getDemoWalletSnapshot(wallet);
  }

  const rpcUrl = Deno.env.get("SOLANA_RPC_URL");
  const tokenMintAddress = Deno.env.get("TOKEN_MINT_ADDRESS");

  if (!rpcUrl || !tokenMintAddress) {
    throw new HttpError(
      500,
      "CHAIN_CONFIG_MISSING",
      "Missing SOLANA_RPC_URL or TOKEN_MINT_ADDRESS in Edge Function secrets.",
    );
  }

  const balanceResponse = await callRpc(rpcUrl, "getTokenAccountsByOwner", [
    wallet,
    { mint: tokenMintAddress },
    { encoding: "jsonParsed" },
  ]);

  const accounts = balanceResponse?.value;
  if (!Array.isArray(accounts)) {
    throw new HttpError(502, "RPC_INVALID_BALANCE", "Invalid token balance response from RPC.");
  }

  let rawBalance = 0n;
  let decimals = 0;

  for (const account of accounts) {
    const tokenAmount = account?.account?.data?.parsed?.info?.tokenAmount;
    const amount = tokenAmount?.amount;
    const itemDecimals = tokenAmount?.decimals;

    if (typeof amount !== "string" || typeof itemDecimals !== "number") continue;
    rawBalance += BigInt(amount);
    decimals = itemDecimals;
  }

  const supply = await getTokenSupply(rpcUrl, tokenMintAddress);
  const pixelsAllowed = supply.raw > 0n ? Number((rawBalance * BigInt(CANVAS_PIXELS)) / supply.raw) : 0;

  return {
    balance: toUiAmount(rawBalance, decimals),
    totalSupply: supply.ui,
    pixelsAllowed,
  };
}

function getDemoWalletSnapshot(wallet: string) {
  const totalSupply = getDemoTotalSupply();
  const balance = deterministicDemoBalance(wallet, totalSupply);
  const pixelsAllowed = totalSupply > 0 ? Math.floor((balance / totalSupply) * CANVAS_PIXELS) : 0;

  return {
    balance,
    totalSupply,
    pixelsAllowed,
  };
}

function isAllowedOrigin(origin: string) {
  if (DEFAULT_ALLOWED_ORIGINS.has(origin)) return true;

  const configured = Deno.env.get("ALLOWED_APP_ORIGINS");
  if (!configured) return false;

  return configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(origin);
}

function isDemoModeEnabled() {
  const raw = (Deno.env.get("DEMO_MODE") ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function shouldAllowAllOrigins() {
  const raw = (Deno.env.get("ALLOW_ALL_ORIGINS") ?? "").trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes" || raw === "on") return true;
  return isDemoModeEnabled();
}

function extractBearerToken(header: string | null) {
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!scheme || !value || scheme.toLowerCase() !== "bearer") return null;
  return value.trim();
}

async function getTokenSupply(rpcUrl: string, tokenMintAddress: string) {
  if (cachedSupply && cachedSupply.expiresAt > Date.now()) {
    return cachedSupply;
  }

  const response = await callRpc(rpcUrl, "getTokenSupply", [tokenMintAddress]);
  const value = response?.value;
  const amount = value?.amount;
  const decimals = value?.decimals;

  if (typeof amount !== "string" || typeof decimals !== "number") {
    throw new HttpError(502, "RPC_INVALID_SUPPLY", "Invalid token supply response from RPC.");
  }

  cachedSupply = {
    raw: BigInt(amount),
    ui: toUiAmount(BigInt(amount), decimals),
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  return cachedSupply;
}

async function callRpc(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new HttpError(502, "RPC_HTTP_ERROR", `RPC ${method} failed with ${response.status}.`);
  }

  const payload = await response.json();
  if (payload?.error) {
    throw new HttpError(502, "RPC_ERROR", payload.error.message ?? `RPC ${method} failed.`);
  }

  return payload?.result;
}

function toUiAmount(raw: bigint, decimals: number) {
  if (decimals <= 0) return Number(raw);

  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return Number(fractionText ? `${whole.toString()}.${fractionText}` : whole.toString());
}

function getDemoTotalSupply() {
  const raw = Number(Deno.env.get("DEMO_TOKEN_TOTAL_SUPPLY") ?? "1000000000");
  return Number.isFinite(raw) && raw > 0 ? raw : 1_000_000_000;
}

function deterministicDemoBalance(wallet: string, totalSupply: number) {
  let hash = 0;
  for (let i = 0; i < wallet.length; i++) {
    hash = (hash * 31 + wallet.charCodeAt(i)) >>> 0;
  }

  const minPct = 0.003;
  const rangePct = 0.008;
  const normalized = (hash % 10_000) / 10_000;

  return Math.floor(totalSupply * (minPct + normalized * rangePct));
}

function toBase64Url(bytes: Uint8Array) {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export class HttpError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
