import type {ProviderRotation} from "../../pipeline/schema";
import type {PulseSpec} from "../../motion/pulse";
import type {MotionTemplate} from "../types";
import {templateDurationInFrames} from "../types";

/**
 * 8s / 240f. Provider windows are the original rotation and must not move.
 * After Claude, the rule expands into the blue field. Two exclusive pulses
 * then the official mark and CTA.
 */
export const SEARCH_FRAMES = 126;
export const TRANSITION_FRAMES = 20;
export const BLUE_FRAMES = 134;

export const PROVIDER_WINDOWS = {
  chatgpt: {startFrame: 0, endFrame: 36},
  google: {startFrame: 36, endFrame: 72},
  claude: {startFrame: 72, endFrame: SEARCH_FRAMES},
} as const;

export const PULSE_ONE: PulseSpec = {
  enterAt: 6,
  enterFrames: 8,
  holdFrames: 21,
  exitFrames: 8,
  fromScale: 0.92,
  exitScale: 0.96,
};

export const PULSE_TWO: PulseSpec = {
  enterAt: 43,
  enterFrames: 6,
  holdFrames: 30,
  exitFrames: 8,
  fromScale: 0.88,
  exitScale: 0.96,
};

/** Pulse 2 starts exiting here. The center line becomes the CTA pill. */
export const HANDOFF_AT =
  PULSE_TWO.enterAt + PULSE_TWO.enterFrames + PULSE_TWO.holdFrames;
export const RULE_AT = HANDOFF_AT + PULSE_TWO.exitFrames;
export const PILL_READY = RULE_AT + 13;
export const BUTTON_AT = PILL_READY;
/** Frames the finished pill is fully visible. Must be >= 30. */
export const CTA_HOLD_FRAMES = BLUE_FRAMES - PILL_READY;

const FOMO_ASSETS = "projects/sailtru-ai-visibility-fomo/assets";

const transitionStart = SEARCH_FRAMES - TRANSITION_FRAMES;

export const searchFomoV2Template = {
  id: "search-fomo-v2",
  version: 1,
  brand: "sailtru",
  summary:
    "A search question swaps providers. The rule expands into Sailtru blue and two exclusive campaign pulses land before the CTA.",
  supportedFormats: ["9:16"],
  defaultFormat: "9:16",
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      id: "search",
      durationInFrames: SEARCH_FRAMES,
      role: "Hook. Full question is readable at frame 0. Providers rotate in the middle line.",
    },
    {
      id: "blue",
      durationInFrames: BLUE_FRAMES,
      role: "Blue field. Exclusive campaign pulses, then logo and CTA.",
    },
  ],
  transitions: [
    {
      id: "rule-expand",
      between: ["search", "blue"],
      durationInFrames: TRANSITION_FRAMES,
      intent:
        "The search rule grows vertically into a full-screen #3B63FF field and reveals the campaign beats.",
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
      purpose: "End-card hero line. One phrase, never the services list.",
    },
    {
      id: "descriptor",
      kind: "text",
      required: false,
      purpose: "Optional compact secondary line. Not the hero.",
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
      atFrame: PROVIDER_WINDOWS.google.startFrame,
      src: "motion/cues/tick.wav",
      volume: 0.2,
      durationInFrames: 8,
    },
    {
      id: "provider-claude",
      atFrame: PROVIDER_WINDOWS.claude.startFrame,
      src: "motion/cues/tick.wav",
      volume: 0.2,
      durationInFrames: 8,
    },
    {
      id: "rule-expand",
      atFrame: transitionStart,
      src: "motion/cues/expand.wav",
      volume: 0.28,
      durationInFrames: 16,
    },
    {
      id: "pulse-one",
      atFrame: transitionStart + PULSE_ONE.enterAt,
      src: "motion/cues/pulse.wav",
      volume: 0.34,
      durationInFrames: 12,
    },
    {
      id: "pulse-two",
      atFrame: transitionStart + PULSE_TWO.enterAt,
      src: "motion/cues/pulse-strong.wav",
      volume: 0.4,
      durationInFrames: 12,
    },
    {
      id: "cta",
      atFrame: transitionStart + BUTTON_AT,
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

export const searchFomoDefaults = {
  lead: "What does",
  tail: "say about your business?",
  pulseOne: "Find what's\nmissing.",
  pulseTwo: "Fix what\nmatters.",
};

export type EndCardId = "a" | "b";

export type EndCardCopy = {
  id: EndCardId;
  statement: string;
  descriptor: string | null;
  cta: string;
};

export const endCards: Record<EndCardId, EndCardCopy> = {
  a: {
    id: "a",
    statement: "Now, let's fix it.",
    descriptor: "SEO · GEO · Custom AI",
    cta: "Start diagnosis",
  },
  b: {
    id: "b",
    statement: "See what you're missing.",
    descriptor: null,
    cta: "Start diagnosis",
  },
};

export const searchFomoDuration = templateDurationInFrames(searchFomoV2Template);

export const searchProviderRotation: ProviderRotation = {
  transitionFrames: 6,
  placement: {
    x: 0.5,
    y: 0.5,
    width: 0.8,
    height: 0.12,
    anchor: "top-left",
    safeInset: false,
  },
  fontSize: 104,
  color: "#141414",
  providers: [
    {
      id: "chatgpt",
      label: "ChatGPT",
      logoAssetId: "chatgpt-logo",
      startFrame: PROVIDER_WINDOWS.chatgpt.startFrame,
      endFrame: PROVIDER_WINDOWS.chatgpt.endFrame,
      logoDisplayHeight: 92,
    },
    {
      id: "google",
      label: "Google",
      logoAssetId: "google-logo",
      startFrame: PROVIDER_WINDOWS.google.startFrame,
      endFrame: PROVIDER_WINDOWS.google.endFrame,
      logoDisplayHeight: 82,
    },
    {
      id: "claude",
      label: "Claude",
      logoAssetId: "claude-logo",
      startFrame: PROVIDER_WINDOWS.claude.startFrame,
      endFrame: PROVIDER_WINDOWS.claude.endFrame,
      logoDisplayHeight: 86,
    },
  ],
};

export const providerLogoSrc: Record<string, string> = {
  "chatgpt-logo": `${FOMO_ASSETS}/chatgpt-logo.png`,
  "google-logo": `${FOMO_ASSETS}/google-logo.png`,
  "claude-logo": `${FOMO_ASSETS}/claude-logo.svg`,
};

/** @deprecated Use `SailtruLogo` from `src/brand` — raster is ink-on-transparent fallback only. */
export const sailtruLogoSrc = `${FOMO_ASSETS}/sailtru-logo.png`;

/** White-on-transparent marks need to be recast in ink. */
export const providerMonochrome = new Set(["chatgpt"]);
