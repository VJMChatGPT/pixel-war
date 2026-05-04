import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, clamp, easeOut} from "../constants";
import {
  AppChromeMock,
  GlassPanel,
  MascotActor,
  SceneShell,
} from "../components/visuals";
import {fade, monoStyle, textStyle} from "../primitives";

const MiniPage = ({title, subtitle, active = false}: {title: string; subtitle: string; active?: boolean}) => (
  <GlassPanel
    style={{
      borderRadius: 18,
      padding: 20,
      height: 156,
      borderColor: active ? COLORS.borderStrong : COLORS.border,
      background: active ? "rgba(138,77,255,0.15)" : "rgba(255,255,255,0.035)",
    }}
  >
    <div style={{...textStyle, fontSize: 25, fontWeight: 900}}>{title}</div>
    <div style={{...monoStyle, fontSize: 12, color: COLORS.muted, marginTop: 9, lineHeight: 1.55}}>{subtitle}</div>
  </GlassPanel>
);

export const AppOverviewScene = () => {
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 38);
  const appProgress = interpolate(frame, [20, 126], [0.2, 1], {...clamp, easing: easeOut});

  return (
    <SceneShell label="02 / app tour" progressLabel="landing · canvas · competition">
      <div
        style={{
          position: "absolute",
          left: 108,
          top: 160,
          width: 510,
          opacity: enter,
          transform: `translateX(${interpolate(enter, [0, 1], [-38, 0])}px)`,
        }}
      >
        <div style={{...monoStyle, color: COLORS.lavender, fontSize: 14, textTransform: "uppercase", marginBottom: 18}}>
          one product loop
        </div>
        <div style={{...textStyle, fontSize: 64, fontWeight: 950, lineHeight: 0.96}}>
          Enter the app.
          <br />
          See the canvas.
          <br />
          Join the contest.
        </div>
        <div style={{display: "grid", gap: 14, marginTop: 36}}>
          <MiniPage title="Landing" subtitle="The story, the rules and the live board at a glance." />
          <MiniPage title="Canvas" subtitle="A clean pixel board built for fast painting and ownership." active />
          <MiniPage title="Leaderboard" subtitle="Every mark turns into visible competitive progress." />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 88,
          top: 164,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [48, 0])}px) scale(${interpolate(enter, [0, 1], [0.96, 1])})`,
        }}
      >
        <AppChromeMock progress={appProgress} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 420,
          bottom: 54,
          opacity: fade(frame, 54, 92),
        }}
      >
        <MascotActor mood="waving" size={150} reactAt={82} rotate={-4} />
      </div>
    </SceneShell>
  );
};
