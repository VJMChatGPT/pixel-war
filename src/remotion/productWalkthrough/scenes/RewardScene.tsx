import {interpolate, useCurrentFrame} from "remotion";
import {clamp, easeOut} from "../constants";
import {FeaturedAdSpotMock, GlassPanel, MascotActor, PixelConfetti, SceneShell} from "../components/visuals";
import {fade, monoStyle, textStyle} from "../primitives";

export const RewardScene = () => {
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 34);
  const celebration = interpolate(frame, [42, 150], [0, 1], {...clamp, easing: easeOut});

  return (
    <SceneShell label="08 / recognition" progressLabel="visibility reward">
      <PixelConfetti progress={celebration} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 42%, rgba(201,168,255,${0.16 + celebration * 0.2}), transparent 38%)`,
        }}
      />
      <div style={{position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", opacity: enter}}>
        <div style={{...monoStyle, color: "#c9a8ff", fontSize: 14, textTransform: "uppercase", marginBottom: 20}}>
          compete for rewards · featured placement
        </div>
        <div style={{...textStyle, fontSize: 88, fontWeight: 950, lineHeight: 0.92}}>
          Earn your place on the board
          <br />
          and on the site.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 86,
          top: 320,
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
        }}
      >
        <FeaturedAdSpotMock progress={celebration} />
      </div>

      <div
        style={{
          position: "absolute",
          right: 110,
          top: 418,
          opacity: fade(frame, 46, 92),
        }}
      >
        <GlassPanel style={{width: 430, borderRadius: 30, padding: 28}}>
          <div style={{display: "flex", justifyContent: "center", marginBottom: 8}}>
            <MascotActor mood="happy" size={170} reactAt={58} />
          </div>
          <div style={{...textStyle, fontSize: 34, fontWeight: 920, textAlign: "center"}}>
            Top players earn a featured ad spot
          </div>
          <div style={{...textStyle, color: "#aaa1bd", fontSize: 18, lineHeight: 1.42, marginTop: 14, textAlign: "center"}}>
          Win premium visibility on the Pixel War website with your wallet, project and pixel identity featured inside the product.
          </div>
        </GlassPanel>
      </div>
    </SceneShell>
  );
};
