import { memo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/config/app";

interface Props {
  className?: string;
}

/* ----------------------------------------------------------------
   Storytelling canvas — a believable SNAPSHOT of the real PIXL
   board (100x100). Not live data; deterministically generated to
   look like real users actually painted: scattered solo pixels,
   small skirmishes, dense clusters, and a few "territory" blobs.
   Uses the actual app palette so it feels native to PIXL.
---------------------------------------------------------------- */

const BOARD = 100;
const PALETTE = APP_CONFIG.palette as readonly string[];

/* Deterministic PRNG so the snapshot is stable across renders */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Cell = string | null;

/* Pick a palette index, biased toward violet family for realism */
function pickColor(rand: () => number): string {
  const r = rand();
  if (r < 0.55) {
    // violet core
    return PALETTE[3 + Math.floor(rand() * 6)]; // a78bff..3d1d7a
  }
  if (r < 0.78) {
    // lavender highlights
    return PALETTE[Math.floor(rand() * 3)];
  }
  if (r < 0.9) {
    // neutrals
    return PALETTE[10 + Math.floor(rand() * 3)];
  }
  // accent pops
  return PALETTE[13 + Math.floor(rand() * 3)];
}

function buildSnapshot(seed = 0xC0FFEE): Cell[] {
  const rand = mulberry32(seed);
  const board: Cell[] = new Array(BOARD * BOARD).fill(null);
  const set = (x: number, y: number, c: string) => {
    if (x < 0 || y < 0 || x >= BOARD || y >= BOARD) return;
    board[y * BOARD + x] = c;
  };

  /* 1) Scattered solo pixels — feels like random painting activity */
  const soloCount = 1400;
  for (let i = 0; i < soloCount; i++) {
    const x = Math.floor(rand() * BOARD);
    const y = Math.floor(rand() * BOARD);
    set(x, y, pickColor(rand));
  }

  /* 2) Small skirmish clusters — 2-6 pixels, two-color contests */
  const skirmishCount = 90;
  for (let i = 0; i < skirmishCount; i++) {
    const cx = Math.floor(rand() * BOARD);
    const cy = Math.floor(rand() * BOARD);
    const a = pickColor(rand);
    const b = pickColor(rand);
    const n = 2 + Math.floor(rand() * 5);
    for (let k = 0; k < n; k++) {
      const dx = Math.floor((rand() - 0.5) * 6);
      const dy = Math.floor((rand() - 0.5) * 6);
      set(cx + dx, cy + dy, rand() < 0.5 ? a : b);
    }
  }

  /* 3) Mid clusters — believable 8-30 pixel blobs */
  const midCount = 28;
  for (let i = 0; i < midCount; i++) {
    const cx = Math.floor(rand() * BOARD);
    const cy = Math.floor(rand() * BOARD);
    const baseColor = pickColor(rand);
    const altColor = pickColor(rand);
    const radius = 2 + rand() * 4;
    const n = 8 + Math.floor(rand() * 22);
    for (let k = 0; k < n; k++) {
      const angle = rand() * Math.PI * 2;
      const r = rand() * radius;
      const x = Math.round(cx + Math.cos(angle) * r);
      const y = Math.round(cy + Math.sin(angle) * r);
      set(x, y, rand() < 0.78 ? baseColor : altColor);
    }
  }

  /* 4) A handful of larger territories — irregular blobs (40-180 px) */
  const territoryCount = 7;
  for (let i = 0; i < territoryCount; i++) {
    const cx = 10 + Math.floor(rand() * (BOARD - 20));
    const cy = 10 + Math.floor(rand() * (BOARD - 20));
    const main = pickColor(rand);
    const accent = pickColor(rand);
    const w = 6 + Math.floor(rand() * 10);
    const h = 6 + Math.floor(rand() * 10);
    // organic blob via random walk fill
    const stack: Array<[number, number]> = [[cx, cy]];
    const filled = new Set<number>();
    const target = 60 + Math.floor(rand() * 120);
    while (stack.length && filled.size < target) {
      const idx = Math.floor(rand() * stack.length);
      const [x, y] = stack.splice(idx, 1)[0];
      const key = y * BOARD + x;
      if (filled.has(key)) continue;
      if (Math.abs(x - cx) > w || Math.abs(y - cy) > h) continue;
      filled.add(key);
      set(x, y, rand() < 0.85 ? main : accent);
      if (rand() < 0.85) stack.push([x + 1, y]);
      if (rand() < 0.85) stack.push([x - 1, y]);
      if (rand() < 0.85) stack.push([x, y + 1]);
      if (rand() < 0.85) stack.push([x, y - 1]);
    }
  }

  /* 5) A few tiny rectangular "logos" — feels like users planting marks */
  const logoCount = 5;
  for (let i = 0; i < logoCount; i++) {
    const x = Math.floor(rand() * (BOARD - 8));
    const y = Math.floor(rand() * (BOARD - 6));
    const w = 3 + Math.floor(rand() * 5);
    const h = 3 + Math.floor(rand() * 4);
    const c = pickColor(rand);
    for (let j = 0; j < h; j++) {
      for (let k = 0; k < w; k++) {
        if (rand() < 0.85) set(x + k, y + j, c);
      }
    }
  }

  /* 6) Sparse scatter overlay — adds final "lived in" noise */
  const noiseCount = 600;
  for (let i = 0; i < noiseCount; i++) {
    const x = Math.floor(rand() * BOARD);
    const y = Math.floor(rand() * BOARD);
    if (board[y * BOARD + x]) continue;
    if (rand() < 0.5) set(x, y, pickColor(rand));
  }

  return board;
}

function drawSnapshot(ctx: CanvasRenderingContext2D, board: Cell[]) {
  // dark backdrop matches PIXL canvas chrome
  ctx.fillStyle = "#0b0718";
  ctx.fillRect(0, 0, BOARD, BOARD);

  for (let y = 0; y < BOARD; y++) {
    for (let x = 0; x < BOARD; x++) {
      const c = board[y * BOARD + x];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // faint pixel grid
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let i = 1; i < BOARD; i++) {
    ctx.fillRect(i, 0, 0.05, BOARD);
    ctx.fillRect(0, i, BOARD, 0.05);
  }
  // every-10 stronger
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 10; i < BOARD; i += 10) {
    ctx.fillRect(i, 0, 0.1, BOARD);
    ctx.fillRect(0, i, BOARD, 0.1);
  }
}

export const ScrollStoryCanvas = memo(function ScrollStoryCanvas({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const board = buildSnapshot();
    drawSnapshot(ctx, board);
  }, []);

  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-md bg-[#0b0718] isolate transform-gpu [backface-visibility:hidden]", className)}>
      <canvas
        ref={canvasRef}
        width={BOARD}
        height={BOARD}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated", transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        aria-hidden="true"
      />
      {/* subtle inner shadow for depth */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.55)]" />
      {/* very soft vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
});
