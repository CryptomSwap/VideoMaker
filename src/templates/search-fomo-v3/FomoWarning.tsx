import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {heeboFamily} from "../../motion/fonts";
import {pulseAt, sharpOut, smooth} from "../../motion/pulse";
import {
  FOMO_LINE_ONE_COPY,
  FOMO_LINE_TWO_COPY,
  FOMO_NAVY,
  FOMO_NAVY_OPACITY,
  warningBox,
} from "./fomo";
import {FOMO_FROM, FOMO_LINE_ONE, FOMO_LINE_TWO} from "./template";

const Line: React.FC<{
  text: string;
  opacity: number;
  scale: number;
  fontSize: number;
}> = ({text, opacity, scale, fontSize}) => {
  if (opacity <= 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: warningBox.left,
        width: warningBox.width,
        top: warningBox.top,
        height: warningBox.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        scale: String(scale),
        fontFamily: heeboFamily,
        fontSize,
        fontWeight: 800,
        letterSpacing: "-0.06em",
        lineHeight: 0.98,
        color: "#FFFFFF",
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

export const FomoWarning: React.FC = () => {
  const local = useCurrentFrame();
  const one = pulseAt(local, FOMO_LINE_ONE, smooth);
  const two = pulseAt(local, FOMO_LINE_TWO, sharpOut);
  const navy = interpolate(
    local,
    [FOMO_FROM, FOMO_FROM + FOMO_LINE_ONE.enterFrames],
    [0, FOMO_NAVY_OPACITY],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  if (local < FOMO_FROM) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: FOMO_NAVY,
          opacity: navy,
        }}
      />
      <Line
        text={FOMO_LINE_ONE_COPY}
        opacity={one.opacity}
        scale={one.scale}
        fontSize={84}
      />
      <Line
        text={FOMO_LINE_TWO_COPY}
        opacity={two.opacity}
        scale={two.scale}
        fontSize={102}
      />
    </>
  );
};
