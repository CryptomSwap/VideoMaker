import React from "react";
import {SailtruLogo} from "../brand/SailtruLogo";
import {sailtruLogoMono} from "../brand/sailtru";
import {typeRole} from "./type";

/** Official Sailtru lockup for light (cream/paper) surfaces. */
export const Wordmark: React.FC<{
  top: number;
  left: number;
  /** Render height of the lockup; defaults to wordmark role size. */
  logoHeight?: number;
}> = ({top, left, logoHeight}) => {
  const role = typeRole.wordmark;
  const height = logoHeight ?? role.fontSize * 1.35;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        display: "flex",
        alignItems: "center",
      }}
    >
      <SailtruLogo height={height} mono={sailtruLogoMono("light")} />
    </div>
  );
};
