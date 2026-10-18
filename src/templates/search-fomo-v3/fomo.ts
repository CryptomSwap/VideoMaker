import {pulseAt, pulseGoneAt, sharpOut, smooth, type PulseSpec} from "../../motion/pulse";
import {OPENING_FRAMES, OPEN_TO_CHAT} from "./template";

export const FOMO_LINE_ONE_COPY = "Not showing up?";
export const FOMO_LINE_TWO_COPY = "Your competitors are.";
export const FOMO_NAVY = "#091322";
export const FOMO_NAVY_OPACITY = 0.78;

export const warningBox = {
  left: 40,
  right: 40,
  width: 1000,
  top: 560,
  height: 640,
} as const;

export const clamp01 = (value: number): number => {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
};

export const fomoLocalToGlobal = (local: number): number => {
  return OPENING_FRAMES - OPEN_TO_CHAT + local;
};

export const lineHold = (spec: PulseSpec): {start: number; end: number} => {
  const start = spec.enterAt + spec.enterFrames;
  return {start, end: start + spec.holdFrames};
};

export const navyOpacityAtLocal = (
  local: number,
  overlayFrom: number,
  overlayFull: number,
): number => {
  if (local < overlayFrom) {
    return 0;
  }
  const t = clamp01((local - overlayFrom) / Math.max(1, overlayFull - overlayFrom));
  return t * FOMO_NAVY_OPACITY;
};

export const blueRectAt = (progress: number): {
  left: number;
  top: number;
  width: number;
  height: number;
} => {
  const t = clamp01(progress);
  const width = 8 + (1080 - 8) * t;
  const height = 4 + (1920 - 4) * t;
  return {
    left: (1080 - width) / 2,
    top: (1920 - height) / 2,
    width,
    height,
  };
};

export const blueExpandProgressAt = (
  globalFrame: number,
  blueStart: number,
  blueEnd: number,
): number => {
  if (globalFrame < blueStart) {
    return 0;
  }
  return clamp01((globalFrame - blueStart) / Math.max(1, blueEnd - blueStart));
};

export const lineFullyUp = (local: number, spec: PulseSpec): boolean => {
  const state = pulseAt(
    local,
    spec,
    spec.fromScale < 0.9 ? sharpOut : smooth,
  );
  return state.opacity >= 0.995 && !state.entering;
};

export const consecutiveLineHold = (
  durationLocal: number,
  spec: PulseSpec,
): number => {
  let best = 0;
  let run = 0;
  for (let frame = 0; frame < durationLocal; frame++) {
    if (lineFullyUp(frame, spec)) {
      run += 1;
      if (run > best) {
        best = run;
      }
    } else {
      run = 0;
    }
  }
  return best;
};

export const pulsesExclusive = (first: PulseSpec, second: PulseSpec): boolean => {
  return second.enterAt >= pulseGoneAt(first);
};
