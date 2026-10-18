import React from "react";
import {Sequence, useCurrentFrame} from "remotion";
import {pulseAt, sharpOut, smooth} from "../../motion/pulse";
import {heeboFamily} from "../../motion/fonts";
import {typeRole} from "../../motion/type";
import {EndCard, type EndCardTimeline} from "./EndCard";
import type {PulseSpec} from "../../motion/pulse";
import {PULSE_ONE, PULSE_TWO, type EndCardCopy} from "./template";

const PulseLine: React.FC<{
  name: string;
  text: string;
  opacity: number;
  scale: number;
  entering: boolean;
  fontSize?: number;
}> = ({name, text, opacity, scale, entering, fontSize}) => {
  const pulse = typeRole.pulse;

  if (opacity <= 0) {
    return null;
  }

  return (
    <Sequence name={name} layout="none">
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity,
          scale: String(scale),
          filter: entering ? `blur(${(1 - opacity) * 8}px)` : undefined,
          fontFamily: heeboFamily,
          fontSize: fontSize ?? pulse.fontSize,
          fontWeight: pulse.fontWeight,
          letterSpacing: pulse.letterSpacing,
          lineHeight: pulse.lineHeight,
          color: pulse.color,
          textAlign: "center",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
    </Sequence>
  );
};

export const BlueScene: React.FC<{
  pulseOne: string;
  pulseTwo: string;
  endCard: EndCardCopy;
  pulseOneSpec?: PulseSpec;
  pulseTwoSpec?: PulseSpec;
  endTimeline?: EndCardTimeline;
  pulseFontSize?: number;
}> = ({
  pulseOne,
  pulseTwo,
  endCard,
  pulseOneSpec = PULSE_ONE,
  pulseTwoSpec = PULSE_TWO,
  endTimeline,
  pulseFontSize,
}) => {
  const local = useCurrentFrame();
  const one = pulseAt(local, pulseOneSpec, smooth);
  const two = pulseAt(local, pulseTwoSpec, sharpOut);

  return (
    <>
      <PulseLine
        name="Pulse one"
        text={pulseOne}
        opacity={one.opacity}
        scale={one.scale}
        entering={one.entering}
        fontSize={pulseFontSize}
      />
      <PulseLine
        name="Pulse two"
        text={pulseTwo}
        opacity={two.opacity}
        scale={two.scale}
        entering={two.entering}
        fontSize={pulseFontSize}
      />
      <EndCard copy={endCard} timeline={endTimeline} />
    </>
  );
};
