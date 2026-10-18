export type PulseSpec = {
  enterAt: number;
  enterFrames: number;
  holdFrames: number;
  exitFrames: number;
  fromScale: number;
  exitScale: number;
};

export type PulseState = {
  opacity: number;
  scale: number;
  visible: boolean;
  entering: boolean;
};

const clamp01 = (value: number): number => {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
};

/** Smoothstep. No overshoot. */
export const smooth = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Sharper ease-out for the second beat. */
export const sharpOut = (t: number): number => {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x) * (1 - x);
};

export const pulseGoneAt = (spec: PulseSpec): number => {
  return spec.enterAt + spec.enterFrames + spec.holdFrames + spec.exitFrames;
};

export const pulseAt = (
  frame: number,
  spec: PulseSpec,
  ease: (t: number) => number,
): PulseState => {
  const holdStart = spec.enterAt + spec.enterFrames;
  const exitStart = holdStart + spec.holdFrames;
  const gone = exitStart + spec.exitFrames;

  if (frame < spec.enterAt || frame >= gone) {
    return {opacity: 0, scale: spec.fromScale, visible: false, entering: false};
  }

  if (frame < holdStart) {
    const t = ease((frame - spec.enterAt) / Math.max(1, spec.enterFrames));
    return {
      opacity: t,
      scale: spec.fromScale + (1 - spec.fromScale) * t,
      visible: true,
      entering: true,
    };
  }

  if (frame < exitStart) {
    return {opacity: 1, scale: 1, visible: true, entering: false};
  }

  const t = ease((frame - exitStart) / Math.max(1, spec.exitFrames));
  return {
    opacity: 1 - t,
    scale: 1 + (spec.exitScale - 1) * t,
    visible: t < 1,
    entering: false,
  };
};

export const pulsesOverlap = (
  frame: number,
  first: PulseSpec,
  second: PulseSpec,
): boolean => {
  const a = pulseAt(frame, first, smooth);
  const b = pulseAt(frame, second, sharpOut);
  return a.opacity > 0.02 && b.opacity > 0.02;
};
