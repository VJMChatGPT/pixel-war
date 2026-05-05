import {interpolate} from "remotion";
import {clamp, easeOut} from "./constants";

export const LEADERBOARD_STAGE_TWO_START = 0.34;
export const LEADERBOARD_STAGE_THREE_START = 0.64;

export const getLeaderboardStage = (transitionProgress: number) => {
  if (transitionProgress < LEADERBOARD_STAGE_TWO_START) {
    return "start" as const;
  }

  if (transitionProgress < LEADERBOARD_STAGE_THREE_START) {
    return "mid" as const;
  }

  return "end" as const;
};

export const interpolateLeaderboardValue = (
  transitionProgress: number,
  start: number,
  middle: number,
  end: number,
) => {
  if (transitionProgress < LEADERBOARD_STAGE_TWO_START) {
    return interpolate(
      transitionProgress,
      [0, LEADERBOARD_STAGE_TWO_START],
      [start, middle],
      {...clamp, easing: easeOut},
    );
  }

  if (transitionProgress < LEADERBOARD_STAGE_THREE_START) {
    return middle;
  }

  return interpolate(
    transitionProgress,
    [LEADERBOARD_STAGE_THREE_START, 1],
    [middle, end],
    {...clamp, easing: easeOut},
  );
};
