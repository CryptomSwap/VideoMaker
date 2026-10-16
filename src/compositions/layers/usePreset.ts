import {Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {animationPresetSchema} from "../../pipeline/schema";
import type {z} from "zod";

type Preset = z.infer<typeof animationPresetSchema>;

export const usePreset = (
  preset: Preset,
  delayFrames: number,
): {
  opacity: number;
  translateY: number;
  clipPercent: number;
} => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - delayFrames;
  const duration = Math.max(8, Math.round(fps * 0.35));
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  if (preset === "none" || local >= duration) {
    return {opacity: local < 0 ? 0 : 1, translateY: 0, clipPercent: 0};
  }

  if (local < 0) {
    return {opacity: 0, translateY: preset === "rise" ? 28 : 0, clipPercent: 100};
  }

  const opacity = interpolate(local, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const translateY =
    preset === "rise"
      ? interpolate(local, [0, duration], [28, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        })
      : 0;
  const clipPercent =
    preset === "masked-reveal"
      ? interpolate(local, [0, duration], [100, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        })
      : 0;

  return {opacity, translateY, clipPercent};
};
