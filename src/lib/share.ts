import { APP_CONFIG } from "@/config/app";
import type { PixelRow, PublicWalletStateRow } from "@/services/pixels";
import { formatPoints, shortAddress } from "@/lib/format";
import { formatWalletDisplayName } from "@/lib/wallet-display";

const SHARE_CARD_WIDTH = 1200;
const SHARE_CARD_HEIGHT = 675;
const BOARD_SIZE = 360;
const BOARD_X = 760;
const BOARD_Y = 146;

function getDisplayLabel(walletAddress: string, walletState: PublicWalletStateRow | null) {
  return formatWalletDisplayName({
    wallet: walletAddress,
    displayName: walletState?.display_name ?? null,
    shortenFallback: true,
  });
}

function getSiteUrl() {
  if (typeof window === "undefined") {
    return "https://pixel-propaganda-project.vercel.app";
  }

  return window.location.origin;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const safe = normalized.length === 3
    ? normalized.split("").map((value) => value + value).join("")
    : normalized.padEnd(6, "0").slice(0, 6);
  const r = Number.parseInt(safe.slice(0, 2), 16);
  const g = Number.parseInt(safe.slice(2, 4), 16);
  const b = Number.parseInt(safe.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawShareBoard(ctx: CanvasRenderingContext2D, pixels: (PixelRow | null)[], walletAddress: string) {
  const cellWidth = BOARD_SIZE / APP_CONFIG.canvas.width;
  const cellHeight = BOARD_SIZE / APP_CONFIG.canvas.height;

  roundedRect(ctx, BOARD_X - 18, BOARD_Y - 18, BOARD_SIZE + 36, BOARD_SIZE + 36, 28);
  ctx.fillStyle = "rgba(18, 12, 30, 0.85)";
  ctx.fill();
  ctx.strokeStyle = "rgba(157, 77, 255, 0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();

  roundedRect(ctx, BOARD_X, BOARD_Y, BOARD_SIZE, BOARD_SIZE, 18);
  ctx.fillStyle = "#090611";
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, BOARD_X, BOARD_Y, BOARD_SIZE, BOARD_SIZE, 18);
  ctx.clip();

  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    if (!pixel) continue;
    const x = BOARD_X + pixel.x * cellWidth;
    const y = BOARD_Y + pixel.y * cellHeight;
    const isOwned = pixel.owner_wallet === walletAddress;

    ctx.fillStyle = isOwned ? pixel.color : hexToRgba(pixel.color, 0.34);
    ctx.fillRect(x, y, cellWidth, cellHeight);

    if (isOwned) {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = pixel.color;
      ctx.strokeStyle = hexToRgba("#ffffff", 0.78);
      ctx.lineWidth = Math.max(1, cellWidth * 0.18);
      ctx.strokeRect(x + 0.35, y + 0.35, Math.max(0.8, cellWidth - 0.7), Math.max(0.8, cellHeight - 0.7));
      ctx.restore();
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= APP_CONFIG.canvas.width; i += 10) {
    const x = BOARD_X + i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, BOARD_Y);
    ctx.lineTo(x, BOARD_Y + BOARD_SIZE);
    ctx.stroke();
  }
  for (let i = 0; i <= APP_CONFIG.canvas.height; i += 10) {
    const y = BOARD_Y + i * cellHeight;
    ctx.beginPath();
    ctx.moveTo(BOARD_X, y);
    ctx.lineTo(BOARD_X + BOARD_SIZE, y);
    ctx.stroke();
  }

  ctx.restore();
}

export function buildXShareText({
  walletAddress,
  walletState,
  ownedPixels,
}: {
  walletAddress: string;
  walletState: PublicWalletStateRow | null;
  ownedPixels: number;
}) {
  const label = getDisplayLabel(walletAddress, walletState);
  const totalPoints = formatPoints(Number(walletState?.total_points ?? 0), 1);
  const pointsPerSecond = formatPoints(Number(walletState?.points_per_second ?? 0), 2);
  const siteUrl = getSiteUrl();

  return `${label} is stacking ${totalPoints} points on PixelDAO at ${pointsPerSecond} pts/s while controlling ${ownedPixels} pixels on the live canvas. Own pixels, earn points, fight for territory.\n\nJoin the board: ${siteUrl}`;
}

export async function generateShareCardBlob({
  walletAddress,
  walletState,
  pixels,
  ownedPixels,
}: {
  walletAddress: string;
  walletState: PublicWalletStateRow | null;
  pixels: (PixelRow | null)[];
  ownedPixels: number;
}) {
  const totalPoints = formatPoints(Number(walletState?.total_points ?? 0), 1);
  const pointsPerSecond = formatPoints(Number(walletState?.points_per_second ?? 0), 2);
  const displayLabel = getDisplayLabel(walletAddress, walletState);
  const siteUrl = getSiteUrl();
  const siteHost = new URL(siteUrl).host;

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create share image.");

  const background = ctx.createLinearGradient(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  background.addColorStop(0, "#0a0714");
  background.addColorStop(0.45, "#130b24");
  background.addColorStop(1, "#1b0e31");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let i = 0; i < SHARE_CARD_WIDTH; i += 36) {
    ctx.fillRect(i, 0, 1, SHARE_CARD_HEIGHT);
  }
  for (let i = 0; i < SHARE_CARD_HEIGHT; i += 36) {
    ctx.fillRect(0, i, SHARE_CARD_WIDTH, 1);
  }

  ctx.save();
  ctx.shadowBlur = 90;
  ctx.shadowColor = "rgba(138, 77, 255, 0.45)";
  ctx.fillStyle = "rgba(157, 77, 255, 0.16)";
  ctx.beginPath();
  ctx.arc(210, 140, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawShareBoard(ctx, pixels, walletAddress);

  ctx.fillStyle = "#f7f0ff";
  ctx.font = "700 44px Arial";
  ctx.fillText("PixelDAO", 86, 110);

  ctx.fillStyle = "rgba(247, 240, 255, 0.72)";
  ctx.font = "600 18px Arial";
  ctx.fillText("LIVE TERRITORY • EARN POINTS • DOMINATE THE CANVAS", 86, 148);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 60px Arial";
  ctx.fillText(displayLabel, 86, 244);

  ctx.fillStyle = "rgba(243, 232, 255, 0.85)";
  ctx.font = "400 26px Arial";
  ctx.fillText("My territory is live on the public PIXL board.", 86, 288);

  const stats = [
    { label: "TOTAL POINTS", value: totalPoints },
    { label: "POINTS / SEC", value: pointsPerSecond },
    { label: "PIXELS CONTROLLED", value: String(ownedPixels) },
  ];

  stats.forEach((stat, index) => {
    const x = 86 + index * 188;
    roundedRect(ctx, x, 340, 168, 120, 24);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(157, 77, 255, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(243, 232, 255, 0.72)";
    ctx.font = "600 14px Arial";
    ctx.fillText(stat.label, x + 20, 374);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 34px Arial";
    ctx.fillText(stat.value, x + 20, 426);
  });

  roundedRect(ctx, 86, 506, 558, 92, 26);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.stroke();
  ctx.fillStyle = "#f7f0ff";
  ctx.font = "700 26px Arial";
  ctx.fillText("Own pixels. Earn points. Compete for territory.", 114, 548);
  ctx.fillStyle = "rgba(243, 232, 255, 0.78)";
  ctx.font = "400 20px Arial";
  ctx.fillText(`Join the live board at ${siteHost}`, 114, 582);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not export share image."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export function downloadShareCard(blob: Blob, filename = "pixeldao-share-card.png") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildXIntentUrl(text: string) {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}
