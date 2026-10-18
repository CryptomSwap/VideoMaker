import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {linearTiming, TransitionSeries} from "@remotion/transitions";
import {z} from "zod";
import {AudioCues} from "../../motion/AudioCues";
import {Wordmark} from "../../motion/Wordmark";
import {colors} from "../../tokens";
import {BlueScene} from "./BlueScene";
import {ExpandingField} from "./ExpandingField";
import {fieldToLockup} from "./fieldToLockup";
import {frame} from "./layout";
import {ReelsChrome} from "./ReelsChrome";
import {SearchScene} from "./SearchScene";
import {
  BLUE_FRAMES,
  SEARCH_FRAMES,
  TRANSITION_FRAMES,
  endCards,
  searchFomoDefaults,
  searchFomoV2Template,
  type EndCardId,
} from "./template";

export const searchFomoV2Schema = z.object({
  lead: z.string(),
  tail: z.string(),
  pulseOne: z.string(),
  pulseTwo: z.string(),
  endCard: z.enum(["a", "b"]),
  showReelsChrome: z.boolean(),
});

export type SearchFomoV2Props = z.infer<typeof searchFomoV2Schema>;

const sharedDefaults = {
  lead: searchFomoDefaults.lead,
  tail: searchFomoDefaults.tail,
  pulseOne: searchFomoDefaults.pulseOne,
  pulseTwo: searchFomoDefaults.pulseTwo,
  showReelsChrome: false,
};

export const searchFomoV2DefaultProps: SearchFomoV2Props = {
  ...sharedDefaults,
  endCard: "b",
};

export const searchFomoV2AProps: SearchFomoV2Props = {
  ...sharedDefaults,
  endCard: "a",
};

export const searchFomoV2BProps: SearchFomoV2Props = {
  ...sharedDefaults,
  endCard: "b",
};

const transitionStart = SEARCH_FRAMES - TRANSITION_FRAMES;

export const SearchFomoV2: React.FC<SearchFomoV2Props> = ({
  lead,
  tail,
  pulseOne,
  pulseTwo,
  endCard,
  showReelsChrome,
}) => {
  const local = useCurrentFrame();
  const wordmarkFade = interpolate(
    local,
    [transitionStart, transitionStart + 10],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  const copy = endCards[endCard as EndCardId];

  return (
    <AbsoluteFill style={{backgroundColor: colors.paper, overflow: "hidden"}}>
      <ExpandingField />
      <div style={{opacity: wordmarkFade}}>
        <Wordmark top={frame.wordmarkTop} left={frame.padX} />
      </div>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SEARCH_FRAMES} name="Search">
          <SearchScene lead={lead} tail={tail} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fieldToLockup()}
          timing={linearTiming({durationInFrames: TRANSITION_FRAMES})}
        />
        <TransitionSeries.Sequence durationInFrames={BLUE_FRAMES} name="Blue">
          <BlueScene
            pulseOne={pulseOne}
            pulseTwo={pulseTwo}
            endCard={copy}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <AudioCues cues={searchFomoV2Template.audioCues} />
      {showReelsChrome ? <ReelsChrome /> : null}
    </AbsoluteFill>
  );
};
