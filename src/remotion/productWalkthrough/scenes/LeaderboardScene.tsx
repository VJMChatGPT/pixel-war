import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, clamp, easeOut} from "../constants";
import {GlassPanel, LeaderboardAnimatedMock, MascotActor, SceneShell} from "../components/visuals";
import {getLeaderboardStage} from "../leaderboardMotion";
import {fade, monoStyle, textStyle} from "../primitives";

export const LeaderboardScene = () => {
  const frame = useCurrentFrame();
  const pace = 0.6;
  const at = (value: number) => Math.round(value * pace);
  const enter = fade(frame, 0, at(32));
  const promote = interpolate(frame, [at(88), at(116), at(132), at(164)], [0, 0.48, 0.56, 1], clamp);
  const boardProgress = interpolate(frame, [at(14), at(166)], [0, 1], {...clamp, easing: easeOut});
  const rankStage = getLeaderboardStage(promote);
  const stagedRank = rankStage === "start" ? 3 : rankStage === "mid" ? 2 : 1;

  return (
    <SceneShell label="07 / leaderboard">
      <div style={{position: "absolute", left: 114, top: 142, opacity: enter}}>
        <LeaderboardAnimatedMock progress={boardProgress} transitionProgress={promote} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 134,
          top: 186,
          width: 610,
          opacity: enter,
          transform: `translateX(${interpolate(enter, [0, 1], [42, 0])}px)`,
        }}
      >
        <div style={{...monoStyle, color: COLORS.lavender, fontSize: 14, textTransform: "uppercase", marginBottom: 18}}>
          visible progress
        </div>
        <div style={{...textStyle, fontSize: 76, fontWeight: 950, lineHeight: 0.94}}>
          Territory becomes status.
        </div>
        <div style={{...textStyle, color: COLORS.muted, fontSize: 25, lineHeight: 1.42, marginTop: 24}}>
          Every move can push your wallet higher. The rank shift is the moment players come back for.
        </div>
        <GlassPanel style={{borderRadius: 28, padding: 28, marginTop: 38, borderColor: "rgba(201,168,255,0.42)"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
            <div>
              <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, textTransform: "uppercase"}}>your rank</div>
              <div style={{...textStyle, fontSize: 68, fontWeight: 950, marginTop: 6}}>
                #{stagedRank}
              </div>
            </div>
            <div style={{...monoStyle, color: COLORS.green, fontSize: 18, fontWeight: 900, opacity: promote}}>
              +2 positions
            </div>
          </div>
        </GlassPanel>
      </div>
      <div style={{position: "absolute", right: 206, bottom: 70}}>
        <MascotActor mood={promote > 0.5 ? "happy" : "normal"} size={165} reactAt={at(112)} rotate={-5} />
      </div>
    </SceneShell>
  );
};
