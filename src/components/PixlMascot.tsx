import { motion, useReducedMotion } from "framer-motion";

import { mascotPaths, tokenTicker } from "@/config/brand";
import { cn } from "@/lib/utils";

export type PixlMood = "idle" | "wave" | "paint" | "sleep" | "cheer" | "shock";

interface Props {
  mood?: PixlMood;
  size?: number;
  className?: string;
}

const MOOD_TO_SRC: Record<PixlMood, string> = {
  idle: mascotPaths.idle,
  wave: mascotPaths.idle,
  paint: mascotPaths.idle,
  sleep: mascotPaths.sleep,
  cheer: mascotPaths.idle,
  shock: mascotPaths.shock,
};

const MOOD_TO_ALT: Record<PixlMood, string> = {
  idle: `${tokenTicker} octopus mascot, idle mood`,
  wave: `${tokenTicker} octopus mascot, waving mood`,
  paint: `${tokenTicker} octopus mascot, painting mood`,
  sleep: `${tokenTicker} octopus mascot, sleep mood`,
  cheer: `${tokenTicker} octopus mascot, cheer mood`,
  shock: `${tokenTicker} octopus mascot, shock mood`,
};

const MOOD_TO_ANIMATION: Record<
  PixlMood,
  { animate?: Record<string, unknown>; transition?: Record<string, unknown> }
> = {
  idle: {
    animate: { y: [0, -4, 0] },
    transition: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
  },
  wave: {
    animate: { y: [0, -2, 0], rotate: [0, 5, -2, 4, 0] },
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
  },
  paint: {
    animate: { scale: [1, 1.04, 1], rotate: [0, -1.5, 1, 0] },
    transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
  },
  sleep: {
    animate: { y: [0, 1, 0], scale: [1, 1.02, 1] },
    transition: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
  },
  cheer: {
    animate: { y: [0, -5, 0], scale: [1, 1.03, 1] },
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
  shock: {
    animate: { x: [0, -2, 2, -1, 1, 0], rotate: [0, -1.5, 1.5, -1, 0] },
    transition: { duration: 0.45, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" },
  },
};

export function PixlMascot({ mood = "idle", size = 80, className }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const animation = prefersReducedMotion ? {} : MOOD_TO_ANIMATION[mood];

  return (
    <motion.img
      src={MOOD_TO_SRC[mood]}
      alt={MOOD_TO_ALT[mood]}
      className={cn("inline-block pixelated", className)}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
      }}
      animate={animation.animate}
      transition={animation.transition}
      draggable={false}
    />
  );
}
