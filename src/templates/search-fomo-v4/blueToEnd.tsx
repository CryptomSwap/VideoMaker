import React from "react";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import {AbsoluteFill, Easing, interpolate} from "remotion";
import {colors} from "../../tokens";

const ease = Easing.bezier(0.55, 0, 0.45, 1);

const BlueToEndPresentation: React.FC<
  TransitionPresentationComponentProps<Record<string, unknown>>
> = ({children, presentationDirection, presentationProgress}) => {
  const t = ease(presentationProgress);

  if (presentationDirection === "entering") {
    const blueOpacity = interpolate(t, [0, 0.5, 1], [1, 0.06, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill>
        {children}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: colors.blue,
            opacity: blueOpacity,
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>
    );
  }

  return <AbsoluteFill>{children}</AbsoluteFill>;
};

export const blueToEnd = (): TransitionPresentation<Record<string, unknown>> => {
  return {
    component: BlueToEndPresentation,
    props: {},
  };
};
