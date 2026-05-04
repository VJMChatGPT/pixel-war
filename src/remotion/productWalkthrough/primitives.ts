import type {CSSProperties} from "react";
import {interpolate} from "remotion";
import {COLORS, FONT, clamp, easeOut} from "./constants";

export const textStyle: CSSProperties = {
  fontFamily: FONT.display,
  color: COLORS.text,
  letterSpacing: 0,
};

export const monoStyle: CSSProperties = {
  fontFamily: FONT.mono,
  letterSpacing: 0,
};

export const fade = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {...clamp, easing: easeOut});

export const fadeOut = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [1, 0], {...clamp, easing: easeOut});
