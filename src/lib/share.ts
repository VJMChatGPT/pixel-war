import { APP_CONFIG } from "../config/app";
import { formatPoints, shortAddress } from "./format";

const DEFAULT_SITE_URL = "https://pixelwarcoin.com";

type ShareWalletState = Pick<
  {
    display_name: string | null;
    total_points: number | null;
    points_per_second: number | null;
    pixels_used: number | null;
  },
  "display_name" | "total_points" | "points_per_second" | "pixels_used"
>;

type SharePixel = {
  x: number;
  y: number;
  color: string;
  owner_wallet: string | null;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeOrigin(origin?: string) {
  if (origin) return origin.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return DEFAULT_SITE_URL;
}

export function getShareDisplayLabel(walletAddress: string, walletState: ShareWalletState | null) {
  const fallback = shortAddress(walletAddress);
  const displayName = walletState?.display_name?.trim();
  return displayName || fallback;
}

export function buildSharePath(walletAddress: string) {
  return `/share/${encodeURIComponent(walletAddress)}`;
}

export function buildShareUrl(walletAddress: string, origin?: string) {
  return `${normalizeOrigin(origin)}${buildSharePath(walletAddress)}`;
}

export function buildShareCardUrl(walletAddress: string, origin?: string) {
  return `${normalizeOrigin(origin)}/share-card/${encodeURIComponent(walletAddress)}`;
}

export function buildXShareText({
  walletAddress,
  walletState,
  ownedPixels,
}: {
  walletAddress: string;
  walletState: ShareWalletState | null;
  ownedPixels: number;
}) {
  const label = getShareDisplayLabel(walletAddress, walletState);
  const totalPoints = formatPoints(Number(walletState?.total_points ?? 0), 1);
  const pointsPerSecond = formatPoints(Number(walletState?.points_per_second ?? 0), 2);

  return `${label} is earning ${totalPoints} points in Pixel War at ${pointsPerSecond} pts/s while holding ${ownedPixels} pixels on the live territory board. $PIXL fuels territory. Territory fuels points.`;
}

export function buildXIntentUrl({
  text,
  shareUrl,
}: {
  text: string;
  shareUrl: string;
}) {
  const url = new URL("https://x.com/intent/post");
  url.searchParams.set("text", text);
  url.searchParams.set("url", shareUrl);
  return url.toString();
}

export function buildShareBoardSvg({
  pixels,
  walletAddress,
  width = 480,
  height = 480,
}: {
  pixels: SharePixel[];
  walletAddress: string;
  width?: number;
  height?: number;
}) {
  const cellWidth = width / APP_CONFIG.canvas.width;
  const cellHeight = height / APP_CONFIG.canvas.height;
  const rects: string[] = [];

  for (const pixel of pixels) {
    const x = Number(pixel.x) * cellWidth;
    const y = Number(pixel.y) * cellHeight;
    const isOwned = pixel.owner_wallet === walletAddress;
    const fill = isOwned ? pixel.color : `${pixel.color}55`;
    const stroke = isOwned ? "#ffffff" : "none";
    const strokeWidth = isOwned ? Math.max(0.9, cellWidth * 0.12) : 0;
    rects.push(
      `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellWidth.toFixed(2)}" height="${cellHeight.toFixed(2)}" fill="${escapeXml(fill)}" stroke="${stroke}" stroke-width="${strokeWidth.toFixed(2)}" rx="0.8" ry="0.8" />`
    );
  }

  for (let index = 0; index <= APP_CONFIG.canvas.width; index += 10) {
    const x = (index * cellWidth).toFixed(2);
    rects.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />`
    );
  }

  for (let index = 0; index <= APP_CONFIG.canvas.height; index += 10) {
    const y = (index * cellHeight).toFixed(2);
    rects.push(
      `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />`
    );
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a0714" />
          <stop offset="100%" stop-color="#180d2e" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="${width}" height="${height}" rx="28" ry="28" fill="url(#bg)" />
      <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="22" ry="22" fill="#090611" stroke="rgba(157,77,255,0.25)" stroke-width="2" />
      <g transform="translate(24 24)">
        <rect width="${width - 48}" height="${height - 48}" rx="18" ry="18" fill="#090611" />
        <g filter="url(#glow)">
          ${rects.join("")}
        </g>
      </g>
    </svg>
  `.trim();
}

export function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getShareFallbackAddress(walletAddress: string) {
  return shortAddress(walletAddress);
}
