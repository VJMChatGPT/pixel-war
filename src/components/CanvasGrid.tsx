import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { APP_CONFIG } from "@/config/app";
import type { PixelRow } from "@/services/pixels";
import { shortAddress, timeAgo, walletGradient } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  pixels: (PixelRow | null)[];
  onPaint?: (x: number, y: number) => void;
  canPaint?: boolean;
  hoverColor?: string;
  highlightWallet?: string | null;
  focusWallet?: string | null;
  focusKey?: number;
  className?: string;
}

const W = APP_CONFIG.canvas.width;
const H = APP_CONFIG.canvas.height;
const BASE_PX = 6; // base cell size in CSS px at zoom=1

/**
 * CanvasGrid — high-performance 100×100 grid renderer (canvas2D).
 * Supports pan (drag), zoom (wheel + buttons), hover tooltip, and click-to-paint.
 */
export function CanvasGrid({
  pixels,
  onPaint,
  canPaint,
  hoverColor,
  highlightWallet,
  focusWallet,
  focusKey,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);

  const cellSize = BASE_PX * zoom;

  // Center grid on first render
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const w = c.clientWidth;
    const h = c.clientHeight;
    setOffset({
      x: (w - W * cellSize) / 2,
      y: (h - H * cellSize) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusOnWalletPixels = useCallback(
    (wallet: string) => {
      const owned = pixels.filter((pixel): pixel is PixelRow => !!pixel && pixel.owner_wallet === wallet);
      if (owned.length === 0) return;

      const c = containerRef.current;
      if (!c) return;

      const minX = Math.min(...owned.map((pixel) => pixel.x));
      const maxX = Math.max(...owned.map((pixel) => pixel.x));
      const minY = Math.min(...owned.map((pixel) => pixel.y));
      const maxY = Math.max(...owned.map((pixel) => pixel.y));

      const boundsWidth = maxX - minX + 1;
      const boundsHeight = maxY - minY + 1;
      const paddingCells = 12;
      const nextZoom = Math.max(
        1.2,
        Math.min(
          4,
          Math.min(
            c.clientWidth / ((boundsWidth + paddingCells * 2) * BASE_PX),
            c.clientHeight / ((boundsHeight + paddingCells * 2) * BASE_PX)
          )
        )
      );

      const nextCellSize = BASE_PX * nextZoom;
      const centerX = (minX + maxX + 1) / 2;
      const centerY = (minY + maxY + 1) / 2;

      setZoom(nextZoom);
      setOffset({
        x: c.clientWidth / 2 - centerX * nextCellSize,
        y: c.clientHeight / 2 - centerY * nextCellSize,
      });
    },
    [pixels]
  );

  const applyZoomAroundViewportCenter = useCallback((nextZoom: number) => {
    const c = containerRef.current;
    if (!c) {
      setZoom(nextZoom);
      return;
    }

    const clampedZoom = Math.max(0.5, Math.min(8, nextZoom));
    const centerScreenX = c.clientWidth / 2;
    const centerScreenY = c.clientHeight / 2;
    const worldX = (centerScreenX - offset.x) / cellSize;
    const worldY = (centerScreenY - offset.y) / cellSize;
    const nextCellSize = BASE_PX * clampedZoom;

    setZoom(clampedZoom);
    setOffset({
      x: centerScreenX - worldX * nextCellSize,
      y: centerScreenY - worldY * nextCellSize,
    });
  }, [cellSize, offset.x, offset.y]);

  useEffect(() => {
    if (!focusWallet || focusKey == null) return;
    focusOnWalletPixels(focusWallet);
  }, [focusKey, focusWallet, focusOnWalletPixels]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cw, ch);

    // Backdrop
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(offset.x, offset.y, W * cellSize, H * cellSize);

    const paintedCount = pixels.reduce((count, pixel) => (pixel?.owner_wallet ? count + 1 : count), 0);
    const emphasizePainted = paintedCount > 0 && cellSize <= 8;
    const highlightSet = highlightWallet
      ? new Set(
          pixels
            .filter((pixel): pixel is PixelRow => !!pixel && pixel.owner_wallet === highlightWallet)
            .map((pixel) => `${pixel.x},${pixel.y}`)
        )
      : null;
    const highlightStroke = highlightWallet ? walletGradient(highlightWallet)[0] : null;

    // Pixels
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = pixels[y * W + x];
        if (!p || !p.owner_wallet) continue;
        const isHighlighted = !!highlightSet?.has(`${x},${y}`);
        const dim = !!highlightWallet && !isHighlighted;
        const drawX = Math.floor(offset.x + x * cellSize);
        const drawY = Math.floor(offset.y + y * cellSize);
        const drawSize = Math.ceil(cellSize);

        ctx.fillStyle = dim ? p.color + "30" : p.color;
        ctx.fillRect(drawX, drawY, drawSize, drawSize);

        if (emphasizePainted && !dim && !isHighlighted) {
          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.strokeRect(drawX - 1, drawY - 1, drawSize + 2, drawSize + 2);
          ctx.restore();
        }

        if (isHighlighted && highlightStroke) {
          ctx.save();
          ctx.strokeStyle = highlightStroke;
          ctx.lineWidth = Math.max(1.5, cellSize >= 10 ? 2 : 1.5);
          ctx.shadowColor = highlightStroke;
          ctx.shadowBlur = 10;
          ctx.beginPath();

          if (!highlightSet?.has(`${x},${y - 1}`)) {
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX + drawSize, drawY);
          }
          if (!highlightSet?.has(`${x + 1},${y}`)) {
            ctx.moveTo(drawX + drawSize, drawY);
            ctx.lineTo(drawX + drawSize, drawY + drawSize);
          }
          if (!highlightSet?.has(`${x},${y + 1}`)) {
            ctx.moveTo(drawX, drawY + drawSize);
            ctx.lineTo(drawX + drawSize, drawY + drawSize);
          }
          if (!highlightSet?.has(`${x - 1},${y}`)) {
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX, drawY + drawSize);
          }

          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Subtle grid when zoomed in
    if (cellSize >= 8) {
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const px = Math.floor(offset.x + x * cellSize) + 0.5;
        ctx.moveTo(px, offset.y);
        ctx.lineTo(px, offset.y + H * cellSize);
      }
      for (let y = 0; y <= H; y++) {
        const py = Math.floor(offset.y + y * cellSize) + 0.5;
        ctx.moveTo(offset.x, py);
        ctx.lineTo(offset.x + W * cellSize, py);
      }
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = "rgba(255,45,117,0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(offset.x - 1, offset.y - 1, W * cellSize + 2, H * cellSize + 2);

    // Hover highlight
    if (hover) {
      const hx = Math.floor(offset.x + hover.x * cellSize);
      const hy = Math.floor(offset.y + hover.y * cellSize);
      ctx.strokeStyle = canPaint ? "#3affb5" : "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(hx - 1, hy - 1, cellSize + 2, cellSize + 2);
      if (canPaint && hoverColor) {
        ctx.fillStyle = hoverColor + "80";
        ctx.fillRect(hx, hy, cellSize, cellSize);
      }
    }
  }, [pixels, offset, cellSize, hover, canPaint, hoverColor, highlightWallet]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const screenToCell = useCallback(
    (clientX: number, clientY: number) => {
      const c = containerRef.current;
      if (!c) return null;
      const rect = c.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left - offset.x) / cellSize);
      const y = Math.floor((clientY - rect.top - offset.y) / cellSize);
      if (x < 0 || x >= W || y < 0 || y >= H) return null;
      return { x, y };
    },
    [cellSize, offset]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, moved: false };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (dragging && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragStart.current.moved = true;
      setOffset({ ox: dragStart.current.ox + dx, oy: dragStart.current.oy + dy } as any);
      // ^ TS workaround
      setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    }
    const cell = screenToCell(e.clientX, e.clientY);
    if (cell) setHover({ ...cell, cx: e.clientX, cy: e.clientY });
    else setHover(null);
  };
  const onMouseUp = (e: React.MouseEvent) => {
    const moved = dragStart.current?.moved;
    setDragging(false);
    dragStart.current = null;
    if (!moved) {
      const cell = screenToCell(e.clientX, e.clientY);
      if (cell && onPaint && canPaint) onPaint(cell.x, cell.y);
    }
  };
  const onMouseLeave = () => {
    setHover(null);
    setDragging(false);
    dragStart.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    applyZoomAroundViewportCenter(zoom * (1 + delta));
  };

  const hoveredPixel = useMemo(() => {
    if (!hover) return null;
    return pixels[hover.y * W + hover.x] ?? null;
  }, [hover, pixels]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden rounded-lg bg-background select-none crt-vignette",
        canPaint ? "cursor-crosshair" : dragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onWheel={onWheel}
    >
      <canvas ref={canvasRef} className="block pixelated" />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-card/80 backdrop-blur border border-border rounded-lg p-1 shadow-xl">
        <button
          className="w-8 h-8 rounded hover:bg-muted/60 font-mono text-lg leading-none"
          onClick={() => applyZoomAroundViewportCenter(zoom * 1.25)}
          aria-label="Zoom in"
        >+</button>
        <div className="text-center font-mono text-[10px] text-muted-foreground tabular-nums">{zoom.toFixed(1)}x</div>
        <button
          className="w-8 h-8 rounded hover:bg-muted/60 font-mono text-lg leading-none"
          onClick={() => applyZoomAroundViewportCenter(zoom / 1.25)}
          aria-label="Zoom out"
        >−</button>
      </div>

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 bg-popover/95 backdrop-blur border border-border rounded-lg px-3 py-2 shadow-2xl text-xs"
          style={{
            left: Math.min((containerRef.current?.clientWidth ?? 0) - 200, hover.cx - (containerRef.current?.getBoundingClientRect().left ?? 0) + 14),
            top: hover.cy - (containerRef.current?.getBoundingClientRect().top ?? 0) + 14,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-sm border border-border"
              style={{ background: hoveredPixel?.color ?? "#0a0a14" }}
            />
            <span className="font-mono">({hover.x}, {hover.y})</span>
          </div>
          {hoveredPixel?.owner_wallet ? (
            <>
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">owner</div>
              <div className="font-mono font-semibold">{shortAddress(hoveredPixel.owner_wallet)}</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-1">{timeAgo(hoveredPixel.updated_at)}</div>
            </>
          ) : (
            <div className="font-mono text-[10px] text-muted-foreground">empty pixel</div>
          )}
        </div>
      )}
    </div>
  );
}
