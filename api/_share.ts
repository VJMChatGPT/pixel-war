type ShareWalletState = {
  wallet: string | null;
  display_name: string | null;
  total_points: number | null;
  points_per_second: number | null;
  pixels_used: number | null;
};

type SharePixelRow = {
  x: number;
  y: number;
  color: string;
  owner_wallet: string | null;
};

type ShareSnapshot = {
  walletAddress: string;
  walletState: ShareWalletState | null;
  pixels: SharePixelRow[];
  ownedPixels: number;
};

const WALLET_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function getSupabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase share env vars are missing on the server.");
  }

  return { url, key };
}

function getHeaders() {
  const { key } = getSupabaseConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

function getRestUrl(path: string) {
  const { url } = getSupabaseConfig();
  return `${url}/rest/v1/${path}`;
}

export function isValidWalletAddress(walletAddress: string) {
  return WALLET_PATTERN.test(walletAddress);
}

export function htmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function fetchShareSnapshot(walletAddress: string): Promise<ShareSnapshot> {
  const headers = getHeaders();
  const encodedWallet = encodeURIComponent(walletAddress);

  const [walletResponse, pixelsResponse] = await Promise.all([
    fetch(
      `${getRestUrl("public_wallet_state")}?wallet=eq.${encodedWallet}&select=wallet,display_name,total_points,points_per_second,pixels_used&limit=1`,
      { headers }
    ),
    fetch(
      `${getRestUrl("pixels")}?select=x,y,color,owner_wallet&owner_wallet=not.is.null&order=y.asc,x.asc`,
      { headers }
    ),
  ]);

  if (!walletResponse.ok) {
    throw new Error(`Could not load wallet share data (${walletResponse.status}).`);
  }

  if (!pixelsResponse.ok) {
    throw new Error(`Could not load canvas share data (${pixelsResponse.status}).`);
  }

  const walletRows = (await walletResponse.json()) as ShareWalletState[];
  const pixels = (await pixelsResponse.json()) as SharePixelRow[];
  const ownedPixels = pixels.filter((pixel) => pixel.owner_wallet === walletAddress).length;

  return {
    walletAddress,
    walletState: walletRows[0] ?? null,
    pixels,
    ownedPixels,
  };
}

export type { ShareSnapshot, SharePixelRow, ShareWalletState };
