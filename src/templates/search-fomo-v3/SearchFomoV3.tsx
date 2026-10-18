import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {linearTiming, TransitionSeries} from "@remotion/transitions";
import {z} from "zod";
import {AudioCues} from "../../motion/AudioCues";
import {Wordmark} from "../../motion/Wordmark";
import {colors} from "../../tokens";
import {BlueScene} from "../search-fomo-v2/BlueScene";
import {frame} from "../search-fomo-v2/layout";
import {SearchScene} from "../search-fomo-v2/SearchScene";
import {ChatScene} from "./ChatScene";
import {openingToChat} from "./openingToChat";
import {
  BLUE_FRAMES,
  CHAT_FRAMES,
  CHAT_TO_BLUE,
  OPEN_TO_CHAT,
  OPENING_FRAMES,
  PULSE_ONE,
  PULSE_TWO,
  endTimeline,
  searchFomoV3Defaults,
  searchFomoV3EndCard,
  searchFomoV3Template,
} from "./template";
import {warningToBlue} from "./warningToBlue";

export const searchFomoV3Schema = z.object({
  lead: z.string(),
  tail: z.string(),
  pulseOne: z.string(),
  pulseTwo: z.string(),
  showReelsChrome: z.boolean(),
});

export type SearchFomoV3Props = z.infer<typeof searchFomoV3Schema>;

export const searchFomoV3DefaultProps: SearchFomoV3Props = {
  ...searchFomoV3Defaults,
  showReelsChrome: false,
};

export const SearchFomoV3: React.FC<SearchFomoV3Props> = ({
  lead,
  tail,
  pulseOne,
  pulseTwo,
}) => {
  const local = useCurrentFrame();
  const wordmarkFade = interpolate(
    local,
    [OPENING_FRAMES - OPEN_TO_CHAT, OPENING_FRAMES - OPEN_TO_CHAT + 10],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  return (
    <AbsoluteFill style={{backgroundColor: colors.paper, overflow: "hidden"}}>
      <div style={{opacity: wordmarkFade}}>
        <Wordmark top={frame.wordmarkTop} left={frame.padX} />
      </div>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={OPENING_FRAMES} name="Opening">
          <SearchScene lead={lead} tail={tail} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={openingToChat()}
          timing={linearTiming({durationInFrames: OPEN_TO_CHAT})}
        />
        <TransitionSeries.Sequence durationInFrames={CHAT_FRAMES} name="Chat">
          <ChatScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={warningToBlue()}
          timing={linearTiming({durationInFrames: CHAT_TO_BLUE})}
        />
        <TransitionSeries.Sequence durationInFrames={BLUE_FRAMES} name="Blue">
          <AbsoluteFill style={{backgroundColor: colors.blue}}>
            <BlueScene
              pulseOne={pulseOne}
              pulseTwo={pulseTwo}
              endCard={searchFomoV3EndCard}
              pulseOneSpec={PULSE_ONE}
              pulseTwoSpec={PULSE_TWO}
              endTimeline={endTimeline}
            />
          </AbsoluteFill>
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <AudioCues cues={searchFomoV3Template.audioCues} />
    </AbsoluteFill>
  );
};
