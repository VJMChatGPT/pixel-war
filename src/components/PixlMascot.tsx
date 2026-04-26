import { cn } from "@/lib/utils";

export type PixlMood = "idle" | "wave" | "paint" | "sleep" | "cheer" | "shock";

interface Props {
  mood?: PixlMood;
  size?: number;
  className?: string;
}

/**
 * PIXL — pixel-art frog mascot.
 *
 * Built on a 32×32 grid as crisp <rect> pixels (shape-rendering: crispEdges)
 * so it scales freely. Cute, chunky frog with big expressive eyes and a
 * paintbrush held in one hand.
 */
export function PixlMascot({ mood = "idle", size = 80, className }: Props) {
  const OUTLINE = "#1a2e14";
  const BODY = "#7bc24a";
  const BODY_LIGHT = "#a3dc6e";
  const BODY_DARK = "#4f8a2b";
  const BELLY = "#e8f5c8";
  const BLUSH = "#ff8fb8";

  // 32x32 frog silhouette
  // o = outline, g = body, l = body light, d = body dark, B = belly, . = empty
  const map = [
    "................................",
    "................................",
    "..........oooo......oooo........",
    ".........ollllo....ollllo.......",
    "........olllllo....olllllo......",
    "........olllllo....olllllo......",
    "........ollllo......ollllo......",
    "......oogggggoooooooogggggoo....",
    ".....oggggggggggggggggggggggo...",
    "....ogggggggggggggggggggggggggo.",
    "...ogggggggggggggggggggggggggggo",
    "..ogggggggggggggggggggggggggggggo",
    "..ogglgggggggggggggggggggggglggo",
    "..oggllggggggggggggggggggggllggo",
    "..oggBBBBBBBBBBBBBBBBBBBBBBBBggo",
    "..ogBBBBBBBBBBBBBBBBBBBBBBBBBBgo",
    "...oBBBBBBBBBBBBBBBBBBBBBBBBBo..",
    "...oBBBBBBBBBBBBBBBBBBBBBBBBBo..",
    "....oBBBBBBBBBBBBBBBBBBBBBBBo...",
    ".....oBBBBBBBBBBBBBBBBBBBBBo....",
    "......ooBBBBBBBBBBBBBBBBBoo.....",
    "...ooooo oooooooooooooo ooooo...",
    "..oggggo................oggggo..",
    ".oggdggo................oggdggo.",
    ".oggdggo................oggdggo.",
    "..ogggo..................ogggo..",
    "...oo......................oo...",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ];

  const colorFor: Record<string, string | null> = {
    o: OUTLINE,
    g: BODY,
    l: BODY_LIGHT,
    d: BODY_DARK,
    B: BELLY,
    ".": null,
    " ": null,
  };

  const rects: JSX.Element[] = [];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const fill = colorFor[ch];
      if (!fill) continue;
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />,
      );
    }
  }

  const renderEyes = () => {
    if (mood === "sleep") {
      return (
        <g fill={OUTLINE}>
          <rect x={9} y={5} width={4} height={1} />
          <rect x={19} y={5} width={4} height={1} />
        </g>
      );
    }
    if (mood === "shock") {
      return (
        <g>
          <rect x={9} y={4} width={4} height={4} fill="#fff" />
          <rect x={10} y={5} width={2} height={2} fill={OUTLINE} />
          <rect x={19} y={4} width={4} height={4} fill="#fff" />
          <rect x={20} y={5} width={2} height={2} fill={OUTLINE} />
        </g>
      );
    }
    if (mood === "cheer") {
      return (
        <g fill={OUTLINE}>
          <rect x={9} y={6} width={1} height={1} />
          <rect x={10} y={5} width={1} height={1} />
          <rect x={11} y={4} width={1} height={1} />
          <rect x={12} y={5} width={1} height={1} />
          <rect x={19} y={6} width={1} height={1} />
          <rect x={20} y={5} width={1} height={1} />
          <rect x={21} y={4} width={1} height={1} />
          <rect x={22} y={5} width={1} height={1} />
        </g>
      );
    }
    // idle / wave / paint — big round frog eyes
    return (
      <g className={mood === "idle" ? "animate-blink" : ""} style={{ transformOrigin: "center" }}>
        <rect x={9} y={3} width={4} height={4} fill="#fff" />
        <rect x={19} y={3} width={4} height={4} fill="#fff" />
        <rect x={11} y={4} width={2} height={2} fill={OUTLINE} />
        <rect x={21} y={4} width={2} height={2} fill={OUTLINE} />
        <rect x={11} y={4} width={1} height={1} fill="#fff" />
        <rect x={21} y={4} width={1} height={1} fill="#fff" />
      </g>
    );
  };

  const renderMouth = () => {
    if (mood === "sleep") {
      return (
        <text x={24} y={11} fontSize="3" fill={BODY_LIGHT} fontFamily="monospace" fontWeight="bold">
          z
        </text>
      );
    }
    if (mood === "cheer") {
      return (
        <g>
          <rect x={13} y={13} width={6} height={2} fill={OUTLINE} />
          <rect x={14} y={15} width={4} height={1} fill="#ff6fae" />
        </g>
      );
    }
    if (mood === "shock") {
      return <rect x={14} y={13} width={4} height={3} fill={OUTLINE} />;
    }
    if (mood === "paint") {
      return (
        <g>
          <rect x={13} y={13} width={6} height={1} fill={OUTLINE} />
          <rect x={14} y={14} width={4} height={1} fill="#ff5fae" />
        </g>
      );
    }
    // idle / wave — small smile
    return (
      <g fill={OUTLINE}>
        <rect x={13} y={13} width={1} height={1} />
        <rect x={14} y={14} width={4} height={1} />
        <rect x={18} y={13} width={1} height={1} />
      </g>
    );
  };

  return (
    <div
      className={cn("relative inline-block pixelated", className)}
      style={{ width: size, height: size }}
      aria-label={`PIXL frog mascot (${mood})`}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className={cn(mood === "idle" && "animate-float-soft")}
      >
        <defs>
          <radialGradient id="frog-glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#a3dc6e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a3dc6e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={16} cy={16} r={16} fill="url(#frog-glow)" />

        {rects}

        {/* Cheeks */}
        <rect x={7} y={11} width={2} height={1} fill={BLUSH} opacity={0.7} />
        <rect x={23} y={11} width={2} height={1} fill={BLUSH} opacity={0.7} />

        {renderEyes()}
        {renderMouth()}

        {/* Paintbrush in right hand */}
        <g shapeRendering="crispEdges">
          <rect x={26} y={20} width={1} height={1} fill="#5a3a1a" />
          <rect x={27} y={19} width={1} height={1} fill="#7a5028" />
          <rect x={28} y={18} width={1} height={1} fill="#7a5028" />
          <rect x={29} y={17} width={1} height={1} fill="#9a6a38" />
          <rect x={29} y={16} width={1} height={1} fill="#c0c0c0" />
          <rect x={30} y={15} width={1} height={1} fill="#c0c0c0" />
          <rect x={30} y={14} width={2} height={1} fill={BODY} />
          <rect x={31} y={13} width={1} height={1} fill={BODY_LIGHT} />
          <rect x={29} y={14} width={1} height={1} fill={BODY_DARK} />
        </g>

        {mood === "paint" && (
          <g shapeRendering="crispEdges" opacity={0.9}>
            <rect x={2} y={24} width={2} height={2} fill="#ff6fae" />
            <rect x={28} y={26} width={2} height={2} fill="#9bd9ff" />
            <rect x={5} y={23} width={1} height={1} fill="#ffd16a" />
          </g>
        )}
        {mood === "shock" && (
          <g shapeRendering="crispEdges">
            <rect x={24} y={1} width={1} height={2} fill="#9bd9ff" />
            <rect x={23} y={2} width={3} height={1} fill="#9bd9ff" />
          </g>
        )}
        {mood === "cheer" && (
          <g shapeRendering="crispEdges" fill="#ffd16a">
            <rect x={3} y={3} width={1} height={1} />
            <rect x={28} y={2} width={1} height={1} />
            <rect x={6} y={1} width={1} height={1} />
          </g>
        )}
      </svg>

      {mood === "wave" && (
        <div
          className="absolute animate-wave"
          style={{
            left: -size * 0.05,
            top: size * 0.6,
            width: size * 0.22,
            height: size * 0.22,
            transformOrigin: "bottom right",
          }}
        >
          <svg viewBox="0 0 8 8" width="100%" height="100%" shapeRendering="crispEdges">
            <rect x={2} y={1} width={4} height={2} fill={BODY} />
            <rect x={3} y={3} width={2} height={3} fill={BODY} />
            <rect x={2} y={1} width={4} height={1} fill={OUTLINE} opacity={0.4} />
          </svg>
        </div>
      )}
    </div>
  );
}
