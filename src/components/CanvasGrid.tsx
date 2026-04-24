import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APP_CONFIG } from "@/config/app";
import type { PixelRow } from "@/services/pixels";
import { shortAddress, timeAgo, walletGradient } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  pixels: (PixelRow | null)[];
  revision?: number;
  onPaint?: (x: number, y: number) => void;
  canPaint?: boolean;
  hoverColor?: string;
  brushSize?: number;
  highlightWallet?: string | null;
  focusWallet?: string | null;
  focusKey?: number;
  className?: string;
}

type HoverState = { x: number; y: number; cx: number; cy: number };
type Offset = { x: number; y: number };
type RenderMeta = {
  paintedCount: number;
  highlightSet: Set<string> | null;
  highlightStroke: string | null;
};

const W = APP_CONFIG.canvas.width;
const H = APP_CONFIG.canvas.height;
const BASE_PX = 6; // base cell size in CSS px at zoom=1

function getBrushCells(x: number, y: number, brushSize: number) {
  const cells: Array<{ x: number; y: number }> = [];
  const startX = x - Math.floor((brushSize - 1) / 2);
  const startY = y - Math.floor((brushSize - 1) / 2);

  for (let offsetY = 0; offsetY < brushSize; offsetY++) {
    for (let offsetX = 0; offsetX < brushSize; offsetX++) {
      const nextX = startX + offsetX;
      const nextY = startY + offsetY;
      if (nextX < 0 || nextX >= W || nextY < 0 || nextY >= H) continue;
      cells.push({ x: nextX, y: nextY });
    }
  }

  return cells;
}

/**
 * CanvasGrid - high-performance 100x100 grid renderer (canvas2D).
 * Supports pan (drag), zoom (wheel + buttons), hover tooltip, and click-to-paint.
 */
export function CanvasGrid({
  pixels,
  revision = 0,
  onPaint,
  canPaint,
  hoverColor,
  brushSize = 1,
  highlightWallet,
  focusWallet,
  focusKey,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef(pixels);
  const offsetRef = useRef<Offset>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const hoverRef = useRef<HoverState | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const rafRef = useRef<number | null>(null);
  const overlayRafRef = useRef<number | null>(null);
  const tooltipRafRef = useRef<number | null>(null);
  const canPaintRef = useRef(canPaint);
  const hoverColorRef = useRef(hoverColor);
  const brushSizeRef = useRef(brushSize);
  const highlightWalletRef = useRef(highlightWallet);
  const renderMetaRef = useRef<RenderMeta>({
    paintedCount: 0,
    highlightSet: null,
    highlightStroke: null,
  });

  const [zoomDisplay, setZoomDisplay] = useState(1);
  const [tooltip, setTooltip] = useState<HoverState | null>(null);
  const [dragging, setDragging] = useState(false);

  const rebuildRenderMeta = useCallback(() => {
    const currentPixels = pixelsRef.current;
    const currentHighlightWallet = highlightWalletRef.current;
    renderMetaRef.current = {
      paintedCount: currentPixels.reduce((count, pixel) => (pixel?.owner_wallet ? count + 1 : count), 0),
      highlightSet: currentHighlightWallet
        ? new Set(
            currentPixels
              .filter((pixel): pixel is PixelRow => !!pixel && pixel.owner_wallet === currentHighlightWallet)
              .map((pixel) => `${pixel.x},${pixel.y}`)
          )
        : null,
      highlightStroke: currentHighlightWallet ? walletGradient(currentHighlightWallet)[0] : null,
    };
  }, []);

  const prepareCanvas = useCallback((canvas: HTMLCanvasElement, container: HTMLDivElement) => {
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
    if (!ctx) return null;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    return { ctx, cw, ch };
  }, []);

  const drawOverlay = useCallback(() => {
    overlayRafRef.current = null;

    const canvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const prepared = prepareCanvas(canvas, container);
    if (!prepared) return;

    const { ctx, cw, ch } = prepared;
    const currentHover = hoverRef.current;
    ctx.clearRect(0, 0, cw, ch);
    if (!currentHover) return;

    const offset = offsetRef.current;
    const cellSize = BASE_PX * zoomRef.current;
    const currentCanPaint = canPaintRef.current;
    const currentHoverColor = hoverColorRef.current;
    const currentBrushSize = brushSizeRef.current;
    const brushCells = getBrushCells(currentHover.x, currentHover.y, currentBrushSize);

    for (const cell of brushCells) {
      const hx = Math.floor(offset.x + cell.x * cellSize);
      const hy = Math.floor(offset.y + cell.y * cellSize);
      if (currentCanPaint && currentHoverColor) {
        ctx.fillStyle = currentHoverColor + "80";
        ctx.fillRect(hx, hy, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = currentCanPaint ? "#3affb5" : "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const cell of brushCells) {
      const hx = Math.floor(offset.x + cell.x * cellSize);
      const hy = Math.floor(offset.y + cell.y * cellSize);
      const hasTop = brushCells.some((candidate) => candidate.x === cell.x && candidate.y === cell.y - 1);
      const hasRight = brushCells.some((candidate) => candidate.x === cell.x + 1 && candidate.y === cell.y);
      const hasBottom = brushCells.some((candidate) => candidate.x === cell.x && candidate.y === cell.y + 1);
      const hasLeft = brushCells.some((candidate) => candidate.x === cell.x - 1 && candidate.y === cell.y);

      if (!hasTop) {
        ctx.moveTo(hx - 1, hy - 1);
        ctx.lineTo(hx + cellSize + 1, hy - 1);
      }
      if (!hasRight) {
        ctx.moveTo(hx + cellSize + 1, hy - 1);
        ctx.lineTo(hx + cellSize + 1, hy + cellSize + 1);
      }
      if (!hasBottom) {
        ctx.moveTo(hx - 1, hy + cellSize + 1);
        ctx.lineTo(hx + cellSize + 1, hy + cellSize + 1);
      }
      if (!hasLeft) {
        ctx.moveTo(hx - 1, hy - 1);
        ctx.lineTo(hx - 1, hy + cellSize + 1);
      }
    }
    ctx.stroke();
  }, [prepareCanvas]);

  const scheduleOverlayDraw = useCallback(() => {
    if (overlayRafRef.current != null) return;
    overlayRafRef.current = window.requestAnimationFrame(drawOverlay);
  }, [drawOverlay]);

  const drawBoard = useCallback(() => {
    rafRef.current = null;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const prepared = prepareCanvas(canvas, container);
    if (!prepared) return;

    const { ctx, cw, ch } = prepared;
    const offset = offsetRef.current;
    const cellSize = BASE_PX * zoomRef.current;
    const currentPixels = pixelsRef.current;
    const currentHighlightWallet = highlightWalletRef.current;
    const renderMeta = renderMetaRef.current;

    ctx.clearRect(0, 0, cw, ch);

    // Backdrop
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(offset.x, offset.y, W * cellSize, H * cellSize);

    const emphasizePainted = renderMeta.paintedCount > 0 && cellSize <= 8;
    const highlightSet = renderMeta.highlightSet;
    const highlightStroke = renderMeta.highlightStroke;

    // Pixels
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = currentPixels[y * W + x];
        if (!p || !p.owner_wallet) continue;
        const isHighlighted = !!highlightSet?.has(`${x},${y}`);
        const dim = !!currentHighlightWallet && !isHighlighted;
        const drawX = Math.floor(offset.x + x * cellSize);
        const drawY = Math.floor(offset.y + y * cellSize);
        const drawSize = Math.ceil(cellSize);

        ctx.fillStyle = dim ? p.color + "90" : p.color;
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
          ctx.strokeStyle = highlightStroke + "cc";
          ctx.lineWidth = Math.max(1, cellSize >= 10 ? 1.5 : 1);
          ctx.shadowColor = highlightStroke;
          ctx.shadowBlur = 4;
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

    scheduleOverlayDraw();
  }, [prepareCanvas, scheduleOverlayDraw]);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(drawBoard);
  }, [drawBoard]);

  const scheduleTooltipUpdate = useCallback(() => {
    if (tooltipRafRef.current != null) return;
    tooltipRafRef.current = window.requestAnimationFrame(() => {
      tooltipRafRef.current = null;
      const next = hoverRef.current;
      setTooltip((prev) => {
        if (!prev && !next) return prev;
        if (prev && next && prev.x === next.x && prev.y === next.y && prev.cx === next.cx && prev.cy === next.cy) {
          return prev;
        }
        return next ? { ...next } : null;
      });
    });
  }, []);

  const screenToCell = useCallback((clientX: number, clientY: number) => {
    const c = containerRef.current;
    if (!c) return null;

    const rect = c.getBoundingClientRect();
    const offset = offsetRef.current;
    const cellSize = BASE_PX * zoomRef.current;
    const x = Math.floor((clientX - rect.left - offset.x) / cellSize);
    const y = Math.floor((clientY - rect.top - offset.y) / cellSize);

    if (x < 0 || x >= W || y < 0 || y >= H) return null;
    return { x, y };
  }, []);

  const updateHover = useCallback((nextHover: HoverState | null) => {
    const previous = hoverRef.current;
    hoverRef.current = nextHover;

    if (
      previous?.x !== nextHover?.x ||
      previous?.y !== nextHover?.y ||
      previous?.cx !== nextHover?.cx ||
      previous?.cy !== nextHover?.cy
    ) {
      scheduleTooltipUpdate();
      scheduleOverlayDraw();
    }
  }, [scheduleOverlayDraw, scheduleTooltipUpdate]);

  const applyZoomAroundViewportCenter = useCallback((nextZoom: number) => {
    const c = containerRef.current;
    const clampedZoom = Math.max(0.5, Math.min(8, nextZoom));

    if (!c) {
      zoomRef.current = clampedZoom;
      setZoomDisplay(clampedZoom);
      scheduleDraw();
      return;
    }

    const offset = offsetRef.current;
    const cellSize = BASE_PX * zoomRef.current;
    const centerScreenX = c.clientWidth / 2;
    const centerScreenY = c.clientHeight / 2;
    const worldX = (centerScreenX - offset.x) / cellSize;
    const worldY = (centerScreenY - offset.y) / cellSize;
    const nextCellSize = BASE_PX * clampedZoom;

    zoomRef.current = clampedZoom;
    offsetRef.current = {
      x: centerScreenX - worldX * nextCellSize,
      y: centerScreenY - worldY * nextCellSize,
    };
    setZoomDisplay(clampedZoom);
    scheduleDraw();
  }, [scheduleDraw]);

  const focusOnWalletPixels = useCallback(
    (wallet: string) => {
      const owned = pixelsRef.current.filter((pixel): pixel is PixelRow => !!pixel && pixel.owner_wallet === wallet);
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

      zoomRef.current = nextZoom;
      offsetRef.current = {
        x: c.clientWidth / 2 - centerX * nextCellSize,
        y: c.clientHeight / 2 - centerY * nextCellSize,
      };
      setZoomDisplay(nextZoom);
      scheduleDraw();
    },
    [scheduleDraw]
  );

  useEffect(() => {
    pixelsRef.current = pixels;
    rebuildRenderMeta();
    scheduleDraw();
  }, [pixels, revision, rebuildRenderMeta, scheduleDraw]);

  useEffect(() => {
    canPaintRef.current = canPaint;
    hoverColorRef.current = hoverColor;
    brushSizeRef.current = brushSize;
    highlightWalletRef.current = highlightWallet;
    rebuildRenderMeta();
    scheduleDraw();
  }, [canPaint, hoverColor, brushSize, highlightWallet, rebuildRenderMeta, scheduleDraw]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;

    const w = c.clientWidth;
    const h = c.clientHeight;
    offsetRef.current = {
      x: (w - W * BASE_PX * zoomRef.current) / 2,
      y: (h - H * BASE_PX * zoomRef.current) / 2,
    };
    scheduleDraw();
  }, [scheduleDraw]);

  useEffect(() => {
    if (!focusWallet || focusKey == null) return;
    focusOnWalletPixels(focusWallet);
  }, [focusKey, focusWallet, focusOnWalletPixels]);

  useEffect(() => {
    const onResize = () => scheduleDraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [scheduleDraw]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      if (overlayRafRef.current != null) window.cancelAnimationFrame(overlayRafRef.current);
      if (tooltipRafRef.current != null) window.cancelAnimationFrame(tooltipRafRef.current);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    const offset = offsetRef.current;
    dragStartRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, moved: false };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const dragStart = dragStartRef.current;
    if (dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragStart.moved = true;
      offsetRef.current = { x: dragStart.ox + dx, y: dragStart.oy + dy };
      scheduleDraw();
    }

    const cell = screenToCell(e.clientX, e.clientY);
    updateHover(cell ? { ...cell, cx: e.clientX, cy: e.clientY } : null);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    const moved = dragStartRef.current?.moved;
    setDragging(false);
    dragStartRef.current = null;

    if (!moved) {
      const cell = screenToCell(e.clientX, e.clientY);
      if (cell && onPaint && canPaintRef.current) onPaint(cell.x, cell.y);
    }
  };

  const onMouseLeave = () => {
    updateHover(null);
    setDragging(false);
    dragStartRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    applyZoomAroundViewportCenter(zoomRef.current * (1 + delta));
  };

  const hoveredPixel = useMemo(() => {
    if (!tooltip) return null;
    return pixels[tooltip.y * W + tooltip.x] ?? null;
  }, [tooltip, pixels, revision]);

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
      <canvas ref={canvasRef} className="absolute inset-0 block pixelated" />
      <canvas ref={overlayCanvasRef} className="absolute inset-0 block pixelated pointer-events-none" />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-card/80 backdrop-blur border border-border rounded-lg p-1 shadow-xl">
        <button
          className="w-8 h-8 rounded hover:bg-muted/60 font-mono text-lg leading-none"
          onClick={() => applyZoomAroundViewportCenter(zoomRef.current * 1.25)}
          aria-label="Zoom in"
        >+</button>
        <div className="text-center font-mono text-[10px] text-muted-foreground tabular-nums">{zoomDisplay.toFixed(1)}x</div>
        <button
          className="w-8 h-8 rounded hover:bg-muted/60 font-mono text-lg leading-none"
          onClick={() => applyZoomAroundViewportCenter(zoomRef.current / 1.25)}
          aria-label="Zoom out"
        >−</button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 bg-popover/95 backdrop-blur border border-border rounded-lg px-3 py-2 shadow-2xl text-xs"
          style={{
            left: Math.min((containerRef.current?.clientWidth ?? 0) - 200, tooltip.cx - (containerRef.current?.getBoundingClientRect().left ?? 0) + 14),
            top: tooltip.cy - (containerRef.current?.getBoundingClientRect().top ?? 0) + 14,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-sm border border-border"
              style={{ background: hoveredPixel?.color ?? "#0a0a14" }}
            />
            <span className="font-mono">({tooltip.x}, {tooltip.y})</span>
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
