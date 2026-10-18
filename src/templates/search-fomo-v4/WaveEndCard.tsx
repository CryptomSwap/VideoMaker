import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {SailtruLogo} from "../../brand/SailtruLogo";
import {sailtruLogoMono} from "../../brand/sailtru";
import {heeboFamily} from "../../motion/fonts";
import {colors} from "../../tokens";
import {
  ctaLabelEnter,
  ctaShellEnter,
  deriveEndCardTiming,
  logoEnter,
  serviceEnter,
  servicesSeparatorOpacity,
  wordEnter,
} from "./endCardMotion";
import {END_CTA_FROM, END_SERVICES_FROM, searchFomoV4EndCard} from "./template";

const copy = searchFomoV4EndCard;
const motion = deriveEndCardTiming(copy);

const HeadlineWord: React.FC<{
  text: string;
  start: number;
  local: number;
  brand?: boolean;
}> = ({text, start, local, brand}) => {
  const p = wordEnter(local, start);
  const lift = brand ? 18 : 14;
  const scale = brand ? 0.9 + 0.1 * p : 1;

  return (
    <span
      style={{
        display: "inline-block",
        opacity: p,
        transform: `translateY(${lift * (1 - p)}px) scale(${scale})`,
        transformOrigin: brand ? "left bottom" : "left center",
        fontWeight: brand ? 800 : 400,
        color: brand ? colors.blue : colors.ink,
        letterSpacing: brand ? "-0.045em" : undefined,
      }}
    >
      {text}
    </span>
  );
};

export const WaveEndCard: React.FC = () => {
  const local = useCurrentFrame();
  const logo = logoEnter(local);
  const ctaShell = ctaShellEnter(local, END_CTA_FROM);
  const ctaLabel = ctaLabelEnter(local, END_CTA_FROM);

  const line0: React.ReactNode[] = [];
  const line1: React.ReactNode[] = [];

  motion.headlineTokens.forEach((token, index) => {
    const prev = motion.headlineTokens[index - 1];
    const start = motion.headlineStarts[index] ?? END_SERVICES_FROM;
    const needsSpace = Boolean(prev && prev.line === token.line);
    const node = (
      <React.Fragment key={`${token.text}-${index}`}>
        {needsSpace ? <span> </span> : null}
        <HeadlineWord
          text={token.text}
          start={start}
          local={local}
          brand={token.emphasis === "brand"}
        />
      </React.Fragment>
    );
    if (token.line === 0) {
      line0.push(node);
    } else {
      line1.push(node);
    }
  });

  const headlineStyle = {
    fontFamily: heeboFamily,
    fontSize: 52,
    fontWeight: 400,
    letterSpacing: "-0.038em",
    lineHeight: 1.12,
    color: colors.ink,
  } as const;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 1220,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 156,
        paddingLeft: 64,
        paddingRight: 64,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          opacity: interpolate(logo, [0, 0.4, 1], [0, 1, 1]),
          transform: `translateY(${28 * (1 - logo)}px) scale(${0.88 + 0.12 * logo})`,
        }}
      >
        <SailtruLogo height={132} mono={sailtruLogoMono("light")} />
      </div>

      <div
        style={{
          marginTop: 48,
          textAlign: "center",
          maxWidth: 920,
        }}
      >
        <div style={headlineStyle}>{line0}</div>
        <div style={{...headlineStyle, marginTop: 10}}>{line1}</div>
      </div>

      <div
        style={{
          marginTop: 32,
          fontFamily: heeboFamily,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: colors.inkMuted,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 0,
        }}
      >
        {motion.serviceParts.map((part, index) => (
          <React.Fragment key={part}>
            {index > 0 ? (
              <span
                style={{
                  opacity: servicesSeparatorOpacity(
                    local,
                    index - 1,
                    END_SERVICES_FROM,
                  ),
                  marginLeft: 10,
                  marginRight: 10,
                }}
              >
                ·
              </span>
            ) : null}
            <span
              style={{
                display: "inline-block",
                opacity: serviceEnter(local, index, END_SERVICES_FROM),
                transform: `translateY(${
                  12 *
                  (1 - serviceEnter(local, index, END_SERVICES_FROM))
                }px)`,
                letterSpacing: `${interpolate(
                  serviceEnter(local, index, END_SERVICES_FROM),
                  [0, 1],
                  [0.22, 0.12],
                )}em`,
              }}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      <div
        style={{
          marginTop: 48,
          opacity: ctaShell,
          transform: `translateY(${24 * (1 - ctaShell)}px)`,
        }}
      >
        <div
          style={{
            minWidth: 520,
            height: 112,
            paddingLeft: 48,
            paddingRight: 48,
            borderRadius: 999,
            backgroundColor: colors.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 ${interpolate(ctaShell, [0, 1], [8, 18])}px ${interpolate(
              ctaShell,
              [0, 1],
              [20, 48],
            )}px rgba(59, 99, 255, ${interpolate(ctaShell, [0, 1], [0.15, 0.35])})`,
            transform: `scale(${0.82 + 0.18 * ctaShell})`,
            transformOrigin: "center center",
          }}
        >
          <div
            style={{
              fontFamily: heeboFamily,
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              opacity: ctaLabel,
              transform: `translateY(${10 * (1 - ctaLabel)}px)`,
            }}
          >
            {copy.cta}
          </div>
        </div>
      </div>
    </div>
  );
};
