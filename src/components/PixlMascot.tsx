import { cn } from "@/lib/utils";

export type PixlMood = "idle" | "wave" | "paint" | "sleep" | "cheer" | "shock";

interface Props {
  mood?: PixlMood;
  size?: number;
  className?: string;
}

/**
 * PIXL — the project's pixel-art mascot: a cute little frog.
 *
 * Built as a 16×16 SVG of crisp pixels so it can be scaled freely without
 * blurring. The mood prop swaps the eyes / mouth / accessory layers.
 *
 * Color philosophy: violet/lavender body with green-purple cheek pads,
 * staying inside the Phantom-inspired palette without ever copying it.
 */
export function PixlMascot({ mood = "idle", size = 80, className }: Props) {
  // Eye renderer — handles all mood variants in one place.
  const eye = (cx: number, cy: number, key: string) => {
    if (mood === "sleep") {
      return (
        <rect key={key} x={cx - 1.5} y={cy + 0.2} width={3} height={0.7} fill="#1a0b2e" />
      );
    }
    if (mood === "shock") {
      return (
        <g key={key}>
          <rect x={cx - 1.5} y={cy - 1.5} width={3} height={3} fill="#fff" />
          <rect x={cx - 0.5} y={cy - 0.5} width={1} height={1} fill="#1a0b2e" />
        </g>
      );
    }
    if (mood === "cheer") {
      return (
        <g key={key} stroke="#1a0b2e" strokeWidth={0.7} fill="none" strokeLinecap="round">
          <path d={`M${cx - 1.2} ${cy + 0.4} L${cx} ${cy - 0.8} L${cx + 1.2} ${cy + 0.4}`} />
        </g>
      );
    }
    // idle / wave / paint — round eye bumps on top of the head with white sparkle
    return (
      <g key={key} className={mood === "idle" ? "animate-blink" : ""}>
        {/* eye bump (lighter green-violet) */}
        <rect x={cx - 1.6} y={cy - 2.2} width={3.2} height={2} fill="#c9a8ff" />
        <rect x={cx - 1.2} y={cy - 2.6} width={2.4} height={0.5} fill="#c9a8ff" />
        {/* iris */}
        <rect x={cx - 1} y={cy - 1.6} width={2} height={1.6} fill="#fff" />
        <rect x={cx - 0.4} y={cy - 1.2} width={1} height={1} fill="#1a0b2e" />
        {/* sparkle */}
        <rect x={cx - 0.7} y={cy - 1.5} width={0.4} height={0.4} fill="#fff" />
      </g>
    );
  };

  const mouth = () => {
    if (mood === "sleep") {
      return (
        <text x={11.2} y={7.5} fontSize="2.2" fill="#c9a8ff" fontFamily="monospace" fontWeight="bold">z</text>
      );
    }
    if (mood === "cheer") {
      // big open smile
      return (
        <g>
          <rect x={5.5} y={10.6} width={5} height={1.6} fill="#1a0b2e" rx={0.3} />
          <rect x={6} y={11.6} width={4} height={0.6} fill="#ff6fae" />
        </g>
      );
    }
    if (mood === "shock") {
      return <rect x={7} y={10.4} width={2} height={2} fill="#1a0b2e" />;
    }
    if (mood === "paint") {
      // tongue out
      return (
        <g>
          <path d="M5.5 10.8 Q8 12 10.5 10.8" stroke="#1a0b2e" strokeWidth={0.7} fill="none" strokeLinecap="round" />
          <rect x={8.5} y={11.4} width={1.6} height={1} fill="#ff5fae" />
          <rect x={9} y={12.2} width={1} height={0.6} fill="#ff5fae" />
        </g>
      );
    }
    // idle / wave — gentle wide frog smile
    return (
      <path
        d="M5.5 10.6 Q8 12 10.5 10.6"
        stroke="#1a0b2e"
        strokeWidth={0.7}
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div
      className={cn("relative inline-block pixelated", className)}
      style={{ width: size, height: size }}
      aria-label={`PIXL frog mascot (${mood})`}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className={cn(mood === "idle" && "animate-float-soft")}
      >
        <defs>
          <radialGradient id="frog-glow" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="#9d4dff" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#6b2dd1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6b2dd1" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="frog-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b48cff" />
            <stop offset="55%" stopColor="#8a4dff" />
            <stop offset="100%" stopColor="#5b2dba" />
          </linearGradient>
          <linearGradient id="frog-belly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8d4ff" />
            <stop offset="100%" stopColor="#c9a8ff" />
          </linearGradient>
        </defs>

        {/* glow halo */}
        <circle cx={8} cy={9} r={9} fill="url(#frog-glow)" />

        {/* === FROG BODY === */}
        {/* head — chunky rounded square */}
        <g fill="url(#frog-body)">
          {/* main head block */}
          <rect x={2} y={5} width={12} height={8} />
          {/* rounded corners (subtract by drawing bg) */}
          <rect x={3} y={4} width={10} height={1} />
          <rect x={4} y={3} width={8} height={1} />
          <rect x={3} y={13} width={10} height={1} />
        </g>

        {/* darker outline accents */}
        <g fill="#3d1d7a">
          <rect x={2} y={4} width={1} height={1} />
          <rect x={13} y={4} width={1} height={1} />
          <rect x={1} y={5} width={1} height={8} />
          <rect x={14} y={5} width={1} height={8} />
          <rect x={2} y={13} width={1} height={1} />
          <rect x={13} y={13} width={1} height={1} />
          <rect x={3} y={14} width={10} height={1} />
        </g>

        {/* belly oval (lighter) */}
        <g fill="url(#frog-belly)">
          <rect x={5} y={9} width={6} height={4} />
          <rect x={4} y={10} width={1} height={2} />
          <rect x={11} y={10} width={1} height={2} />
          <rect x={6} y={8} width={4} height={1} />
        </g>

        {/* highlight on head */}
        <rect x={4} y={5} width={2} height={1} fill="#fff" opacity={0.35} />
        <rect x={4} y={6} width={1} height={1} fill="#fff" opacity={0.18} />

        {/* cheeks (pink blush) */}
        <rect x={3.5} y={9} width={1.4} height={1} fill="#ff6fae" opacity={0.75} />
        <rect x={11.1} y={9} width={1.4} height={1} fill="#ff6fae" opacity={0.75} />

        {/* === EYES === */}
        {eye(5, 5, "left-eye")}
        {eye(11, 5, "right-eye")}
        {/* dark band between eyes for "frog" feel */}
        <rect x={6.5} y={4.4} width={3} height={0.4} fill="#3d1d7a" opacity={0.4} />

        {/* === MOUTH === */}
        {mouth()}

        {/* === FEET (webbed) === */}
        <g fill="#3d1d7a">
          <rect x={3} y={14} width={3} height={1} />
          <rect x={4} y={15} width={1} height={0.5} />
          <rect x={10} y={14} width={3} height={1} />
          <rect x={11} y={15} width={1} height={0.5} />
        </g>
        <g fill="#5b2dba">
          <rect x={3.2} y={14} width={2.6} height={0.4} />
          <rect x={10.2} y={14} width={2.6} height={0.4} />
        </g>

        {/* paint mood: paint splatters around */}
        {mood === "paint" && (
          <g>
            <rect x={13.5} y={6} width={1.5} height={1.5} fill="#a78bff" />
            <rect x={14.5} y={5} width={0.8} height={0.8} fill="#e8d4ff" />
            <rect x={0.5} y={9} width={1.2} height={1.2} fill="#c9a8ff" />
            <rect x={1} y={11} width={0.6} height={0.6} fill="#fff" />
          </g>
        )}

        {/* shock mood: sweat drop */}
        {mood === "shock" && (
          <g>
            <rect x={13} y={4} width={1} height={1.2} fill="#9bd9ff" />
            <rect x={13.2} y={3.4} width={0.6} height={0.6} fill="#9bd9ff" />
          </g>
        )}

        {/* sleep mood: night cap dots */}
        {mood === "sleep" && (
          <g opacity={0.7}>
            <rect x={13.2} y={2.4} width={1.4} height={1.4} fill="#c9a8ff" />
            <rect x={14.2} y={1} width={1} height={1} fill="#e8d4ff" />
          </g>
        )}
      </svg>

      {/* Waving hand for wave mood */}
      {mood === "wave" && (
        <div
          className="absolute animate-wave"
          style={{ right: -size * 0.16, top: size * 0.32, width: size * 0.28, height: size * 0.28 }}
        >
          <svg viewBox="0 0 8 8" width="100%" height="100%" shapeRendering="crispEdges">
            <rect x={2} y={1} width={4} height={5} fill="#a78bff" />
            <rect x={1} y={2} width={1} height={3} fill="#a78bff" />
            <rect x={6} y={2} width={1} height={3} fill="#a78bff" />
            <rect x={3} y={6} width={2} height={1} fill="#5b2dba" />
            <rect x={2} y={2} width={1} height={1} fill="#fff" opacity={0.5} />
          </svg>
        </div>
      )}
    </div>
  );
}
