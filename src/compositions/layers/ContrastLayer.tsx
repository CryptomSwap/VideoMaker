import React from "react";
import {AbsoluteFill} from "remotion";
import type {contrastSchema} from "../../pipeline/schema";
import type {z} from "zod";

type Contrast = z.infer<typeof contrastSchema>;

const hexToRgb = (hex: string): string => {
  const value = hex.slice(1);
  const n = parseInt(value, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `${r}, ${g}, ${b}`;
};

export const ContrastLayer: React.FC<{contrast: Contrast}> = ({contrast}) => {
  if (contrast.scrim === "none") {
    return null;
  }

  const rgb = hexToRgb(contrast.color);
  const fill = `rgba(${rgb}, ${contrast.opacity})`;

  if (contrast.scrim === "full") {
    return <AbsoluteFill style={{backgroundColor: fill}} />;
  }

  const gradient =
    contrast.scrim === "bottom"
      ? `linear-gradient(to top, rgba(${rgb}, ${contrast.opacity}) 0%, rgba(${rgb}, 0) 58%)`
      : `linear-gradient(to bottom, rgba(${rgb}, ${contrast.opacity}) 0%, rgba(${rgb}, 0) 58%)`;

  return <AbsoluteFill style={{backgroundImage: gradient}} />;
};
