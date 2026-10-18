import React from "react";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import {AbsoluteFill, interpolate} from "remotion";
import {searchField} from "../search-fomo-v2/layout";

const OpeningToChatPresentation: React.FC<
  TransitionPresentationComponentProps<Record<string, unknown>>
> = ({children, presentationDirection, presentationProgress}) => {
  const t = presentationProgress;
  const left = interpolate(t, [0, 1], [searchField.left + 28, 0]);
  const top = interpolate(t, [0, 1], [searchField.top + searchField.height - 36, 0]);
  const width = interpolate(t, [0, 1], [searchField.width - 56, 1080]);
  const height = interpolate(t, [0, 1], [4, 1920]);
  const radius = interpolate(t, [0, 1], [2, 0]);

  if (presentationDirection === "entering") {
    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left,
            top,
            width,
            height,
            borderRadius: radius,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
    );
  }

  const fade = interpolate(t, [0.55, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <AbsoluteFill style={{opacity: fade}}>{children}</AbsoluteFill>;
};

export const openingToChat = (): TransitionPresentation<Record<string, unknown>> => {
  return {
    component: OpeningToChatPresentation,
    props: {},
  };
};
