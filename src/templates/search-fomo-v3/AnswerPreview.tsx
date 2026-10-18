import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {ChatGPTPanel} from "./ChatGPTPanel";
import {THINK_FROM} from "./template";
import {answerCompleteFrame} from "./wordReveal";

/** Standalone proof of the word-by-word answer — no screenshot fade. */
export const ANSWER_PREVIEW_FRAMES = 7 + answerCompleteFrame() + 24;

export const AnswerPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "#E8ECF4"}}>
      <Sequence from={-THINK_FROM} durationInFrames={THINK_FROM + ANSWER_PREVIEW_FRAMES}>
        <ChatGPTPanel />
      </Sequence>
    </AbsoluteFill>
  );
};
