import React from "react";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import {useTransitionProgress} from "@remotion/transitions";
import {AbsoluteFill, interpolate} from "remotion";

/**
 * Scenes stay opaque. The expanding rule is drawn by the parent.
 * Search type reads `leave` and gets out of the way of the fill.
 */
const FieldToLockupPresentation: React.FC<
  TransitionPresentationComponentProps<Record<string, unknown>>
> = ({children}) => {
  return <AbsoluteFill>{children}</AbsoluteFill>;
};

export const fieldToLockup = (): TransitionPresentation<Record<string, unknown>> => {
  return {
    component: FieldToLockupPresentation,
    props: {},
  };
};

export const useFieldProgress = (): {leave: number} => {
  const {exiting} = useTransitionProgress();
  const leave = interpolate(exiting, [0.42, 0.92], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {leave};
};
