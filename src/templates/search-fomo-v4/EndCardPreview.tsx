import React from "react";
import {AbsoluteFill} from "remotion";
import {EndScene} from "./EndScene";
import {END_FRAMES} from "./template";

/** Short preview of the wave end-card stagger. */
export const END_CARD_PREVIEW_FRAMES = END_FRAMES;

export const EndCardPreview: React.FC = () => {
  return (
    <AbsoluteFill>
      <EndScene />
    </AbsoluteFill>
  );
};
