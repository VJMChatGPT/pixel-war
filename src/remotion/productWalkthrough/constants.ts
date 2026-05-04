import {Easing} from "remotion";

export const PIXL_WALKTHROUGH_FPS = 30;
export const PIXL_WALKTHROUGH_WIDTH = 1920;
export const PIXL_WALKTHROUGH_HEIGHT = 1080;
export const PIXL_WALKTHROUGH_DURATION = 1620;

export const PIXL_TEASER_DURATION = 540;

export const COLORS = {
  ink: "#05050a",
  charcoal: "#0b0913",
  panel: "#11101c",
  panelSoft: "#181525",
  panelLift: "#211b35",
  border: "rgba(255,255,255,0.13)",
  borderStrong: "rgba(201,168,255,0.36)",
  text: "#fbf8ff",
  muted: "#aaa1bd",
  quiet: "#706781",
  purple: "#8a4dff",
  purpleDeep: "#5b2dba",
  lavender: "#c9a8ff",
  pink: "#ff6fae",
  blue: "#9bd9ff",
  gold: "#ffd16a",
  white: "#ffffff",
  green: "#7ee3ad",
  canvas: "#fbfaff",
  grid: "#ddd9e8",
};

export const PIXL_PALETTE = [
  "#f3e8ff",
  "#e0c8ff",
  "#c9a8ff",
  "#a78bff",
  "#9d4dff",
  "#8a4dff",
  "#7b2dff",
  "#5b2dba",
  "#3d1d7a",
  "#1a0b2e",
  "#ffffff",
  "#ff6fae",
  "#9bd9ff",
  "#ffd16a",
];

export const FONT = {
  display: "Space Grotesk, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  mono: "JetBrains Mono, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
};

export const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
export const popEase = Easing.bezier(0.34, 1.22, 0.64, 1);

export const seconds = (value: number) => Math.round(value * PIXL_WALKTHROUGH_FPS);

export const sceneTimings = {
  intro: {from: 0, duration: seconds(5.4)},
  app: {from: seconds(4.8), duration: seconds(5.6)},
  wallet: {from: seconds(9.8), duration: seconds(6.0)},
  loop: {from: seconds(15.2), duration: seconds(5.4)},
  paint: {from: seconds(20.0), duration: seconds(7.2)},
  realtime: {from: seconds(26.7), duration: seconds(7.0)},
  leaderboard: {from: seconds(33.2), duration: seconds(6.6)},
  reward: {from: seconds(39.2), duration: seconds(5.8)},
  outro: {from: seconds(44.2), duration: seconds(9.8)},
};

export const compositionPresets = {
  horizontal: {
    width: PIXL_WALKTHROUGH_WIDTH,
    height: PIXL_WALKTHROUGH_HEIGHT,
    fps: PIXL_WALKTHROUGH_FPS,
  },
  vertical: {
    width: 1080,
    height: 1920,
    fps: PIXL_WALKTHROUGH_FPS,
  },
};
