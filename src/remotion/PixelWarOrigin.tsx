import React, {useState} from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BG = "#05030a";
const SURFACE = "rgba(255,255,255,0.045)";
const SURFACE_BORDER = "rgba(255,255,255,0.11)";
const PURPLE = "#8b5cf6";
const PURPLE_2 = "#a855f7";
const LIGHT_PURPLE = "#c084fc";
const DEEP_PURPLE = "#2e1065";
const BLUE = "#93c5fd";
const PINK = "#f0abfc";
const WHITE = "#f8f7ff";
const MUTED = "rgba(248,247,255,0.68)";
const QUIET = "rgba(248,247,255,0.44)";
const GRID = "rgba(255,255,255,0.06)";
const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
export const PIXEL_WAR_ORIGIN_FPS = 30;
export const PIXEL_WAR_ORIGIN_DURATION = 720;

const ORIGIN_SCENE_IDEA = 90;
const ORIGIN_SCENE_TOKEN = 120;
const ORIGIN_SCENE_CANVAS = 120;
const ORIGIN_SCENE_MECHANICS = 120;
const ORIGIN_SCENE_POINTS = 120;
const ORIGIN_SCENE_FINAL = 150;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const fadeIn = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: ease,
  });

const fadeOut = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [1, 0], {
    ...clamp,
    easing: ease,
  });

const smoothProgress = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: ease,
  });

const sceneOpacity = (
  frame: number,
  duration: number,
  fadeInFrames = 18,
  fadeOutFrames = 18,
  holdTail = 12,
) => {
  const fadeOutStart = duration - fadeOutFrames - holdTail;
  return Math.min(
    fadeIn(frame, 0, fadeInFrames),
    fadeOut(frame, fadeOutStart, fadeOutFrames),
  );
};

const seeded = (seed: number) => {
  const value = Math.sin(seed * 912.371) * 10000;
  return value - Math.floor(value);
};

function PixelParticles({
  count = 54,
  settle = 0,
}: {
  count?: number;
  settle?: number;
}) {
  const frame = useCurrentFrame();
  const colors = [PURPLE, LIGHT_PURPLE, BLUE, PINK, WHITE];

  return (
    <AbsoluteFill>
      {Array.from({length: count}, (_, i) => {
        const baseX = seeded(i + 3) * 1920;
        const baseY = seeded(i + 19) * 1080;
        const driftX = Math.sin((frame + i * 17) / (52 + (i % 7) * 4)) * (10 + (i % 4) * 4);
        const driftY = Math.cos((frame + i * 11) / (58 + (i % 5) * 5)) * (14 + (i % 3) * 5);
        const size = 4 + (i % 3) * 3;
        const opacity = 0.08 + (i % 5) * 0.03;
        const settleY = interpolate(settle, [0, 1], [0, 18 + (i % 6) * 2], clamp);
        const color = colors[i % colors.length];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: baseX + driftX,
              top: baseY + driftY + settleY,
              width: size,
              height: size,
              borderRadius: 2,
              opacity,
              background: color,
              boxShadow: `0 0 18px ${color}88`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

function SoftBackground({settle = 0}: {settle?: number}) {
  const frame = useCurrentFrame();
  const glowDrift = Math.sin(frame / 90) * 40;

  return (
    <AbsoluteFill style={{background: BG}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 46%, rgba(139,92,246,0.24), transparent 34%), radial-gradient(circle at 18% 80%, rgba(192,132,252,0.11), transparent 28%), radial-gradient(circle at 84% 18%, rgba(99,102,241,0.10), transparent 26%)",
          transform: `translate3d(${glowDrift}px, 0, 0)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.11,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <PixelParticles settle={settle} />
    </AbsoluteFill>
  );
}

function TextBlock({
  title,
  subtitle,
  opacity,
  scale = 1,
  align = "center",
  maxWidth = 1160,
}: {
  title: string;
  subtitle?: string;
  opacity: number;
  scale?: number;
  align?: "center" | "left";
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        textAlign: align,
        maxWidth,
        margin: align === "center" ? "0 auto" : "0",
      }}
    >
      <h1
        style={{
          margin: 0,
          color: WHITE,
          fontSize: 96,
          lineHeight: 0.94,
          fontWeight: 780,
          letterSpacing: 0,
        }}
      >
        {title}
      </h1>

      {subtitle ? (
        <p
          style={{
            margin: "28px auto 0",
            maxWidth: align === "center" ? 940 : 720,
            color: MUTED,
            fontSize: 32,
            lineHeight: 1.25,
            fontWeight: 420,
            letterSpacing: 0,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function TokenCard({progress}: {progress: number}) {
  const [showImg, setShowImg] = useState(true);
  const scale = interpolate(progress, [0, 1], [0.82, 1], clamp);
  const y = interpolate(progress, [0, 1], [36, 0], clamp);
  const rotate = interpolate(progress, [0, 1], [-10, 0], clamp);

  return (
    <div
      style={{
        width: 330,
        height: 330,
        borderRadius: 86,
        background: `radial-gradient(circle at 34% 24%, ${LIGHT_PURPLE}, ${PURPLE_2} 52%, ${DEEP_PURPLE})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: WHITE,
        fontSize: 76,
        fontWeight: 850,
        letterSpacing: 0,
        transform: `translateY(${y}px) rotate(${rotate}deg) scale(${scale})`,
        boxShadow:
          "0 0 120px rgba(139,92,246,0.48), inset 0 1px 0 rgba(255,255,255,0.26)",
        overflow: "hidden",
      }}
    >
      {showImg ? (
        <Img
          src={staticFile("pixl_mascot.png")}
          style={{
            width: 210,
            height: 210,
            objectFit: "contain",
            imageRendering: "pixelated",
            filter: "drop-shadow(0 24px 28px rgba(0,0,0,0.28))",
          }}
          onError={() => setShowImg(false)}
        />
      ) : (
        <div
          style={{
            width: 178,
            height: 178,
            position: "relative",
            filter: "drop-shadow(0 24px 28px rgba(0,0,0,0.28))",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "12%",
              borderRadius: 24,
              background: `linear-gradient(180deg, ${LIGHT_PURPLE}, ${PURPLE_2})`,
              boxShadow: "0 0 38px rgba(248,247,255,0.16)",
            }}
          />
          <div style={{position: "absolute", left: 42, top: 52, width: 22, height: 22, borderRadius: 7, background: WHITE}} />
          <div style={{position: "absolute", right: 42, top: 52, width: 22, height: 22, borderRadius: 7, background: WHITE}} />
          <div
            style={{
              position: "absolute",
              left: 50,
              right: 50,
              bottom: 48,
              height: 18,
              borderRadius: 999,
              background: "rgba(248,247,255,0.84)",
            }}
          />
        </div>
      )}
    </div>
  );
}

function PixelCluster({progress}: {progress: number}) {
  return (
    <div
      style={{
        width: 330,
        height: 330,
        display: "grid",
        gridTemplateColumns: "repeat(10, 1fr)",
        gap: 8,
      }}
    >
      {Array.from({length: 100}, (_, i) => {
        const visible = i / 100 < progress;
        return (
          <div
            key={i}
            style={{
              borderRadius: 5,
              background: visible ? LIGHT_PURPLE : GRID,
              boxShadow: visible ? "0 0 18px rgba(192,132,252,0.72)" : "none",
              transform: `scale(${visible ? 1 : 0.84})`,
              opacity: visible ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}

function CanvasGridVisual({
  progress = 1,
  conquest = 0,
  scale = 1,
  variant = "ambient",
}: {
  progress?: number;
  conquest?: number;
  scale?: number;
  variant?: "ambient" | "territory" | "conflict";
}) {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: 620,
        height: 620,
        display: "grid",
        gridTemplateColumns: "repeat(25, 1fr)",
        gridTemplateRows: "repeat(25, 1fr)",
        gap: 3,
        padding: 18,
        borderRadius: 30,
        background: SURFACE,
        border: `1px solid ${SURFACE_BORDER}`,
        boxShadow:
          "0 0 95px rgba(139,92,246,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
        transform: `scale(${scale})`,
      }}
    >
      {Array.from({length: 625}, (_, i) => {
        const x = i % 25;
        const y = Math.floor(i / 25);
        const pulseSeed = seeded(i + 7);
        const phase = Math.floor(pulseSeed * 72);
        const flickerWindow = ((frame + phase) % 54) < 8;
        const shimmerWindow = ((frame + Math.floor(seeded(i + 13) * 96)) % 82) < 10;
        const scatteredBase = seeded(i + 41) < progress * 0.24;
        const ambientSpark = variant === "ambient" && (scatteredBase || (flickerWindow && seeded(i + 31) > 0.58));
        const ambientHot = variant === "ambient" && shimmerWindow && seeded(i + 22) > 0.78;
        const baseLit =
          (variant === "territory" || variant === "conflict") &&
          (i % 21 === 0 || i % 34 === 0 || i / 625 < progress * 0.14);
        const territoryA = variant === "territory" && x > 5 && x < 14 && y > 6 && y < 16;
        const territoryB = variant === "territory" && x > 12 - conquest * 5 && x < 22 && y > 10 && y < 22;
        const territoryC = variant === "territory" && x > 7 && x < 13 && y > 16 && y < 22 && conquest > 0.52;
        const conflictA =
          variant === "conflict" &&
          x > 4 &&
          x < 15 &&
          y > 6 &&
          y < 17 &&
          seeded(i + 61) > 0.26 &&
          ((x + y + Math.floor(conquest * 7)) % 3 !== 0);
        const conflictB =
          variant === "conflict" &&
          x > 11 - conquest * 4.5 &&
          x < 22 &&
          y > 10 &&
          y < 22 &&
          seeded(i + 77) > 0.34 &&
          ((x * 2 + y + Math.floor(conquest * 9)) % 4 !== 1);
        const conflictC =
          variant === "conflict" &&
          x > 6 &&
          x < 14 &&
          y > 15 &&
          y < 22 &&
          conquest > 0.42 &&
          seeded(i + 93) > 0.55;
        const skirmish =
          variant === "conflict" &&
          flickerWindow &&
          seeded(i + 121) > 0.74 &&
          x > 8 &&
          x < 20 &&
          y > 8 &&
          y < 21;

        let color = GRID;
        if (baseLit) color = "rgba(192,132,252,0.36)";
        if (ambientSpark) color = seeded(i + 88) > 0.72 ? "rgba(192,132,252,0.72)" : "rgba(139,92,246,0.58)";
        if (ambientHot) color = seeded(i + 55) > 0.5 ? "rgba(147,197,253,0.84)" : "rgba(240,171,252,0.84)";
        if (territoryA) color = "#7c3aed";
        if (territoryB) color = "#c084fc";
        if (territoryC) color = "#93c5fd";
        if (conflictA) color = "#7c3aed";
        if (conflictB) color = "#c084fc";
        if (conflictC) color = "#93c5fd";
        if (skirmish) color = seeded(i + 133) > 0.5 ? "rgba(240,171,252,0.92)" : "rgba(147,197,253,0.92)";

        const active =
          territoryA ||
          territoryB ||
          territoryC ||
          conflictA ||
          conflictB ||
          conflictC ||
          skirmish ||
          baseLit ||
          ambientSpark ||
          ambientHot;
        const opacity =
          variant === "ambient"
            ? ambientHot
              ? 1
              : ambientSpark
                ? 0.64 + seeded(i + 101) * 0.26
                : 0.46
            : variant === "conflict"
              ? skirmish
                ? 1
                : conflictA || conflictB || conflictC
                  ? 0.82 + seeded(i + 151) * 0.14
                  : baseLit
                    ? 0.66
                    : 0.42
            : active
              ? 0.98
              : 0.54;

        return (
          <div
            key={i}
            style={{
              borderRadius: 3,
              background: color,
              opacity,
              transform: `scale(${
                variant === "ambient"
                  ? ambientHot
                    ? 1
                    : ambientSpark
                      ? 0.94
                      : 0.88
                  : variant === "conflict"
                    ? skirmish
                      ? 1
                      : conflictA || conflictB || conflictC
                        ? 0.96
                        : 0.9
                    : active
                      ? 1
                      : 0.92
              })`,
              boxShadow:
                territoryA || territoryB || territoryC
                  ? "0 0 10px rgba(192,132,252,0.32)"
                  : conflictA || conflictB || conflictC
                    ? "0 0 10px rgba(192,132,252,0.26)"
                    : skirmish
                      ? "0 0 12px rgba(192,132,252,0.4)"
                  : ambientHot
                    ? "0 0 12px rgba(192,132,252,0.42)"
                    : ambientSpark || baseLit
                      ? "0 0 8px rgba(192,132,252,0.22)"
                  : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function LeaderboardRows({
  points,
  opacity,
}: {
  points: [number, number, number];
  opacity: number;
}) {
  const rows: Array<[string, string, number]> = [
    ["01", "Top Territory", points[0]],
    ["02", "Rising Wallet", points[1]],
    ["03", "Pixel Raider", points[2]],
  ];

  return (
    <div
      style={{
        width: 920,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        opacity,
      }}
    >
      {rows.map(([rank, name, value], index) => (
        <div
          key={rank}
          style={{
            height: 88,
            borderRadius: 24,
            background: SURFACE,
            border: `1px solid ${SURFACE_BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 34px",
            color: WHITE,
            transform: `translateY(${interpolate(opacity, [0, 1], [18 + index * 6, 0], clamp)}px)`,
            boxShadow: rank === "01" ? "0 0 68px rgba(139,92,246,0.18)" : "none",
          }}
        >
          <div style={{display: "flex", gap: 28, alignItems: "center"}}>
            <span style={{color: LIGHT_PURPLE, fontSize: 24, fontWeight: 760}}>{rank}</span>
            <span style={{fontSize: 30, fontWeight: 680}}>{name}</span>
          </div>
          <span style={{fontSize: 30, fontWeight: 780}}>{value.toLocaleString()} pts</span>
        </div>
      ))}
    </div>
  );
}

function MascotOrFallback({opacity}: {opacity: number}) {
  const [showImg, setShowImg] = useState(true);

  return (
    <div
      style={{
        opacity,
        width: 220,
        height: 220,
        margin: "0 auto 28px",
        position: "relative",
      }}
    >
      {showImg ? (
        <Img
          src={staticFile("pixl_mascot.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            imageRendering: "pixelated",
            filter: "drop-shadow(0 26px 32px rgba(0,0,0,0.34))",
          }}
          onError={() => setShowImg(false)}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            filter: "drop-shadow(0 26px 32px rgba(0,0,0,0.34))",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "12%",
              borderRadius: 28,
              background: `linear-gradient(180deg, ${LIGHT_PURPLE}, ${PURPLE_2})`,
              boxShadow: "0 0 56px rgba(139,92,246,0.42)",
            }}
          />
          <div style={{position: "absolute", left: 56, top: 74, width: 26, height: 26, borderRadius: 8, background: WHITE}} />
          <div style={{position: "absolute", right: 56, top: 74, width: 26, height: 26, borderRadius: 8, background: WHITE}} />
          <div
            style={{
              position: "absolute",
              left: 70,
              right: 70,
              bottom: 70,
              height: 20,
              borderRadius: 999,
              background: "rgba(248,247,255,0.84)",
            }}
          />
        </div>
      )}
    </div>
  );
}

function SceneIdea() {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 120);
  const scale = interpolate(frame, [0, 120], [0.965, 1.02], clamp);

  return (
    <AbsoluteFill style={{opacity}}>
      <SoftBackground />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <TextBlock
          title="What if a token became a place?"
          subtitle="Not just a chart. A public board anyone can see."
          opacity={1}
          scale={scale}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SceneTokenToTerritory() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = sceneOpacity(frame, 150);
  const tokenSpring = spring({
    frame: frame - 8,
    fps,
    config: {damping: 18, stiffness: 105},
  });
  const pixelsProgress = smoothProgress(frame, 36, 56);
  const textOpacity = fadeIn(frame, 28, 30);
  const linkGlow = smoothProgress(frame, 26, 48);

  return (
    <AbsoluteFill style={{opacity}}>
      <SoftBackground />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <div style={{display: "flex", alignItems: "center", gap: 84}}>
          <TokenCard progress={tokenSpring} />
          <div
            style={{
              width: 170,
              height: 2,
              background: `linear-gradient(90deg, rgba(255,255,255,0.12), rgba(192,132,252,${0.3 + linkGlow * 0.5}), rgba(255,255,255,0.12))`,
              boxShadow: "0 0 30px rgba(139,92,246,0.3)",
              transform: `scaleX(${interpolate(linkGlow, [0, 1], [0.4, 1], clamp)})`,
            }}
          />
          <PixelCluster progress={pixelsProgress} />
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 118,
            textAlign: "center",
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              color: WHITE,
              fontSize: 56,
              fontWeight: 740,
              letterSpacing: 0,
            }}
          >
            $PIXL becomes territory
          </div>
          <div
            style={{
              marginTop: 16,
              color: MUTED,
              fontSize: 30,
            }}
          >
            0.01% supply = 1 pixel
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SceneCanvas() {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 150);
  const progress = smoothProgress(frame, 18, 54);
  const gridScale = interpolate(progress, [0, 1], [0.86, 1], clamp);

  return (
    <AbsoluteFill style={{opacity}}>
      <SoftBackground />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <div style={{display: "flex", alignItems: "center", gap: 94}}>
          <CanvasGridVisual progress={progress} scale={gridScale} variant="ambient" />
          <div style={{width: 610}}>
            <h2
              style={{
                margin: 0,
                color: WHITE,
                fontSize: 82,
                lineHeight: 0.94,
                fontWeight: 780,
                letterSpacing: 0,
              }}
            >
              100 × 100
              <br />
              10,000 public pixels
            </h2>
            <p
              style={{
                marginTop: 28,
                color: MUTED,
                fontSize: 32,
                lineHeight: 1.28,
              }}
            >
              A shared board where every wallet can be seen.
            </p>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SceneMechanics() {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 150);
  const conquest = smoothProgress(frame, 30, 58);

  return (
    <AbsoluteFill style={{opacity}}>
      <SoftBackground />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <div style={{display: "flex", alignItems: "center", gap: 94}}>
          <div style={{width: 570}}>
            <h2
              style={{
                margin: 0,
                color: WHITE,
                fontSize: 82,
                lineHeight: 0.94,
                fontWeight: 780,
                letterSpacing: 0,
              }}
            >
              Paint.
              <br />
              Defend.
              <br />
              Conquer.
            </h2>
            <p
              style={{
                marginTop: 30,
                color: MUTED,
                fontSize: 31,
                lineHeight: 1.3,
              }}
            >
              More $PIXL means more territory capacity.
            </p>
          </div>
          <CanvasGridVisual conquest={conquest} variant="conflict" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function ScenePoints() {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 150);
  const rowsOpacity = fadeIn(frame, 34, 28);
  const glowProgress = smoothProgress(frame, 22, 76);
  const p1 = Math.floor(interpolate(frame, [34, 118], [0, 8420], clamp));
  const p2 = Math.floor(interpolate(frame, [44, 118], [0, 6310], clamp));
  const p3 = Math.floor(interpolate(frame, [54, 118], [0, 4985], clamp));

  return (
    <AbsoluteFill style={{opacity}}>
      <SoftBackground />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 180,
          height: 240,
          opacity: 0.2 + glowProgress * 0.16,
          background: "radial-gradient(circle at 50% 60%, rgba(139,92,246,0.34), transparent 42%)",
        }}
      />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <div style={{textAlign: "center", marginBottom: 64}}>
          <h2
            style={{
              margin: 0,
              color: WHITE,
              fontSize: 82,
              lineHeight: 0.95,
              fontWeight: 780,
              letterSpacing: 0,
            }}
          >
            Territory earns points
          </h2>
          <p
            style={{
              color: MUTED,
              fontSize: 31,
              marginTop: 24,
            }}
          >
            Points become status, ranking and visibility.
          </p>
        </div>
        <LeaderboardRows points={[p1, p2, p3]} opacity={rowsOpacity} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SceneFinal() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = fadeIn(frame, 0, 28);
  const titleSpring = spring({
    frame: frame - 8,
    fps,
    config: {damping: 18, stiffness: 90},
  });
  const scale = interpolate(titleSpring, [0, 1], [0.9, 1], clamp);
  const settle = smoothProgress(frame, 12, 90);

  return (
    <AbsoluteFill style={{opacity}}>
      <SoftBackground settle={settle} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 160,
          height: 440,
          opacity: 0.16 + settle * 0.16,
          background: "radial-gradient(circle at 50% 42%, rgba(139,92,246,0.34), transparent 42%)",
        }}
      />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", textAlign: "center"}}>
        <div
          style={{
            transform: `scale(${scale})`,
          }}
        >
          <MascotOrFallback opacity={fadeIn(frame, 0, 22)} />
          <h1
            style={{
              margin: 0,
              color: WHITE,
              fontSize: 116,
              lineHeight: 0.9,
              fontWeight: 850,
              letterSpacing: 0,
            }}
          >
            Enter the
            <br />
            Pixel War
          </h1>
          <p
            style={{
              marginTop: 34,
              color: MUTED,
              fontSize: 32,
              letterSpacing: 0,
            }}
          >
            Buy $PIXL. Claim territory. Climb the board.
          </p>
          <div
            style={{
              marginTop: 32,
              color: QUIET,
              fontSize: 22,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            pixelwarcoin.com
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const PixelWarOrigin: React.FC = () => {
  return (
    <AbsoluteFill style={{background: BG, fontFamily: FONT}}>
      <Sequence from={0} durationInFrames={120}>
        <SceneIdea />
      </Sequence>

      <Sequence from={120} durationInFrames={150}>
        <SceneTokenToTerritory />
      </Sequence>

      <Sequence from={270} durationInFrames={150}>
        <SceneCanvas />
      </Sequence>

      <Sequence from={420} durationInFrames={150}>
        <SceneMechanics />
      </Sequence>

      <Sequence from={570} durationInFrames={150}>
        <ScenePoints />
      </Sequence>

      <Sequence from={720} durationInFrames={180}>
        <SceneFinal />
      </Sequence>
    </AbsoluteFill>
  );
};
