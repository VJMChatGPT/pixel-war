import { memo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

/* ----------------------------------------------------------------
   Storytelling canvas — a curated, mock 100x100 board that looks
   like a real, active, collaborative pixel canvas (Reddit r/place
   style) on a clean white background. Used ONLY in the scroll
   narrative section as a visual artifact — not the live board.
---------------------------------------------------------------- */

const BOARD_SIZE = 100;

/* Restrained, curated palette — violet-leaning with a few accents */
const C = {
  bg: "#ffffff",
  ink: "#0e0a1a",
  grid: "rgba(15, 10, 30, 0.05)",

  violet: "#7b2dff",
  violetD: "#4a1eb5",
  violetL: "#a78bff",
  lavender: "#d8c8ff",
  lilac: "#f1e8ff",

  pink: "#ff6fae",
  pinkL: "#ffc2d9",

  sky: "#5fb8ff",
  skyD: "#1f6fc4",
  skyL: "#bfe1ff",

  mint: "#3ddca5",
  mintL: "#bff0dd",

  gold: "#ffc93b",
  goldD: "#d99a16",

  coral: "#ff7a59",
  red: "#e53b5a",

  ink2: "#1a1430",
  ash: "#3a3552",
  cloud: "#eef0f6",
} as const;

type Cell = string | null;

function makeBoard(): Cell[] {
  const b: Cell[] = new Array(BOARD_SIZE * BOARD_SIZE).fill(null);
  const set = (x: number, y: number, c: string) => {
    if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) return;
    b[y * BOARD_SIZE + x] = c;
  };
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c);
  };
  const border = (x: number, y: number, w: number, h: number, c: string) => {
    for (let i = 0; i < w; i++) {
      set(x + i, y, c);
      set(x + i, y + h - 1, c);
    }
    for (let j = 0; j < h; j++) {
      set(x, y + j, c);
      set(x + w - 1, y + j, c);
    }
  };
  const checker = (x: number, y: number, w: number, h: number, a: string, c: string) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) set(x + i, y + j, (i + j) % 2 === 0 ? a : c);
  };
  const stripesH = (x: number, y: number, w: number, h: number, a: string, c: string) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) set(x + i, y + j, j % 2 === 0 ? a : c);
  };
  const diag = (x: number, y: number, w: number, h: number, a: string, c: string) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) set(x + i, y + j, (i + j) % 3 === 0 ? a : c);
  };

  /* ---------------- TERRITORY 1 — Violet kingdom (top-left) ---------------- */
  rect(2, 2, 26, 22, C.lilac);
  border(2, 2, 26, 22, C.violet);
  // crown / castle silhouette
  rect(8, 8, 14, 10, C.violet);
  rect(10, 6, 2, 2, C.violet);
  rect(14, 4, 2, 4, C.violet);
  rect(18, 6, 2, 2, C.violet);
  rect(11, 12, 2, 2, C.gold);
  rect(17, 12, 2, 2, C.gold);
  rect(14, 14, 2, 4, C.violetD);
  // signature dots
  set(4, 4, C.violetD);
  set(5, 4, C.violetD);
  set(4, 5, C.violetD);
  set(25, 21, C.violetD);
  set(26, 21, C.violetD);

  /* ---------------- TERRITORY 2 — Pink heart (top-mid) ---------------- */
  rect(34, 4, 18, 16, C.pinkL);
  border(34, 4, 18, 16, C.pink);
  // heart shape
  const heart = [
    [38, 8], [39, 8], [40, 8], [44, 8], [45, 8], [46, 8],
    [37, 9], [38, 9], [39, 9], [40, 9], [41, 9], [43, 9], [44, 9], [45, 9], [46, 9], [47, 9],
    [37, 10], [38, 10], [39, 10], [40, 10], [41, 10], [42, 10], [43, 10], [44, 10], [45, 10], [46, 10], [47, 10],
    [38, 11], [39, 11], [40, 11], [41, 11], [42, 11], [43, 11], [44, 11], [45, 11], [46, 11],
    [39, 12], [40, 12], [41, 12], [42, 12], [43, 12], [44, 12], [45, 12],
    [40, 13], [41, 13], [42, 13], [43, 13], [44, 13],
    [41, 14], [42, 14], [43, 14],
    [42, 15],
  ];
  heart.forEach(([x, y]) => set(x, y, C.red));
  // tag
  rect(36, 17, 4, 1, C.pink);
  rect(46, 17, 4, 1, C.pink);

  /* ---------------- TERRITORY 3 — Gold corner (top-right) ---------------- */
  rect(60, 2, 22, 20, C.cloud);
  border(60, 2, 22, 20, C.goldD);
  checker(63, 5, 16, 14, C.gold, C.lilac);
  // logo block
  rect(67, 9, 8, 6, C.violetD);
  rect(69, 11, 4, 2, C.gold);

  /* ---------------- Contested border between violet and pink ---------------- */
  // a few skirmish pixels
  [
    [29, 6, C.violet], [30, 7, C.pink], [29, 9, C.pink], [30, 10, C.violet],
    [29, 12, C.violet], [30, 13, C.pink], [31, 14, C.violet], [29, 16, C.pink],
    [30, 18, C.violetD], [31, 19, C.red], [32, 20, C.violet],
  ].forEach(([x, y, c]) => set(x as number, y as number, c as string));

  /* ---------------- Solo ad — top-right corner sliver ---------------- */
  rect(85, 4, 12, 8, C.ink);
  rect(86, 5, 10, 6, C.gold);
  // tiny "AD" marker pixels
  rect(88, 7, 2, 2, C.ink);
  rect(91, 7, 2, 2, C.ink);
  rect(94, 7, 1, 2, C.ink);

  /* ---------------- TERRITORY 4 — Sky blue ocean (mid-left) ---------------- */
  rect(2, 28, 30, 26, C.skyL);
  border(2, 28, 30, 26, C.skyD);
  // wave pattern
  stripesH(5, 32, 24, 18, C.sky, C.skyL);
  // lone island
  rect(12, 38, 8, 4, C.gold);
  rect(13, 37, 6, 1, C.mint);
  rect(14, 42, 4, 1, C.goldD);
  // pixel "fish"
  set(24, 35, C.violet);
  set(25, 35, C.violet);
  set(23, 36, C.violet);
  set(24, 36, C.violetL);
  set(25, 47, C.pink);
  set(26, 47, C.pink);

  /* ---------------- TERRITORY 5 — Mint diamond (center) ---------------- */
  // diamond shape
  for (let r = 0; r < 12; r++) {
    for (let c = -r; c <= r; c++) {
      const x = 46 + c;
      const y = 28 + r;
      if (r < 11) set(x, y, C.mintL);
      if (r === 11 || Math.abs(c) === r) set(x, y, C.mint);
    }
  }
  for (let r = 0; r < 12; r++) {
    for (let c = -(11 - r); c <= 11 - r; c++) {
      const x = 46 + c;
      const y = 40 + r;
      if (r > 0) set(x, y, C.mintL);
      if (Math.abs(c) === 11 - r || r === 11) set(x, y, C.mint);
    }
  }
  // initials in center
  rect(43, 33, 2, 5, C.violetD); // P
  rect(44, 33, 3, 1, C.violetD);
  rect(46, 34, 1, 2, C.violetD);
  rect(44, 35, 3, 1, C.violetD);
  rect(48, 33, 1, 5, C.violetD); // X
  rect(52, 33, 1, 5, C.violetD);
  set(49, 34, C.violetD);
  set(51, 34, C.violetD);
  set(50, 35, C.violetD);
  set(49, 36, C.violetD);
  set(51, 36, C.violetD);

  /* ---------------- TERRITORY 6 — Coral grid (mid-right) ---------------- */
  rect(70, 28, 26, 24, C.cloud);
  border(70, 28, 26, 24, C.coral);
  diag(73, 31, 20, 18, C.coral, C.lilac);
  // smiley
  rect(78, 35, 2, 2, C.ink);
  rect(86, 35, 2, 2, C.ink);
  rect(78, 41, 10, 1, C.ink);
  set(77, 40, C.ink);
  set(88, 40, C.ink);

  /* ---------------- Skirmish — coral vs mint border ---------------- */
  [
    [68, 30, C.mint], [69, 31, C.coral], [68, 33, C.coral],
    [69, 35, C.mint], [68, 37, C.mint], [69, 39, C.coral],
    [68, 41, C.coral], [69, 43, C.mint], [68, 45, C.violet],
  ].forEach(([x, y, c]) => set(x as number, y as number, c as string));

  /* ---------------- TERRITORY 7 — Violet grand banner (bottom-left) ---------------- */
  rect(2, 60, 36, 34, C.violetD);
  border(2, 60, 36, 34, C.gold);
  // pixel-art "P"
  rect(8, 66, 4, 22, C.lilac);
  rect(12, 66, 10, 4, C.lilac);
  rect(20, 70, 4, 8, C.lilac);
  rect(12, 78, 10, 4, C.lilac);
  // small banner strip
  rect(6, 90, 28, 2, C.gold);
  // tiny bottom-left markers
  set(4, 92, C.lilac);
  set(5, 92, C.lilac);
  set(4, 91, C.lilac);

  /* ---------------- TERRITORY 8 — Sky flag (bottom-mid) ---------------- */
  rect(42, 60, 22, 18, C.skyL);
  border(42, 60, 22, 18, C.skyD);
  // stripes
  rect(45, 63, 16, 2, C.sky);
  rect(45, 67, 16, 2, C.sky);
  rect(45, 71, 16, 2, C.sky);
  // pole
  rect(43, 60, 1, 30, C.ink2);
  rect(43, 89, 5, 1, C.ink2);

  /* ---------------- Mini ad — bottom-mid ---------------- */
  rect(45, 80, 18, 6, C.ink);
  rect(46, 81, 16, 4, C.gold);
  rect(48, 82, 4, 2, C.ink);
  rect(53, 82, 3, 2, C.ink);
  rect(57, 82, 4, 2, C.ink);

  /* ---------------- TERRITORY 9 — Gold/coral sunset (bottom-right) ---------------- */
  rect(68, 60, 30, 34, C.gold);
  border(68, 60, 30, 34, C.goldD);
  // sun
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const dx = c - 3.5;
      const dy = r - 3.5;
      if (dx * dx + dy * dy <= 14) set(78 + c, 68 + r, C.coral);
    }
  }
  // horizon stripes
  rect(70, 80, 26, 1, C.violet);
  rect(70, 82, 26, 1, C.violetD);
  rect(70, 84, 26, 1, C.violet);
  // pixel boats
  rect(72, 87, 3, 1, C.ink2);
  set(73, 86, C.ink2);
  rect(82, 89, 4, 1, C.ink2);
  set(83, 88, C.ink2);
  rect(91, 87, 3, 1, C.ink2);

  /* ---------------- Scattered noise — looks "lived in" ---------------- */
  const noise: [number, number, string][] = [
    [40, 26, C.violet], [41, 27, C.pink], [55, 26, C.mint], [66, 27, C.coral],
    [3, 56, C.violet], [33, 55, C.sky], [40, 56, C.gold], [65, 55, C.coral],
    [38, 58, C.violetL], [67, 58, C.mint],
    [33, 25, C.gold], [34, 26, C.gold],
    [56, 56, C.pink], [57, 57, C.pink], [58, 56, C.violet],
    [40, 95, C.violet], [41, 96, C.pink], [42, 97, C.gold],
    [65, 96, C.violet], [66, 97, C.coral], [67, 96, C.gold],
    [29, 25, C.lavender], [30, 26, C.lavender],
    [97, 25, C.violet], [98, 26, C.pink],
    [1, 27, C.skyL], [98, 58, C.coral],
    [60, 24, C.gold], [61, 25, C.violet], [62, 24, C.pink],
    [27, 56, C.mint], [28, 57, C.violet], [29, 58, C.coral],
  ];
  noise.forEach(([x, y, c]) => set(x, y, c));

  return b;
}

/* Pulsing "live" cells — animated overlay */
const LIVE_CELLS: Array<[number, number, string]> = [
  [14, 4, C.gold], [42, 15, C.red], [50, 39, C.violetD],
  [78, 35, C.coral], [86, 35, C.coral], [22, 22, C.violet],
  [73, 19, C.gold], [12, 38, C.mint], [60, 70, C.coral],
  [83, 73, C.gold], [16, 86, C.gold], [54, 73, C.sky],
  [29, 9, C.pink], [69, 35, C.mint], [88, 7, C.gold],
];

function drawBaseBoard(ctx: CanvasRenderingContext2D, board: Cell[]) {
  // white canvas
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  // subtle off-white wash so board doesn't look paper-flat
  ctx.fillStyle = "rgba(245, 240, 252, 0.5)";
  ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  // painted cells
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const c = board[y * BOARD_SIZE + x];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // pixel grid overlay (very faint)
  ctx.fillStyle = C.grid;
  for (let i = 1; i < BOARD_SIZE; i++) {
    ctx.fillRect(i, 0, 0.06, BOARD_SIZE);
    ctx.fillRect(0, i, BOARD_SIZE, 0.06);
  }
  // every-10 stronger grid
  ctx.fillStyle = "rgba(15, 10, 30, 0.09)";
  for (let i = 10; i < BOARD_SIZE; i += 10) {
    ctx.fillRect(i, 0, 0.12, BOARD_SIZE);
    ctx.fillRect(0, i, BOARD_SIZE, 0.12);
  }
}

export const ScrollStoryCanvas = memo(function ScrollStoryCanvas({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const board = makeBoard();
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = BOARD_SIZE;
    baseCanvas.height = BOARD_SIZE;
    const baseCtx = baseCanvas.getContext("2d");
    if (!baseCtx) return;
    drawBaseBoard(baseCtx, board);

    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    ctx.drawImage(baseCanvas, 0, 0);

    for (let i = 0; i < LIVE_CELLS.length; i++) {
      const [x, y, color] = LIVE_CELLS[i];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = `${color}2e`;
      ctx.fillRect(x - 0.5, y - 0.5, 2, 2);
    }
  }, []);

  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-md bg-white isolate transform-gpu [backface-visibility:hidden]", className)}>
      <canvas
        ref={canvasRef}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated", transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        aria-hidden="true"
      />
      {/* subtle inner shadow for depth */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(15,10,30,0.08)]" />
      {/* very soft vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_55%,rgba(15,10,30,0.08)_100%)]" />
    </div>
  );
});
