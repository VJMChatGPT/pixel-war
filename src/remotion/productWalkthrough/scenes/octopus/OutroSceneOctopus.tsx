import {interpolate, useCurrentFrame} from "remotion";
import {COLORS} from "../../constants";
import {useWalkthroughBranding} from "../../branding";
import {BrandBug, SceneShell, WalletButtonMock} from "../../components/visuals";
import {OctopusMascotActor} from "../../components/OctopusMascotActor";
import {fade, monoStyle, textStyle} from "../../primitives";

export const OutroSceneOctopus = () => {
  const branding = useWalkthroughBranding();
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 44);
  const lines = fade(frame, 18, 82);

  return (
    <SceneShell label="09 / cta">
      <BrandBug minimal />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(circle at 72% 48%, ${branding.accent}3d, transparent 30%), radial-gradient(circle at 30% 18%, ${branding.accentSoft}14, transparent 24%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 126,
          top: 170,
          width: 900,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
        }}
      >
        <div style={{...textStyle, fontSize: 120, fontWeight: 950, lineHeight: 0.88}}>Pixel Battle</div>
        <div style={{display: "grid", gap: 8, marginTop: 18, opacity: lines}}>
          {[
            {label: `Buy ${branding.tokenTicker}.`, color: COLORS.text},
            {label: "Claim territory.", color: branding.accentSoft},
            {label: "Hold & Paint the board.", color: COLORS.white},
          ].map((item) => (
            <div key={item.label} style={{...textStyle, fontSize: 76, fontWeight: 930, lineHeight: 0.95, color: item.color}}>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{...textStyle, color: COLORS.muted, fontSize: 24, lineHeight: 1.42, marginTop: 28, maxWidth: 650}}>
          Hold & Paint powers a live 100 x 100 territory board where {branding.tokenTicker} holders compete for status, visibility and control.
        </div>
        <div style={{display: "flex", gap: 18, alignItems: "center", marginTop: 42}}>
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
            Enter Pixel Battle
          </div>
        </div>
        <div style={{display: "flex", gap: 12, marginTop: 28, opacity: fade(frame, 84, 132)}}>
          {["100 x 100 canvas", `${branding.tokenTicker} territory`, "live leaderboard"].map((item) => (
            <div
              key={item}
              style={{
                ...monoStyle,
                color: COLORS.muted,
                fontSize: 12,
                textTransform: "uppercase",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 999,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.035)",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 156,
          bottom: 86,
          opacity: fade(frame, 20, 58),
          transform: `translateY(${interpolate(fade(frame, 20, 58), [0, 1], [34, 0])}px)`,
        }}
      >
        <OctopusMascotActor mood="normal" size={320} reactAt={64} rotate={-3} />
      </div>
    </SceneShell>
  );
};
