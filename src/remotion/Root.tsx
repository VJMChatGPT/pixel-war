import {Composition, Folder} from "remotion";
import {PixlLaunchVideo, PIXL_LAUNCH_DURATION, PIXL_LAUNCH_FPS} from "./PixlLaunchVideo";

export const RemotionRoot = () => {
  return (
    <Folder name="PIXL">
      <Composition
        id="PIXLLaunchX"
        component={PixlLaunchVideo}
        durationInFrames={PIXL_LAUNCH_DURATION}
        fps={PIXL_LAUNCH_FPS}
        width={1080}
        height={1920}
      />
    </Folder>
  );
};
