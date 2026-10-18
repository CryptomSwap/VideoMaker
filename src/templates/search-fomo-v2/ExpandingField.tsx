import React from "react";
import {Easing, interpolate, interpolateColors, useCurrentFrame} from "remotion";
import {colors} from "../../tokens";
import {searchField} from "./layout";
import {SEARCH_FRAMES, TRANSITION_FRAMES} from "./template";

const boomEase = Easing.bezier(0.18, 1, 0.32, 1);
export const FILL_END = 8;

export const fillTopAt = (local: number): number => {
  const tFill = interpolate(local, [0, FILL_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const barTop = searchField.top + searchField.height - 36;
  return interpolate(tFill, [0, 1], [barTop, searchField.top]);
};

/**
 * The underline fills the search field, then that field becomes the frame.
 * Two stages so the fill is readable — spring-eased one-shot ate the gesture.
 */
export const ExpandingField: React.FC = () => {
  const global = useCurrentFrame();
  const local = global - (SEARCH_FRAMES - TRANSITION_FRAMES);
  if (local < 0) {
    return null;
  }

  const tFill = interpolate(local, [0, FILL_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const tBoom = interpolate(local, [FILL_END, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: boomEase,
  });

  const barLeft = searchField.left + 28;
  const barTop = searchField.top + searchField.height - 36;
  const barWidth = searchField.width - 56;
  const barHeight = 4;

  const filledLeft = interpolate(tFill, [0, 1], [barLeft, searchField.left]);
  const filledTop = interpolate(tFill, [0, 1], [barTop, searchField.top]);
  const filledWidth = interpolate(tFill, [0, 1], [barWidth, searchField.width]);
  const filledHeight = interpolate(tFill, [0, 1], [barHeight, searchField.height]);
  const filledRadius = interpolate(tFill, [0, 1], [2, searchField.radius]);

  const left = interpolate(tBoom, [0, 1], [filledLeft, 0]);
  const top = interpolate(tBoom, [0, 1], [filledTop, 0]);
  const width = interpolate(tBoom, [0, 1], [filledWidth, 1080]);
  const height = interpolate(tBoom, [0, 1], [filledHeight, 1920]);
  const radius = interpolate(tBoom, [0, 1], [filledRadius, 0]);
  const fill = interpolateColors(
    tFill,
    [0, 0.35, 1],
    [colors.ink, colors.blue, colors.blue],
  );

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius: radius,
        backgroundColor: fill,
      }}
    />
  );
};
