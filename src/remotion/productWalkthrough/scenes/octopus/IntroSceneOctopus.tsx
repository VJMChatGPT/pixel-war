import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONT, clamp, easeOut} from "../../constants";
import {BrandBug, PixelBoard, SceneShell} from "../../components/visuals";
import {OctopusMascotActor} from "../../components/OctopusMascotActor";
import {fade, fadeOut, monoStyle, textStyle} from "../../primitives";

export const IntroSceneOctopus = () => {
  const frame = useCurrentFrame();
  const title = fade(frame, 28, 74) * fadeOut(frame, 132, 158);
  const board = fade(frame, 0, 80);
  const wake = fade(frame, 38, 84);
  const mascotSwap = interpolate(frame, [22, 58], [0, 1], {...clamp, easing: easeOut});
  const normalOpacity = interpolate(mascotSwap, [0, 0.52, 1], [1, 1, 0], clamp);
  const normalLift = interpolate(mascotSwap, [0, 1], [0, -16], clamp);
  const normalScale = interpolate(mascotSwap, [0, 1], [1, 0.97], clamp);
  const wavingOpacity = interpolate(mascotSwap, [0, 0.35, 1], [0, 0, 1], clamp);
  const wavingLift = interpolate(mascotSwap, [0, 1], [16, 0], clamp);
  const wavingScale = interpolate(mascotSwap, [0, 1], [0.95, 1], clamp);

  return (
    <SceneShell label="01 / hero">
      <BrandBug />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(5,5,10,${interpolate(frame, [0, 60], [0.25, 0], clamp)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 130,
          top: 152,
          width: 610,
          opacity: board * 0.74,
          transform: `perspective(1200px) rotateY(-16deg) rotateX(9deg) translateY(${interpolate(board, [0, 1], [70, 0])}px)`,
        }}
      >
        <PixelBoard mode="quiet" progress={wake} />
      </div>
      <div style={{position: "absolute", left: 150, top: 220, width: 980}}>
        <div
          style={{
            ...monoStyle,
            color: COLORS.lavender,
            fontSize: 16,
            textTransform: "uppercase",
            marginBottom: 24,
            opacity: title,
            transform: `translateY(${interpolate(title, [0, 1], [22, 0])}px)`,
          }}
        >
          the live canvas for $PIXL holders
        </div>
        <div
          style={{
            ...textStyle,
            fontFamily: FONT.display,
            fontWeight: 950,
            fontSize: 100,
            lineHeight: 0.95,
            opacity: title,
            transform: `translateY(${interpolate(title, [0, 1], [58, 0])}px)`,
            maxWidth: 1000,
          }}
        >
          Enter the Pixel War.
          <br />
          Claim territory.
          <br />
          <span style={{color: COLORS.lavender}}>Climb the board.</span>
        </div>
      </div>
      <div style={{position: "absolute", right: 228, bottom: 88, width: 238, height: 238}}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: normalOpacity,
            transform: `translateY(${normalLift}px) scale(${normalScale})`,
          }}
        >
          <OctopusMascotActor mood="normal" size={228} rotate={-4} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: wavingOpacity,
            transform: `translateY(${wavingLift}px) scale(${wavingScale})`,
          }}
        >
          <OctopusMascotActor mood="waving" size={234} reactAt={62} rotate={-2} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 154,
          bottom: 108,
          width: 360,
          height: 4,
          background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.lavender}, transparent)`,
          opacity: title,
          transform: `scaleX(${title})`,
          transformOrigin: "0 50%",
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(circle at 70% 72%, rgba(138,77,255,0.12), transparent 20%)",
          opacity: fade(frame, 18, 54),
        }}
      />
    </SceneShell>
  );
};

