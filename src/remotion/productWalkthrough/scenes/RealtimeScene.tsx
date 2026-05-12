import {interpolate, useCurrentFrame} from "remotion";
import {activityEvents} from "../mockData";
import {COLORS, clamp, easeOut} from "../constants";
import {useWalkthroughBranding} from "../branding";
import {ActivityLabel, GlassPanel, MascotActor, PixelBoard, SceneShell} from "../components/visuals";
import {fade, monoStyle, textStyle} from "../primitives";

export const RealtimeScene = () => {
  const branding = useWalkthroughBranding();
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 32);
  const progress = interpolate(frame, [18, 170], [0, 1], {...clamp, easing: easeOut});

  return (
    <SceneShell label="06 / realtime">
      <div style={{position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${branding.accent}22, transparent 44%)`}} />
      <div
        style={{
          position: "absolute",
          left: 130,
          top: 150,
          width: 560,
          opacity: enter,
        }}
      >
        <div style={{...monoStyle, color: branding.accentSoft, fontSize: 14, textTransform: "uppercase", marginBottom: 18}}>
          live board energy
        </div>
        <div style={{...textStyle, fontSize: 70, fontWeight: 950, lineHeight: 0.95}}>
          Other players
          <br />
          are painting too.
        </div>
        <div style={{...textStyle, color: COLORS.muted, fontSize: 25, lineHeight: 1.42, marginTop: 24}}>
          Pixels change hands. Territories grow. The canvas starts to feel alive.
        </div>
        <GlassPanel style={{borderRadius: 24, padding: 22, marginTop: 36}}>
          {activityEvents.map((event, index) => (
            <div key={event.delay} style={{display: "flex", alignItems: "center", gap: 14, marginBottom: index === activityEvents.length - 1 ? 0 : 16}}>
              <span style={{width: 10, height: 10, borderRadius: 99, background: event.color, boxShadow: `0 0 16px ${event.color}`}} />
              <span style={{...monoStyle, color: COLORS.text, fontSize: 15}}>{event.wallet}</span>
              <span style={{...monoStyle, color: COLORS.muted, fontSize: 14, marginLeft: "auto"}}>{event.label}</span>
            </div>
          ))}
        </GlassPanel>
      </div>

      <div
        style={{
          position: "absolute",
          right: 116,
          top: 98,
          width: 835,
          opacity: enter,
          transform: `perspective(1300px) rotateY(-8deg) rotateX(5deg) scale(${interpolate(enter, [0, 1], [0.96, 1])})`,
        }}
      >
        <PixelBoard mode="battle" progress={progress} showActivity />
      </div>

      {activityEvents.map((event) => {
        const p = interpolate(frame - event.delay, [0, 20, 86], [0, 1, 0], clamp);
        return (
          <div
            key={`label-${event.delay}`}
            style={{
              position: "absolute",
              left: event.x,
              top: event.y,
              opacity: p,
              transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.82, 1])})`,
            }}
          >
            <ActivityLabel color={event.color} label={event.label} wallet={event.wallet} />
          </div>
        );
      })}

      <div style={{position: "absolute", right: 210, bottom: 66}}>
        <MascotActor mood="happy" size={150} reactAt={96} rotate={5} />
      </div>
    </SceneShell>
  );
};
