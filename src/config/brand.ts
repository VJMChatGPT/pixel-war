export const BRAND_CONFIG = {
  brandName: "Pixel Battle",
  ticker: "$P&H",
  tagline: "HOLD. PAINT. DEFEND. GROW.",
  description:
    "Green and teal pixel-art octopus branding for a competitive territory-painting game UI. Playful, premium, readable, and built around public canvas control.",
  colors: {
    backgroundDeep: "#051817",
    backgroundDark: "#0a2321",
    mintGreen: "#61f3bb",
    aquaHighlight: "#4ce5d0",
    textLight: "#ecfffa",
  },
  mascot: {
    idle: "/brand/octopus-idle.png",
    sleep: "/brand/octopus-sleep.png",
    shock: "/brand/octopus-shock.png",
    serious: "/brand/octopus-serious.png",
  },
  mark: {
    sm: "/mark/pixl-mark-32.png",
    lg: "/mark/pixl-mark-128.png",
  },
} as const;

export const brandName = BRAND_CONFIG.brandName;
export const tokenTicker = BRAND_CONFIG.ticker;
export const brandTagline = BRAND_CONFIG.tagline;
export const mascotPaths = BRAND_CONFIG.mascot;
export const markPaths = BRAND_CONFIG.mark;

export const WINNER_PRIZE_BADGE = "WINNER PRIZE";
export const WINNER_PRIZE_HEADLINE = "Win the round. Get the homepage slot + 50% of dev fees.";
export const WINNER_PRIZE_SUBLINE =
  "Advertise whatever you want here and receive half of the dev fees from this round.";
export const WINNER_PRIZE_RULES_COPY =
  "Win the round and you get the homepage promotion slot plus 50% of the dev fees collected during that round.";
export const WINNER_PRIZE_FEE_LABEL = "Estimated dev fees generated";
export const WINNER_PRIZE_SHARE_LABEL = "Estimated winner share";
export const WINNER_PRIZE_FEE_DISCLAIMER = "Final amount verified on-chain at round end.";
