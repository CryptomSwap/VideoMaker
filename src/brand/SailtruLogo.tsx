import React from "react";
import {Img, staticFile} from "remotion";
import {
  SAILTRU_LOGO_ASPECT,
  SAILTRU_LOGO_HULL,
  SAILTRU_LOGO_MONO_MASK,
} from "./sailtru";

export type SailtruLogoProps = {
  height: number;
  /** Sail + wordmark color. Hull blues stay fixed. */
  mono: string;
  style?: React.CSSProperties;
};

/**
 * Official Sailtru lockup: transparent, mono adapts to the surface behind it.
 */
export const SailtruLogo: React.FC<SailtruLogoProps> = ({height, mono, style}) => {
  const width = height * SAILTRU_LOGO_ASPECT;
  const mask = staticFile(SAILTRU_LOGO_MONO_MASK);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        flexShrink: 0,
        ...style,
      }}
    >
      <Img
        src={staticFile(SAILTRU_LOGO_HULL)}
        name="Sailtru hull"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: mono,
          WebkitMaskImage: `url(${mask})`,
          maskImage: `url(${mask})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </div>
  );
};
