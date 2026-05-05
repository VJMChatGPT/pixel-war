import type {ReactNode} from "react";
import {AbsoluteFill} from "remotion";
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
import {SceneFrame, TransitionBridgeSequence} from "./productWalkthrough/transitions";

export const PIXLProductWalkthrough = () => {
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <PremiumBackground />
      <SceneFrame from={sceneTimings.intro.from} duration={sceneTimings.intro.duration} preset="hero">
        <IntroScene />
      </SceneFrame>
      <SceneFrame from={sceneTimings.app.from} duration={sceneTimings.app.duration} preset="browser">
        <AppOverviewScene />
      </SceneFrame>
      <SceneFrame from={sceneTimings.wallet.from} duration={sceneTimings.wallet.duration} preset="focus">
        <ConnectWalletScene />
      </SceneFrame>
      <SceneFrame from={sceneTimings.loop.from} duration={sceneTimings.loop.duration} preset="data">
        <CoreLoopScene />
      </SceneFrame>
      <SceneFrame from={sceneTimings.paint.from} duration={sceneTimings.paint.duration} preset="canvas">
        <PaintScene />
      </SceneFrame>
      <SceneFrame from={sceneTimings.realtime.from} duration={sceneTimings.realtime.duration} preset="battle">
        <RealtimeScene />
      </SceneFrame>
      <SceneFrame from={sceneTimings.leaderboard.from} duration={sceneTimings.leaderboard.duration} preset="status">
        <LeaderboardScene />
      </SceneFrame>
      <SceneFrame from={sceneTimings.reward.from} duration={sceneTimings.reward.duration} preset="reward">
        <RewardScene />
      </SceneFrame>
      <SceneFrame from={sceneTimings.outro.from} duration={sceneTimings.outro.duration} preset="cta">
        <OutroScene />
      </SceneFrame>

      <TransitionBridgeSequence
        from={sceneTimings.app.from - 10}
        duration={28}
        effects={[
          {type: "pixelSweep"},
        ]}
      />
      <TransitionBridgeSequence
        from={sceneTimings.wallet.from - 10}
        duration={26}
        effects={[
          {type: "cameraPush", focus: {x: 1460, y: 196, width: 250, height: 74}},
          {type: "pixelSweep", accent: "#ffffff"},
        ]}
      />
      <TransitionBridgeSequence
        from={sceneTimings.loop.from - 8}
        duration={28}
        effects={[
          {type: "cardMorph", fromRect: {x: 1160, y: 292, width: 360, height: 214}, toRect: {x: 1060, y: 244, width: 454, height: 238}},
          {type: "cameraPush", focus: {x: 1100, y: 274, width: 430, height: 254}},
        ]}
      />
      <TransitionBridgeSequence
        from={sceneTimings.paint.from - 8}
        duration={30}
        effects={[
          {type: "pixelDissolve", origin: {x: 850, y: 248, width: 420, height: 420}},
          {type: "cameraPush", focus: {x: 790, y: 212, width: 520, height: 520}},
        ]}
      />
      <TransitionBridgeSequence
        from={sceneTimings.realtime.from - 10}
        duration={24}
        effects={[
          {type: "pixelSweep"},
          {type: "pixelDissolve", origin: {x: 1160, y: 170, width: 520, height: 520}},
        ]}
      />
      <TransitionBridgeSequence
        from={sceneTimings.leaderboard.from - 8}
        duration={26}
        effects={[
          {type: "spotlight", origin: {x: 1440, y: 420}, radius: 420},
          {type: "cameraPush", focus: {x: 180, y: 188, width: 650, height: 420}},
        ]}
      />
      <TransitionBridgeSequence
        from={sceneTimings.reward.from - 8}
        duration={26}
        effects={[
          {type: "spotlight", origin: {x: 560, y: 460}, radius: 360},
        ]}
      />
      <TransitionBridgeSequence
        from={sceneTimings.outro.from - 8}
        duration={24}
        effects={[
          {type: "spotlight", origin: {x: 1380, y: 620}, radius: 400},
        ]}
      />
    </AbsoluteFill>
  );
};

export const PIXLProductTeaser = () => {
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <PremiumBackground intensity={1.05} />
      <SceneFrame from={0} duration={seconds(6.2)} preset="hero">
        <IntroScene />
      </SceneFrame>
      <SceneFrame from={seconds(5.6)} duration={seconds(6.0)} preset="canvas">
        <PaintScene />
      </SceneFrame>
      <TransitionBridgeSequence
        from={seconds(5.6) - 8}
        duration={28}
        effects={[
          {type: "pixelSweep"},
          {type: "pixelDissolve", origin: {x: 860, y: 230, width: 420, height: 420}},
        ]}
      />
      <SceneFrame from={seconds(11.0)} duration={PIXL_TEASER_DURATION - seconds(11.0)} preset="cta">
        <OutroScene />
      </SceneFrame>
    </AbsoluteFill>
  );
};
