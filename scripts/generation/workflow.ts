import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_DOWNLOAD_TIMEOUT_MS,
  DEFAULT_POLL_TIMEOUT_MS,
  DEFAULT_SUBMIT_TIMEOUT_MS,
  FAL_PROVIDER_ID,
  GENERATION_MODELS,
  imageMatchesRequestedAspect,
  imageMeetsKlingLimits,
  parseDurationForModel,
  type FalI2vModel,
  type GenerationPreset,
} from "../../src/pipeline/generation/spec";
import type {Asset, Project, Scene} from "../../src/pipeline/schema";
import {findAsset, videoIsShorterThanScene} from "../../src/pipeline/timing";
import {buildI2vInput, imageDataUri, type FalHttp} from "./falHttp";
import {fingerprintRequest, hashFile, newLocalJobId} from "./hash";
import {
  findJobsByFingerprint,
  isBlockingStatus,
  readJob,
  touchJob,
  writeJob,
} from "./jobStore";
import {nextBackoffMs, sleep} from "./poll";
import type {GenerationJobRecord} from "./types";
import type {MediaProbe} from "../lib/mediaProbe";

export type ProjectIo = {
  readProject: (projectId: string) => Project;
  writeProject: (project: Project) => void;
  assetAbsPath: (projectId: string, relativeSrc: string) => string;
  importVideo: (input: {
    projectId: string;
    sourcePath: string;
    assetId: string;
    originalName: string;
  }) => Promise<Asset>;
  probe: (filePath: string) => Promise<MediaProbe>;
};

export type PreviewPlan = {
  provider: typeof FAL_PROVIDER_ID;
  preset: GenerationPreset | null;
  modelId: FalI2vModel["id"];
  model: string;
  docs: string[];
  projectId: string;
  sceneId: string;
  sourceAssetId: string;
  sourcePath: string;
  sourceHash: string;
  sourceSizeBytes: number;
  sourceWidth: number | null;
  sourceHeight: number | null;
  settings: {
    durationSeconds: number;
    aspectRatio: `${number}:${number}`;
    generateAudio: false;
    prompt: string;
    seed: null;
    extraInput: Record<string, unknown>;
  };
  output: {
    format: "mp4";
    durationEnum: string;
    aspect: string;
    audio: string;
    fps: string;
  };
  estimatedCostUsd: number;
  costBasis: string;
  fingerprint: string;
  blockingJobs: string[];
};

export const assertTextFree = (attested: boolean): void => {
  if (!attested) {
    throw new Error(
      [
        "Refusing to submit: pass --text-free to attest that the source image has no headline, CTA, logo, or other baked type.",
        "This is an attestation, not automated OCR. The provider will only receive this image plus the motion prompt.",
      ].join(" "),
    );
  }
};

export const buildPreview = (input: {
  workspaceRoot: string;
  io: ProjectIo;
  projectId: string;
  sceneId: string;
  sourceAssetId: string;
  prompt: string;
  durationSeconds: number;
  aspectRatio: `${number}:${number}`;
  model?: FalI2vModel;
  preset?: GenerationPreset | null;
}): PreviewPlan => {
  const model = input.model ?? GENERATION_MODELS.kling;
  const preset = input.preset ?? null;
  parseDurationForModel(String(input.durationSeconds), model);
  const project = input.io.readProject(input.projectId);
  const scene = project.scenes.find((entry) => entry.id === input.sceneId);
  if (!scene) {
    throw new Error(`Scene "${input.sceneId}" not found in ${input.projectId}`);
  }
  const asset = findAsset(project, input.sourceAssetId);
  if (!asset) {
    throw new Error(`Asset "${input.sourceAssetId}" not found`);
  }
  if (asset.kind !== "image") {
    throw new Error(
      `Source "${input.sourceAssetId}" is kind=${asset.kind}; image-to-video needs an image.`,
    );
  }
  const sourcePath = input.io.assetAbsPath(input.projectId, asset.src);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file missing: ${sourcePath}`);
  }
  const bytes = fs.statSync(sourcePath).size;
  const ext = path.extname(sourcePath);
  const limits = imageMeetsKlingLimits({
    bytes,
    width: asset.width,
    height: asset.height,
    ext,
  });
  if (limits.length) {
    throw new Error(limits.join("\n"));
  }
  if (
    asset.width &&
    asset.height &&
    !imageMatchesRequestedAspect(asset.width, asset.height, input.aspectRatio)
  ) {
    throw new Error(
      `Requested aspect ${input.aspectRatio} but source is ${asset.width}x${asset.height}. Framing follows the start image. Use a ${input.aspectRatio} plate.`,
    );
  }
  if (!input.prompt.trim()) {
    throw new Error("Motion prompt is empty");
  }

  const sourceHash = hashFile(sourcePath);
  const fingerprint = fingerprintRequest({
    projectId: input.projectId,
    sceneId: input.sceneId,
    sourceAssetId: input.sourceAssetId,
    sourceHash,
    prompt: input.prompt,
    durationSeconds: input.durationSeconds,
    aspectRatio: input.aspectRatio,
    model: model.endpoint,
  });
  const blockingJobs = findJobsByFingerprint(input.workspaceRoot, fingerprint)
    .filter((job) => isBlockingStatus(job.status))
    .map((job) => job.localJobId);

  return {
    provider: FAL_PROVIDER_ID,
    preset,
    modelId: model.id,
    model: model.endpoint,
    docs: [...model.docs],
    projectId: input.projectId,
    sceneId: input.sceneId,
    sourceAssetId: input.sourceAssetId,
    sourcePath,
    sourceHash,
    sourceSizeBytes: bytes,
    sourceWidth: asset.width,
    sourceHeight: asset.height,
    settings: {
      durationSeconds: input.durationSeconds,
      aspectRatio: input.aspectRatio,
      generateAudio: false,
      prompt: input.prompt,
      seed: null,
      extraInput: model.extraInput,
    },
    output: {
      format: "mp4",
      durationEnum: String(input.durationSeconds),
      aspect:
        model.id === "ltx-fast"
          ? "aspect_ratio=auto (follows start image)"
          : "follows start image (no aspect_ratio field)",
      audio: model.supportsGenerateAudio
        ? "generate_audio=false; do not enable in the ad"
        : "model has no generate_audio field; mute the scene anyway",
      fps: "provider-defined; composition does not require 30fps",
    },
    estimatedCostUsd: model.estimateCostUsd(input.durationSeconds),
    costBasis: model.costBasis,
    fingerprint,
    blockingJobs,
  };
};

export const formatPreview = (plan: PreviewPlan): string => {
  return [
    "DRY RUN — no request will be sent.",
    `Provider: ${plan.provider}`,
    `Preset: ${plan.preset ?? "(none — pass --preset=draft before spending)"}`,
    `Model: ${plan.modelId} → ${plan.model}`,
    `Docs: ${plan.docs.join(" ")}`,
    `Project: ${plan.projectId}`,
    `Scene: ${plan.sceneId}`,
    `Source: ${plan.sourceAssetId} (${plan.sourceWidth}x${plan.sourceHeight}, ${plan.sourceSizeBytes} bytes, sha256 ${plan.sourceHash.slice(0, 12)}…)`,
    `Prompt: ${plan.settings.prompt}`,
    `Duration: ${plan.settings.durationSeconds}s`,
    `Requested aspect: ${plan.settings.aspectRatio} (${plan.output.aspect})`,
    `Seed: not supported on ${plan.model}`,
    `Audio: ${plan.output.audio}`,
    `Expected output: ${plan.output.format}; ${plan.output.fps}`,
    `Estimated cost: $${plan.estimatedCostUsd.toFixed(3)} USD`,
    `Cost basis: ${plan.costBasis}`,
    `Fingerprint: ${plan.fingerprint}`,
    plan.blockingJobs.length
      ? `Existing jobs for this fingerprint: ${plan.blockingJobs.join(", ")} (pass --new-take to generate another version)`
      : "No blocking jobs for this fingerprint.",
    "Paid submit requires --execute --text-free.",
  ].join("\n");
};

export const submitJob = async (input: {
  workspaceRoot: string;
  io: ProjectIo;
  fal: FalHttp;
  plan: PreviewPlan;
  newTake: boolean;
  submitTimeoutMs?: number;
}): Promise<GenerationJobRecord> => {
  if (input.plan.blockingJobs.length && !input.newTake) {
    throw new Error(
      `Duplicate request. Resume or inspect ${input.plan.blockingJobs.join(", ")}. Pass --new-take for another version.`,
    );
  }

  const localJobId = newLocalJobId();
  const now = new Date().toISOString();
  const job: GenerationJobRecord = {
    localJobId,
    fingerprint: input.plan.fingerprint,
    provider: "fal",
    model: input.plan.model,
    providerRequestId: null,
    statusUrl: null,
    resultUrl: null,
    cancelUrl: null,
    projectId: input.plan.projectId,
    sceneId: input.plan.sceneId,
    sourceAssetId: input.plan.sourceAssetId,
    sourceHash: input.plan.sourceHash,
    sourceRelPath: path.relative(input.workspaceRoot, input.plan.sourcePath).replace(/\\/g, "/"),
    settings: {
      durationSeconds: input.plan.settings.durationSeconds,
      aspectRatio: input.plan.settings.aspectRatio,
      generateAudio: false,
      prompt: input.plan.settings.prompt,
      preset: input.plan.preset,
      modelId: input.plan.modelId,
    },
    textFreeAttestation: true,
    status: "submitting",
    error: null,
    createdAt: now,
    updatedAt: now,
    estimatedCostUsd: input.plan.estimatedCostUsd,
    actualCostUsd: null,
    costBasis: input.plan.costBasis,
    downloadedPath: null,
    importedAssetId: null,
    outputProbe: null,
    assignedToScene: false,
  };
  writeJob(input.workspaceRoot, job);

  const imageBytes = fs.readFileSync(input.plan.sourcePath);
  const model = GENERATION_MODELS[input.plan.modelId];
  const body = buildI2vInput({
    model,
    imageDataUri: imageDataUri(imageBytes, path.extname(input.plan.sourcePath)),
    prompt: input.plan.settings.prompt,
    durationSeconds: input.plan.settings.durationSeconds,
  });

  try {
    const submitted = await input.fal.submit(
      model.endpoint,
      body,
      input.submitTimeoutMs ?? DEFAULT_SUBMIT_TIMEOUT_MS,
    );
    if (!submitted.request_id) {
      return touchJob(input.workspaceRoot, localJobId, {
        status: "submission-unknown",
        error:
          "Submit returned no request_id. Do not retry blindly. Check the fal dashboard, then: npx tsx scripts/ad.ts generate status --job=<id>",
      });
    }
    return touchJob(input.workspaceRoot, localJobId, {
      status: "queued",
      providerRequestId: submitted.request_id,
      statusUrl: submitted.status_url ?? null,
      resultUrl: submitted.response_url ?? null,
      cancelUrl: submitted.cancel_url ?? null,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const maybeAccepted =
      /abort|timeout|UND_ERR|network|fetch failed|ECONNRESET/i.test(message);
    return touchJob(input.workspaceRoot, localJobId, {
      status: maybeAccepted ? "submission-unknown" : "failed",
      error: maybeAccepted
        ? `Submission timed out or dropped after the request may have been accepted. Do not retry submit. ${message}`
        : message,
    });
  }
};

export const refreshJobStatus = async (input: {
  workspaceRoot: string;
  fal: FalHttp;
  localJobId: string;
}): Promise<GenerationJobRecord> => {
  const job = readJob(input.workspaceRoot, input.localJobId);
  if (!job.statusUrl || !job.providerRequestId) {
    return job;
  }
  if (
    job.status === "succeeded" ||
    job.status === "failed" ||
    job.status === "cancelled"
  ) {
    return job;
  }
  const remote = await input.fal.status(job.statusUrl);
  if (remote.status === "IN_QUEUE") {
    return touchJob(input.workspaceRoot, job.localJobId, {
      status: "queued",
      error: null,
    });
  }
  if (remote.status === "IN_PROGRESS") {
    return touchJob(input.workspaceRoot, job.localJobId, {
      status: "running",
      error: null,
    });
  }
  if (remote.status === "COMPLETED") {
    if (remote.error) {
      return touchJob(input.workspaceRoot, job.localJobId, {
        status: "failed",
        error: remote.error,
      });
    }
    return touchJob(input.workspaceRoot, job.localJobId, {
      status: "succeeded",
      error: null,
      actualCostUsd: job.estimatedCostUsd,
    });
  }
  return job;
};

export const pollJob = async (input: {
  workspaceRoot: string;
  fal: FalHttp;
  localJobId: string;
  timeoutMs?: number;
  sleeper?: (ms: number) => Promise<void>;
}): Promise<GenerationJobRecord> => {
  const timeoutMs = input.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
  const wait = input.sleeper ?? sleep;
  const started = Date.now();
  let attempt = 0;
  let job = await refreshJobStatus(input);
  while (job.status === "queued" || job.status === "running" || job.status === "submitting") {
    if (Date.now() - started > timeoutMs) {
      return touchJob(input.workspaceRoot, job.localJobId, {
        status: "poll-timed-out",
        error:
          "Local poll timed out. The remote job may still be running. Resume with: npx tsx scripts/ad.ts generate poll --job=<id>",
      });
    }
    await wait(nextBackoffMs(attempt));
    attempt += 1;
    job = await refreshJobStatus(input);
  }
  return job;
};

export const downloadJobOutput = async (input: {
  workspaceRoot: string;
  fal: FalHttp;
  io: ProjectIo;
  localJobId: string;
}): Promise<GenerationJobRecord> => {
  let job = readJob(input.workspaceRoot, input.localJobId);
  if (job.status === "poll-timed-out" || job.status === "queued" || job.status === "running") {
    job = await refreshJobStatus(input);
  }
  if (job.status !== "succeeded") {
    throw new Error(`Cannot download job ${job.localJobId} in status ${job.status}`);
  }
  if (!job.resultUrl) {
    throw new Error(`Job ${job.localJobId} has no result URL`);
  }
  const result = await input.fal.result(job.resultUrl);
  const url = result.video?.url;
  if (!url) {
    throw new Error(`Job ${job.localJobId} result has no video.url`);
  }
  const destDir = path.join(
    input.workspaceRoot,
    "var",
    "generation-jobs",
    job.localJobId,
  );
  fs.mkdirSync(destDir, {recursive: true});
  const dest = path.join(destDir, "output.mp4");
  const bytes = await input.fal.download(url, DEFAULT_DOWNLOAD_TIMEOUT_MS);
  if (bytes.length < 32) {
    throw new Error("Downloaded file is too small to be a video");
  }
  fs.writeFileSync(dest, bytes);
  const probe = await input.io.probe(dest);
  if (!probe.width || !probe.height || !probe.durationInSeconds) {
    throw new Error("Downloaded file did not probe as usable video");
  }
  return touchJob(input.workspaceRoot, job.localJobId, {
    downloadedPath: dest,
    outputProbe: probe,
  });
};

export const importJobOutput = async (input: {
  workspaceRoot: string;
  io: ProjectIo;
  localJobId: string;
}): Promise<GenerationJobRecord> => {
  const job = readJob(input.workspaceRoot, input.localJobId);
  if (!job.downloadedPath || !fs.existsSync(job.downloadedPath)) {
    throw new Error(`Nothing downloaded for ${job.localJobId}. Run generate download first.`);
  }
  const project = input.io.readProject(job.projectId);
  const assetId = nextTakeId(project, job.sceneId);
  const originalName = `${job.localJobId}.mp4`;
  const asset = await input.io.importVideo({
    projectId: job.projectId,
    sourcePath: job.downloadedPath,
    assetId,
    originalName,
  });
  return touchJob(input.workspaceRoot, job.localJobId, {
    importedAssetId: asset.id,
  });
};

export const nextTakeId = (project: Project, sceneId: string): string => {
  const prefix = `${sceneId}-take-`;
  let max = 0;
  for (const asset of project.assets) {
    if (!asset.id.startsWith(prefix)) {
      continue;
    }
    const n = Number(asset.id.slice(prefix.length));
    if (Number.isInteger(n) && n > max) {
      max = n;
    }
  }
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
};

export const assignVideoAssetToScene = (input: {
  io: ProjectIo;
  projectId: string;
  sceneId: string;
  assetId: string;
  ifShort: "loop" | "freeze" | null;
  probe?: GenerationJobRecord["outputProbe"];
}): {project: Project; warnings: string[]} => {
  const project = input.io.readProject(input.projectId);
  const sceneIndex = project.scenes.findIndex((scene) => scene.id === input.sceneId);
  if (sceneIndex < 0) {
    throw new Error(`Scene ${input.sceneId} is gone`);
  }
  const scene = project.scenes[sceneIndex];
  const asset = findAsset(project, input.assetId);
  if (!asset || asset.kind !== "video") {
    throw new Error(`Video asset ${input.assetId} is missing`);
  }

  const warnings: string[] = [];
  const crop = scene.background.crop;
  const sceneSeconds = scene.durationInFrames / project.fps;
  const clipSeconds = asset.durationInSeconds ?? 0;

  const next: Scene = {
    ...scene,
    background: {
      type: "video",
      assetId: asset.id,
      crop,
      trimStartSeconds: 0,
      trimEndSeconds: clipSeconds > 0 ? clipSeconds : null,
      ifShort: null,
      mute: true,
    },
    showLogo: scene.showLogo,
  };

  project.scenes[sceneIndex] = next;

  if (clipSeconds + 0.05 < sceneSeconds) {
    if (!input.ifShort) {
      throw new Error(
        `Clip is ${clipSeconds.toFixed(2)}s, scene is ${sceneSeconds.toFixed(2)}s. Pass --if-short=loop or --if-short=freeze. Footage will not be stretched.`,
      );
    }
    next.background.ifShort = input.ifShort;
    warnings.push(
      `Clip shorter than scene; using ifShort=${input.ifShort}. Copy/CTA/logo unchanged.`,
    );
  } else if (videoIsShorterThanScene(project, next) && input.ifShort) {
    next.background.ifShort = input.ifShort;
  }

  if (clipSeconds > sceneSeconds + 0.05) {
    warnings.push(
      `Clip is ${clipSeconds.toFixed(2)}s and the scene is ${sceneSeconds.toFixed(2)}s. Scene length clips playback; the file was not trimmed, stretched, or rewritten.`,
    );
  }
  if (input.probe?.fps && input.probe.fps !== "30/1") {
    warnings.push(
      `Provider fps is ${input.probe.fps}, composition is ${project.fps}fps. Original file kept; Remotion plays it. No resample was written.`,
    );
  }
  if (input.probe?.hasAudio) {
    warnings.push(
      "Take has an audio stream. Scene mute=true so it will not play in the ad. Replace with project audio if needed.",
    );
  }

  input.io.writeProject(project);
  return {project, warnings};
};

export const assignTakeToScene = (input: {
  io: ProjectIo;
  workspaceRoot: string;
  localJobId: string;
  ifShort: "loop" | "freeze" | null;
  sceneId?: string | null;
}): {project: Project; warnings: string[]} => {
  const job = readJob(input.workspaceRoot, input.localJobId);
  if (!job.importedAssetId) {
    throw new Error(`Job ${job.localJobId} is not imported yet`);
  }
  const sceneId = input.sceneId || job.sceneId;
  const result = assignVideoAssetToScene({
    io: input.io,
    projectId: job.projectId,
    sceneId,
    assetId: job.importedAssetId,
    ifShort: input.ifShort,
    probe: job.outputProbe,
  });
  if (sceneId === job.sceneId) {
    touchJob(input.workspaceRoot, job.localJobId, {assignedToScene: true});
  }
  return result;
};

export const cancelJob = async (input: {
  workspaceRoot: string;
  fal: FalHttp;
  localJobId: string;
}): Promise<GenerationJobRecord> => {
  const job = readJob(input.workspaceRoot, input.localJobId);
  if (!job.cancelUrl) {
    throw new Error(`Job ${job.localJobId} has no cancel URL`);
  }
  const result = await input.fal.cancel(job.cancelUrl);
  if (result.httpStatus === 202) {
    return touchJob(input.workspaceRoot, job.localJobId, {
      status: "cancelled",
      error:
        "Cancel accepted. If the runner was already IN_PROGRESS, fal may still finish and bill. See https://fal.ai/docs/documentation/model-apis/inference/queue",
    });
  }
  if (result.httpStatus === 400) {
    throw new Error(`Already completed; cannot cancel. ${result.body}`);
  }
  throw new Error(`Cancel failed HTTP ${result.httpStatus}: ${result.body}`);
};
