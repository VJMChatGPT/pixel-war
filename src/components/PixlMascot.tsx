import { cn } from "@/lib/utils";

export type PixlMood = "idle" | "wave" | "paint" | "sleep" | "cheer" | "shock";

interface Props {
  mood?: PixlMood;
  size?: number;
  className?: string;
}

/**
 * PIXL — pixel-art octopus mascot.
 *
 * Built on a 32×32 grid as crisp <rect> pixels (shape-rendering: crispEdges)
 * so it scales freely. The silhouette is an unmistakable octopus: domed head,
 * two large expressive eyes, and 8 visible tentacles fanning out, with one
 * tentacle holding a paintbrush.
 *
 * Mood prop changes the eyes / mouth / accessories without rebuilding the body.
 */
export function PixlMascot({ mood = "idle", size = 80, className }: Props) {
  // Color palette — restrained violet, dark outline.
  const OUTLINE = "#1a0f2e";
  const BODY = "#9576d6";
  const BODY_LIGHT = "#b89aee";
  const BODY_DARK = "#6f4fb8";
  const BELLY = "#e8dcff";
  const BLUSH = "#d98ab8";

  // Body silhouette as a 32x32 character map.
  // o = outline, b = body, l = body light, d = body dark, B = belly, . = empty
  const map = [
    "................................",
    "................................",
    "..........oooooooooo............",
    "........oollllllllllloo.........",
    ".......olllllllllllllllo........",
    "......olllllllllllllllllo.......",
    ".....obbbbbbbbbbbbbbbbbbbo......",
    ".....obbbbbbbbbbbbbbbbbbbo......",
    "....obbbbbbbbbbbbbbbbbbbbbo.....",
    "....obbbbbbbbbbbbbbbbbbbbbo.....",
    "....obbbbbbbbbbbbbbbbbbbbbo.....",
    "....obbbbBBBBBBBBBBBBBbbbbo.....",
    "....obbBBBBBBBBBBBBBBBBBBbo.....",
    ".....oBBBBBBBBBBBBBBBBBBBo......",
    "......oBBBBBBBBBBBBBBBBBo.......",
    ".....obBBBBBBBBBBBBBBBBBBo......",
    "....obbBBBBBBBBBBBBBBBBBBbo.....",
    "...obbbBdddBdddBdddBdddBbbbo....",
    "..obboobBdoBBdoBBdoBBdoBBoobbo..",
    ".oboo..oddo.odo.odo.odo.oo..oobo",
    "ob......oo...o...o...o...o....bo",
    ".o......................o....o..",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ];

  const colorFor: Record<string, string | null> = {
    o: OUTLINE,
    b: BODY,
    l: BODY_LIGHT,
    d: BODY_DARK,
    B: BELLY,
    ".": null,
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

  // Eyes
  const renderEyes = () => {
    if (mood === "sleep") {
      return (
        <g fill={OUTLINE}>
          <rect x={11} y={9} width={3} height={1} />
          <rect x={18} y={9} width={3} height={1} />
        </g>
      );
    }
    if (mood === "shock") {
      return (
        <g>
          <rect x={10} y={8} width={4} height={4} fill="#fff" />
          <rect x={11} y={9} width={2} height={2} fill={OUTLINE} />
          <rect x={18} y={8} width={4} height={4} fill="#fff" />
          <rect x={19} y={9} width={2} height={2} fill={OUTLINE} />
        </g>
      );
    }
    if (mood === "cheer") {
      return (
        <g fill={OUTLINE}>
          {/* ^ ^ closed happy eyes */}
          <rect x={10} y={10} width={1} height={1} />
          <rect x={11} y={9} width={1} height={1} />
          <rect x={12} y={10} width={1} height={1} />
          <rect x={13} y={11} width={1} height={1} />
          <rect x={9} y={11} width={1} height={1} />
          <rect x={18} y={10} width={1} height={1} />
          <rect x={19} y={9} width={1} height={1} />
          <rect x={20} y={10} width={1} height={1} />
          <rect x={21} y={11} width={1} height={1} />
          <rect x={17} y={11} width={1} height={1} />
        </g>
      );
    }
    // idle / wave / paint — round eyes with white sclera
    return (
      <g className={mood === "idle" ? "animate-blink" : ""} style={{ transformOrigin: "center" }}>
        {/* whites */}
        <rect x={9} y={8} width={5} height={5} fill="#fff" />
        <rect x={18} y={8} width={5} height={5} fill="#fff" />
        {/* outline */}
        <rect x={9} y={8} width={5} height={1} fill={OUTLINE} />
        <rect x={9} y={12} width={5} height={1} fill={OUTLINE} />
        <rect x={9} y={9} width={1} height={3} fill={OUTLINE} />
        <rect x={13} y={9} width={1} height={3} fill={OUTLINE} />
        <rect x={18} y={8} width={5} height={1} fill={OUTLINE} />
        <rect x={18} y={12} width={5} height={1} fill={OUTLINE} />
        <rect x={18} y={9} width={1} height={3} fill={OUTLINE} />
        <rect x={22} y={9} width={1} height={3} fill={OUTLINE} />
        {/* pupils */}
        <rect x={11} y={10} width={2} height={2} fill={OUTLINE} />
        <rect x={20} y={10} width={2} height={2} fill={OUTLINE} />
        {/* sparkle */}
        <rect x={11} y={10} width={1} height={1} fill="#fff" />
        <rect x={20} y={10} width={1} height={1} fill="#fff" />
      </g>
    );
  };

  // Mouth
  const renderMouth = () => {
    if (mood === "sleep") {
      return (
        <text
          x={24}
          y={7}
          fontSize="3"
          fill={BODY_LIGHT}
          fontFamily="monospace"
          fontWeight="bold"
        >
          z
        </text>
      );
    }
    if (mood === "cheer") {
      return (
        <g>
          <rect x={14} y={14} width={4} height={2} fill={OUTLINE} />
          <rect x={15} y={16} width={2} height={1} fill="#ff6fae" />
        </g>
      );
    }
    if (mood === "shock") {
      return <rect x={15} y={14} width={2} height={3} fill={OUTLINE} />;
    }
    if (mood === "paint") {
      return (
        <g>
          <rect x={14} y={14} width={4} height={1} fill={OUTLINE} />
          <rect x={15} y={15} width={2} height={1} fill="#ff5fae" />
        </g>
      );
    }
    // idle / wave — small smile
    return (
      <g fill={OUTLINE}>
        <rect x={14} y={14} width={1} height={1} />
        <rect x={15} y={15} width={2} height={1} />
        <rect x={17} y={14} width={1} height={1} />
      </g>
    );
  };

  return (
    <div
      className={cn("relative inline-block pixelated", className)}
      style={{ width: size, height: size }}
      aria-label={`PIXL octopus mascot (${mood})`}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className={cn(mood === "idle" && "animate-float-soft")}
      >
        {/* Soft halo */}
        <defs>
          <radialGradient id="octo-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#a78bff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a78bff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={16} cy={14} r={16} fill="url(#octo-glow)" />

        {/* Body silhouette */}
        {rects}

        {/* Cheeks */}
        <rect x={9} y={13} width={2} height={1} fill={BLUSH} opacity={0.7} />
        <rect x={21} y={13} width={2} height={1} fill={BLUSH} opacity={0.7} />

        {/* Face */}
        {renderEyes()}
        {renderMouth()}

        {/* Paintbrush held by rightmost tentacle (visible across all moods) */}
        {/* Handle */}
        <g shapeRendering="crispEdges">
          <rect x={26} y={14} width={1} height={1} fill="#5a3a1a" />
          <rect x={27} y={13} width={1} height={1} fill="#7a5028" />
          <rect x={28} y={12} width={1} height={1} fill="#7a5028" />
          <rect x={29} y={11} width={1} height={1} fill="#9a6a38" />
          {/* Ferrule */}
          <rect x={29} y={10} width={1} height={1} fill="#c0c0c0" />
          <rect x={30} y={9} width={1} height={1} fill="#c0c0c0" />
          {/* Bristles */}
          <rect x={30} y={8} width={2} height={1} fill={BODY} />
          <rect x={31} y={7} width={1} height={1} fill={BODY_LIGHT} />
          <rect x={29} y={8} width={1} height={1} fill={BODY_DARK} />
          {/* Outline accents on brush */}
          <rect x={30} y={9} width={2} height={1} fill={OUTLINE} opacity={0.25} />
        </g>

        {/* Mood accessories */}
        {mood === "paint" && (
          <g shapeRendering="crispEdges" opacity={0.9}>
            <rect x={2} y={20} width={2} height={2} fill="#ff6fae" />
            <rect x={28} y={22} width={2} height={2} fill="#9bd9ff" />
            <rect x={5} y={19} width={1} height={1} fill="#ffd16a" />
          </g>
        )}
        {mood === "shock" && (
          <g shapeRendering="crispEdges">
            <rect x={24} y={4} width={1} height={2} fill="#9bd9ff" />
            <rect x={23} y={5} width={3} height={1} fill="#9bd9ff" />
          </g>
        )}
        {mood === "cheer" && (
          <g shapeRendering="crispEdges" fill="#ffd16a">
            <rect x={3} y={6} width={1} height={1} />
            <rect x={28} y={4} width={1} height={1} />
            <rect x={6} y={3} width={1} height={1} />
          </g>
        )}
      </svg>

      {/* Wave hand for wave mood (a tentacle tip lifting up) */}
      {mood === "wave" && (
        <div
          className="absolute animate-wave"
          style={{
            left: -size * 0.05,
            top: size * 0.55,
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
