import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {heeboFamily} from "../../motion/fonts";
import {smooth} from "../../motion/pulse";
import {
  FOMO_LINE_ONE_COPY,
  FOMO_LINE_TWO_COPY,
  FOMO_NAVY,
  FOMO_NAVY_OPACITY,
  warningBox,
} from "./fomo";
import {fomoBlueHandoffT} from "./fomoToBlueHandoff";
import {
  CHAT_TO_BLUE,
  FOMO_FROM,
  FOMO_LINE_ONE_ENTER,
  FOMO_LINE_ONE_FADE_OUT,
  FOMO_LINE_TWO_DELAY,
  FOMO_LINE_TWO_ENTER,
  FOMO_READY_FOR_BLUE,
} from "./template";

/** Line two clears before pulse one is meant to read (see PULSE_ONE.enterAt). */
export const FOMO_LINE_TWO_EXIT_FRACTION = 0.32;

export const FomoWarning: React.FC = () => {
  const local = useCurrentFrame();
  if (local < FOMO_FROM) {
    return null;
  }

  const t0 = local - FOMO_FROM;
  const navy = interpolate(
    local,
    [FOMO_FROM, FOMO_FROM + FOMO_LINE_ONE_ENTER],
    [0, FOMO_NAVY_OPACITY],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  const lineOneIn = smooth(t0 / Math.max(1, FOMO_LINE_ONE_ENTER));
  const lineOneHeld =
    t0 >= FOMO_LINE_ONE_ENTER && t0 < FOMO_LINE_TWO_DELAY ? 1 : lineOneIn;
  const lineOneFade = smooth(
    (t0 - FOMO_LINE_TWO_DELAY) / Math.max(1, FOMO_LINE_ONE_FADE_OUT),
  );
  const lineOneOpacity =
    t0 < FOMO_LINE_TWO_DELAY
      ? lineOneHeld
      : Math.max(0, lineOneHeld * (1 - lineOneFade));

  const lineTwoIn = smooth(
    (t0 - FOMO_LINE_TWO_DELAY) / Math.max(1, FOMO_LINE_TWO_ENTER),
  );
  const handoff = fomoBlueHandoffT(local, FOMO_READY_FOR_BLUE, CHAT_TO_BLUE);
  const lineTwoExit = smooth(
    Math.min(1, handoff / FOMO_LINE_TWO_EXIT_FRACTION),
  );
  const lineTwoOpacity =
    (t0 >= FOMO_LINE_TWO_DELAY ? lineTwoIn : 0) * (1 - lineTwoExit);

  const overlayOpacity =
    handoff > 0
      ? interpolate(handoff, [0.12, 0.72], [FOMO_NAVY_OPACITY, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : navy;

  const lineStyle = (opacity: number, fontSize: number, y: number) => ({
    position: "absolute" as const,
    left: warningBox.left,
    width: warningBox.width,
    top: warningBox.top + y,
    height: warningBox.height / 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity,
    fontFamily: heeboFamily,
    fontSize,
    fontWeight: 800,
    letterSpacing: "-0.055em",
    lineHeight: 1.02,
    color: "#FFFFFF",
    textAlign: "center" as const,
    padding: "0 8px",
  });

  if (handoff >= 1 && overlayOpacity <= 0 && lineTwoOpacity <= 0) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: FOMO_NAVY,
          opacity: overlayOpacity,
        }}
      />
      {lineOneOpacity > 0.01 ? (
        <div
          style={{
            ...lineStyle(lineOneOpacity, 92, 0),
            transform: `translateY(${20 * (1 - lineOneIn)}px)`,
          }}
        >
          {FOMO_LINE_ONE_COPY}
        </div>
      ) : null}
      {lineTwoOpacity > 0.01 ? (
        <div
          style={{
            ...lineStyle(lineTwoOpacity, 100, warningBox.height / 2 - 40),
            transform: `translateY(${24 * (1 - lineTwoIn)}px) scale(${
              0.94 + 0.06 * lineTwoIn
            })`,
          }}
        >
          {FOMO_LINE_TWO_COPY}
        </div>
      ) : null}
    </>
  );
};
