/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type ReactNode,
  useContext,
} from "react";
import {BRAND_CONFIG} from "../../config/brand";
import type {MascotMood} from "./components/visuals";

export type WalkthroughBranding = {
  wordmark: string;
  bugSubtitle: string;
  brandBugMood: MascotMood;
  tokenTicker: string;
  alternateName: string;
  domain: string;
  accent: string;
  accentSoft: string;
  backgroundDeep: string;
  backgroundDark: string;
  mascotAssets: Partial<Record<MascotMood, string>>;
};

const defaultBranding: WalkthroughBranding = {
  wordmark: "PIXL",
  bugSubtitle: "product walkthrough",
  brandBugMood: "normal",
  tokenTicker: "$PIXL",
  alternateName: "PIXL",
  domain: "pixelwarcoin.com",
  accent: "#8a4dff",
  accentSoft: "#c9a8ff",
  backgroundDeep: "#05050a",
  backgroundDark: "#0b0913",
  mascotAssets: {
    normal: "assets/mascot/pixl-normal.png",
    waving: "assets/mascot/pixl-waving.png",
    happy: "assets/mascot/pixl-happy.png",
    sleeping: "assets/mascot/pixl-sleeping.png",
  },
};

const walkthroughBrandingContext = createContext<WalkthroughBranding>(defaultBranding);

export const WalkthroughBrandingProvider = ({
  value,
  children,
}: {
  value: WalkthroughBranding;
  children: ReactNode;
}) => {
  const merged = {
    ...defaultBranding,
    ...value,
    mascotAssets: {
      ...defaultBranding.mascotAssets,
      ...value.mascotAssets,
    },
  } satisfies WalkthroughBranding;

  return (
    <walkthroughBrandingContext.Provider value={merged}>
      {children}
    </walkthroughBrandingContext.Provider>
  );
};

export const useWalkthroughBranding = () => useContext(walkthroughBrandingContext);

export const octopusWalkthroughBranding: WalkthroughBranding = {
  wordmark: BRAND_CONFIG.brandName,
  bugSubtitle: "Paint & Hold walkthrough",
  brandBugMood: "waving",
  tokenTicker: "$P&H",
  alternateName: "Paint & Hold",
  domain: "pixelwarcoin.com",
  accent: BRAND_CONFIG.colors.mintGreen,
  accentSoft: BRAND_CONFIG.colors.aquaHighlight,
  backgroundDeep: BRAND_CONFIG.colors.backgroundDeep,
  backgroundDark: BRAND_CONFIG.colors.backgroundDark,
  mascotAssets: {
    normal: "brand/octopus-serious.png",
    waving: "brand/octopus-idle.png",
    happy: "brand/octopus-shock.png",
    sleeping: "brand/octopus-sleep.png",
  },
};
