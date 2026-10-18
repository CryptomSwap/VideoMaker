import React from "react";
import {AbsoluteFill} from "remotion";
import {linearTiming, TransitionSeries} from "@remotion/transitions";
import {z} from "zod";
import {AudioCues} from "../../motion/AudioCues";
import {colors} from "../../tokens";
import {BlueScene} from "../search-fomo-v2/BlueScene";
import {warningToBlueV4} from "./warningToBlue";
import {blueToEnd} from "./blueToEnd";
import {EndScene} from "./EndScene";
import {HookChatScene} from "./HookChatScene";
import {
  BLUE_FRAMES,
  BLUE_TO_END,
  END_FRAMES,
  HOOK_CHAT_FRAMES,
  CHAT_TO_BLUE,
  BLUE_PULSE_FONT_SIZE,
  PULSE_ONE,
  PULSE_TWO,
  searchFomoV4Defaults,
  searchFomoV4Template,
} from "./template";

export const searchFomoV4Schema = z.object({
  lead: z.string(),
  tail: z.string(),
  pulseOne: z.string(),
  pulseTwo: z.string(),
  showReelsChrome: z.boolean(),
});

export type SearchFomoV4Props = z.infer<typeof searchFomoV4Schema>;

export const searchFomoV4DefaultProps: SearchFomoV4Props = {
  ...searchFomoV4Defaults,
  showReelsChrome: false,
};

const hiddenEndTimeline = {
  handoffAt: 99_999,
  ruleAt: 99_999,
  pillReady: 99_999,
};

export const SearchFomoV4: React.FC<SearchFomoV4Props> = ({
  lead,
  tail,
  pulseOne,
  pulseTwo,
}) => {
  return (
    <AbsoluteFill style={{backgroundColor: colors.paper, overflow: "hidden"}}>
      <TransitionSeries>
        <TransitionSeries.Sequence
          durationInFrames={HOOK_CHAT_FRAMES}
          name="Hook and Chat"
        >
          <HookChatScene lead={lead} tail={tail} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={warningToBlueV4()}
          timing={linearTiming({durationInFrames: CHAT_TO_BLUE})}
        />
        <TransitionSeries.Sequence durationInFrames={BLUE_FRAMES} name="Blue">
          <AbsoluteFill style={{backgroundColor: colors.blue}}>
            <BlueScene
              pulseOne={pulseOne}
              pulseTwo={pulseTwo}
              endCard={{
                id: "b",
                statement: "",
                descriptor: null,
                cta: "",
              }}
              pulseOneSpec={PULSE_ONE}
              pulseTwoSpec={PULSE_TWO}
              endTimeline={hiddenEndTimeline}
              pulseFontSize={BLUE_PULSE_FONT_SIZE}
            />
          </AbsoluteFill>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={blueToEnd()}
          timing={linearTiming({durationInFrames: BLUE_TO_END})}
        />
        <TransitionSeries.Sequence durationInFrames={END_FRAMES} name="End">
          <EndScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <AudioCues cues={searchFomoV4Template.audioCues} />
    </AbsoluteFill>
  );
};
