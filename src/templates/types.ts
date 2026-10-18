/**
 * Motion templates sit beside the project-JSON pipeline.
 * A template is an approved composition: layout, slots, choreography,
 * timing, type, transitions, cues, and which output formats are actually drawn.
 * An agent later picks one, fills slots, and renders. It does not invent a layout.
 *
 * Existing `public/projects/*` ads keep using `AdProject`. They are not templates.
 */

export type FormatId = "9:16" | "4:5" | "1:1";

export type TemplateSlot = {
  id: string;
  kind: "text" | "providers";
  required: boolean;
  purpose: string;
};

export type TemplateScene = {
  id: string;
  durationInFrames: number;
  role: string;
};

export type TemplateTransition = {
  id: string;
  between: readonly [string, string];
  durationInFrames: number;
  /** What the viewer should understand from the move. */
  intent: string;
  timing: "spring";
};

export type TemplateAudioCue = {
  id: string;
  atFrame: number;
  src: string;
  volume: number;
  durationInFrames: number;
};

export type TemplateCta = {
  slotId: string;
  variant: "fill" | "outline";
} | null;

export type MotionTemplate = {
  id: string;
  version: 1;
  brand: "sailtru";
  summary: string;
  supportedFormats: readonly FormatId[];
  defaultFormat: FormatId;
  fps: number;
  width: number;
  height: number;
  scenes: readonly TemplateScene[];
  transitions: readonly TemplateTransition[];
  slots: readonly TemplateSlot[];
  audioCues: readonly TemplateAudioCue[];
  cta: TemplateCta;
  typography: {
    font: "heebo";
    roles: readonly string[];
  };
};

export const templateDurationInFrames = (template: MotionTemplate): number => {
  const sceneFrames = template.scenes.reduce(
    (total, scene) => total + scene.durationInFrames,
    0,
  );
  const overlap = template.transitions.reduce(
    (total, transition) => total + transition.durationInFrames,
    0,
  );
  return sceneFrames - overlap;
};

export const templateIssues = (template: MotionTemplate): string[] => {
  const issues: string[] = [];
  const sceneIds = new Set(template.scenes.map((scene) => scene.id));
  const slotIds = template.slots.map((slot) => slot.id);

  if (template.scenes.length === 0) {
    issues.push("template has no scenes");
  }

  if (new Set(slotIds).size !== slotIds.length) {
    issues.push("duplicate slot id");
  }

  if (!template.supportedFormats.includes(template.defaultFormat)) {
    issues.push("default format is not supported");
  }

  for (const transition of template.transitions) {
    const [beforeId, afterId] = transition.between;
    const before = template.scenes.find((scene) => scene.id === beforeId);
    const after = template.scenes.find((scene) => scene.id === afterId);
    if (!before || !after || !sceneIds.has(beforeId) || !sceneIds.has(afterId)) {
      issues.push(`transition ${transition.id} references a missing scene`);
      continue;
    }
    if (
      transition.durationInFrames >= before.durationInFrames ||
      transition.durationInFrames >= after.durationInFrames
    ) {
      issues.push(`transition ${transition.id} is longer than one of its scenes`);
    }
    if (transition.durationInFrames < 1) {
      issues.push(`transition ${transition.id} has no duration`);
    }
  }

  const duration = templateDurationInFrames(template);
  for (const cue of template.audioCues) {
    if (cue.atFrame < 0 || cue.atFrame >= duration) {
      issues.push(`cue ${cue.id} falls outside the timeline`);
    }
  }

  return issues;
};
