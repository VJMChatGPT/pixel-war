/* eslint-disable react-refresh/only-export-components */
import {AbsoluteFill} from "remotion";
import {WalkthroughBrandingProvider, octopusWalkthroughBranding} from "./productWalkthrough/branding";
import {PremiumBackground} from "./productWalkthrough/components/visuals";
import {PIXL_TEASER_DURATION, seconds} from "./productWalkthrough/constants";
import {AppOverviewScene} from "./productWalkthrough/scenes/AppOverviewScene";
import {ConnectWalletScene} from "./productWalkthrough/scenes/ConnectWalletScene";
import {CoreLoopScene} from "./productWalkthrough/scenes/CoreLoopScene";
import {LeaderboardScene} from "./productWalkthrough/scenes/LeaderboardScene";
import {PaintScene} from "./productWalkthrough/scenes/PaintScene";
import {RealtimeScene} from "./productWalkthrough/scenes/RealtimeScene";
import {IntroSceneOctopus} from "./productWalkthrough/scenes/octopus/IntroSceneOctopus";
import {OutroSceneOctopus} from "./productWalkthrough/scenes/octopus/OutroSceneOctopus";
import {RewardSceneOctopus} from "./productWalkthrough/scenes/octopus/RewardSceneOctopus";
import {SceneFrame, TransitionBridgeSequence} from "./productWalkthrough/transitions";

export const OCTOPUS_WALKTHROUGH_DURATION = seconds(44);

const octopusSceneTimings = {
  intro: {from: 0, duration: seconds(4.8)},
  app: {from: seconds(4.2), duration: seconds(4.8)},
  wallet: {from: seconds(8.4), duration: seconds(5.0)},
  loop: {from: seconds(13.0), duration: seconds(4.5)},
  paint: {from: seconds(17.1), duration: seconds(5.8)},
  realtime: {from: seconds(22.3), duration: seconds(5.7)},
  leaderboard: {from: seconds(27.5), duration: seconds(5.0)},
  reward: {from: seconds(31.9), duration: seconds(4.6)},
  outro: {from: seconds(36.0), duration: OCTOPUS_WALKTHROUGH_DURATION - seconds(36.0)},
};

export const PIXLProductWalkthroughOctopus = () => {
  return (
    <WalkthroughBrandingProvider value={octopusWalkthroughBranding}>
      <AbsoluteFill style={{overflow: "hidden"}}>
        <PremiumBackground />
        <SceneFrame from={octopusSceneTimings.intro.from} duration={octopusSceneTimings.intro.duration} preset="hero">
          <IntroSceneOctopus />
        </SceneFrame>
        <SceneFrame from={octopusSceneTimings.app.from} duration={octopusSceneTimings.app.duration} preset="browser">
          <AppOverviewScene />
        </SceneFrame>
        <SceneFrame from={octopusSceneTimings.wallet.from} duration={octopusSceneTimings.wallet.duration} preset="focus">
          <ConnectWalletScene />
        </SceneFrame>
        <SceneFrame from={octopusSceneTimings.loop.from} duration={octopusSceneTimings.loop.duration} preset="data">
          <CoreLoopScene />
        </SceneFrame>
        <SceneFrame from={octopusSceneTimings.paint.from} duration={octopusSceneTimings.paint.duration} preset="canvas">
          <PaintScene />
        </SceneFrame>
        <SceneFrame from={octopusSceneTimings.realtime.from} duration={octopusSceneTimings.realtime.duration} preset="battle">
          <RealtimeScene />
        </SceneFrame>
        <SceneFrame from={octopusSceneTimings.leaderboard.from} duration={octopusSceneTimings.leaderboard.duration} preset="status">
          <LeaderboardScene pace={0.52} />
        </SceneFrame>
        <SceneFrame from={octopusSceneTimings.reward.from} duration={octopusSceneTimings.reward.duration} preset="reward">
          <RewardSceneOctopus />
        </SceneFrame>
        <SceneFrame from={octopusSceneTimings.outro.from} duration={octopusSceneTimings.outro.duration} preset="cta">
          <OutroSceneOctopus />
        </SceneFrame>

        <TransitionBridgeSequence from={octopusSceneTimings.app.from - 10} duration={26} effects={[{type: "pixelSweep"}]} />
        <TransitionBridgeSequence
          from={octopusSceneTimings.wallet.from - 10}
          duration={24}
          effects={[
            {type: "cameraPush", focus: {x: 1460, y: 196, width: 250, height: 74}},
            {type: "pixelSweep", accent: "#ffffff"},
          ]}
        />
        <TransitionBridgeSequence
          from={octopusSceneTimings.loop.from - 8}
          duration={24}
          effects={[
            {type: "cardMorph", fromRect: {x: 1160, y: 292, width: 360, height: 214}, toRect: {x: 1060, y: 244, width: 454, height: 238}},
            {type: "cameraPush", focus: {x: 1100, y: 274, width: 430, height: 254}},
          ]}
        />
        <TransitionBridgeSequence
          from={octopusSceneTimings.paint.from - 8}
          duration={26}
          effects={[
            {type: "pixelDissolve", origin: {x: 850, y: 248, width: 420, height: 420}},
            {type: "cameraPush", focus: {x: 790, y: 212, width: 520, height: 520}},
          ]}
        />
        <TransitionBridgeSequence
          from={octopusSceneTimings.realtime.from - 10}
          duration={22}
          effects={[
            {type: "pixelSweep"},
            {type: "pixelDissolve", origin: {x: 1160, y: 170, width: 520, height: 520}},
          ]}
        />
        <TransitionBridgeSequence
          from={octopusSceneTimings.leaderboard.from - 8}
          duration={24}
          effects={[
            {type: "spotlight", origin: {x: 1440, y: 420}, radius: 420},
            {type: "cameraPush", focus: {x: 180, y: 188, width: 650, height: 420}},
          ]}
        />
        <TransitionBridgeSequence
          from={octopusSceneTimings.reward.from - 8}
          duration={22}
          effects={[{type: "spotlight", origin: {x: 560, y: 460}, radius: 360}]}
        />
        <TransitionBridgeSequence
          from={octopusSceneTimings.outro.from - 8}
          duration={20}
          effects={[{type: "spotlight", origin: {x: 1380, y: 620}, radius: 400}]}
        />
      </AbsoluteFill>
    </WalkthroughBrandingProvider>
  );
};

export const PIXLProductTeaserOctopus = () => {
  return (
    <WalkthroughBrandingProvider value={octopusWalkthroughBranding}>
      <AbsoluteFill style={{overflow: "hidden"}}>
        <PremiumBackground intensity={1.05} />
        <SceneFrame from={0} duration={seconds(6.2)} preset="hero">
          <IntroSceneOctopus />
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
          <OutroSceneOctopus />
        </SceneFrame>
      </AbsoluteFill>
    </WalkthroughBrandingProvider>
  );
};
