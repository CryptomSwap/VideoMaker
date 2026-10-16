import React from "react";
import {AbsoluteFill, useVideoConfig} from "remotion";
import type {safeAreaSchema} from "../../pipeline/schema";
import type {z} from "zod";

type SafeArea = z.infer<typeof safeAreaSchema>;

export const SafeAreaGuides: React.FC<{safeArea: SafeArea}> = ({safeArea}) => {
  const {width, height} = useVideoConfig();
  const boxWidth = width - safeArea.left - safeArea.right;
  const boxHeight = height - safeArea.top - safeArea.bottom;

  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          left: safeArea.left,
          top: safeArea.top,
          width: boxWidth,
          height: boxHeight,
          border: "2px dashed rgba(59, 99, 255, 0.55)",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: safeArea.left,
          top: 24,
          padding: "4px 8px",
          backgroundColor: "rgba(59, 99, 255, 0.9)",
          color: "#fff",
          fontSize: 16,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Safe area guide
      </div>
    </AbsoluteFill>
  );
};
