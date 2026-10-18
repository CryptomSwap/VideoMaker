import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import type {ctaBlockSchema, Project} from "../../pipeline/schema";
import type {z} from "zod";
import {resolvePlacement} from "./placement";
import {usePreset} from "./usePreset";

type CtaBlock = z.infer<typeof ctaBlockSchema>;

export const CtaLayer: React.FC<{
  block: CtaBlock;
  project: Project;
  fontFamily: string;
}> = ({block, project, fontFamily}) => {
  const box = resolvePlacement(project, block.placement);
  const motion = usePreset(block.animation, block.delayFrames);
  const frame = useCurrentFrame();
  const filled = block.variant === "fill";
  const pulse = block.pulse === true;
  const glow = pulse
    ? interpolate(frame, [block.delayFrames + 8, block.delayFrames + 28], [0.35, 0.7], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const scale = pulse
    ? interpolate(frame, [block.delayFrames, block.delayFrames + 10], [0.97, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        display: "flex",
        justifyContent: box.textAlign === "center" ? "center" : "flex-start",
        opacity: motion.opacity,
        translate: `0px ${motion.translateY}px`,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "18px 36px",
          borderRadius: 999,
          backgroundColor: filled ? project.brand.accent : "transparent",
          border: filled ? "none" : `2px solid ${project.brand.accent}`,
          boxShadow:
            pulse && filled
              ? `0 0 ${28 + glow * 18}px rgba(116, 228, 255, ${0.18 + glow * 0.2})`
              : "none",
          color: filled ? "#FFFCFA" : project.brand.accent,
          fontFamily,
          fontSize: block.fontSize,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {block.text}
      </div>
    </div>
  );
};
