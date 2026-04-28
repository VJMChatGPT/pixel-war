import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const PIXL_LAUNCH_FPS = 30;
export const PIXL_LAUNCH_DURATION = 420;

const COLORS = {
  ink: "#07070b",
  panel: "#101018",
  panelSoft: "#171724",
  line: "rgba(255,255,255,0.12)",
  text: "#f7f4ff",
  muted: "#a6a0b8",
  purple: "#8b5cf6",
  purpleSoft: "#c4b5fd",
  cyan: "#67e8f9",
  red: "#fb7185",
  gold: "#f8d66d",
  green: "#74e2a7",
  canvas: "#fbfbfd",
  grid: "#e5e7ee",
};

const COPY = {
  hook: "Own the canvas.",
  territory: "Tokens become territory.",
  battle: "Every pixel is public.",
  cta: "Connect. Paint. Dominate.",
};

type Pixel = {
  x: number;
  y: number;
  color: string;
  delay: number;
  owner: number;
};

const palette = [COLORS.purple, COLORS.cyan, COLORS.red, COLORS.gold, COLORS.green, "#f472b6", "#60a5fa"];

const rand = (seed: number) => {
  const value = Math.sin(seed * 999.73) * 10000;
  return value - Math.floor(value);
};

const makePixelAction = (count: number): Pixel[] =>
  Array.from({length: count}, (_, i) => ({
    x: Math.floor(rand(i + 1) * 100),
    y: Math.floor(rand(i + 24) * 100),
    color: palette[Math.floor(rand(i + 70) * palette.length)],
    delay: Math.floor(rand(i + 130) * 110),
    owner: Math.floor(rand(i + 220) * 4),
  }));

const pixelAction = makePixelAction(520);

const ownerBlocks = [
  {x: 8, y: 12, w: 19, h: 16, color: COLORS.purple, label: "0xA7...91"},
  {x: 59, y: 11, w: 25, h: 19, color: COLORS.cyan, label: "0x41...E0"},
  {x: 15, y: 57, w: 31, h: 22, color: COLORS.red, label: "0xC9...5B"},
  {x: 54, y: 58, w: 34, h: 27, color: COLORS.gold, label: "0x02...77"},
];

const sec = (seconds: number, fps: number) => seconds * fps;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const sceneText: React.CSSProperties = {
  color: COLORS.text,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 0.95,
};

export const PixlLaunchVideo = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const cameraPunch = interpolate(frame, [0, 20, 280, 360], [1.08, 1, 1, 0.92], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink, overflow: "hidden"}}>
      <PremiumBackground />
      <BrandBar />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${cameraPunch})`,
          transformOrigin: "50% 48%",
        }}
      >
        <CanvasStage />
      </div>

      <Sequence from={0} durationInFrames={sec(2.4, fps)} premountFor={sec(0.5, fps)}>
        <HookScene />
      </Sequence>
      <Sequence from={sec(2.0, fps)} durationInFrames={sec(3.3, fps)} premountFor={sec(0.5, fps)}>
        <OwnershipScene />
      </Sequence>
      <Sequence from={sec(5.0, fps)} durationInFrames={sec(4.6, fps)} premountFor={sec(0.5, fps)}>
        <BattleScene />
      </Sequence>
      <Sequence from={sec(9.5, fps)} durationInFrames={sec(4.5, fps)} premountFor={sec(0.5, fps)}>
        <FinalScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const PremiumBackground = () => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, PIXL_LAUNCH_DURATION], [-420, 1380], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 18%, rgba(139,92,246,0.20), transparent 30%), linear-gradient(180deg, #0d0d14 0%, #07070b 58%, #050507 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: 0,
          width: 260,
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.055), transparent)",
          transform: "skewX(-12deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 34,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 36,
          boxShadow: "inset 0 0 80px rgba(255,255,255,0.025)",
        }}
      />
    </AbsoluteFill>
  );
};

const BrandBar = () => {
  const frame = useCurrentFrame();
  const enter = spring({frame, fps: PIXL_LAUNCH_FPS, config: {damping: 18, stiffness: 110}});

  return (
    <div
      style={{
        position: "absolute",
        top: 66,
        left: 64,
        right: 64,
        height: 82,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [-20, 0])}px)`,
        zIndex: 10,
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 16}}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.cyan})`,
            boxShadow: "0 0 28px rgba(139,92,246,0.35)",
          }}
        />
        <div style={{...sceneText, fontSize: 38}}>PIXL</div>
      </div>
      <div
        style={{
          color: COLORS.muted,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 22,
          letterSpacing: 0,
        }}
      >
        LIVE TERRITORY
      </div>
    </div>
  );
};

const CanvasStage = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const boardEnter = spring({frame: frame - 2, fps, config: {damping: 20, stiffness: 130}});
  const tilt = interpolate(frame, [0, 34, 160, 270, 360], [-2.2, 0, -1, 1.4, 0], clamp);
  const y = interpolate(boardEnter, [0, 1], [120, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 265,
        height: 1040,
        borderRadius: 28,
        background: "linear-gradient(180deg, rgba(23,23,36,0.96), rgba(10,10,16,0.98))",
        border: `1px solid ${COLORS.line}`,
        boxShadow: "0 40px 120px rgba(0,0,0,0.55), 0 0 48px rgba(139,92,246,0.16)",
        transform: `translateY(${y}px) rotate(${tilt}deg)`,
        opacity: boardEnter,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 74,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          borderBottom: `1px solid ${COLORS.line}`,
          color: COLORS.muted,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 19,
        }}
      >
        <span>100 x 100 LIVE CANVAS</span>
        <span>{Math.min(10000, 6180 + frame * 7).toLocaleString("en-US")} / 10,000 CLAIMED</span>
      </div>
      <div style={{position: "absolute", left: 44, right: 44, top: 118, height: 820}}>
        <PixelCanvas />
      </div>
      <div
        style={{
          position: "absolute",
          left: 34,
          right: 34,
          bottom: 32,
          height: 50,
          display: "flex",
          gap: 10,
          alignItems: "center",
          color: COLORS.muted,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 18,
        }}
      >
        {ownerBlocks.map((owner) => (
          <div key={owner.label} style={{display: "flex", alignItems: "center", gap: 8}}>
            <span style={{width: 13, height: 13, background: owner.color, display: "block", borderRadius: 3}} />
            {owner.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const PixelCanvas = () => {
  const frame = useCurrentFrame();
  const battle = interpolate(frame, [145, 275], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const revealOwners = interpolate(frame, [55, 115], [0, 1], clamp);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        background: COLORS.canvas,
        border: "1px solid #d7d9e2",
        borderRadius: 8,
        boxShadow: "0 18px 50px rgba(0,0,0,0.36)",
        overflow: "hidden",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" shapeRendering="crispEdges">
        <defs>
          <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke={COLORS.grid} strokeWidth="0.06" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={COLORS.canvas} />
        <rect width="100" height="100" fill="url(#grid)" />
        {ownerBlocks.map((owner, index) => {
          const w = owner.w * interpolate(revealOwners, [0, 1], [0.16, 1]);
          const h = owner.h * interpolate(revealOwners, [0, 1], [0.16, 1]);
          const pulse = 0.7 + 0.3 * Math.sin((frame + index * 9) / 9);
          return (
            <g key={owner.label} opacity={0.2 + revealOwners * 0.76}>
              <rect
                x={owner.x}
                y={owner.y}
                width={w + battle * (index % 2 === 0 ? 8 : -5)}
                height={h + battle * (index % 2 === 1 ? 8 : -4)}
                fill={owner.color}
                opacity={0.68}
              />
              <rect
                x={owner.x}
                y={owner.y}
                width={w + battle * (index % 2 === 0 ? 8 : -5)}
                height={h + battle * (index % 2 === 1 ? 8 : -4)}
                fill="none"
                stroke={owner.color}
                strokeWidth={0.55 + pulse * 0.25}
              />
            </g>
          );
        })}
        {pixelAction.map((pixel, index) => {
          const flicker = (frame + pixel.delay) % (10 + (index % 8));
          const opacity = flicker < 4 ? 1 : 0.28;
          const active = frame > pixel.delay * 0.65 || frame < 70;
          const takeover = frame > 170 + (index % 70);
          const color = takeover && index % 5 === 0 ? ownerBlocks[pixel.owner].color : pixel.color;
          return active ? (
            <rect key={`${pixel.x}-${pixel.y}-${index}`} x={pixel.x} y={pixel.y} width="1" height="1" fill={color} opacity={opacity} />
          ) : null;
        })}
        <ConquestWave progress={battle} />
      </svg>
    </div>
  );
};

const ConquestWave = ({progress}: {progress: number}) => {
  const width = interpolate(progress, [0, 1], [0, 44]);
  const opacity = interpolate(progress, [0, 0.25, 1], [0, 0.9, 0.65], clamp);

  return (
    <g opacity={opacity}>
      <rect x={48} y={34} width={width} height={9} fill={COLORS.purple} />
      <rect x={45} y={43} width={width * 0.75} height={8} fill={COLORS.purple} opacity={0.86} />
      <rect x={52} y={51} width={width * 0.62} height={10} fill={COLORS.purple} opacity={0.74} />
      <rect x={48 + width - 2} y={31} width={1} height={34} fill="#ffffff" opacity={0.88} />
    </g>
  );
};

const HookScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hit = spring({frame, fps, config: {damping: 13, stiffness: 210}});
  const exit = interpolate(frame, [52, 70], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        top: 1290,
        opacity: 1 - exit,
        transform: `translateY(${interpolate(hit, [0, 1], [70, 0]) + exit * 30}px)`,
      }}
    >
      <div style={{...sceneText, fontSize: 94, maxWidth: 760}}>{COPY.hook}</div>
      <div
        style={{
          marginTop: 20,
          width: 260,
          height: 5,
          background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.cyan})`,
        }}
      />
    </div>
  );
};

const OwnershipScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 145}});
  const line = interpolate(frame, [8, 54], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 1298,
          left: 70,
          right: 70,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [46, 0])}px)`,
        }}
      >
        <div style={{...sceneText, fontSize: 58}}>{COPY.territory}</div>
        <div style={{display: "flex", gap: 16, marginTop: 28}}>
          <OwnershipCard label="0.01%" value="1 pixel" color={COLORS.cyan} />
          <OwnershipCard label="100%" value="10,000 px" color={COLORS.purple} />
        </div>
      </div>
      <svg
        viewBox="0 0 1080 1920"
        style={{position: "absolute", inset: 0, opacity: 0.9}}
        fill="none"
        strokeLinecap="round"
      >
        <path
          d="M246 1390 C320 1180 390 1030 486 930"
          stroke={COLORS.cyan}
          strokeWidth="4"
          strokeDasharray={`${line * 500} 500`}
        />
        <path
          d="M710 1390 C750 1184 696 1056 642 856"
          stroke={COLORS.purpleSoft}
          strokeWidth="4"
          strokeDasharray={`${line * 560} 560`}
        />
      </svg>
    </AbsoluteFill>
  );
};

const OwnershipCard = ({label, value, color}: {label: string; value: string; color: string}) => {
  return (
    <div
      style={{
        flex: 1,
        height: 122,
        borderRadius: 16,
        background: "rgba(14,14,22,0.88)",
        border: `1px solid ${COLORS.line}`,
        padding: "22px 24px",
        boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
      }}
    >
      <div style={{fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color, fontSize: 30, fontWeight: 800}}>{label}</div>
      <div style={{...sceneText, fontSize: 36, marginTop: 10}}>{value}</div>
    </div>
  );
};

const BattleScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: frame - 4, fps, config: {damping: 15, stiffness: 180}});
  const count = Math.floor(interpolate(frame, [0, 112], [12, 247], clamp));

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 1332,
          left: 86,
          right: 86,
          opacity: interpolate(frame, [0, 12, 118, 134], [0, 1, 1, 0], clamp),
          transform: `scale(${interpolate(pop, [0, 1], [0.94, 1])})`,
        }}
      >
        <div style={{...sceneText, fontSize: 60}}>{COPY.battle}</div>
        <div
          style={{
            marginTop: 24,
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            color: COLORS.text,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 25,
            background: "rgba(14,14,22,0.86)",
            border: `1px solid ${COLORS.line}`,
            borderRadius: 999,
            padding: "13px 18px",
          }}
        >
          <span style={{width: 12, height: 12, borderRadius: 99, background: COLORS.red, boxShadow: `0 0 20px ${COLORS.red}`}} />
          {count} pixels flipped
        </div>
      </div>
      <BattleMarkers />
    </AbsoluteFill>
  );
};

const BattleMarkers = () => {
  const frame = useCurrentFrame();
  const markers = [
    {x: 680, y: 760, c: COLORS.purple, d: 0},
    {x: 430, y: 610, c: COLORS.cyan, d: 12},
    {x: 345, y: 970, c: COLORS.red, d: 21},
    {x: 718, y: 990, c: COLORS.gold, d: 30},
  ];

  return (
    <>
      {markers.map((marker) => {
        const p = interpolate(frame - marker.d, [0, 18, 42], [0, 1, 0], clamp);
        return (
          <div
            key={`${marker.x}-${marker.y}`}
            style={{
              position: "absolute",
              left: marker.x,
              top: marker.y,
              width: 76,
              height: 76,
              borderRadius: 12,
              border: `4px solid ${marker.c}`,
              opacity: p,
              transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.5, 1.35])})`,
              boxShadow: `0 0 38px ${marker.c}`,
            }}
          />
        );
      })}
    </>
  );
};

const FinalScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 17, stiffness: 128}});
  const mascotIn = spring({frame: frame - 22, fps, config: {damping: 14, stiffness: 145}});

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(7,7,11,${interpolate(frame, [0, 40], [0, 0.58], clamp)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 1210,
          left: 68,
          right: 68,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [70, 0])}px)`,
        }}
      >
        <div style={{...sceneText, fontSize: 126}}>PIXL</div>
        <div style={{...sceneText, fontSize: 48, color: COLORS.purpleSoft, marginTop: 4}}>{COPY.cta}</div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 52,
          top: 1096,
          opacity: mascotIn,
          transform: `translateY(${interpolate(mascotIn, [0, 1], [92, 0])}px) rotate(${interpolate(mascotIn, [0, 1], [7, -3])}deg)`,
        }}
      >
        <OctopusMascot size={265} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 68,
          right: 68,
          bottom: 96,
          height: 68,
          borderTop: `1px solid ${COLORS.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: COLORS.muted,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 21,
          opacity: interpolate(frame, [52, 78], [0, 1], clamp),
        }}
      >
        <span>100 x 100</span>
        <span>WALLET CONTROLLED</span>
        <span>LIVE ON X</span>
      </div>
    </AbsoluteFill>
  );
};

const OctopusMascot = ({size}: {size: number}) => {
  const frame = useCurrentFrame();
  const brushBob = Math.sin(frame / 8) * 2.5;

  return (
    <svg width={size} height={size} viewBox="0 0 240 240" fill="none">
      <defs>
        <radialGradient id="octoBody" cx="40%" cy="25%" r="78%">
          <stop offset="0%" stopColor="#efe7ff" />
          <stop offset="42%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
        <linearGradient id="brushWood" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f1c27d" />
          <stop offset="1" stopColor="#8a5a2b" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="198" rx="76" ry="18" fill="rgba(0,0,0,0.28)" />
      <path
        d="M57 116C57 62 84 29 121 29C161 29 185 62 185 115C185 146 172 164 148 170C139 172 127 168 120 168C111 168 102 172 91 170C69 166 57 147 57 116Z"
        fill="url(#octoBody)"
        stroke="#2b155f"
        strokeWidth="5"
      />
      <path d="M68 151C45 157 35 173 40 190C44 204 61 204 68 191C74 179 78 163 91 157" stroke="#7447d8" strokeWidth="18" strokeLinecap="round" />
      <path d="M95 163C76 176 75 196 87 204C99 212 113 199 108 184C105 174 105 167 116 162" stroke="#8b5cf6" strokeWidth="17" strokeLinecap="round" />
      <path d="M143 162C162 176 164 196 151 204C139 212 126 199 131 184C134 174 134 167 123 162" stroke="#8b5cf6" strokeWidth="17" strokeLinecap="round" />
      <path d="M172 151C195 157 205 173 200 190C196 204 179 204 172 191C166 179 162 163 149 157" stroke="#7447d8" strokeWidth="18" strokeLinecap="round" />
      <g transform={`translate(0 ${brushBob})`}>
        <path d="M42 176L92 132" stroke="url(#brushWood)" strokeWidth="8" strokeLinecap="round" />
        <path d="M88 128L99 119" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
        <path d="M99 119L111 108" stroke={COLORS.cyan} strokeWidth="12" strokeLinecap="round" />
        <path d="M196 176L146 132" stroke="url(#brushWood)" strokeWidth="8" strokeLinecap="round" />
        <path d="M150 128L139 119" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
        <path d="M139 119L127 108" stroke={COLORS.red} strokeWidth="12" strokeLinecap="round" />
      </g>
      <circle cx="96" cy="102" r="15" fill="#fff" />
      <circle cx="145" cy="102" r="15" fill="#fff" />
      <circle cx="101" cy="105" r="7" fill="#13091f" />
      <circle cx="140" cy="105" r="7" fill="#13091f" />
      <circle cx="104" cy="101" r="3" fill="#fff" />
      <circle cx="143" cy="101" r="3" fill="#fff" />
      <path d="M104 133C115 143 129 143 138 133" stroke="#210f3f" strokeWidth="6" strokeLinecap="round" />
      <circle cx="78" cy="125" r="8" fill="#f9a8d4" opacity="0.72" />
      <circle cx="164" cy="125" r="8" fill="#f9a8d4" opacity="0.72" />
    </svg>
  );
};
