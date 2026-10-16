/**
 * fal.ai image-to-video contracts used by the Node CLI.
 *
 * Queue: https://fal.ai/docs/documentation/model-apis/inference/queue
 * Auth: FAL_KEY via `Authorization: Key $FAL_KEY`
 *
 * Image ingest (jpg/png, max 50MB, ≥300px/side, aspect 1:2.5–2.5:1) is
 * documented on the Kling V3 Standard Turbo i2v sibling and applied to every
 * plate we send:
 * https://fal.ai/models/fal-ai/kling-video/v3/turbo/standard/image-to-video/api
 *
 * Live calls stay in scripts/generation. No FAL_KEY in public/, project JSON,
 * browser code, or manifests.
 */

export const FAL_PROVIDER_ID = "fal" as const;
export const FAL_QUEUE_BASE = "https://queue.fal.run";

export type GenerationPreset = "draft" | "final";
export type GenerationModelId = "kling" | "hailuo-fast" | "ltx-fast";

export const KLING_V3_STANDARD_I2V_ENDPOINT =
  "fal-ai/kling-video/v3/standard/image-to-video";
export const HAILUO_FAST_I2V_ENDPOINT =
  "fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video";
export const LTX_FAST_I2V_ENDPOINT = "fal-ai/ltx-2.3/image-to-video/fast";

/** @deprecated Submit URL is per-model. Kept for tests that pin Kling. */
export const FAL_QUEUE_SUBMIT_URL = `${FAL_QUEUE_BASE}/${KLING_V3_STANDARD_I2V_ENDPOINT}`;

export const KLING_DURATION_SECONDS = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const;
export type KlingDurationSeconds = (typeof KLING_DURATION_SECONDS)[number];

export const HAILUO_FAST_DURATION_SECONDS = [6, 10] as const;
export const LTX_FAST_DURATION_SECONDS = [6, 8, 10, 12, 14, 16, 18, 20] as const;

export const COST_USD_PER_SECOND_AUDIO_OFF = 0.084;
export const COST_USD_PER_SECOND_AUDIO_ON = 0.126;
export const HAILUO_FAST_COST_USD: Record<6 | 10, number> = {6: 0.19, 10: 0.32};
/** Conservative 1080p Fast price from fal's live "will cost" line. Table also lists $0.04/s. */
export const LTX_FAST_COST_USD_PER_SECOND_1080P = 0.06;

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MIN_IMAGE_SIDE_PX = 300;
export const MIN_ASPECT = 1 / 2.5;
export const MAX_ASPECT = 2.5;
export const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png"] as const;

export const DEFAULT_POLL_TIMEOUT_MS = 15 * 60 * 1000;
export const DEFAULT_SUBMIT_TIMEOUT_MS = 30 * 1000;
export const DEFAULT_DOWNLOAD_TIMEOUT_MS = 120 * 1000;

export type FalI2vModel = {
  id: GenerationModelId;
  aliases: readonly string[];
  label: string;
  endpoint: string;
  docs: readonly string[];
  durationSeconds: readonly number[];
  defaultDurationSeconds: number;
  durationAsString: boolean;
  imageField: "start_image_url" | "image_url";
  supportsGenerateAudio: boolean;
  supportsSeed: boolean;
  extraInput: Record<string, unknown>;
  estimateCostUsd: (durationSeconds: number) => number;
  costBasis: string;
};

export const falQueueSubmitUrl = (endpoint: string): string => {
  return `${FAL_QUEUE_BASE}/${endpoint}`;
};

export const estimateKlingStandardCostUsd = (
  durationSeconds: number,
  generateAudio: boolean,
): number => {
  const rate = generateAudio
    ? COST_USD_PER_SECOND_AUDIO_ON
    : COST_USD_PER_SECOND_AUDIO_OFF;
  return Math.round(durationSeconds * rate * 1000) / 1000;
};

export const estimateHailuoFastCostUsd = (durationSeconds: number): number => {
  if (durationSeconds === 6 || durationSeconds === 10) {
    return HAILUO_FAST_COST_USD[durationSeconds];
  }
  throw new Error(`Hailuo Fast duration must be 6 or 10. Got ${durationSeconds}`);
};

export const estimateLtxFast1080pCostUsd = (durationSeconds: number): number => {
  return Math.round(durationSeconds * LTX_FAST_COST_USD_PER_SECOND_1080P * 1000) / 1000;
};

export const GENERATION_MODELS: Record<GenerationModelId, FalI2vModel> = {
  kling: {
    id: "kling",
    aliases: ["kling", "kling-v3", "kling-v3-standard"],
    label: "Kling Video v3 Standard i2v",
    endpoint: KLING_V3_STANDARD_I2V_ENDPOINT,
    docs: [
      "https://fal.ai/models/fal-ai/kling-video/v3/standard/image-to-video/api",
      "https://fal.ai/models/fal-ai/kling-video/v3/standard/image-to-video",
      "https://fal.ai/docs/documentation/model-apis/inference/queue",
    ],
    durationSeconds: KLING_DURATION_SECONDS,
    defaultDurationSeconds: 5,
    durationAsString: true,
    imageField: "start_image_url",
    supportsGenerateAudio: true,
    supportsSeed: false,
    extraInput: {},
    estimateCostUsd: (durationSeconds) =>
      estimateKlingStandardCostUsd(durationSeconds, false),
    costBasis:
      `fal Kling v3 Standard i2v: $${COST_USD_PER_SECOND_AUDIO_OFF}/s with audio off (https://fal.ai/models/fal-ai/kling-video/v3/standard/image-to-video). This pipeline always sends generate_audio=false.`,
  },
  "hailuo-fast": {
    id: "hailuo-fast",
    aliases: ["hailuo-fast", "minimax-turbo", "minimax-hailuo-fast"],
    label: "MiniMax Hailuo 2.3 Fast Standard i2v",
    endpoint: HAILUO_FAST_I2V_ENDPOINT,
    docs: [
      "https://fal.ai/models/fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video/api",
      "https://fal.ai/models/fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video",
      "https://fal.ai/docs/documentation/model-apis/inference/queue",
    ],
    durationSeconds: HAILUO_FAST_DURATION_SECONDS,
    defaultDurationSeconds: 6,
    durationAsString: true,
    imageField: "image_url",
    supportsGenerateAudio: false,
    supportsSeed: false,
    extraInput: {prompt_optimizer: false},
    estimateCostUsd: estimateHailuoFastCostUsd,
    costBasis:
      "fal MiniMax Hailuo 2.3 Fast Standard i2v: $0.19 / 6s, $0.32 / 10s (https://fal.ai/models/fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video). prompt_optimizer=false. No generate_audio field.",
  },
  "ltx-fast": {
    id: "ltx-fast",
    aliases: ["ltx-fast", "ltx-2.3-fast"],
    label: "LTX-2.3 Fast i2v",
    endpoint: LTX_FAST_I2V_ENDPOINT,
    docs: [
      "https://fal.ai/models/fal-ai/ltx-2.3/image-to-video/fast/api",
      "https://fal.ai/models/fal-ai/ltx-2.3/image-to-video/fast",
      "https://fal.ai/docs/documentation/model-apis/inference/queue",
    ],
    durationSeconds: LTX_FAST_DURATION_SECONDS,
    defaultDurationSeconds: 6,
    durationAsString: false,
    imageField: "image_url",
    supportsGenerateAudio: true,
    supportsSeed: false,
    extraInput: {
      resolution: "1080p",
      aspect_ratio: "auto",
      fps: 24,
    },
    estimateCostUsd: estimateLtxFast1080pCostUsd,
    costBasis:
      `fal LTX-2.3 Fast i2v 1080p estimate $${LTX_FAST_COST_USD_PER_SECOND_1080P}/s audio off (https://fal.ai/models/fal-ai/ltx-2.3/image-to-video/fast). Fal's price table also lists $0.04/s; preview uses the live $0.06/s line. generate_audio=false. Durations >10s need 25fps+1080p on fal; this pipeline stays ≤10s at 24fps.`,
  },
};

export const PRESET_DEFAULT_MODEL: Record<GenerationPreset, GenerationModelId> = {
  draft: "hailuo-fast",
  final: "kling",
};

export const parseGenerationPreset = (raw: string): GenerationPreset => {
  if (raw === "draft" || raw === "final") {
    return raw;
  }
  throw new Error(`Preset must be draft or final. Got: ${raw}`);
};

export const parseGenerationModelId = (raw: string): GenerationModelId => {
  const needle = raw.trim().toLowerCase();
  for (const model of Object.values(GENERATION_MODELS)) {
    if (model.aliases.includes(needle) || model.endpoint === needle) {
      return model.id;
    }
  }
  throw new Error(
    `Unknown model "${raw}". Use kling | hailuo-fast | ltx-fast (aliases: minimax-turbo, ltx-2.3-fast).`,
  );
};

export const resolveGenerationModel = (input: {
  preset?: GenerationPreset | null;
  modelId?: GenerationModelId | null;
}): {preset: GenerationPreset | null; model: FalI2vModel} => {
  if (input.modelId) {
    return {
      preset: input.preset ?? null,
      model: GENERATION_MODELS[input.modelId],
    };
  }
  if (input.preset) {
    return {
      preset: input.preset,
      model: GENERATION_MODELS[PRESET_DEFAULT_MODEL[input.preset]],
    };
  }
  return {preset: null, model: GENERATION_MODELS.kling};
};

export const parseDurationForModel = (raw: string, model: FalI2vModel): number => {
  const value = Number(raw);
  if (!model.durationSeconds.includes(value)) {
    throw new Error(
      `Duration for ${model.id} must be one of ${model.durationSeconds.join(", ")}. Got: ${raw}`,
    );
  }
  if (model.id === "ltx-fast" && value > 10) {
    throw new Error(
      "LTX Fast durations >10s require 25fps + 1080p on fal. This pipeline uses fps=24; pass 6, 8, or 10.",
    );
  }
  return value;
};

export const parseKlingDuration = (raw: string): KlingDurationSeconds => {
  return parseDurationForModel(raw, GENERATION_MODELS.kling) as KlingDurationSeconds;
};

export const parseAspectRatio = (raw: string): `${number}:${number}` => {
  const match = /^(\d+):(\d+)$/.exec(raw);
  if (!match) {
    throw new Error(`Aspect ratio must look like 9:16. Got: ${raw}`);
  }
  return `${Number(match[1])}:${Number(match[2])}`;
};

export const aspectValue = (ratio: `${number}:${number}`): number => {
  const [w, h] = ratio.split(":").map(Number);
  return w / h;
};

export const imageMeetsKlingLimits = (input: {
  bytes: number;
  width: number | null;
  height: number | null;
  ext: string;
}): string[] => {
  const errors: string[] = [];
  if (
    !ALLOWED_IMAGE_EXT.some((allowed) => allowed === input.ext.toLowerCase())
  ) {
    errors.push(
      `i2v plates must be jpg/jpeg/png. Got ${input.ext || "(none)"}`,
    );
  }
  if (input.bytes > MAX_IMAGE_BYTES) {
    errors.push(
      `Image is ${(input.bytes / (1024 * 1024)).toFixed(1)}MB; max is 50MB.`,
    );
  }
  if (
    input.width === null ||
    input.height === null ||
    input.width < MIN_IMAGE_SIDE_PX ||
    input.height < MIN_IMAGE_SIDE_PX
  ) {
    errors.push(
      `Image must be at least ${MIN_IMAGE_SIDE_PX}px on each side (got ${input.width}x${input.height}).`,
    );
  }
  if (input.width && input.height) {
    const ratio = input.width / input.height;
    if (ratio < MIN_ASPECT || ratio > MAX_ASPECT) {
      errors.push(
        `Image aspect ${ratio.toFixed(3)} is outside i2v range 1:2.5–2.5:1.`,
      );
    }
  }
  return errors;
};

export const imageMatchesRequestedAspect = (
  width: number,
  height: number,
  requested: `${number}:${number}`,
  tolerance = 0.04,
): boolean => {
  const actual = width / height;
  const target = aspectValue(requested);
  return Math.abs(actual - target) / target <= tolerance;
};
