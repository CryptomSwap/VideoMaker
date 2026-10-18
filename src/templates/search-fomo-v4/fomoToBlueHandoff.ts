import {blueRectAt, clamp01} from "../search-fomo-v3/fomo";
import {smooth} from "../../motion/pulse";

/** Shared ease for FOMO → blue (hook scene + transition presentation). */
export const fomoBlueExpandEase = (linearProgress: number): number => {
  return smooth(clamp01(linearProgress));
};

export const fomoBlueHandoffT = (
  localFrame: number,
  handoffFrom: number,
  handoffFrames: number,
): number => {
  if (localFrame < handoffFrom) {
    return 0;
  }
  return fomoBlueExpandEase((localFrame - handoffFrom) / Math.max(1, handoffFrames));
};

export const fomoBlueExpandRect = (linearProgress: number) => {
  return blueRectAt(fomoBlueExpandEase(linearProgress));
};
