import type {PulseSpec} from "../../motion/pulse";
import {pulseGoneAt} from "../../motion/pulse";
import {
  searchFomoDefaults,
  searchProviderRotation,
} from "../search-fomo-v2/template";
import type {MotionTemplate} from "../types";
import {templateDurationInFrames} from "../types";
import {answerCompleteFrame} from "../search-fomo-v3/wordReveal";
import {typingCompleteFrame} from "../search-fomo-v3/typeQuestion";
import {deriveEndCardTiming} from "./endCardMotion";
import {FOMO_MIN_HOLD_FRAMES} from "./fomo";

export {END_HEADLINE_FROM, END_LOGO_FROM} from "./endCardMotion";

export const OPENING_LOGO_HEIGHT = 96;

export const CHAT_TO_BLUE = 16;
export const BLUE_TO_END = 10;

export const TYPE_FROM = 4;
export const TYPE_DONE = TYPE_FROM + typingCompleteFrame();
export const SUBMIT_AT = TYPE_DONE + 3;
export const THINK_FROM = SUBMIT_AT + 2;
export const THINK_FRAMES = 7;
export const ANSWER_FROM = THINK_FROM + THINK_FRAMES;
export const ANSWER_DONE = ANSWER_FROM + answerCompleteFrame();
export const FOMO_FROM = ANSWER_DONE + 8;
export const FOMO_LINE_ONE_ENTER = 10;
/** Hold line one on screen before the second line takes over. */
export const FOMO_LINE_TWO_DELAY = 28;
export const FOMO_LINE_TWO_ENTER = 10;
export const FOMO_LINE_ONE_FADE_OUT = 7;
export const FOMO_HOLD_FRAMES = FOMO_MIN_HOLD_FRAMES;
export const FOMO_READY_FOR_BLUE =
  FOMO_FROM +
  FOMO_LINE_TWO_DELAY +
  FOMO_LINE_TWO_ENTER +
  FOMO_HOLD_FRAMES;
export const HOOK_CHAT_FRAMES = FOMO_READY_FOR_BLUE + CHAT_TO_BLUE;
/** @deprecated Use HOOK_CHAT_FRAMES */
export const CHAT_FRAMES = HOOK_CHAT_FRAMES;

/** Lands while blue is still growing — no empty slab after FOMO. */
export const PULSE_ONE: PulseSpec = {
  enterAt: 9,
  enterFrames: 9,
  holdFrames: 18,
  exitFrames: 7,
  fromScale: 0.92,
  exitScale: 0.96,
};

export const PULSE_TWO: PulseSpec = {
  enterAt: pulseGoneAt(PULSE_ONE) + 1,
  enterFrames: 6,
  holdFrames: 16,
  exitFrames: 5,
  fromScale: 0.88,
  exitScale: 0.96,
};

/** Start the wave handoff as soon as pulse two finishes its hold. */
export const PULSE_TWO_HOLD_END =
  PULSE_TWO.enterAt + PULSE_TWO.enterFrames + PULSE_TWO.holdFrames;
export const BLUE_BEAT_AFTER_PULSE_TWO = 2;
/** @deprecated */
export const BLUE_SETTLE_AFTER_PULSES = BLUE_BEAT_AFTER_PULSE_TWO;

export const BLUE_FRAMES = PULSE_TWO_HOLD_END + BLUE_BEAT_AFTER_PULSE_TWO + BLUE_TO_END;

export const searchFomoV4EndCard = {
  headlineLead: "Spend your time where it's needed most,",
  headlineTail: "and leave the rest to",
  headlineBrand: "Sailtru.",
  descriptor: "SEO · GEO · Custom AI Solutions",
  cta: "Start diagnosis →",
};

const endCardTiming = deriveEndCardTiming(searchFomoV4EndCard);

export const END_SERVICES_FROM = endCardTiming.servicesFrom;
export const END_CTA_FROM = endCardTiming.ctaFrom;
export const END_ANIM_DONE = endCardTiming.animDone;
export const END_HOLD_FRAMES = 36;
export const END_FRAMES = END_ANIM_DONE + END_HOLD_FRAMES;

const blueGlobal = HOOK_CHAT_FRAMES - CHAT_TO_BLUE;
const endGlobal = blueGlobal + BLUE_FRAMES - BLUE_TO_END;

export const fomoGlobal = {
  warningEnter: FOMO_FROM,
  warningFull: FOMO_FROM + FOMO_LINE_ONE_ENTER,
  lineTwoEnter: FOMO_FROM + FOMO_LINE_TWO_DELAY,
  warningHoldEnd: FOMO_READY_FOR_BLUE,
  blueStart: FOMO_READY_FOR_BLUE,
  blueEnd: FOMO_READY_FOR_BLUE + CHAT_TO_BLUE,
};

export const endCardBackgroundSrc =
  "projects/search-fomo-v4/assets/end-card-background.jpg";

export const searchFomoV4Template = {
  id: "search-fomo-v4",
  version: 1,
  brand: "sailtru",
  summary:
    "V3 hook and ChatGPT demo with a stronger FOMO hold, blue pulses, and a wave end card.",
  supportedFormats: ["9:16"],
  defaultFormat: "9:16",
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      id: "hook-chat",
      durationInFrames: HOOK_CHAT_FRAMES,
      role: "Search question over ChatGPT demo and FOMO warning.",
    },
    {
      id: "blue",
      durationInFrames: BLUE_FRAMES,
      role: "Exclusive campaign pulses on Sailtru blue only.",
    },
    {
      id: "end",
      durationInFrames: END_FRAMES,
      role: "Wave background with staggered logo, headline, and CTA.",
    },
  ],
  transitions: [
    {
      id: "warning-blue",
      between: ["hook-chat", "blue"],
      durationInFrames: CHAT_TO_BLUE,
      intent: "Blue field grows in only after the FOMO warning has held.",
      timing: "spring",
    },
    {
      id: "blue-wave",
      between: ["blue", "end"],
      durationInFrames: BLUE_TO_END,
      intent: "Solid blue lifts away to reveal the wave end-card plate.",
      timing: "spring",
    },
  ],
  slots: [
    {
      id: "lead",
      kind: "text",
      required: true,
      purpose: "Opening words of the question.",
    },
    {
      id: "tail",
      kind: "text",
      required: true,
      purpose: "Rest of the question above the rule.",
    },
    {
      id: "providers",
      kind: "providers",
      required: true,
      purpose: "Ordered marks that crossfade in the question.",
    },
    {
      id: "pulseOne",
      kind: "text",
      required: true,
      purpose: "First exclusive campaign pulse.",
    },
    {
      id: "pulseTwo",
      kind: "text",
      required: true,
      purpose: "Second exclusive campaign pulse.",
    },
    {
      id: "descriptor",
      kind: "text",
      required: false,
      purpose: "Services line on the end card.",
    },
    {
      id: "cta",
      kind: "text",
      required: true,
      purpose: "End-card button label.",
    },
  ],
  audioCues: [
    {
      id: "provider-google",
      atFrame: searchProviderRotation.providers[1].startFrame,
      src: "motion/cues/tick.wav",
      volume: 0.2,
      durationInFrames: 8,
    },
    {
      id: "provider-claude",
      atFrame: searchProviderRotation.providers[2].startFrame,
      src: "motion/cues/tick.wav",
      volume: 0.2,
      durationInFrames: 8,
    },
    {
      id: "type-tick",
      atFrame: TYPE_FROM + 4,
      src: "motion/cues/type.wav",
      volume: 0.18,
      durationInFrames: 20,
    },
    {
      id: "submit",
      atFrame: SUBMIT_AT,
      src: "motion/cues/click.wav",
      volume: 0.28,
      durationInFrames: 8,
    },
    {
      id: "think",
      atFrame: THINK_FROM,
      src: "motion/cues/think.wav",
      volume: 0.22,
      durationInFrames: 12,
    },
    {
      id: "rec-1",
      atFrame: ANSWER_FROM + 10,
      src: "motion/cues/tick.wav",
      volume: 0.16,
      durationInFrames: 6,
    },
    {
      id: "rec-2",
      atFrame: ANSWER_FROM + 24,
      src: "motion/cues/tick.wav",
      volume: 0.16,
      durationInFrames: 6,
    },
    {
      id: "rec-3",
      atFrame: ANSWER_FROM + 38,
      src: "motion/cues/tick.wav",
      volume: 0.16,
      durationInFrames: 6,
    },
    {
      id: "fomo-one",
      atFrame: fomoGlobal.warningEnter,
      src: "motion/cues/pulse.wav",
      volume: 0.3,
      durationInFrames: 10,
    },
    {
      id: "fomo-two",
      atFrame: fomoGlobal.lineTwoEnter,
      src: "motion/cues/fomo.wav",
      volume: 0.38,
      durationInFrames: 14,
    },
    {
      id: "pulse-one",
      atFrame: blueGlobal + PULSE_ONE.enterAt,
      src: "motion/cues/pulse.wav",
      volume: 0.34,
      durationInFrames: 12,
    },
    {
      id: "pulse-two",
      atFrame: blueGlobal + PULSE_TWO.enterAt,
      src: "motion/cues/pulse-strong.wav",
      volume: 0.4,
      durationInFrames: 12,
    },
    {
      id: "wave-reveal",
      atFrame:
        blueGlobal + PULSE_TWO_HOLD_END + BLUE_BEAT_AFTER_PULSE_TWO,
      src: "motion/cues/expand.wav",
      volume: 0.24,
      durationInFrames: 18,
    },
    {
      id: "cta",
      atFrame: endGlobal + END_CTA_FROM,
      src: "motion/cues/cta.wav",
      volume: 0.3,
      durationInFrames: 14,
    },
  ],
  cta: {slotId: "cta", variant: "fill"},
  typography: {
    font: "heebo",
    roles: ["wordmark", "hook", "provider", "tail", "pulse", "label", "cta"],
  },
} as const satisfies MotionTemplate;

export const searchFomoV4Defaults = {
  lead: searchFomoDefaults.lead,
  tail: searchFomoDefaults.tail,
  pulseOne: searchFomoDefaults.pulseOne,
  pulseTwo: searchFomoDefaults.pulseTwo,
};

/** Campaign pulse type on the blue field (V4). */
export const BLUE_PULSE_FONT_SIZE = 124;

export const searchFomoV4Duration = templateDurationInFrames(
  searchFomoV4Template,
);

/** Global frame with FOMO at full opacity mid-hold (for stills). */
export const FOMO_STILL_FRAME =
  fomoGlobal.warningFull + Math.floor(FOMO_HOLD_FRAMES / 2);

/** Global frame with end card fully composed (for stills). */
export const END_STILL_FRAME = endGlobal + END_ANIM_DONE + 8;
