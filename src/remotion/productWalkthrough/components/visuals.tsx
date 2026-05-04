import type {CSSProperties, ReactNode} from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {COLORS, PIXL_PALETTE, clamp, easeOut, popEase} from "../constants";
import {
  activityEvents,
  boardPixels,
  featuredWallet,
  leaderboard,
  promotedLeaderboard,
  territoryBlocks,
  userPaintPath,
} from "../mockData";
import {fade, monoStyle, textStyle} from "../primitives";

export type MascotMood = "normal" | "waving" | "happy" | "sleeping";

const mascotSrc: Record<MascotMood, string> = {
  normal: "assets/mascot/pixl-normal.png",
  waving: "assets/mascot/pixl-waving.png",
  happy: "assets/mascot/pixl-happy.png",
  sleeping: "assets/mascot/pixl-sleeping.png",
};

export const PremiumBackground = ({intensity = 1}: {intensity?: number}) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, 1620], [-360, 2280], clamp);
  const drift = Math.sin(frame / 95) * 22;

  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 54% 16%, rgba(138,77,255,0.24), transparent 28%), radial-gradient(circle at 13% 82%, rgba(255,111,174,0.13), transparent 32%), linear-gradient(180deg, #0b0913 0%, #05050a 66%, #030306 100%)",
          opacity: intensity,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          transform: `translate(${drift}px, ${drift * 0.35}px)`,
          opacity: 0.44,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: -120,
          width: 310,
          height: 1320,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.075), transparent)",
          transform: "skewX(-17deg)",
          filter: "blur(1px)",
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 28,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "inset 0 0 120px rgba(255,255,255,0.025)",
        }}
      />
    </AbsoluteFill>
  );
};

export const BrandBug = ({minimal = false}: {minimal?: boolean}) => (
  <div
    style={{
      position: "absolute",
      left: 62,
      top: 44,
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${COLORS.lavender}, ${COLORS.purple})`,
        boxShadow: "0 0 26px rgba(138,77,255,0.46)",
      }}
    />
    <div style={{...textStyle, fontWeight: 900, fontSize: minimal ? 30 : 38}}>PIXL</div>
    {!minimal && (
      <div
        style={{
          ...monoStyle,
          color: COLORS.quiet,
          fontSize: 13,
          textTransform: "uppercase",
          marginLeft: 8,
        }}
      >
        product walkthrough
      </div>
    )}
  </div>
);

export const SceneShell = ({
  children,
  label,
  progressLabel,
}: {
  children: ReactNode;
  label: string;
  progressLabel?: string;
}) => {
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 24);

  return (
    <AbsoluteFill style={{opacity: enter}}>
      <div
        style={{
          position: "absolute",
          top: 52,
          right: 62,
          display: "flex",
          gap: 14,
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 99,
            background: COLORS.lavender,
            boxShadow: `0 0 18px ${COLORS.lavender}`,
          }}
        />
        <span style={{...monoStyle, color: COLORS.muted, fontSize: 13, textTransform: "uppercase"}}>
          {label}
        </span>
        {progressLabel && (
          <span style={{...monoStyle, color: COLORS.quiet, fontSize: 13}}>
            {progressLabel}
          </span>
        )}
      </div>
      {children}
    </AbsoluteFill>
  );
};

export const MascotActor = ({
  mood = "normal",
  size = 160,
  x = 0,
  y = 0,
  rotate = 0,
  delay = 0,
  reactAt,
  glow = true,
}: {
  mood?: MascotMood;
  size?: number;
  x?: number;
  y?: number;
  rotate?: number;
  delay?: number;
  reactAt?: number;
  glow?: boolean;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: frame - delay, fps, config: {damping: 18, stiffness: 118}});
  const float = Math.sin((frame - delay) / 25) * 7;
  const breathe = 1 + Math.sin((frame - delay) / 38) * 0.018;
  const reaction = reactAt == null ? 0 : interpolate(frame - reactAt, [0, 9, 28], [0, 1, 0], clamp);
  const pop = interpolate(reaction, [0, 1], [1, 1.075], {easing: popEase});

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `translate(${x}px, ${y + interpolate(enter, [0, 1], [42, 0]) + float}px) rotate(${rotate}deg) scale(${breathe * pop})`,
        opacity: enter,
        position: "relative",
        transformOrigin: "50% 70%",
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            inset: "16%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(138,77,255,0.42), rgba(138,77,255,0) 68%)",
            filter: "blur(22px)",
            transform: "translateY(18%)",
          }}
        />
      )}
      <Img
        src={staticFile(mascotSrc[mood])}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          imageRendering: "pixelated",
          filter: "drop-shadow(0 26px 34px rgba(0,0,0,0.38))",
        }}
      />
    </div>
  );
};

export const GlassPanel = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div
    style={{
      border: `1px solid ${COLORS.border}`,
      background: "linear-gradient(180deg, rgba(24,21,37,0.92), rgba(10,9,18,0.94))",
      boxShadow: "0 34px 110px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const BrowserFrame = ({
  title = "pixelwarcoin.com",
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <GlassPanel
    style={{
      borderRadius: 22,
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        height: 58,
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px",
      }}
    >
      <div style={{display: "flex", gap: 8}}>
        {[COLORS.pink, COLORS.gold, COLORS.green].map((color) => (
          <span key={color} style={{width: 11, height: 11, borderRadius: 99, background: color, opacity: 0.86}} />
        ))}
      </div>
      <div
        style={{
          ...monoStyle,
          color: COLORS.muted,
          fontSize: 13,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 999,
          padding: "7px 18px",
          background: "rgba(255,255,255,0.035)",
        }}
      >
        {title}
      </div>
      <div style={{width: 58}} />
    </div>
    <div style={{position: "relative", height: "calc(100% - 58px)"}}>{children}</div>
  </GlassPanel>
);

export const PixelBoard = ({
  mode = "overview",
  progress = 1,
  activeColor = COLORS.purple,
  showCursor = false,
  showActivity = false,
  style,
}: {
  mode?: "overview" | "quiet" | "paint" | "battle";
  progress?: number;
  activeColor?: string;
  showCursor?: boolean;
  showActivity?: boolean;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const paintCount = Math.floor(interpolate(progress, [0, 1], [0, userPaintPath.length], clamp));
  const pulse = 0.7 + Math.sin(frame / 10) * 0.22;
  const current = userPaintPath[Math.min(userPaintPath.length - 1, Math.max(0, paintCount - 1))];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        background: COLORS.canvas,
        border: "1px solid rgba(20,16,34,0.16)",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.34)",
        ...style,
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" shapeRendering="crispEdges">
        <defs>
          <pattern id={`grid-${mode}`} width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke={COLORS.grid} strokeWidth="0.06" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={mode === "quiet" ? "#fff" : COLORS.canvas} />
        <rect width="100" height="100" fill={`url(#grid-${mode})`} opacity={mode === "quiet" ? 0.55 : 1} />
        {mode !== "quiet" &&
          territoryBlocks.map((block, index) => {
            const reveal = interpolate(progress, [0, 0.38 + index * 0.045, 0.7 + index * 0.035], [0.06, 0.06, 1], clamp);
            const fight = mode === "battle" ? interpolate(progress, [0.18, 1], [0, 1], clamp) : 0;
            return (
              <g key={block.owner} opacity={0.2 + reveal * 0.72}>
                <rect
                  x={block.x}
                  y={block.y}
                  width={block.w * reveal + fight * (index % 2 === 0 ? 5 : -3)}
                  height={block.h * reveal + fight * (index % 2 === 1 ? 4 : -2)}
                  fill={block.color}
                  opacity={0.72}
                />
                <rect
                  x={block.x}
                  y={block.y}
                  width={block.w * reveal + fight * (index % 2 === 0 ? 5 : -3)}
                  height={block.h * reveal + fight * (index % 2 === 1 ? 4 : -2)}
                  fill="none"
                  stroke={block.color}
                  strokeWidth={0.5 + pulse * 0.16}
                />
              </g>
            );
          })}
        {boardPixels.map((pixel, index) => {
          const visible =
            mode === "quiet"
              ? index % 19 === 0 && progress > 0.55
              : mode === "battle"
                ? frame > pixel.delay * 0.45
                : frame > pixel.delay || index < 260 * progress;
          if (!visible) return null;
          const flicker = (frame + pixel.delay) % (12 + (index % 5)) < 5 ? 1 : 0.5;
          return (
            <rect
              key={`${pixel.x}-${pixel.y}-${index}`}
              x={pixel.x}
              y={pixel.y}
              width="1"
              height="1"
              fill={pixel.color}
              opacity={mode === "quiet" ? 0.35 : flicker}
            />
          );
        })}
        {userPaintPath.slice(0, paintCount).map((pixel, index) => (
          <rect
            key={`${pixel.x}-${pixel.y}`}
            x={pixel.x}
            y={pixel.y}
            width="1"
            height="1"
            fill={activeColor}
            opacity={0.95}
          >
            <animate attributeName="opacity" values="1;0.72;1" dur={`${0.7 + index * 0.03}s`} repeatCount="indefinite" />
          </rect>
        ))}
        {mode === "battle" && (
          <g opacity={interpolate(progress, [0.2, 0.8], [0, 0.86], clamp)}>
            <rect x="44" y="42" width={interpolate(progress, [0.2, 1], [0, 27], clamp)} height="6" fill={COLORS.purple} />
            <rect x="47" y="49" width={interpolate(progress, [0.3, 1], [0, 24], clamp)} height="5" fill={COLORS.lavender} />
            <rect x="69" y="39" width="1" height="18" fill={COLORS.white} opacity={0.86} />
          </g>
        )}
      </svg>
      {showCursor && (
        <Cursor
          x={`${interpolate(progress, [0, 1], [42, current.x])}%`}
          y={`${interpolate(progress, [0, 1], [37, current.y])}%`}
          active={paintCount > 0}
        />
      )}
      {showActivity &&
        activityEvents.map((event) => {
          const p = interpolate(frame - event.delay, [0, 18, 86], [0, 1, 0], clamp);
          return (
            <div
              key={`${event.wallet}-${event.delay}`}
              style={{
                position: "absolute",
                left: event.x / 14,
                top: event.y / 10,
                opacity: p,
                transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.8, 1])})`,
              }}
            >
              <ActivityLabel color={event.color} label={event.label} wallet={event.wallet} />
            </div>
          );
        })}
    </div>
  );
};

export const Cursor = ({x, y, active = false}: {x: string; y: string; active?: boolean}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 38,
      height: 38,
      transform: "translate(-8px, -8px)",
      filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.3))",
    }}
  >
    <svg viewBox="0 0 34 34" width="34" height="34">
      <path d="M7 3L26 19L17 21L13 30L7 3Z" fill={COLORS.text} stroke={COLORS.ink} strokeWidth="2" />
    </svg>
    {active && (
      <span
        style={{
          position: "absolute",
          left: 18,
          top: 20,
          width: 18,
          height: 18,
          borderRadius: 6,
          border: `2px solid ${COLORS.purple}`,
          boxShadow: `0 0 22px ${COLORS.purple}`,
        }}
      />
    )}
  </div>
);

export const ActivityLabel = ({label, wallet, color}: {label: string; wallet: string; color: string}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 13px",
      borderRadius: 999,
      border: `1px solid ${color}88`,
      background: "rgba(8,7,14,0.78)",
      boxShadow: `0 0 28px ${color}44`,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{width: 9, height: 9, borderRadius: 99, background: color}} />
    <span style={{...monoStyle, fontSize: 13, color: COLORS.text, fontWeight: 800}}>{label}</span>
    <span style={{...monoStyle, fontSize: 12, color: COLORS.muted}}>{wallet}</span>
  </div>
);

export const WalletButtonMock = ({connected = false, large = false}: {connected?: boolean; large?: boolean}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      height: large ? 58 : 46,
      padding: large ? "0 24px" : "0 18px",
      borderRadius: 14,
      background: connected ? "rgba(126,227,173,0.13)" : `linear-gradient(120deg, ${COLORS.purple}, ${COLORS.lavender})`,
      border: connected ? "1px solid rgba(126,227,173,0.38)" : "1px solid rgba(255,255,255,0.14)",
      boxShadow: connected ? "0 0 34px rgba(126,227,173,0.18)" : "0 18px 44px rgba(138,77,255,0.34)",
      color: connected ? COLORS.green : COLORS.ink,
      ...textStyle,
      fontSize: large ? 18 : 15,
      fontWeight: 850,
    }}
  >
    <span style={{fontSize: large ? 22 : 18}}>{connected ? "✓" : "◈"}</span>
    {connected ? featuredWallet : "Connect Wallet"}
  </div>
);

export const WalletModalMock = ({progress}: {progress: number}) => {
  const phantom = interpolate(progress, [0.32, 0.55], [0, 1], {...clamp, easing: easeOut});
  const connected = progress > 0.62;

  return (
    <GlassPanel
      style={{
        width: 500,
        borderRadius: 28,
        padding: 26,
      }}
    >
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24}}>
        <div>
          <div style={{...textStyle, fontWeight: 850, fontSize: 30}}>Connect wallet</div>
          <div style={{...monoStyle, color: COLORS.muted, fontSize: 13, marginTop: 6}}>mocked video flow</div>
        </div>
        <div style={{width: 36, height: 36, borderRadius: 12, border: `1px solid ${COLORS.border}`, display: "grid", placeItems: "center", color: COLORS.muted}}>
          ×
        </div>
      </div>
      {[
        {name: "Phantom", hint: connected ? "Connected" : "Recommended", color: COLORS.purple},
        {name: "Solflare", hint: "Available", color: COLORS.gold},
        {name: "Backpack", hint: "Available", color: COLORS.blue},
      ].map((wallet, index) => {
        const selected = wallet.name === "Phantom";
        return (
          <div
            key={wallet.name}
            style={{
              height: 68,
              borderRadius: 18,
              border: selected ? `1px solid rgba(201,168,255,${0.28 + phantom * 0.42})` : `1px solid ${COLORS.border}`,
              background: selected ? `rgba(138,77,255,${0.06 + phantom * 0.12})` : "rgba(255,255,255,0.035)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 18px",
              marginTop: 12,
              transform: selected ? `scale(${1 + phantom * 0.018})` : "scale(1)",
              boxShadow: selected ? `0 0 ${phantom * 38}px rgba(138,77,255,0.28)` : "none",
              opacity: index === 0 ? 1 : 0.78,
            }}
          >
            <div style={{display: "flex", alignItems: "center", gap: 14}}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${wallet.color}, ${COLORS.panelLift})`,
                }}
              />
              <div style={{...textStyle, fontSize: 18, fontWeight: 780}}>{wallet.name}</div>
            </div>
            <div style={{...monoStyle, color: selected && connected ? COLORS.green : COLORS.muted, fontSize: 12}}>
              {wallet.hint}
            </div>
          </div>
        );
      })}
    </GlassPanel>
  );
};

export const AppChromeMock = ({progress = 1}: {progress?: number}) => (
  <BrowserFrame title="pixelwarcoin.com/canvas" style={{width: 1180, height: 690}}>
    <div style={{position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, padding: 22}}>
      <div>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
          <div>
            <div style={{...textStyle, fontWeight: 850, fontSize: 28}}>The Canvas</div>
            <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, marginTop: 4}}>100 x 100 board · live public territory</div>
          </div>
          <div style={{...monoStyle, color: COLORS.lavender, fontSize: 13, display: "flex", gap: 8, alignItems: "center"}}>
            <span style={{width: 7, height: 7, borderRadius: 99, background: COLORS.lavender, boxShadow: `0 0 14px ${COLORS.lavender}`}} />
            realtime
          </div>
        </div>
        <PixelBoard mode="overview" progress={progress} style={{height: 535, width: 535}} />
      </div>
      <div style={{display: "flex", flexDirection: "column", gap: 14}}>
        <GlassPanel style={{borderRadius: 18, padding: 18}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div>
              <div style={{...monoStyle, color: COLORS.muted, fontSize: 11, textTransform: "uppercase"}}>connected</div>
              <div style={{...monoStyle, color: COLORS.text, fontSize: 18, marginTop: 6}}>{featuredWallet}</div>
            </div>
            <MascotActor mood="happy" size={64} glow={false} delay={4} />
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18}}>
            <MetricMini label="allowed" value="64" color={COLORS.purple} />
            <MetricMini label="used" value="48" color={COLORS.lavender} />
          </div>
        </GlassPanel>
        <GlassPanel style={{borderRadius: 18, padding: 18}}>
          <div style={{...textStyle, fontWeight: 800, fontSize: 17, marginBottom: 14}}>Brush</div>
          <div style={{display: "flex", gap: 8, marginBottom: 14}}>
            {["1x1", "2x2", "3x3"].map((label, index) => (
              <span
                key={label}
                style={{
                  ...monoStyle,
                  padding: "9px 12px",
                  borderRadius: 10,
                  color: index === 1 ? COLORS.ink : COLORS.muted,
                  background: index === 1 ? COLORS.lavender : "rgba(255,255,255,0.045)",
                  border: `1px solid ${index === 1 ? COLORS.lavender : COLORS.border}`,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {label}
              </span>
            ))}
          </div>
          <ColorSwatches active={5} />
        </GlassPanel>
        <GlassPanel style={{borderRadius: 18, padding: 18, flex: 1}}>
          <div style={{...monoStyle, color: COLORS.muted, fontSize: 11, textTransform: "uppercase", marginBottom: 12}}>activity</div>
          {activityEvents.slice(0, 3).map((event) => (
            <div key={event.delay} style={{display: "flex", gap: 10, alignItems: "center", marginBottom: 13}}>
              <span style={{width: 9, height: 9, borderRadius: 99, background: event.color}} />
              <span style={{...monoStyle, color: COLORS.text, fontSize: 13}}>{event.wallet}</span>
              <span style={{...monoStyle, color: COLORS.quiet, fontSize: 12, marginLeft: "auto"}}>{event.label}</span>
            </div>
          ))}
        </GlassPanel>
      </div>
    </div>
  </BrowserFrame>
);

export const MetricMini = ({label, value, color}: {label: string; value: string; color: string}) => (
  <div style={{borderRadius: 14, border: `1px solid ${color}66`, background: `${color}18`, padding: 12}}>
    <div style={{...monoStyle, color, fontSize: 10, textTransform: "uppercase"}}>{label}</div>
    <div style={{...textStyle, color: COLORS.text, fontSize: 28, fontWeight: 900, marginTop: 4}}>{value}</div>
  </div>
);

export const ColorSwatches = ({active = 5}: {active?: number}) => (
  <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8}}>
    {PIXL_PALETTE.slice(0, 14).map((color, index) => (
      <span
        key={color}
        style={{
          height: 26,
          borderRadius: 7,
          background: color,
          border: index === active ? `3px solid ${COLORS.white}` : "1px solid rgba(255,255,255,0.24)",
          boxShadow: index === active ? `0 0 24px ${color}99` : "none",
        }}
      />
    ))}
  </div>
);

export const CapacityBars = ({progress}: {progress: number}) => {
  const rows = [
    {label: "12K PIXL", pixels: 12, width: 38, color: COLORS.lavender},
    {label: "48K PIXL", pixels: 48, width: 68, color: COLORS.purple},
    {label: "92K PIXL", pixels: 92, width: 92, color: COLORS.pink},
  ];
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 20}}>
      {rows.map((row, index) => {
        const p = interpolate(progress, [0.12 + index * 0.12, 0.52 + index * 0.12], [0, 1], {...clamp, easing: easeOut});
        return (
          <div key={row.label}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: 9}}>
              <span style={{...monoStyle, color: COLORS.muted, fontSize: 15}}>{row.label}</span>
              <span style={{...monoStyle, color: COLORS.text, fontSize: 15, fontWeight: 800}}>{Math.round(row.pixels * p)} paint capacity</span>
            </div>
            <div style={{height: 14, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden"}}>
              <div
                style={{
                  width: `${row.width * p}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${row.color}, ${COLORS.white})`,
                  boxShadow: `0 0 26px ${row.color}55`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const LeaderboardMock = ({promoted = false, progress = 1}: {promoted?: boolean; progress?: number}) => {
  const data = promoted ? promotedLeaderboard : leaderboard;
  return (
    <GlassPanel style={{borderRadius: 26, padding: 24, width: 660}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20}}>
        <div>
          <div style={{...textStyle, fontSize: 30, fontWeight: 900}}>Leaderboard</div>
          <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, marginTop: 5}}>pixels controlled · points earned</div>
        </div>
        <div style={{...monoStyle, color: COLORS.lavender, fontSize: 12, textTransform: "uppercase"}}>live ranking</div>
      </div>
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        {data.map((row, index) => {
          const enter = interpolate(progress, [index * 0.08, 0.38 + index * 0.08], [0, 1], {...clamp, easing: easeOut});
          const isUser = row.wallet === featuredWallet;
          return (
            <div
              key={`${row.wallet}-${row.rank}`}
              style={{
                height: 74,
                borderRadius: 18,
                border: isUser ? `1px solid ${COLORS.lavender}` : `1px solid ${COLORS.border}`,
                background: isUser ? "rgba(138,77,255,0.17)" : "rgba(255,255,255,0.035)",
                display: "grid",
                gridTemplateColumns: "64px 1fr 110px 110px",
                alignItems: "center",
                gap: 14,
                padding: "0 16px",
                opacity: enter,
                transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px) scale(${isUser && promoted ? 1.02 : 1})`,
                boxShadow: isUser ? "0 0 38px rgba(138,77,255,0.25)" : "none",
              }}
            >
              <div style={{...textStyle, fontWeight: 900, fontSize: 28, color: isUser ? COLORS.lavender : COLORS.muted}}>#{row.rank}</div>
              <div style={{display: "flex", alignItems: "center", gap: 12, minWidth: 0}}>
                <span style={{width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${row.color}, ${COLORS.panelLift})`}} />
                <span style={{...monoStyle, color: COLORS.text, fontSize: 16, fontWeight: 800}}>{row.wallet}</span>
              </div>
              <div style={{...monoStyle, color: COLORS.text, fontSize: 16, textAlign: "right"}}>{row.pixels} px</div>
              <div style={{...monoStyle, color: COLORS.muted, fontSize: 16, textAlign: "right"}}>{row.points}</div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
};

export const FeaturedAdSpotMock = ({
  compact = false,
  progress = 1,
}: {
  compact?: boolean;
  progress?: number;
}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(progress, [0, 1], [0, 1], {...clamp, easing: easeOut});
  const shimmer = 0.55 + Math.sin(frame / 22) * 0.12;
  const width = compact ? 520 : 780;
  const height = compact ? 300 : 430;

  return (
  <BrowserFrame title="pixelwarcoin.com" style={{width, height, borderRadius: compact ? 20 : 24}}>
      <div style={{position: "absolute", inset: 0, padding: compact ? 18 : 24}}>
        <div
          style={{
            height: compact ? 108 : 148,
            borderRadius: 22,
            border: `1px solid rgba(201,168,255,${0.3 + reveal * 0.3})`,
            background:
              "linear-gradient(135deg, rgba(138,77,255,0.28), rgba(255,111,174,0.18) 46%, rgba(255,255,255,0.06) 100%)",
            boxShadow: "0 24px 70px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)",
            padding: compact ? 16 : 22,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(110deg, transparent 12%, rgba(255,255,255,${shimmer * 0.18}) 42%, transparent 72%)`,
              transform: `translateX(${interpolate(reveal, [0, 1], [-40, 65], clamp)}%)`,
            }}
          />
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative"}}>
            <div>
              <div style={{...monoStyle, color: COLORS.lavender, fontSize: compact ? 11 : 12, textTransform: "uppercase"}}>
                featured placement
              </div>
              <div style={{...textStyle, fontSize: compact ? 24 : 32, fontWeight: 930, marginTop: 10}}>
                Top players earn a featured ad spot
              </div>
              <div style={{...textStyle, color: COLORS.muted, fontSize: compact ? 14 : 17, lineHeight: 1.4, marginTop: 10, maxWidth: compact ? 290 : 420}}>
                Win premium visibility on the Pixel War website.
              </div>
            </div>
            <div
              style={{
                ...monoStyle,
                color: COLORS.ink,
                fontSize: compact ? 10 : 12,
                fontWeight: 900,
                background: COLORS.lavender,
                borderRadius: 999,
                padding: compact ? "8px 12px" : "10px 14px",
              }}
            >
              winner spotlight
            </div>
          </div>
        </div>

        <div style={{display: "grid", gridTemplateColumns: compact ? "150px 1fr" : "180px 1fr", gap: compact ? 14 : 18, marginTop: compact ? 16 : 18}}>
          <div
            style={{
              borderRadius: 18,
              border: `1px solid ${COLORS.border}`,
              background: "rgba(255,255,255,0.04)",
              padding: compact ? 14 : 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{...monoStyle, color: COLORS.muted, fontSize: 10, textTransform: "uppercase"}}>winner identity</div>
              <div style={{marginTop: 14, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4}}>
                {Array.from({length: 25}, (_, index) => (
                  <span
                    key={index}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: 3,
                      background: [COLORS.purple, COLORS.lavender, COLORS.blue, COLORS.pink, COLORS.gold][index % 5],
                      opacity: index / 25 < 0.88 ? 0.95 : 0.18,
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{marginTop: 14}}>
              <div style={{...monoStyle, color: COLORS.text, fontSize: compact ? 12 : 13, fontWeight: 800}}>{featuredWallet}</div>
              <div style={{...monoStyle, color: COLORS.quiet, fontSize: compact ? 10 : 11, marginTop: 5}}>project: PIXL Alpha Guild</div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 18,
              border: `1px solid ${COLORS.border}`,
              background: "rgba(255,255,255,0.035)",
              padding: compact ? 14 : 18,
            }}
          >
            <div style={{...monoStyle, color: COLORS.muted, fontSize: 10, textTransform: "uppercase"}}>homepage promo slot</div>
            <div style={{display: "grid", gridTemplateColumns: compact ? "1fr" : "1.05fr 0.95fr", gap: 14, marginTop: 14}}>
              <div>
                <div style={{...textStyle, fontSize: compact ? 22 : 28, fontWeight: 930, lineHeight: 1}}>
                  Earn your place on the board
                  <br />
                  and on the site
                </div>
                <div style={{...textStyle, color: COLORS.muted, fontSize: compact ? 13 : 15, lineHeight: 1.45, marginTop: 12}}>
                  Featured winners can be promoted directly inside Pixel War with their identity, project and pixel style.
                </div>
                <div style={{display: "flex", gap: 10, marginTop: 16}}>
                  <div
                    style={{
                      ...textStyle,
                      height: compact ? 36 : 40,
                      borderRadius: 12,
                      padding: compact ? "0 14px" : "0 16px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: compact ? 13 : 14,
                      fontWeight: 850,
                      color: COLORS.ink,
                      background: `linear-gradient(120deg, ${COLORS.lavender}, ${COLORS.white})`,
                    }}
                  >
                    Featured winner
                  </div>
                  <div
                    style={{
                      ...monoStyle,
                      height: compact ? 36 : 40,
                      borderRadius: 12,
                      padding: compact ? "0 14px" : "0 16px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: compact ? 12 : 13,
                      color: COLORS.muted,
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    homepage visibility
                  </div>
                </div>
              </div>
              {!compact && (
                <div
                  style={{
                    borderRadius: 16,
                    background: "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(138,77,255,0.09))",
                    border: `1px solid ${COLORS.border}`,
                    padding: 14,
                  }}
                >
                  <div style={{...monoStyle, color: COLORS.muted, fontSize: 10, textTransform: "uppercase", marginBottom: 10}}>
                    spotlight preview
                  </div>
                  <PixelBoard mode="overview" progress={0.86} style={{width: 170, margin: "0 auto"}} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

export const PixelConfetti = ({count = 70, progress = 1}: {count?: number; progress?: number}) => (
  <>
    {Array.from({length: count}, (_, index) => {
      const seed = Math.sin(index * 99.17) * 10000;
      const x = (seed - Math.floor(seed)) * 1920;
      const ySeed = Math.sin(index * 41.73) * 10000;
      const sizeSeed = Math.sin(index * 13.37) * 10000;
      const y = interpolate(progress, [0, 1], [-60, 1140 + (ySeed - Math.floor(ySeed)) * 160], clamp);
      const size = 6 + (sizeSeed - Math.floor(sizeSeed)) * 10;
      const color = PIXL_PALETTE[index % PIXL_PALETTE.length];
      return (
        <span
          key={index}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            background: color,
            opacity: interpolate(progress, [0, 0.12, 0.82, 1], [0, 0.9, 0.8, 0], clamp),
            transform: `rotate(${progress * 360 + index * 17}deg)`,
            boxShadow: `0 0 12px ${color}55`,
          }}
        />
      );
    })}
  </>
);
