import {COLORS, PIXL_PALETTE} from "./constants";

export type BoardPixel = {
  x: number;
  y: number;
  color: string;
  delay: number;
  owner: string;
};

export type LeaderboardEntry = {
  rank: number;
  wallet: string;
  pixels: number;
  points: string;
  color: string;
};

export type ActivityEvent = {
  label: string;
  wallet: string;
  x: number;
  y: number;
  color: string;
  delay: number;
};

const seeded = (seed: number) => {
  const value = Math.sin(seed * 928.318) * 10000;
  return value - Math.floor(value);
};

export const featuredWallet = "9pXL...8f2A";

export const territoryBlocks = [
  {x: 9, y: 12, w: 18, h: 16, color: COLORS.purple, owner: "7hC2...91q"},
  {x: 38, y: 10, w: 22, h: 19, color: COLORS.blue, owner: "4b7Q...e91"},
  {x: 66, y: 15, w: 20, h: 16, color: COLORS.lavender, owner: "Zk88...Qa1"},
  {x: 15, y: 47, w: 24, h: 22, color: COLORS.pink, owner: "6pX9...7Hd"},
  {x: 47, y: 43, w: 32, h: 26, color: COLORS.purpleDeep, owner: featuredWallet},
  {x: 19, y: 75, w: 28, h: 16, color: COLORS.gold, owner: "2vP7...nA9"},
  {x: 65, y: 73, w: 22, h: 18, color: COLORS.green, owner: "Gm42...Lv5"},
];

export const userPaintPath = [
  {x: 51, y: 49},
  {x: 52, y: 49},
  {x: 53, y: 49},
  {x: 54, y: 49},
  {x: 51, y: 50},
  {x: 52, y: 50},
  {x: 53, y: 50},
  {x: 54, y: 50},
  {x: 52, y: 51},
  {x: 53, y: 51},
  {x: 55, y: 49},
  {x: 55, y: 50},
  {x: 55, y: 51},
  {x: 50, y: 51},
  {x: 50, y: 52},
  {x: 51, y: 52},
  {x: 52, y: 52},
  {x: 53, y: 52},
];

export const boardPixels: BoardPixel[] = Array.from({length: 620}, (_, index) => ({
  x: Math.floor(seeded(index + 2) * 100),
  y: Math.floor(seeded(index + 38) * 100),
  color: PIXL_PALETTE[Math.floor(seeded(index + 84) * PIXL_PALETTE.length)],
  delay: Math.floor(seeded(index + 155) * 190),
  owner: `wallet-${Math.floor(seeded(index + 270) * 7)}`,
}));

export const activityEvents: ActivityEvent[] = [
  {label: "+4 pixels", wallet: "A7f...19c", x: 365, y: 272, color: COLORS.blue, delay: 8},
  {label: "takeover", wallet: "9pXL...8f2A", x: 968, y: 512, color: COLORS.purple, delay: 36},
  {label: "+12 streak", wallet: "Mb2...0e9", x: 1288, y: 344, color: COLORS.pink, delay: 62},
  {label: "defended", wallet: "Gm4...Lv5", x: 1270, y: 724, color: COLORS.green, delay: 91},
  {label: "+8 pixels", wallet: "2vP...nA9", x: 600, y: 772, color: COLORS.gold, delay: 122},
];

export const leaderboard: LeaderboardEntry[] = [
  {rank: 1, wallet: "4b7Q...e91", pixels: 812, points: "42.8K", color: COLORS.lavender},
  {rank: 2, wallet: "7hC2...91q", pixels: 694, points: "39.4K", color: COLORS.blue},
  {rank: 3, wallet: featuredWallet, pixels: 648, points: "37.1K", color: COLORS.purple},
  {rank: 4, wallet: "Gm42...Lv5", pixels: 521, points: "30.6K", color: COLORS.green},
  {rank: 5, wallet: "2vP7...nA9", pixels: 386, points: "24.9K", color: COLORS.gold},
];

export const promotedLeaderboard = [
  {rank: 1, wallet: featuredWallet, pixels: 904, points: "48.2K", color: COLORS.purple},
  {rank: 2, wallet: "4b7Q...e91", pixels: 812, points: "42.8K", color: COLORS.lavender},
  {rank: 3, wallet: "7hC2...91q", pixels: 694, points: "39.4K", color: COLORS.blue},
  {rank: 4, wallet: "Gm42...Lv5", pixels: 521, points: "30.6K", color: COLORS.green},
  {rank: 5, wallet: "2vP7...nA9", pixels: 386, points: "24.9K", color: COLORS.gold},
];

export const promotedLeaderboardMid = [
  {rank: 1, wallet: "4b7Q...e91", pixels: 836, points: "43.9K", color: COLORS.lavender},
  {rank: 2, wallet: featuredWallet, pixels: 782, points: "41.2K", color: COLORS.purple},
  {rank: 3, wallet: "7hC2...91q", pixels: 694, points: "39.4K", color: COLORS.blue},
  {rank: 4, wallet: "Gm42...Lv5", pixels: 521, points: "30.6K", color: COLORS.green},
  {rank: 5, wallet: "2vP7...nA9", pixels: 386, points: "24.9K", color: COLORS.gold},
];
