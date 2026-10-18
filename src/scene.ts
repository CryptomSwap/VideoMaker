/**
 * Edit copy, timing, and review poses here.
 * Root.tsx defaultProps.headline should stay in sync with COPY.headline.
 */
export const COPY = {
  headline: "Still doing this manually?",
  headlineLines: ["Still doing this", "manually?"],
  wordmark: "SailTru",
  wordmarkNote:
    "Official lockup via SailtruLogo in compositions; this string is metadata only.",
};

export const STEPS = [
  {
    id: "inquiry",
    label: "New inquiry",
    detail: "Alex · pricing question",
    action: "New",
  },
  {
    id: "copy",
    label: "Copy details",
    detail: "Name, email, request",
    action: "Copied",
  },
  {
    id: "sheet",
    label: "Update spreadsheet",
    detail: "Pipeline.xlsx · row 148",
    action: "Saved",
  },
  {
    id: "followup",
    label: "Send follow-up",
    detail: "Thanks for reaching out…",
    action: "Sent",
  },
] as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 150,
};

/** Key poses for still review: opening, midpoint, ending. */
export const POSES = {
  opening: 18,
  midpoint: 88,
  ending: 142,
} as const;

export const BEATS = {
  headlineIn: 12,
  cardsIn: 18,
  cycle1Start: 20,
  stepDuration1: 11,
  resetStart: 64,
  cycle2Start: 70,
  stepDuration2: 7,
  connectStart: 100,
  spineEnd: 128,
  alignEnd: 130,
  wordmarkIn: 118,
  wordmarkSettled: 136,
};

export type WorkflowPhase = {
  cycle: 0 | 1 | 2 | 3;
  step: number;
  local: number;
  resetting: boolean;
  connecting: boolean;
};

export const getWorkflowPhase = (frame: number): WorkflowPhase => {
  if (frame < BEATS.cycle1Start) {
    return {
      cycle: 0,
      step: frame >= 14 ? 0 : -1,
      local: 0,
      resetting: false,
      connecting: false,
    };
  }

  if (frame < BEATS.resetStart) {
    const t = frame - BEATS.cycle1Start;
    const step = Math.min(3, Math.floor(t / BEATS.stepDuration1));
    return {
      cycle: 1,
      step,
      local: (t - step * BEATS.stepDuration1) / BEATS.stepDuration1,
      resetting: false,
      connecting: false,
    };
  }

  if (frame < BEATS.cycle2Start) {
    return {
      cycle: 1,
      step: -1,
      local: 0,
      resetting: true,
      connecting: false,
    };
  }

  if (frame < BEATS.connectStart) {
    const t = frame - BEATS.cycle2Start;
    const step = Math.min(3, Math.floor(t / BEATS.stepDuration2));
    return {
      cycle: 2,
      step,
      local: (t - step * BEATS.stepDuration2) / BEATS.stepDuration2,
      resetting: false,
      connecting: false,
    };
  }

  return {
    cycle: 3,
    step: 4,
    local: 1,
    resetting: false,
    connecting: true,
  };
};

export const isStepComplete = (phase: WorkflowPhase, index: number) => {
  if (phase.connecting) {
    return true;
  }
  if (phase.resetting || phase.cycle === 0) {
    return false;
  }
  return phase.step > index;
};
