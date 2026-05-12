import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, clamp, easeOut} from "../../constants";
import {useWalkthroughBranding} from "../../branding";
import {GlassPanel, PixelConfetti, SceneShell} from "../../components/visuals";
import {OctopusMascotActor} from "../../components/OctopusMascotActor";
import {fade, monoStyle, textStyle} from "../../primitives";

export const RewardSceneOctopus = () => {
  const branding = useWalkthroughBranding();
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 24);
  const celebration = interpolate(frame, [8, 118], [0, 1], {...clamp, easing: easeOut});
  const cardReveal = fade(frame, 6, 32);

  return (
    <SceneShell label="08 / recognition" progressLabel="visibility reward">
      <PixelConfetti count={24} progress={celebration} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 70% 44%, rgba(201,168,255,0.16), transparent 34%), radial-gradient(circle at 32% 72%, rgba(138,77,255,0.1), transparent 24%)",
          opacity: 0.55 + celebration * 0.28,
        }}
      />

      <div style={{position: "absolute", left: 118, top: 138, width: 620, opacity: enter}}>
        <div style={{...monoStyle, color: branding.accentSoft, fontSize: 14, textTransform: "uppercase", marginBottom: 18}}>
          visibility reward
        </div>
        <div style={{...textStyle, fontSize: 90, fontWeight: 950, lineHeight: 0.94}}>
          Win the
          <br />
          spotlight.
        </div>
        <div style={{...textStyle, color: COLORS.muted, fontSize: 24, lineHeight: 1.45, marginTop: 34, maxWidth: 560}}>
          Top players earn visibility on the Pixel War site, with their identity and territory style featured in a premium slot.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          top: 484,
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
            <div style={{...textStyle, fontSize: 86, fontWeight: 950, lineHeight: 0.86, color: branding.accentSoft}}>#1</div>
            <div>
              <div style={{...monoStyle, color: COLORS.text, fontSize: 18, fontWeight: 800}}>9pXL...8f2A</div>
              <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, marginTop: 8}}>live leaderboard</div>
            </div>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22}}>
            {[
              {label: "status", value: "secured"},
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
          top: 598,
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
          top: 330,
          width: 620,
          opacity: cardReveal,
          transform: `translateY(${interpolate(cardReveal, [0, 1], [34, 0])}px)`,
        }}
      >
        <GlassPanel
          style={{
            borderRadius: 30,
            padding: 28,
            overflow: "hidden",
            borderColor: "rgba(201,168,255,0.24)",
            background:
              "linear-gradient(180deg, rgba(19,17,31,0.96), rgba(8,7,14,0.98)), radial-gradient(circle at 16% 18%, rgba(138,77,255,0.18), transparent 30%)",
          }}
        >
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div style={{...monoStyle, color: branding.accentSoft, fontSize: 12, textTransform: "uppercase"}}>featured placement</div>
            <div
              style={{
                ...monoStyle,
                color: COLORS.text,
                fontSize: 11,
                textTransform: "uppercase",
                border: "1px solid rgba(201,168,255,0.24)",
                borderRadius: 999,
                padding: "8px 12px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              pixelwarcoin.com
            </div>
          </div>

          <div style={{display: "grid", gridTemplateColumns: "150px 1fr", gap: 18, alignItems: "center", marginTop: 22}}>
            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: 22,
                border: `1px solid ${COLORS.border}`,
                background: "rgba(255,255,255,0.045)",
                padding: 12,
              }}
            >
              <div style={{display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, height: "100%"}}>
                {Array.from({length: 36}, (_, index) => (
                  <span
                    key={index}
                    style={{
                      borderRadius: 3,
                      background: [branding.accent, branding.accentSoft, COLORS.blue, COLORS.green, COLORS.gold][index % 5],
                      opacity: index % 5 === 0 || index % 7 === 0 ? 0.96 : 0.42 + ((index % 4) * 0.13),
                      boxShadow: index % 5 === 0 ? "0 0 14px rgba(201,168,255,0.38)" : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div style={{...textStyle, fontSize: 34, fontWeight: 930, lineHeight: 0.98}}>
                Get featured on
                <br />
                Pixel War.
              </div>
              <div style={{...textStyle, color: COLORS.muted, fontSize: 16, lineHeight: 1.46, marginTop: 14, maxWidth: 340}}>
                The winning wallet earns premium visibility with a branded slot that showcases territory style, identity and presence on the live site.
              </div>
              <div style={{display: "flex", gap: 10, marginTop: 18}}>
                {["premium visibility", "winner identity", "spotlight"].map((item) => (
                  <div
                    key={item}
                    style={{
                      ...monoStyle,
                      color: COLORS.muted,
                      fontSize: 10,
                      textTransform: "uppercase",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 999,
                      padding: "8px 10px",
                      background: "rgba(255,255,255,0.035)",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      <div style={{position: "absolute", right: 160, bottom: 70, opacity: fade(frame, 16, 44)}}>
        <OctopusMascotActor mood="happy" size={168} reactAt={72} rotate={-4} />
      </div>
    </SceneShell>
  );
};
