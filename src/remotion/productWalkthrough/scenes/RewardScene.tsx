import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, clamp, easeOut} from "../constants";
import {FeaturedAdSpotMock, GlassPanel, MascotActor, PixelConfetti, SceneShell} from "../components/visuals";
import {fade, monoStyle, textStyle} from "../primitives";

export const RewardScene = () => {
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 24);
  const celebration = interpolate(frame, [8, 118], [0, 1], {...clamp, easing: easeOut});
  const cardReveal = fade(frame, 6, 32);

  return (
    <SceneShell label="08 / recognition" progressLabel="visibility reward">
      <PixelConfetti count={26} progress={celebration} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 66% 42%, rgba(201,168,255,${0.12 + celebration * 0.16}), transparent 34%)`,
        }}
      />

      <div style={{position: "absolute", left: 118, top: 138, width: 620, opacity: enter}}>
        <div style={{...monoStyle, color: COLORS.lavender, fontSize: 14, textTransform: "uppercase", marginBottom: 18}}>
          spotlight reward
        </div>
        <div style={{...textStyle, fontSize: 90, fontWeight: 950, lineHeight: 0.94}}>
          Win the
          <br />
          spotlight.
        </div>
        <div style={{...textStyle, color: COLORS.muted, fontSize: 24, lineHeight: 1.45, marginTop: 34, maxWidth: 560}}>
          Top players can earn featured placement on the PIXL website.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          top: 470,
          width: 350,
          opacity: cardReveal,
          transform: `translateY(${interpolate(cardReveal, [0, 1], [26, 0])}px)`,
        }}
      >
        <GlassPanel
          style={{
            borderRadius: 28,
            padding: 26,
            borderColor: "rgba(201,168,255,0.28)",
            background: "linear-gradient(180deg, rgba(26,22,40,0.95), rgba(10,8,18,0.95))",
          }}
        >
          <div style={{...monoStyle, color: COLORS.quiet, fontSize: 12, textTransform: "uppercase"}}>top player</div>
          <div style={{display: "flex", alignItems: "baseline", gap: 16, marginTop: 14}}>
            <div style={{...textStyle, fontSize: 86, fontWeight: 950, lineHeight: 0.86, color: COLORS.lavender}}>#1</div>
            <div>
              <div style={{...monoStyle, color: COLORS.text, fontSize: 18, fontWeight: 800}}>9pXL...8f2A</div>
              <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, marginTop: 8}}>live leaderboard</div>
            </div>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22}}>
            {[
              {label: "placement", value: "secured"},
              {label: "visibility", value: "premium"},
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
                  background: "rgba(255,255,255,0.04)",
                  padding: 14,
                }}
              >
                <div style={{...monoStyle, color: COLORS.quiet, fontSize: 10, textTransform: "uppercase"}}>{item.label}</div>
                <div style={{...monoStyle, color: COLORS.text, fontSize: 14, fontWeight: 800, marginTop: 8}}>{item.value}</div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div
        style={{
          position: "absolute",
          left: 502,
          top: 586,
          width: 98,
          height: 2,
          opacity: cardReveal,
          background: "linear-gradient(90deg, rgba(201,168,255,0.15), rgba(201,168,255,0.8), rgba(201,168,255,0.15))",
          boxShadow: "0 0 24px rgba(201,168,255,0.35)",
          transform: `scaleX(${interpolate(cardReveal, [0, 1], [0.4, 1])})`,
        }}
      />

      <div
        style={{
          position: "absolute",
          right: 140,
          top: 344,
          opacity: cardReveal,
          transform: `translateY(${interpolate(cardReveal, [0, 1], [34, 0])}px)`,
        }}
      >
        <FeaturedAdSpotMock progress={celebration} />
      </div>

      <div style={{position: "absolute", right: 162, bottom: 74, opacity: fade(frame, 16, 44)}}>
        <MascotActor mood="happy" size={156} reactAt={72} rotate={-4} />
      </div>
    </SceneShell>
  );
};
