import { cn } from "@/lib/utils";

export type PixlMood = "idle" | "wave" | "paint" | "sleep" | "cheer" | "shock";

interface Props {
  mood?: PixlMood;
  size?: number;
  className?: string;
}

/**
 * PIXL — the project's pixel-art mascot.
 *
 * Built as a 16×16 SVG of crisp pixels so it can be scaled freely without
 * blurring. The mood prop swaps the eyes / mouth / accessory layer.
 */
export function PixlMascot({ mood = "idle", size = 80, className }: Props) {
  // 16x16 grid, each cell is 1 unit. Body is a chunky rounded blob.
  const eye = (cx: number, cy: number) => {
    if (mood === "sleep") {
      return <rect key={`${cx}-${cy}`} x={cx - 1.5} y={cy} width={3} height={0.7} fill="#0a0a14" />;
    }
    if (mood === "shock") {
      return (
        <g key={`${cx}-${cy}`}>
          <rect x={cx - 1.5} y={cy - 1.5} width={3} height={3} fill="#fff" />
          <rect x={cx - 0.5} y={cy - 0.5} width={1} height={1} fill="#0a0a14" />
        </g>
      );
    }
    if (mood === "cheer") {
      // ^ ^ shape
      return (
        <g key={`${cx}-${cy}`} stroke="#0a0a14" strokeWidth={0.7} fill="none" strokeLinecap="square">
          <path d={`M${cx - 1.2} ${cy + 0.4} L${cx} ${cy - 0.8} L${cx + 1.2} ${cy + 0.4}`} />
        </g>
      );
    }
    return (
      <g key={`${cx}-${cy}`} className={mood === "idle" ? "animate-blink" : ""}>
        <rect x={cx - 1} y={cy - 1} width={2} height={2} fill="#fff" />
        <rect x={cx} y={cy - 0.5} width={0.8} height={0.8} fill="#0a0a14" />
      </g>
    );
  };

  const mouth = () => {
    if (mood === "sleep") {
      // small "z"
      return (
        <text x={11.5} y={6.5} fontSize="2" fill="#fff" fontFamily="monospace">z</text>
      );
    }
    if (mood === "cheer") {
      return <rect x={7} y={11.2} width={2} height={1} rx={0.5} fill="#0a0a14" />;
    }
    if (mood === "shock") {
      return <rect x={7.3} y={11} width={1.4} height={1.6} fill="#0a0a14" />;
    }
    if (mood === "paint") {
      return <path d="M6.5 10.8 Q8 12.3 9.5 10.8" stroke="#0a0a14" strokeWidth={0.6} fill="none" strokeLinecap="round" />;
    }
    return <path d="M6.5 10.8 Q8 11.8 9.5 10.8" stroke="#0a0a14" strokeWidth={0.6} fill="none" strokeLinecap="round" />;
  };

  return (
    <div
      className={cn("relative inline-block pixelated", className)}
      style={{ width: size, height: size }}
      aria-label={`PIXL mascot (${mood})`}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className={cn(mood === "idle" && "animate-float-soft")}
      >
        {/* glow halo */}
        <defs>
          <radialGradient id="pixl-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff2d75" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#9d4dff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#9d4dff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pixl-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff5fae" />
            <stop offset="55%" stopColor="#9d4dff" />
            <stop offset="100%" stopColor="#3a8cff" />
          </linearGradient>
        </defs>
        <circle cx={8} cy={8} r={9} fill="url(#pixl-glow)" />

        {/* antenna */}
        <rect x={7.6} y={1} width={0.8} height={2} fill="#9d4dff" />
        <rect x={7.2} y={0.4} width={1.6} height={1} fill="#fff03a" />

        {/* body — chunky pixel blob (rounded square corners) */}
        <g fill="url(#pixl-body)">
          <rect x={3} y={4} width={10} height={9} />
          <rect x={2} y={5} width={1} height={7} />
          <rect x={13} y={5} width={1} height={7} />
          <rect x={4} y={3} width={8} height={1} />
          <rect x={4} y={13} width={8} height={1} />
        </g>
        {/* highlight */}
        <rect x={4} y={5} width={2} height={1} fill="#fff" opacity={0.35} />
        <rect x={4} y={6} width={1} height={1} fill="#fff" opacity={0.2} />

        {/* cheeks */}
        <rect x={4} y={9} width={1.4} height={1} fill="#ff2d75" opacity={0.7} />
        <rect x={10.6} y={9} width={1.4} height={1} fill="#ff2d75" opacity={0.7} />

        {/* eyes */}
        {eye(6, 8)}
        {eye(10, 8)}

        {/* mouth */}
        {mouth()}

        {/* feet */}
        <rect x={5} y={14} width={2} height={1} fill="#0a0a14" />
        <rect x={9} y={14} width={2} height={1} fill="#0a0a14" />

        {/* paint splat (paint mood) */}
        {mood === "paint" && (
          <g>
            <rect x={13} y={6} width={1.5} height={1.5} fill="#3affb5" />
            <rect x={14.2} y={5} width={0.8} height={0.8} fill="#fff03a" />
            <rect x={1} y={9} width={1.2} height={1.2} fill="#00f0ff" />
          </g>
        )}
      </svg>

      {mood === "wave" && (
        <div
          className="absolute animate-wave"
          style={{ right: -size * 0.18, top: size * 0.3, width: size * 0.3, height: size * 0.3 }}
        >
          <svg viewBox="0 0 8 8" width="100%" height="100%" shapeRendering="crispEdges">
            <rect x={2} y={1} width={4} height={5} fill="#ff5fae" />
            <rect x={1} y={2} width={1} height={3} fill="#ff5fae" />
            <rect x={6} y={2} width={1} height={3} fill="#ff5fae" />
            <rect x={3} y={6} width={2} height={1} fill="#ff5fae" />
          </svg>
        </div>
      )}
    </div>
  );
}
