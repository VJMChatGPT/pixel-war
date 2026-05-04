import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, clamp} from "../constants";
import {CapacityBars, GlassPanel, MascotActor, PixelBoard, SceneShell} from "../components/visuals";
import {fade, monoStyle, textStyle} from "../primitives";

const FormulaTile = ({label, value, color}: {label: string; value: string; color: string}) => (
  <GlassPanel style={{borderRadius: 24, padding: 24, flex: 1}}>
    <div style={{...monoStyle, color, fontSize: 13, textTransform: "uppercase"}}>{label}</div>
    <div style={{...textStyle, fontSize: 42, fontWeight: 950, marginTop: 10}}>{value}</div>
  </GlassPanel>
);

export const CoreLoopScene = () => {
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 34);
  const progress = interpolate(frame, [18, 130], [0, 1], clamp);

  return (
    <SceneShell label="04 / core loop">
      <div style={{position: "absolute", left: 120, top: 168, width: 660, opacity: enter}}>
        <div style={{...monoStyle, color: COLORS.lavender, fontSize: 14, textTransform: "uppercase", marginBottom: 18}}>
          simple incentive
        </div>
        <div style={{...textStyle, fontSize: 76, fontWeight: 950, lineHeight: 0.94}}>
          More PIXL
          <br />
          means more presence.
        </div>
        <div style={{...textStyle, color: COLORS.muted, fontSize: 25, lineHeight: 1.42, marginTop: 24}}>
          Holding PIXL unlocks capacity to paint. Painting creates territory. Territory pushes you up the board.
        </div>
        <div style={{display: "flex", gap: 16, marginTop: 34}}>
          <FormulaTile label="hold" value="$PIXL" color={COLORS.lavender} />
          <FormulaTile label="unlock" value="pixels" color={COLORS.purple} />
          <FormulaTile label="compete" value="rank" color={COLORS.pink} />
        </div>
      </div>

      <div style={{position: "absolute", right: 132, top: 172, width: 700, opacity: enter}}>
        <GlassPanel style={{borderRadius: 30, padding: 34}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30}}>
            <div>
              <div style={{...textStyle, fontSize: 34, fontWeight: 900}}>Paint capacity</div>
              <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, marginTop: 6}}>mocked token balance tiers</div>
            </div>
            <MascotActor mood="normal" size={96} />
          </div>
          <CapacityBars progress={progress} />
          <div style={{display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 7, marginTop: 34}}>
            {Array.from({length: 72}, (_, index) => {
              const active = index / 72 < progress * 0.86;
              return (
                <span
                  key={index}
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: 4,
                    background: active ? [COLORS.purple, COLORS.lavender, COLORS.pink][index % 3] : "rgba(255,255,255,0.06)",
                    boxShadow: active ? "0 0 18px rgba(138,77,255,0.38)" : "none",
                  }}
                />
              );
            })}
          </div>
        </GlassPanel>
      </div>

      <div style={{position: "absolute", right: 586, bottom: 50, width: 230, opacity: fade(frame, 82, 122)}}>
        <PixelBoard mode="overview" progress={progress} />
      </div>
    </SceneShell>
  );
};
