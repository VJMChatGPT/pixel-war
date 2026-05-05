import type {ReactNode} from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {COLORS, PIXL_PALETTE, clamp, easeInOut, easeOut} from "../constants";

type SceneMotionPreset = "hero" | "browser" | "focus" | "data" | "canvas" | "battle" | "status" | "reward" | "cta";
type MascotMood = "normal" | "waving" | "happy" | "sleeping";

type Point = {
  x: number;
  y: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TransitionEffect =
  | {type: "pixelSweep"; accent?: string}
  | {type: "spotlight"; origin?: Point; radius?: number}
  | {type: "mascotBridge"; mood?: MascotMood; start: Point; end: Point; size?: number}
  | {type: "cameraPush"; focus: Rect}
  | {type: "pixelDissolve"; origin: Rect}
  | {type: "cardMorph"; fromRect: Rect; toRect: Rect};

const sceneMotionPresets: Record<
  SceneMotionPreset,
  {
    enterX: number;
    enterY: number;
    enterScale: number;
    exitX: number;
    exitY: number;
    exitScale: number;
    blur: number;
  }
> = {
  hero: {enterX: 0, enterY: 30, enterScale: 1.04, exitX: -12, exitY: -16, exitScale: 1.03, blur: 12},
  browser: {enterX: 28, enterY: 14, enterScale: 0.985, exitX: -18, exitY: -10, exitScale: 1.025, blur: 10},
  focus: {enterX: 0, enterY: 18, enterScale: 1.025, exitX: -8, exitY: -18, exitScale: 1.04, blur: 10},
  data: {enterX: -18, enterY: 16, enterScale: 0.99, exitX: -16, exitY: -10, exitScale: 1.03, blur: 9},
  canvas: {enterX: 16, enterY: 18, enterScale: 0.985, exitX: -10, exitY: -10, exitScale: 1.035, blur: 8},
  battle: {enterX: 24, enterY: 12, enterScale: 0.99, exitX: -24, exitY: -8, exitScale: 1.03, blur: 9},
  status: {enterX: 20, enterY: 12, enterScale: 0.99, exitX: -12, exitY: -10, exitScale: 1.028, blur: 8},
  reward: {enterX: 0, enterY: 22, enterScale: 1.02, exitX: -14, exitY: -10, exitScale: 1.024, blur: 9},
  cta: {enterX: 0, enterY: 26, enterScale: 1.03, exitX: 0, exitY: 0, exitScale: 1, blur: 10},
};

const mascotSrc: Record<MascotMood, string> = {
  normal: "assets/mascot/pixl-normal.png",
  waving: "assets/mascot/pixl-waving.png",
  happy: "assets/mascot/pixl-happy.png",
  sleeping: "assets/mascot/pixl-sleeping.png",
};

const seeded = (seed: number) => {
  const value = Math.sin(seed * 913.173) * 10000;
  return value - Math.floor(value);
};

const mix = (start: number, end: number, amount: number) => start + (end - start) * amount;

const progressFromDuration = (frame: number, duration: number) =>
  interpolate(frame, [0, duration - 1], [0, 1], {...clamp, easing: easeInOut});

export const SceneFrame = ({
  from,
  duration,
  preset,
  children,
}: {
  from: number;
  duration: number;
  preset: SceneMotionPreset;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const presetConfig = sceneMotionPresets[preset];
  const enter = interpolate(local, [0, 22], [0, 1], {...clamp, easing: easeOut});
  const exit = interpolate(local, [duration - 22, duration], [0, 1], {...clamp, easing: easeInOut});
  const opacity =
    interpolate(local, [0, 12], [0, 1], {...clamp, easing: easeOut}) *
    interpolate(local, [duration - 12, duration], [1, 0], {...clamp, easing: easeInOut});
  const x =
    interpolate(enter, [0, 1], [presetConfig.enterX, 0], clamp) +
    interpolate(exit, [0, 1], [0, presetConfig.exitX], clamp);
  const y =
    interpolate(enter, [0, 1], [presetConfig.enterY, 0], clamp) +
    interpolate(exit, [0, 1], [0, presetConfig.exitY], clamp);
  const scale =
    interpolate(enter, [0, 1], [presetConfig.enterScale, 1], clamp) *
    interpolate(exit, [0, 1], [1, presetConfig.exitScale], clamp);
  const blur =
    interpolate(enter, [0, 1], [presetConfig.blur, 0], clamp) +
    interpolate(exit, [0, 1], [0, presetConfig.blur * 0.8], clamp);

  return (
    <Sequence from={from} durationInFrames={duration} premountFor={20}>
      <AbsoluteFill
        style={{
          opacity,
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
          filter: `blur(${blur}px)`,
          transformOrigin: "50% 50%",
        }}
      >
        {children}
      </AbsoluteFill>
    </Sequence>
  );
};

export const TransitionBridgeSequence = ({
  from,
  duration,
  effects,
}: {
  from: number;
  duration: number;
  effects: TransitionEffect[];
}) => (
  <Sequence from={from} durationInFrames={duration} premountFor={8}>
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {effects.map((effect, index) => {
        switch (effect.type) {
          case "pixelSweep":
            return <PixelSweepTransition key={`pixel-sweep-${index}`} duration={duration} accent={effect.accent} />;
          case "spotlight":
            return (
              <SpotlightWipe
                key={`spotlight-${index}`}
                duration={duration}
                origin={effect.origin}
                radius={effect.radius}
              />
            );
          case "mascotBridge":
            return (
              <FloatingMascotBridge
                key={`mascot-${index}`}
                duration={duration}
                mood={effect.mood}
                start={effect.start}
                end={effect.end}
                size={effect.size}
              />
            );
          case "cameraPush":
            return <CameraPush key={`camera-${index}`} duration={duration} focus={effect.focus} />;
          case "pixelDissolve":
            return <PixelDissolveTransition key={`dissolve-${index}`} duration={duration} origin={effect.origin} />;
          case "cardMorph":
            return (
              <UICardMorphTransition
                key={`card-morph-${index}`}
                duration={duration}
                fromRect={effect.fromRect}
                toRect={effect.toRect}
              />
            );
          default:
            return null;
        }
      })}
    </AbsoluteFill>
  </Sequence>
);

export const PixelParticles = ({
  duration,
  count = 48,
  mode = "sweep",
  origin,
}: {
  duration: number;
  count?: number;
  mode?: "sweep" | "burst";
  origin?: Rect;
}) => {
  const frame = useCurrentFrame();
  const progress = progressFromDuration(frame, duration);
  const palette = [COLORS.purple, COLORS.lavender, COLORS.white, COLORS.blue, COLORS.pink];

  return (
    <>
      {Array.from({length: count}, (_, index) => {
        const delay = seeded(index + 1) * (mode === "sweep" ? 0.28 : 0.34);
        const travel = mode === "sweep" ? 0.62 : 0.56;
        const particleProgress = interpolate(progress, [delay, Math.min(1, delay + travel)], [0, 1], clamp);
        const visible = particleProgress > 0 && particleProgress < 1;
        if (!visible) return null;

        const startX =
          mode === "sweep"
            ? -220 - seeded(index + 17) * 180
            : (origin?.x ?? 900) + seeded(index + 4) * (origin?.width ?? 140);
        const startY =
          mode === "sweep"
            ? 120 + seeded(index + 28) * 860
            : (origin?.y ?? 420) + seeded(index + 7) * (origin?.height ?? 140);
        const endX =
          mode === "sweep"
            ? 2140 + seeded(index + 12) * 120
            : startX + mix(-560, 680, seeded(index + 35));
        const endY =
          mode === "sweep"
            ? startY + mix(-90, 110, seeded(index + 8))
            : startY + mix(-360, 360, seeded(index + 41));
        const x = mix(startX, endX, particleProgress);
        const y = mix(startY, endY, particleProgress) + Math.sin((particleProgress + index * 0.03) * 10) * 16;
        const size = 4 + Math.floor(seeded(index + 22) * 8);
        const opacity = interpolate(particleProgress, [0, 0.12, 0.82, 1], [0, 0.9, 0.58, 0], clamp);
        const color = palette[index % palette.length];

        return (
          <span
            key={`${mode}-${index}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              opacity,
              background: color,
              boxShadow: `0 0 14px ${color}55`,
              transform: `rotate(${particleProgress * 140 + index * 11}deg) scale(${1 + Math.sin(particleProgress * Math.PI) * 0.12})`,
            }}
          />
        );
      })}
    </>
  );
};

export const PixelSweepTransition = ({duration, accent = COLORS.lavender}: {duration: number; accent?: string}) => {
  const frame = useCurrentFrame();
  const progress = progressFromDuration(frame, duration);
  const bandX = interpolate(progress, [0, 1], [-32, 108], clamp);
  const bandOpacity = interpolate(progress, [0, 0.18, 0.72, 1], [0, 0.48, 0.34, 0], clamp);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: bandOpacity,
          background: `linear-gradient(102deg, transparent 22%, rgba(201,168,255,0.06) 38%, ${accent}22 52%, transparent 70%)`,
          transform: `translateX(${bandX}%)`,
          filter: "blur(10px)",
        }}
      />
      <PixelParticles duration={duration} count={54} mode="sweep" />
    </>
  );
};

export const SpotlightWipe = ({
  duration,
  origin = {x: 1460, y: 420},
  radius = 420,
}: {
  duration: number;
  origin?: Point;
  radius?: number;
}) => {
  const frame = useCurrentFrame();
  const progress = progressFromDuration(frame, duration);
  const x = mix(origin.x, origin.x - 260, progress);
  const y = mix(origin.y, origin.y + 20, progress);
  const glowOpacity = interpolate(progress, [0, 0.18, 0.78, 1], [0, 0.52, 0.34, 0], clamp);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: glowOpacity,
        background: `radial-gradient(circle ${radius}px at ${x}px ${y}px, rgba(201,168,255,0.28), rgba(138,77,255,0.12) 34%, transparent 66%)`,
        filter: "blur(18px)",
      }}
    />
  );
};

export const CameraPush = ({duration, focus}: {duration: number; focus: Rect}) => {
  const frame = useCurrentFrame();
  const progress = progressFromDuration(frame, duration);
  const haloOpacity = interpolate(progress, [0, 0.18, 0.86, 1], [0, 0.34, 0.26, 0], clamp);
  const ringScale = interpolate(progress, [0, 1], [1.24, 0.92], {...clamp, easing: easeOut});
  const vignetteOpacity = interpolate(progress, [0, 0.15, 1], [0, 0.16, 0], clamp);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: vignetteOpacity,
          background: `radial-gradient(circle at ${focus.x + focus.width / 2}px ${focus.y + focus.height / 2}px, transparent 0%, transparent 9%, rgba(5,5,10,0.22) 28%, rgba(5,5,10,0.38) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: focus.x,
          top: focus.y,
          width: focus.width,
          height: focus.height,
          borderRadius: 28,
          border: "1px solid rgba(201,168,255,0.5)",
          boxShadow: "0 0 48px rgba(138,77,255,0.34), inset 0 1px 0 rgba(255,255,255,0.1)",
          opacity: haloOpacity,
          transform: `scale(${ringScale})`,
          transformOrigin: "50% 50%",
          background: "rgba(255,255,255,0.02)",
        }}
      />
    </>
  );
};

export const PixelDissolveTransition = ({duration, origin}: {duration: number; origin: Rect}) => {
  const frame = useCurrentFrame();
  const progress = progressFromDuration(frame, duration);
  const gridOpacity = interpolate(progress, [0, 0.16, 0.72, 1], [0, 0.2, 0.12, 0], clamp);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: origin.x,
          top: origin.y,
          width: origin.width,
          height: origin.height,
          opacity: gridOpacity,
          borderRadius: 20,
          backgroundImage:
            "linear-gradient(rgba(201,168,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,255,0.14) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          transform: `scale(${interpolate(progress, [0, 1], [0.96, 1.08], clamp)})`,
          filter: "blur(1px)",
        }}
      />
      <PixelParticles duration={duration} count={42} mode="burst" origin={origin} />
    </>
  );
};

export const UICardMorphTransition = ({
  duration,
  fromRect,
  toRect,
}: {
  duration: number;
  fromRect: Rect;
  toRect: Rect;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = progressFromDuration(frame, duration);
  const settle = spring({frame, fps, config: {damping: 16, stiffness: 110}, durationInFrames: duration});
  const x = mix(fromRect.x, toRect.x, progress);
  const y = mix(fromRect.y, toRect.y, progress);
  const width = mix(fromRect.width, toRect.width, progress);
  const height = mix(fromRect.height, toRect.height, progress);
  const radius = mix(22, 30, progress);
  const opacity = interpolate(progress, [0, 0.1, 0.92, 1], [0, 0.92, 0.68, 0], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        opacity,
        borderRadius: radius,
        border: "1px solid rgba(201,168,255,0.4)",
        background: "linear-gradient(180deg, rgba(24,21,37,0.88), rgba(8,7,14,0.92))",
        boxShadow: "0 0 42px rgba(138,77,255,0.24), inset 0 1px 0 rgba(255,255,255,0.08)",
        transform: `scale(${interpolate(settle, [0, 1], [0.96, 1.02], clamp)})`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(112deg, transparent 14%, rgba(255,255,255,${0.14 * opacity}) 42%, transparent 72%)`,
          transform: `translateX(${interpolate(progress, [0, 1], [-55, 65], clamp)}%)`,
        }}
      />
      <div style={{position: "absolute", left: 18, right: 18, top: 18, display: "grid", gap: 10}}>
        <div style={{height: 10, width: `${mix(46, 38, progress)}%`, borderRadius: 999, background: "rgba(201,168,255,0.74)"}} />
        <div style={{height: 10, width: `${mix(34, 52, progress)}%`, borderRadius: 999, background: "rgba(255,255,255,0.18)"}} />
      </div>
      <div style={{position: "absolute", left: 18, right: 18, bottom: 18, display: "flex", gap: 8}}>
        {[0, 1, 2].map((chip) => (
          <span
            key={chip}
            style={{
              height: 10,
              width: `${28 + chip * 10}%`,
              borderRadius: 999,
              background: chip === 0 ? "rgba(138,77,255,0.5)" : "rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const FloatingMascotBridge = ({
  duration,
  mood = "happy",
  start,
  end,
  size = 138,
}: {
  duration: number;
  mood?: MascotMood;
  start: Point;
  end: Point;
  size?: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = progressFromDuration(frame, duration);
  const bounce = spring({frame, fps, config: {damping: 15, stiffness: 120}, durationInFrames: duration});
  const x = mix(start.x, end.x, progress);
  const y = mix(start.y, end.y, progress) + Math.sin(progress * Math.PI) * -18 + (1 - bounce) * 18;
  const opacity = interpolate(progress, [0, 0.1, 0.88, 1], [0, 1, 1, 0], clamp);
  const scale = interpolate(progress, [0, 0.52, 1], [0.92, 1.02, 0.98], clamp);
  const rotate = interpolate(progress, [0, 0.5, 1], [-5, 2, -2], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        opacity,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "12%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(138,77,255,0.4), rgba(138,77,255,0) 70%)",
          filter: "blur(18px)",
          transform: "translateY(22%)",
        }}
      />
      <Img
        src={staticFile(mascotSrc[mood])}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          imageRendering: "pixelated",
          filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.35))",
        }}
      />
    </div>
  );
};
