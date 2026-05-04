import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONT, clamp, easeOut} from "../constants";
import {BrandBug, MascotActor, PixelBoard, SceneShell} from "../components/visuals";
import {fade, fadeOut, monoStyle, textStyle} from "../primitives";

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const title = fade(frame, 28, 74) * fadeOut(frame, 132, 158);
  const board = fade(frame, 0, 80);
  const wake = fade(frame, 38, 84);

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
          opacity: board * 0.72,
          transform: `perspective(1200px) rotateY(-16deg) rotateX(9deg) translateY(${interpolate(board, [0, 1], [70, 0])}px)`,
        }}
      >
        <PixelBoard mode="quiet" progress={wake} />
      </div>
      <div style={{position: "absolute", left: 150, top: 244, width: 930}}>
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
          the public canvas for $PIXL holders
        </div>
        <div
          style={{
            ...textStyle,
            fontFamily: FONT.display,
            fontWeight: 950,
            fontSize: 102,
            lineHeight: 0.95,
            opacity: title,
            transform: `translateY(${interpolate(title, [0, 1], [58, 0])}px)`,
            maxWidth: 1000,
          }}
        >
          Own pixels.
          <br />
          Paint the board.
          <br />
          <span style={{color: COLORS.lavender}}>Climb the leaderboard.</span>
        </div>
      </div>
      <div style={{position: "absolute", right: 246, bottom: 95}}>
        <div style={{opacity: 1 - wake}}>
          <MascotActor mood="sleeping" size={206} delay={4} rotate={-3} />
        </div>
        <div style={{position: "absolute", inset: 0, opacity: wake}}>
          <MascotActor mood="waving" size={218} delay={0} reactAt={62} rotate={-2} />
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
    </SceneShell>
  );
};
