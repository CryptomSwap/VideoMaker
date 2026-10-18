import type {GenerationPreset} from "../../src/pipeline/generation/spec";

export type GenerationStatus =
  | "submitting"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "submission-unknown"
  | "poll-timed-out";

export type GenerationSettings = {
  durationSeconds: number;
  aspectRatio: `${number}:${number}`;
  generateAudio: false;
  prompt: string;
  preset: GenerationPreset | null;
  modelId: string;
  seed: number | null;
};

export type GenerationJobRecord = {
  localJobId: string;
  fingerprint: string;
  provider: "fal";
  model: string;
  providerRequestId: string | null;
  statusUrl: string | null;
  resultUrl: string | null;
  cancelUrl: string | null;
  projectId: string;
  sceneId: string;
  sourceAssetId: string;
  sourceHash: string;
  sourceRelPath: string;
  settings: GenerationSettings;
  textFreeAttestation: true;
  status: GenerationStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  estimatedCostUsd: number;
  actualCostUsd: number | null;
  costBasis: string;
  downloadedPath: string | null;
  importedAssetId: string | null;
  outputProbe: {
    width: number | null;
    height: number | null;
    durationInSeconds: number | null;
    fps: string | null;
    hasAudio: boolean;
  } | null;
  assignedToScene: boolean;
};

export type FalSubmitResponse = {
  request_id?: string;
  status_url?: string;
  response_url?: string;
  cancel_url?: string;
  queue_position?: number;
};

export type FalStatusResponse = {
  status?: string;
  request_id?: string;
  queue_position?: number;
  error?: string;
  error_type?: string;
};

export type FalResultResponse = {
  video?: {
    url?: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
  };
  detail?: unknown;
};
