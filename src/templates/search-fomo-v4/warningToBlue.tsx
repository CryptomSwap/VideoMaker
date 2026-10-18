import React from "react";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import {AbsoluteFill} from "remotion";
import {colors} from "../../tokens";
import {fomoBlueExpandRect} from "./fomoToBlueHandoff";

const WarningToBluePresentation: React.FC<
  TransitionPresentationComponentProps<Record<string, unknown>>
> = ({children, presentationDirection, presentationProgress}) => {
  if (presentationDirection !== "entering") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const rect = fomoBlueExpandRect(presentationProgress);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          overflow: "hidden",
          backgroundColor: colors.blue,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const warningToBlueV4 = (): TransitionPresentation<
  Record<string, unknown>
> => {
  return {
    component: WarningToBluePresentation,
    props: {},
  };
};
