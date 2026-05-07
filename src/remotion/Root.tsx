import {Composition, Folder} from "remotion";
import {PixlLaunchVideo, PIXL_LAUNCH_DURATION, PIXL_LAUNCH_FPS} from "./PixlLaunchVideo";
import {PixelWarOrigin, PIXEL_WAR_ORIGIN_DURATION, PIXEL_WAR_ORIGIN_FPS} from "./PixelWarOrigin";
import {
  PIXLProductTeaser,
  PIXLProductWalkthrough,
} from "./PIXLProductWalkthrough";
import {
  PIXL_TEASER_DURATION,
  PIXL_WALKTHROUGH_DURATION,
  PIXL_WALKTHROUGH_FPS,
  compositionPresets,
} from "./productWalkthrough/constants";

export const RemotionRoot = () => {
  return (
    <Folder name="PIXL">
      <Composition
        id="PIXLProductWalkthrough"
        component={PIXLProductWalkthrough}
        durationInFrames={PIXL_WALKTHROUGH_DURATION}
        fps={PIXL_WALKTHROUGH_FPS}
        width={compositionPresets.horizontal.width}
        height={compositionPresets.horizontal.height}
      />
      <Composition
        id="PIXLProductTeaser"
        component={PIXLProductTeaser}
        durationInFrames={PIXL_TEASER_DURATION}
        fps={PIXL_WALKTHROUGH_FPS}
        width={compositionPresets.horizontal.width}
        height={compositionPresets.horizontal.height}
      />
      <Composition
        id="PIXLLaunchX"
        component={PixlLaunchVideo}
        durationInFrames={PIXL_LAUNCH_DURATION}
        fps={PIXL_LAUNCH_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="PixelWarOrigin"
        component={PixelWarOrigin}
        durationInFrames={PIXEL_WAR_ORIGIN_DURATION}
        fps={PIXEL_WAR_ORIGIN_FPS}
        width={1920}
        height={1080}
      />
    </Folder>
  );
};
