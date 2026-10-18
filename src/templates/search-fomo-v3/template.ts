import type {PulseSpec} from "../../motion/pulse";
import type {EndCardCopy} from "../search-fomo-v2/template";
import {
  searchFomoDefaults,
  searchProviderRotation,
} from "../search-fomo-v2/template";
import type {MotionTemplate} from "../types";
import {templateDurationInFrames} from "../types";
import {answerCompleteFrame} from "./wordReveal";
import {typingCompleteFrame} from "./typeQuestion";

export const OPENING_FRAMES = 96;
export const OPEN_TO_CHAT = 18;
export const CHAT_TO_BLUE = 9;
export const BLUE_FRAMES = 120;

export const TYPE_FROM = 4;
export const TYPE_DONE = TYPE_FROM + typingCompleteFrame();
export const SUBMIT_AT = TYPE_DONE + 3;
export const THINK_FROM = SUBMIT_AT + 2;
export const THINK_FRAMES = 7;
export const ANSWER_FROM = THINK_FROM + THINK_FRAMES;
export const ANSWER_DONE = ANSWER_FROM + answerCompleteFrame();
export const FOMO_FROM = ANSWER_DONE + 8;

/** Chat-local. Two exclusive pulses over the live ChatGPT answer. */
export const FOMO_LINE_ONE: PulseSpec = {
  enterAt: FOMO_FROM,
  enterFrames: 6,
  holdFrames: 18,
  exitFrames: 6,
  fromScale: 0.92,
  exitScale: 0.96,
};

export const FOMO_LINE_TWO: PulseSpec = {
  enterAt: FOMO_FROM + 30,
  enterFrames: 6,
  holdFrames: 24,
  exitFrames: 8,
  fromScale: 0.86,
  exitScale: 0.96,
};

export const FOMO_HOLD_END =
  FOMO_LINE_TWO.enterAt + FOMO_LINE_TWO.enterFrames + FOMO_LINE_TWO.holdFrames;
export const CHAT_FRAMES = FOMO_HOLD_END + CHAT_TO_BLUE;

export const PULSE_ONE: PulseSpec = {
  enterAt: 4,
  enterFrames: 8,
  holdFrames: 18,
  exitFrames: 7,
  fromScale: 0.92,
  exitScale: 0.96,
};

export const PULSE_TWO: PulseSpec = {
  enterAt: 38,
  enterFrames: 6,
  holdFrames: 22,
  exitFrames: 8,
  fromScale: 0.88,
  exitScale: 0.96,
};

export const HANDOFF_AT =
  PULSE_TWO.enterAt + PULSE_TWO.enterFrames + PULSE_TWO.holdFrames;
export const RULE_AT = HANDOFF_AT + PULSE_TWO.exitFrames;
export const PILL_READY = RULE_AT + 12;
export const CTA_HOLD_FRAMES = BLUE_FRAMES - PILL_READY;

export const endTimeline = {
  handoffAt: HANDOFF_AT,
  ruleAt: RULE_AT,
  pillReady: PILL_READY,
};

const chatGlobal = OPENING_FRAMES - OPEN_TO_CHAT;
const blueGlobal = chatGlobal + CHAT_FRAMES - CHAT_TO_BLUE;

export const fomoGlobal = {
  lineOneEnter: chatGlobal + FOMO_LINE_ONE.enterAt,
  lineOneHold: chatGlobal + FOMO_LINE_ONE.enterAt + FOMO_LINE_ONE.enterFrames,
  lineOneGone:
    chatGlobal +
    FOMO_LINE_ONE.enterAt +
    FOMO_LINE_ONE.enterFrames +
    FOMO_LINE_ONE.holdFrames +
    FOMO_LINE_ONE.exitFrames,
  lineTwoEnter: chatGlobal + FOMO_LINE_TWO.enterAt,
  lineTwoHold: chatGlobal + FOMO_LINE_TWO.enterAt + FOMO_LINE_TWO.enterFrames,
  lineTwoHoldEnd: chatGlobal + FOMO_HOLD_END,
  blueStart: chatGlobal + FOMO_HOLD_END,
  blueEnd: chatGlobal + FOMO_HOLD_END + CHAT_TO_BLUE,
};

export const searchFomoV3Template = {
  id: "search-fomo-v3",
  version: 1,
  brand: "sailtru",
  summary:
    "Provider question, then a ChatGPT demo over FAL footage, FOMO warning, exclusive pulses, CTA.",
  supportedFormats: ["9:16"],
  defaultFormat: "9:16",
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      id: "opening",
      durationInFrames: OPENING_FRAMES,
      role: "V2 hook. Full question readable at frame 0. Providers rotate.",
    },
    {
      id: "chat",
      durationInFrames: CHAT_FRAMES,
      role: "FAL environment plus Remotion ChatGPT typing, answer, FOMO.",
    },
    {
      id: "blue",
      durationInFrames: BLUE_FRAMES,
      role: "Exclusive campaign pulses then logo and CTA.",
    },
  ],
  transitions: [
    {
      id: "rule-window",
      between: ["opening", "chat"],
      durationInFrames: OPEN_TO_CHAT,
      intent:
        "The search underline opens into a window that reveals the ChatGPT environment.",
      timing: "spring",
    },
    {
      id: "warning-blue",
      between: ["chat", "blue"],
      durationInFrames: CHAT_TO_BLUE,
      intent: "A blue field grows from the warning until it owns the frame.",
      timing: "spring",
    },
  ],
  slots: [
    {
      id: "lead",
      kind: "text",
      required: true,
      purpose: "Opening words of the question, above the provider.",
    },
    {
      id: "tail",
      kind: "text",
      required: true,
      purpose: "Rest of the question, directly above the rule.",
    },
    {
      id: "providers",
      kind: "providers",
      required: true,
      purpose: "Ordered marks and names that crossfade in the question.",
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
      purpose: "Second exclusive campaign pulse, same center.",
    },
    {
      id: "statement",
      kind: "text",
      required: true,
      purpose: "End-card hero line.",
    },
    {
      id: "descriptor",
      kind: "text",
      required: false,
      purpose: "Optional compact secondary line.",
    },
    {
      id: "cta",
      kind: "text",
      required: true,
      purpose: "Conversion line on the closing card.",
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
      id: "window-open",
      atFrame: OPENING_FRAMES - OPEN_TO_CHAT,
      src: "motion/cues/expand.wav",
      volume: 0.26,
      durationInFrames: 16,
    },
    {
      id: "type-tick",
      atFrame: chatGlobal + TYPE_FROM + 4,
      src: "motion/cues/type.wav",
      volume: 0.18,
      durationInFrames: 20,
    },
    {
      id: "submit",
      atFrame: chatGlobal + SUBMIT_AT,
      src: "motion/cues/click.wav",
      volume: 0.28,
      durationInFrames: 8,
    },
    {
      id: "think",
      atFrame: chatGlobal + THINK_FROM,
      src: "motion/cues/think.wav",
      volume: 0.22,
      durationInFrames: 12,
    },
    {
      id: "rec-1",
      atFrame: chatGlobal + ANSWER_FROM + 10,
      src: "motion/cues/tick.wav",
      volume: 0.16,
      durationInFrames: 6,
    },
    {
      id: "rec-2",
      atFrame: chatGlobal + ANSWER_FROM + 24,
      src: "motion/cues/tick.wav",
      volume: 0.16,
      durationInFrames: 6,
    },
    {
      id: "rec-3",
      atFrame: chatGlobal + ANSWER_FROM + 38,
      src: "motion/cues/tick.wav",
      volume: 0.16,
      durationInFrames: 6,
    },
    {
      id: "fomo-one",
      atFrame: chatGlobal + FOMO_LINE_ONE.enterAt,
      src: "motion/cues/pulse.wav",
      volume: 0.32,
      durationInFrames: 12,
    },
    {
      id: "fomo-two",
      atFrame: chatGlobal + FOMO_LINE_TWO.enterAt,
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
      id: "cta",
      atFrame: blueGlobal + PILL_READY,
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

export const searchFomoV3Defaults = {
  lead: searchFomoDefaults.lead,
  tail: searchFomoDefaults.tail,
  pulseOne: searchFomoDefaults.pulseOne,
  pulseTwo: searchFomoDefaults.pulseTwo,
};

export const searchFomoV3EndCard: EndCardCopy = {
  id: "b",
  statement: "See where your\nbusiness stands.",
  descriptor: "SEO · GEO · Custom AI Solutions",
  cta: "Start diagnosis",
};

export const searchFomoV3Duration = templateDurationInFrames(
  searchFomoV3Template,
);

export const chatBackground = {
  imageSrc: "projects/search-fomo-v3/assets/laptop-plate.jpg",
  /** Set after a FAL take is imported. Null until then. */
  videoSrc: null as string | null,
};

export const chatgptLogoSrc =
  "projects/sailtru-ai-visibility-fomo/assets/chatgpt-logo.png";
