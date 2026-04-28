import { memo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const BOARD_SIZE = 100;
const COLORS = [
  "#ffffff",
  "#f3e8ff",
  "#e0c8ff",
  "#c9a8ff",
  "#a78bff",
  "#9d4dff",
  "#8a4dff",
  "#7b2dff",
  "#5b2dba",
  "#3d1d7a",
  "#ff6fae",
  "#9bd9ff",
  "#ffd16a",
] as const;

type Cluster = {
  cx: number;
  cy: number;
  radius: number;
  density: number;
  color: string;
  glow: string;
  seed: number;
};

const CLUSTERS: Cluster[] = [
  { cx: 16, cy: 18, radius: 14, density: 0.82, color: "#f3e8ff", glow: "#ffffff", seed: 1.7 },
  { cx: 32, cy: 28, radius: 10, density: 0.78, color: "#9bd9ff", glow: "#c9a8ff", seed: 2.6 },
  { cx: 54, cy: 18, radius: 16, density: 0.84, color: "#8a4dff", glow: "#e0c8ff", seed: 3.4 },
  { cx: 73, cy: 26, radius: 12, density: 0.76, color: "#ffd16a", glow: "#ffffff", seed: 4.5 },
  { cx: 86, cy: 16, radius: 9, density: 0.68, color: "#ff6fae", glow: "#f3e8ff", seed: 5.4 },
  { cx: 22, cy: 52, radius: 15, density: 0.82, color: "#7b2dff", glow: "#9bd9ff", seed: 6.2 },
  { cx: 47, cy: 48, radius: 18, density: 0.9, color: "#a78bff", glow: "#ffffff", seed: 7.1 },
  { cx: 71, cy: 56, radius: 16, density: 0.8, color: "#5b2dba", glow: "#ffd16a", seed: 8.3 },
  { cx: 88, cy: 46, radius: 10, density: 0.72, color: "#9d4dff", glow: "#ff6fae", seed: 9.6 },
  { cx: 18, cy: 82, radius: 11, density: 0.7, color: "#9bd9ff", glow: "#ffffff", seed: 10.1 },
  { cx: 41, cy: 78, radius: 15, density: 0.84, color: "#ff6fae", glow: "#ffd16a", seed: 11.4 },
  { cx: 63, cy: 84, radius: 13, density: 0.78, color: "#8a4dff", glow: "#f3e8ff", seed: 12.2 },
  { cx: 84, cy: 79, radius: 12, density: 0.76, color: "#c9a8ff", glow: "#9bd9ff", seed: 13.1 },
];

const SPARK_POINTS = [
  [6, 11], [11, 24], [21, 9], [28, 39], [34, 14], [39, 30], [44, 8], [52, 35], [57, 13],
  [62, 28], [68, 10], [76, 33], [82, 8], [92, 19], [9, 68], [16, 57], [24, 73], [31, 62],
  [37, 88], [49, 65], [58, 75], [67, 69], [74, 84], [89, 71], [94, 87],
];

function hash(x: number, y: number, seed: number) {
  const value = Math.sin((x * 127.1 + y * 311.7 + seed * 71.9) * 0.0731) * 43758.5453123;
  return value - Math.floor(value);
}

function sampleCluster(x: number, y: number, cluster: Cluster) {
  const dx = x - cluster.cx;
  const dy = y - cluster.cy;
  const distance = Math.sqrt(dx * dx + dy * dy) / cluster.radius;
  if (distance > 1.18) return null;

  const falloff = Math.max(0, 1 - distance * distance);
  const localNoise =
    hash(x, y, cluster.seed) * 0.55 +
    hash(y + 13, x - 7, cluster.seed * 1.7) * 0.3 +
    Math.sin((x + cluster.seed) * 0.42) * 0.08 +
    Math.cos((y - cluster.seed) * 0.35) * 0.07;

  const threshold = cluster.density - falloff * 0.52;
  if (localNoise < threshold) return null;

  return {
    intensity: falloff,
    color: localNoise > 0.9 ? cluster.glow : cluster.color,
    isGlow: localNoise > 0.94 || falloff > 0.82,
  };
}

function drawBaseField(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  ctx.fillStyle = "#06040d";
  ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      let chosen: { intensity: number; color: string; isGlow: boolean } | null = null;

      for (const cluster of CLUSTERS) {
        const sample = sampleCluster(x, y, cluster);
        if (!sample) continue;
        if (!chosen || sample.intensity > chosen.intensity) {
          chosen = sample;
        }
      }

      const ambient = hash(x + 19, y - 11, 4.2);
      if (!chosen && ambient < 0.987) continue;

      const color = chosen?.color ?? COLORS[(x + y) % COLORS.length];
      const alpha = chosen ? Math.min(1, 0.45 + chosen.intensity * 0.85) : 0.5;
      ctx.fillStyle = `${color}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.fillRect(x, y, 1, 1);

      if (chosen?.isGlow) {
        ctx.fillStyle = `${chosen.color}${Math.round((0.18 + chosen.intensity * 0.22) * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.fillRect(x - 0.18, y - 0.18, 1.36, 1.36);
      }
    }
  }
}

function drawSparkLayer(ctx: CanvasRenderingContext2D, timeMs: number) {
  for (let i = 0; i < SPARK_POINTS.length; i++) {
    const [x, y] = SPARK_POINTS[i];
    const pulse = 0.55 + 0.45 * Math.sin(timeMs / 700 + i * 0.63);
    const color = COLORS[(i * 3) % COLORS.length];
    ctx.fillStyle = `${color}${Math.round((0.45 + pulse * 0.45) * 255)
      .toString(16)
      .padStart(2, "0")}`;
    ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = `${color}${Math.round((0.12 + pulse * 0.18) * 255)
      .toString(16)
      .padStart(2, "0")}`;
    ctx.fillRect(x - 0.25, y - 0.25, 1.5, 1.5);
  }
}

export const ScrollStoryCanvas = memo(function ScrollStoryCanvas({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = BOARD_SIZE;
    baseCanvas.height = BOARD_SIZE;
    const baseCtx = baseCanvas.getContext("2d");
    if (!baseCtx) return;

    drawBaseField(baseCtx);

    let frameId = 0;
    let lastPaintMs = 0;
    const targetFrameMs = 1000 / 24;

    const render = (time: number) => {
      if (time - lastPaintMs >= targetFrameMs) {
        lastPaintMs = time;
        ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
        ctx.drawImage(baseCanvas, 0, 0);
        drawSparkLayer(ctx, time);
      }
      frameId = window.requestAnimationFrame(render);
    };

    render(0);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-md bg-[#06040d]", className)}>
      <canvas
        ref={canvasRef}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,transparent_52%,rgba(6,4,13,0.42)_100%)]" />
    </div>
  );
});
