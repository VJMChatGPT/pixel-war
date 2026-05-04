import type {ReactNode} from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {PremiumBackground} from "./productWalkthrough/components/visuals";
import {
  PIXL_TEASER_DURATION,
  PIXL_WALKTHROUGH_DURATION,
  PIXL_WALKTHROUGH_FPS,
  clamp,
  sceneTimings,
  seconds,
} from "./productWalkthrough/constants";
import {AppOverviewScene} from "./productWalkthrough/scenes/AppOverviewScene";
import {ConnectWalletScene} from "./productWalkthrough/scenes/ConnectWalletScene";
import {CoreLoopScene} from "./productWalkthrough/scenes/CoreLoopScene";
import {IntroScene} from "./productWalkthrough/scenes/IntroScene";
import {LeaderboardScene} from "./productWalkthrough/scenes/LeaderboardScene";
import {OutroScene} from "./productWalkthrough/scenes/OutroScene";
import {PaintScene} from "./productWalkthrough/scenes/PaintScene";
import {RealtimeScene} from "./productWalkthrough/scenes/RealtimeScene";
import {RewardScene} from "./productWalkthrough/scenes/RewardScene";

const SceneFade = ({from, duration, children}: {from: number; duration: number; children: ReactNode}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, from + 18, from + duration - 18, from + duration], [0, 1, 1, 0], clamp);

  return (
    <Sequence from={from} durationInFrames={duration} premountFor={18}>
      <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>
    </Sequence>
  );
};

export const PIXLProductWalkthrough = () => {
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <PremiumBackground />
      <SceneFade from={sceneTimings.intro.from} duration={sceneTimings.intro.duration}>
        <IntroScene />
      </SceneFade>
      <SceneFade from={sceneTimings.app.from} duration={sceneTimings.app.duration}>
        <AppOverviewScene />
      </SceneFade>
      <SceneFade from={sceneTimings.wallet.from} duration={sceneTimings.wallet.duration}>
        <ConnectWalletScene />
      </SceneFade>
      <SceneFade from={sceneTimings.loop.from} duration={sceneTimings.loop.duration}>
        <CoreLoopScene />
      </SceneFade>
      <SceneFade from={sceneTimings.paint.from} duration={sceneTimings.paint.duration}>
        <PaintScene />
      </SceneFade>
      <SceneFade from={sceneTimings.realtime.from} duration={sceneTimings.realtime.duration}>
        <RealtimeScene />
      </SceneFade>
      <SceneFade from={sceneTimings.leaderboard.from} duration={sceneTimings.leaderboard.duration}>
        <LeaderboardScene />
      </SceneFade>
      <SceneFade from={sceneTimings.reward.from} duration={sceneTimings.reward.duration}>
        <RewardScene />
      </SceneFade>
      <SceneFade from={sceneTimings.outro.from} duration={sceneTimings.outro.duration}>
        <OutroScene />
      </SceneFade>
    </AbsoluteFill>
  );
};

export const PIXLProductTeaser = () => {
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <PremiumBackground intensity={1.05} />
      <SceneFade from={0} duration={seconds(6.2)}>
        <IntroScene />
      </SceneFade>
      <SceneFade from={seconds(5.6)} duration={seconds(6.0)}>
        <PaintScene />
      </SceneFade>
      <SceneFade from={seconds(11.0)} duration={PIXL_TEASER_DURATION - seconds(11.0)}>
        <OutroScene />
      </SceneFade>
    </AbsoluteFill>
  );
};
