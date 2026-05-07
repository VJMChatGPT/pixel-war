import { useEffect, useRef } from "react";
import { APP_CONFIG } from "@/config/app";
import type { PixelRow } from "@/services/pixels";
import { cn } from "@/lib/utils";

interface Props {
  pixels: (PixelRow | null)[];
  revision?: number;
  className?: string;
}

const W = APP_CONFIG.canvas.width;
const H = APP_CONFIG.canvas.height;
const MAX_DPR = 1.5;

export function CanvasPreview({ pixels, revision = 0, className }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef(pixels);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    pixelsRef.current = pixels;
  }, [pixels, revision]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const draw = () => {
      rafRef.current = null;

      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      if (!width || !height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);

      const boardSize = Math.min(width, height);
      const originX = Math.floor((width - boardSize) / 2);
      const originY = Math.floor((height - boardSize) / 2);
      const cellWidth = boardSize / W;
      const cellHeight = boardSize / H;

      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(originX, originY, boardSize, boardSize);

      const currentPixels = pixelsRef.current;
      for (let index = 0; index < currentPixels.length; index++) {
        const pixel = currentPixels[index];
        if (!pixel?.owner_wallet) continue;
        const drawX = originX + pixel.x * cellWidth;
        const drawY = originY + pixel.y * cellHeight;
        ctx.fillStyle = pixel.color;
        ctx.fillRect(drawX, drawY, Math.ceil(cellWidth), Math.ceil(cellHeight));
      }

      if (cellWidth >= 5) {
        ctx.strokeStyle = "rgba(255,255,255,0.035)";
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 1; x < W; x++) {
          const drawX = Math.floor(originX + x * cellWidth) + 0.5;
          ctx.moveTo(drawX, originY);
          ctx.lineTo(drawX, originY + boardSize);
        }

        for (let y = 1; y < H; y++) {
          const drawY = Math.floor(originY + y * cellHeight) + 0.5;
          ctx.moveTo(originX, drawY);
          ctx.lineTo(originX + boardSize, drawY);
        }

        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(157,77,255,0.42)";
      ctx.lineWidth = 2;
      ctx.strokeRect(originX - 1, originY - 1, boardSize + 2, boardSize + 2);
    };

    const scheduleDraw = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(() => scheduleDraw());
    observer.observe(wrapper);
    scheduleDraw();

    return () => {
      observer.disconnect();
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const wrapper = wrapperRef.current;
      const canvas = canvasRef.current;
      if (!wrapper || !canvas) return;

      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      if (!width || !height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);

      const boardSize = Math.min(width, height);
      const originX = Math.floor((width - boardSize) / 2);
      const originY = Math.floor((height - boardSize) / 2);
      const cellWidth = boardSize / W;
      const cellHeight = boardSize / H;

      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(originX, originY, boardSize, boardSize);

      for (let index = 0; index < pixels.length; index++) {
        const pixel = pixels[index];
        if (!pixel?.owner_wallet) continue;
        ctx.fillStyle = pixel.color;
        ctx.fillRect(
          originX + pixel.x * cellWidth,
          originY + pixel.y * cellHeight,
          Math.ceil(cellWidth),
          Math.ceil(cellHeight),
        );
      }

      if (cellWidth >= 5) {
        ctx.strokeStyle = "rgba(255,255,255,0.035)";
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 1; x < W; x++) {
          const drawX = Math.floor(originX + x * cellWidth) + 0.5;
          ctx.moveTo(drawX, originY);
          ctx.lineTo(drawX, originY + boardSize);
        }

        for (let y = 1; y < H; y++) {
          const drawY = Math.floor(originY + y * cellHeight) + 0.5;
          ctx.moveTo(originX, drawY);
          ctx.lineTo(originX + boardSize, drawY);
        }

        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(157,77,255,0.42)";
      ctx.lineWidth = 2;
      ctx.strokeRect(originX - 1, originY - 1, boardSize + 2, boardSize + 2);
    });

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [pixels, revision]);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative h-full w-full overflow-hidden rounded-md bg-[#0a0a14]", className)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full block"
        style={{ imageRendering: "pixelated" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_58%,rgba(7,4,14,0.34)_100%)]" />
    </div>
  );
}
