import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, clamp, easeOut} from "../constants";
import {
  BrowserFrame,
  ColorSwatches,
  GlassPanel,
  MascotActor,
  PixelBoard,
  SceneShell,
} from "../components/visuals";
import {fade, monoStyle, textStyle} from "../primitives";

export const PaintScene = () => {
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 32);
  const paintProgress = interpolate(frame, [52, 182], [0, 1], {...clamp, easing: easeOut});
  const success = fade(frame, 144, 184);

  return (
    <SceneShell label="05 / paint">
      <div
        style={{
          position: "absolute",
          left: 92,
          top: 126,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [42, 0])}px)`,
        }}
      >
        <BrowserFrame title="pixl.app/canvas" style={{width: 1260, height: 820}}>
          <div style={{display: "grid", gridTemplateColumns: "760px 1fr", gap: 28, padding: 30}}>
            <div>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: 20}}>
                <div>
                  <div style={{...textStyle, fontSize: 34, fontWeight: 900}}>The Canvas</div>
                  <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, marginTop: 6}}>click to paint · instant feedback</div>
                </div>
                <div style={{...monoStyle, color: COLORS.lavender, fontSize: 13}}>brush 2x2</div>
              </div>
              <PixelBoard mode="paint" progress={paintProgress} activeColor={COLORS.purple} showCursor style={{width: 710}} />
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: 16}}>
              <GlassPanel style={{borderRadius: 22, padding: 22}}>
                <div style={{...textStyle, fontSize: 22, fontWeight: 900, marginBottom: 16}}>Color</div>
                <ColorSwatches active={5} />
              </GlassPanel>
              <GlassPanel style={{borderRadius: 22, padding: 22}}>
                <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, textTransform: "uppercase"}}>painted this move</div>
                <div style={{...textStyle, fontSize: 64, fontWeight: 950, marginTop: 8}}>
                  {Math.round(interpolate(paintProgress, [0, 1], [0, 18]))}
                  <span style={{fontSize: 24, color: COLORS.muted}}> pixels</span>
                </div>
                <div style={{height: 10, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden", marginTop: 18}}>
                  <div style={{width: `${paintProgress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.lavender})`}} />
                </div>
              </GlassPanel>
              <GlassPanel style={{borderRadius: 22, padding: 22, flex: 1}}>
                <div style={{...textStyle, fontSize: 24, fontWeight: 900}}>Microinteractions</div>
                {["hover preview", "click glow", "paint confirmation"].map((item, index) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 18,
                      opacity: interpolate(frame, [52 + index * 26, 78 + index * 26], [0, 1], clamp),
                    }}
                  >
                    <span style={{width: 10, height: 10, borderRadius: 99, background: [COLORS.blue, COLORS.purple, COLORS.green][index]}} />
                    <span style={{...monoStyle, color: COLORS.text, fontSize: 15}}>{item}</span>
                  </div>
                ))}
              </GlassPanel>
            </div>
          </div>
        </BrowserFrame>
      </div>

      <div style={{position: "absolute", right: 126, bottom: 88, opacity: enter}}>
        <MascotActor mood={success > 0.5 ? "happy" : "normal"} size={230} reactAt={150} rotate={-3} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 296,
          top: 214,
          opacity: success,
          transform: `translateY(${interpolate(success, [0, 1], [16, 0])}px)`,
        }}
      >
        <GlassPanel style={{borderRadius: 999, padding: "15px 20px", borderColor: "rgba(126,227,173,0.45)"}}>
          <span style={{...monoStyle, color: COLORS.green, fontSize: 15, fontWeight: 800}}>pixel painted</span>
        </GlassPanel>
      </div>
    </SceneShell>
  );
};
