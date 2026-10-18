import type {ProviderItem, ProviderRotation} from "./schema";

export type ProviderLayerState = {
  provider: ProviderItem;
  opacity: number;
  scale: number;
  /** Incoming slides up through the clip. Outgoing slides up and out. */
  shiftY: number;
};

const clamp01 = (value: number): number => {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

const lerp = (from: number, to: number, t: number): number => {
  return from + (to - from) * clamp01(t);
};

/**
 * Inclusive/exclusive provider ranges with an overlapping crossfade.
 * First provider is fully visible at frame 0 (no entrance fade).
 * Last provider holds through endFrame (no fade to empty).
 */
export const providerLayerAt = (
  rotation: ProviderRotation,
  frame: number,
): ProviderLayerState[] => {
  const transition = rotation.transitionFrames;
  const lastIndex = rotation.providers.length - 1;

  return rotation.providers.map((provider, index) => {
    const isFirst = index === 0;
    const isLast = index === lastIndex;
    const fadeInStart = isFirst ? provider.startFrame : provider.startFrame - transition;
    const fadeInEnd = provider.startFrame;
    const fadeOutStart = isLast ? provider.endFrame : provider.endFrame - transition;
    const fadeOutEnd = provider.endFrame;

    let opacity = 0;
    if (frame >= fadeInEnd && frame < fadeOutStart) {
      opacity = 1;
    } else if (!isFirst && frame >= fadeInStart && frame < fadeInEnd) {
      const span = Math.max(1, fadeInEnd - fadeInStart);
      opacity = (frame - fadeInStart) / span;
    } else if (!isLast && frame >= fadeOutStart && frame < fadeOutEnd) {
      const span = Math.max(1, fadeOutEnd - fadeOutStart);
      opacity = 1 - (frame - fadeOutStart) / span;
    }

    opacity = clamp01(opacity);
    const scale = opacity <= 0 ? 1 : lerp(0.94, 1, opacity);
    const incoming = !isFirst && frame >= fadeInStart && frame < fadeInEnd;
    const outgoing = !isLast && frame >= fadeOutStart && frame < fadeOutEnd;
    let shiftY = 0;
    if (incoming) {
      shiftY = (1 - opacity) * 36;
    } else if (outgoing) {
      shiftY = (1 - opacity) * -28;
    }

    return {provider, opacity, scale, shiftY};
  });
};

export const visibleProvidersAt = (
  rotation: ProviderRotation,
  frame: number,
): ProviderLayerState[] => {
  return providerLayerAt(rotation, frame).filter((layer) => layer.opacity > 0);
};
