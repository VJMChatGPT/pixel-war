import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, clamp, easeOut} from "../constants";
import {BrandBug, FeaturedAdSpotMock, MascotActor, PixelBoard, SceneShell, WalletButtonMock} from "../components/visuals";
import {fade, monoStyle, textStyle} from "../primitives";

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 44);
  const board = interpolate(frame, [0, 170], [0.65, 1], {...clamp, easing: easeOut});

  return (
    <SceneShell label="09 / cta">
      <BrandBug minimal />
      <div style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: "radial-gradient(circle at 74% 42%, rgba(138,77,255,0.20), transparent 34%)"}} />
      <div
        style={{
          position: "absolute",
          left: 126,
          top: 198,
          width: 850,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [46, 0])}px)`,
        }}
      >
        <div style={{...textStyle, fontSize: 118, fontWeight: 950, lineHeight: 0.9}}>
          PIXL
          <br />
          <span style={{color: COLORS.lavender}}>Paint.</span>
          <br />
          Compete.
          <br />
          Conquer.
        </div>
        <div style={{...textStyle, color: COLORS.muted, fontSize: 24, lineHeight: 1.42, marginTop: 24, maxWidth: 620}}>
          Compete for rewards and featured placement. Top players can win premium visibility on the Pixel War website.
        </div>
        <div style={{display: "flex", gap: 18, alignItems: "center", marginTop: 40}}>
          <WalletButtonMock large />
          <div
            style={{
              ...textStyle,
              height: 58,
              borderRadius: 14,
              border: `1px solid ${COLORS.borderStrong}`,
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              fontSize: 18,
              fontWeight: 850,
              color: COLORS.text,
              background: "rgba(255,255,255,0.05)",
            }}
          >
            Join the canvas
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 92,
          top: 116,
          opacity: enter * 0.96,
        }}
      >
        <FeaturedAdSpotMock compact progress={board} />
      </div>
      <div style={{position: "absolute", right: 295, bottom: 90, opacity: enter}}>
        <MascotActor mood="normal" size={235} reactAt={64} rotate={-3} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 128,
          bottom: 70,
          right: 128,
          display: "flex",
          justifyContent: "space-between",
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 22,
          opacity: fade(frame, 90, 136),
        }}
      >
        {["100 x 100 canvas", "featured visibility", "live leaderboard"].map((item) => (
          <span key={item} style={{...monoStyle, color: COLORS.muted, fontSize: 13, textTransform: "uppercase"}}>
            {item}
          </span>
        ))}
      </div>
    </SceneShell>
  );
};
