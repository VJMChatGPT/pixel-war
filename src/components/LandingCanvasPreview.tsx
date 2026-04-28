import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const BOARD_SIZE = 100;
const PALETTE = [
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

type Territory = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  accent: string;
  seed: number;
};

const TERRITORIES: Territory[] = [
  { cx: 18, cy: 18, rx: 13, ry: 10, color: "#9d4dff", accent: "#f3e8ff", seed: 1.2 },
  { cx: 45, cy: 16, rx: 15, ry: 12, color: "#7b2dff", accent: "#9bd9ff", seed: 2.1 },
  { cx: 76, cy: 20, rx: 14, ry: 11, color: "#5b2dba", accent: "#ffd16a", seed: 3.6 },
  { cx: 22, cy: 48, rx: 17, ry: 13, color: "#a78bff", accent: "#ffffff", seed: 5.2 },
  { cx: 55, cy: 44, rx: 16, ry: 15, color: "#8a4dff", accent: "#ff6fae", seed: 6.4 },
  { cx: 82, cy: 49, rx: 12, ry: 15, color: "#3d1d7a", accent: "#e0c8ff", seed: 7.8 },
  { cx: 18, cy: 80, rx: 14, ry: 12, color: "#ff6fae", accent: "#ffffff", seed: 8.3 },
  { cx: 48, cy: 77, rx: 18, ry: 13, color: "#9bd9ff", accent: "#f3e8ff", seed: 9.1 },
  { cx: 77, cy: 78, rx: 16, ry: 12, color: "#ffd16a", accent: "#7b2dff", seed: 10.2 },
];

const PULSE_CELLS = [
  [12, 13], [15, 16], [33, 14], [47, 22], [61, 20], [79, 16], [73, 31],
  [21, 42], [28, 54], [41, 47], [56, 41], [68, 57], [83, 48], [15, 73],
  [25, 81], [45, 69], [51, 87], [64, 76], [78, 72], [88, 80], [38, 34], [58, 61],
];

function noise(x: number, y: number, seed: number) {
  return (
    Math.sin((x + seed * 11) * 0.31) * 0.08 +
    Math.cos((y - seed * 7) * 0.29) * 0.08 +
    Math.sin((x + y + seed * 13) * 0.11) * 0.06
  );
}

function drawBoard(ctx: CanvasRenderingContext2D, timeMs: number) {
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const gx = x + 0.5;
      const gy = y + 0.5;
      let best: { score: number; territory: Territory } | null = null;

      for (const territory of TERRITORIES) {
        const nx = (gx - territory.cx) / territory.rx;
        const ny = (gy - territory.cy) / territory.ry;
        const score = nx * nx + ny * ny + noise(x, y, territory.seed);
        if (!best || score < best.score) {
          best = { score, territory };
        }
      }

      if (!best) continue;

      const isFilled = best.score < 1;
      const borderBand = best.score >= 0.9 && best.score < 1.12;
      const speckle = Math.abs(Math.sin((x + 1) * (y + 3) * 0.07 + best.territory.seed)) > 0.94;
      const carveOut =
        Math.abs(Math.sin((x - best.territory.cx) * 0.22) + Math.cos((y - best.territory.cy) * 0.19)) > 1.86;

      if (isFilled && !carveOut) {
        const stripe = Math.sin((x * 0.6) + (y * 0.35) + best.territory.seed) > 0.55;
        ctx.fillStyle = stripe ? best.territory.accent : best.territory.color;
        ctx.fillRect(x, y, 1, 1);
      } else if (borderBand && speckle) {
        ctx.fillStyle = best.territory.accent;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  for (let i = 0; i < BOARD_SIZE; i += 6) {
    ctx.fillStyle = "rgba(10,10,20,0.06)";
    ctx.fillRect(i, 0, 0.22, BOARD_SIZE);
    ctx.fillRect(0, i, BOARD_SIZE, 0.22);
  }

  for (let i = 0; i < PULSE_CELLS.length; i++) {
    const [x, y] = PULSE_CELLS[i];
    const pulse = 0.5 + 0.5 * Math.sin(timeMs / 800 + i * 0.7);
    const baseColor = PALETTE[(i % (PALETTE.length - 1)) + 1];
    ctx.fillStyle = `${baseColor}${Math.round((0.4 + pulse * 0.35) * 255)
      .toString(16)
      .padStart(2, "0")}`;
    ctx.fillRect(x, y, 1, 1);
  }
}

export function LandingCanvasPreview({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;

    const render = (time: number) => {
      drawBoard(ctx, time);
      frameId = window.requestAnimationFrame(render);
    };

    render(0);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-md bg-white", className)}>
      <canvas
        ref={canvasRef}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "pixelated" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0%,transparent_55%,rgba(18,10,33,0.08)_100%)]" />
    </div>
  );
}
