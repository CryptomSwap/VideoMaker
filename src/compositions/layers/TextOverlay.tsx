import React, {useLayoutEffect, useRef, useState} from "react";
import {cancelRender, continueRender, delayRender} from "remotion";
import {layoutText} from "../../pipeline/textLayout";
import type {CopyBlock, Project} from "../../pipeline/schema";
import {resolvePlacement} from "./placement";
import {usePreset} from "./usePreset";

export const TextOverlay: React.FC<{
  name: string;
  fieldPath: string;
  block: CopyBlock;
  project: Project;
  fontFamily: string;
  fontWeight: number;
  role: "headline" | "supporting";
  showOverflowBadge: boolean;
  failOnOverflow: boolean;
}> = ({
  name,
  fieldPath,
  block,
  project,
  fontFamily,
  fontWeight,
  role,
  showOverflowBadge,
  failOnOverflow,
}) => {
  const box = resolvePlacement(project, block.placement);
  const motion = usePreset(block.animation, block.delayFrames);
  const color = block.color ?? project.brand.ink;
  const maxHeight = box.height;
  const estimate = layoutText({
    text: block.text,
    maxWidthPx: box.width,
    maxHeightPx: maxHeight,
    fontSize: block.fontSize,
    minFontSize: block.minFontSize,
    lineHeight: block.lineHeight,
  });
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(estimate.overflow);
  const [handle] = useState(() => delayRender(`measure-${name}`));

  useLayoutEffect(() => {
    const el = ref.current;
    const measured = el
      ? el.scrollHeight > maxHeight + 1 || el.scrollWidth > box.width + 1
      : estimate.overflow;
    if (measured && failOnOverflow) {
      cancelRender(
        new Error(
          `ERROR ${fieldPath}: Copy cannot fit at minFontSize ${block.minFontSize}px. Shorten the copy or increase the placement box.`,
        ),
      );
      return;
    }
    setOverflow(measured);
    continueRender(handle);
  }, [
    block.minFontSize,
    block.text,
    box.width,
    estimate.overflow,
    failOnOverflow,
    fieldPath,
    handle,
    maxHeight,
  ]);

  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        textAlign: box.textAlign,
        opacity: motion.opacity,
        translate: `0px ${motion.translateY}px`,
        clipPath:
          block.animation === "masked-reveal"
            ? `inset(0 0 ${motion.clipPercent}% 0)`
            : undefined,
        color,
        fontFamily,
        fontWeight,
        fontSize: estimate.fontSize,
        lineHeight: block.lineHeight,
        letterSpacing: role === "headline" ? "-0.03em" : "-0.015em",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      }}
    >
      <div ref={ref}>{block.text}</div>
      {overflow && showOverflowBadge ? (
        <div
          style={{
            marginTop: 12,
            display: "inline-block",
            padding: "6px 10px",
            borderRadius: 6,
            backgroundColor: "#C81E1E",
            color: "#fff",
            fontFamily,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Overflow
        </div>
      ) : null}
    </div>
  );
};
