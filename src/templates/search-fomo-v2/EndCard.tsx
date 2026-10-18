import React from "react";
import {Sequence, interpolate, useCurrentFrame} from "remotion";
import {SailtruLogo} from "../../brand/SailtruLogo";
import {sailtruLogoMono} from "../../brand/sailtru";
import {heeboFamily} from "../../motion/fonts";
import {smooth} from "../../motion/pulse";
import {typeRole} from "../../motion/type";
import {colors} from "../../tokens";
import {
  HANDOFF_AT,
  PILL_READY,
  RULE_AT,
  type EndCardCopy,
} from "./template";

export type EndCardTimeline = {
  handoffAt: number;
  ruleAt: number;
  pillReady: number;
};

/**
 * Shared outro. Pulse 2's center collapses into a rule, the rule becomes
 * the CTA pill. Copy is variant data, not a second composition.
 * Taste: convert, not another cut. Rejected stacked services-as-hero.
 */
export const EndCard: React.FC<{
  copy: EndCardCopy;
  timeline?: EndCardTimeline;
}> = ({
  copy,
  timeline = {handoffAt: HANDOFF_AT, ruleAt: RULE_AT, pillReady: PILL_READY},
}) => {
  const local = useCurrentFrame();
  const {handoffAt, ruleAt, pillReady} = timeline;
  if (local < handoffAt) {
    return null;
  }

  const bar = interpolate(local, [handoffAt, ruleAt], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pill = interpolate(local, [ruleAt, pillReady], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const copyIn = interpolate(local, [ruleAt + 2, ruleAt + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const descIn = interpolate(local, [ruleAt + 8, ruleAt + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelIn = interpolate(local, [pillReady - 6, pillReady], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const width = interpolate(bar, [0, 1], [80, 720]) + pill * 100;
  const height = interpolate(pill, [0, 1], [4, 128]);
  const top = interpolate(pill, [0, 1], [958, 1368]);
  const radius = interpolate(pill, [0, 1], [2, 999]);
  const fill = pill < 0.35 ? "#FFFFFF" : colors.cream;
  const statement = typeRole.statement;
  const descriptor = typeRole.descriptor;
  const cta = typeRole.cta;

  return (
    <>
      <Sequence name="Handoff pill" layout="none">
        <div
          style={{
            position: "absolute",
            left: 540 - width / 2,
            top,
            width,
            height,
            borderRadius: radius,
            backgroundColor: fill,
            opacity: Math.max(bar, pill),
          }}
        />
      </Sequence>
      <Sequence name="Official logo" layout="none">
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 268,
            display: "flex",
            justifyContent: "center",
            opacity: copyIn,
            scale: String(0.92 + 0.08 * smooth(copyIn)),
          }}
        >
          <SailtruLogo height={148} mono={sailtruLogoMono("dark")} />
        </div>
      </Sequence>
      <Sequence name="End statement" layout="none">
        <div
          style={{
            position: "absolute",
            left: 64,
            right: 64,
            top: 780,
            textAlign: "center",
            opacity: copyIn,
            translate: `0px ${22 * (1 - smooth(copyIn))}px`,
            clipPath: `inset(${(1 - copyIn) * 70}% 0 0 0)`,
            fontFamily: heeboFamily,
            fontSize: statement.fontSize,
            fontWeight: statement.fontWeight,
            letterSpacing: statement.letterSpacing,
            lineHeight: statement.lineHeight,
            color: statement.color,
            whiteSpace: "pre-wrap",
          }}
        >
          {copy.statement}
        </div>
      </Sequence>
      {copy.descriptor ? (
        <Sequence name="Descriptor" layout="none">
          <div
            style={{
              position: "absolute",
              left: 80,
              right: 80,
              top: copy.statement.includes("\n") ? 980 : 890,
              textAlign: "center",
              opacity: descIn,
              fontFamily: heeboFamily,
              fontSize: descriptor.fontSize,
              fontWeight: descriptor.fontWeight,
              letterSpacing: descriptor.letterSpacing,
              lineHeight: descriptor.lineHeight,
              color: descriptor.color,
            }}
          >
            {copy.descriptor}
          </div>
        </Sequence>
      ) : null}
      <Sequence name="Start diagnosis" layout="none">
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1368,
            height: 128,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: labelIn,
            fontFamily: heeboFamily,
            fontSize: cta.fontSize,
            fontWeight: cta.fontWeight,
            letterSpacing: cta.letterSpacing,
            lineHeight: cta.lineHeight,
            color: cta.color,
          }}
        >
          {copy.cta}
        </div>
      </Sequence>
    </>
  );
};
