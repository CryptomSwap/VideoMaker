import fs from "node:fs";
import path from "node:path";
import {
  parseAspectRatio,
  parseDurationForModel,
  parseGenerationModelId,
  parseGenerationPreset,
  resolveGenerationModel,
} from "../../src/pipeline/generation/spec";
import type {Asset, Project} from "../../src/pipeline/schema";
import {createFalHttp, type FalHttp} from "./falHttp";
import {readJob} from "./jobStore";
import {
  assertTextFree,
  assignTakeToScene,
  assignVideoAssetToScene,
  buildPreview,
  cancelJob,
  downloadJobOutput,
  formatPreview,
  importJobOutput,
  pollJob,
  refreshJobStatus,
  submitJob,
  type ProjectIo,
} from "./workflow";
import {falKeyPresent, loadDotEnv} from "../lib/env";
import {probeMediaFile, remotionCliPath, type MediaProbe} from "../lib/mediaProbe";

const flagValue = (args: string[], name: string): string | null => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return null;
  }
  return args[index + 1];
};

const hasFlag = (args: string[], name: string): boolean => {
  return args.includes(name);
};

const usage = (): string => {
  return `Image-to-video (fal.ai). Same queue, pick a model.

  Draft (cheap motion/composition):  --preset=draft     → hailuo-fast (alias minimax-turbo)
  Draft alt:                         --model=ltx-fast
  Final (plate i2v — pick one):  --preset=final --model=kling   |   --model=seedance

  npx tsx scripts/ad.ts generate preview --preset=draft --project=<id> --source=<imageAsset> --scene=<sceneId> --prompt-file=<utf8.txt> --aspect=9:16 --text-free
  npx tsx scripts/ad.ts generate submit  ...same flags... --execute
  npx tsx scripts/ad.ts generate status --job=<localJobId>
  npx tsx scripts/ad.ts generate poll --job=<localJobId>
  npx tsx scripts/ad.ts generate download --job=<localJobId>
  npx tsx scripts/ad.ts generate import --job=<localJobId>
  npx tsx scripts/ad.ts generate assign --job=<localJobId> [--scene=<sceneId>] [--if-short=freeze|loop]
  npx tsx scripts/ad.ts generate reuse --project=<id> --asset=<videoAsset> --scene=<sceneId> [--if-short=freeze|loop]
  npx tsx scripts/ad.ts generate cancel --job=<localJobId>

Reuse a take in Remotion (headlines, CTAs, crops) instead of paying again.
Paid submit requires --execute. --text-free is an attestation, not OCR.
Duplicate fingerprints (source+prompt+duration+model+scene) need --new-take.
`;
};

const readPrompt = (args: string[]): string => {
  const file = flagValue(args, "--prompt-file");
  if (file) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
      throw new Error(`Prompt file not found: ${abs}`);
    }
    return fs.readFileSync(abs, "utf8").replace(/^\uFEFF/, "");
  }
  const inline = flagValue(args, "--prompt");
  if (inline) {
    return inline;
  }
  throw new Error("Pass --prompt-file=<utf8.txt> (preferred) or --prompt=");
};

export const createProjectIo = (
  workspaceRoot: string,
  helpers: {
    readProject: (projectId: string) => Project;
    writeProject: (project: Project) => void;
    projectDir: (projectId: string) => string;
    importAsset: (args: string[]) => Promise<void>;
    probe?: (filePath: string) => Promise<MediaProbe>;
  },
): ProjectIo => {
  return {
    readProject: helpers.readProject,
    writeProject: helpers.writeProject,
    assetAbsPath: (projectId, relativeSrc) => {
      return path.join(helpers.projectDir(projectId), ...relativeSrc.split("/"));
    },
    importVideo: async ({projectId, sourcePath, assetId, originalName}) => {
      const before = helpers.readProject(projectId);
      const existing = new Set(before.assets.map((asset) => asset.id));
      await helpers.importAsset([
        projectId,
        sourcePath,
        "--id",
        assetId,
        "--kind",
        "video",
      ]);
      const after = helpers.readProject(projectId);
      const created = after.assets.find((asset) => asset.id === assetId);
      if (!created) {
        throw new Error(`Import did not create ${assetId}`);
      }
      if (existing.has(assetId)) {
        throw new Error(`Refusing to clobber existing asset id ${assetId}`);
      }
      created.originalName = originalName;
      helpers.writeProject(after);
      return created as Asset;
    },
    probe:
      helpers.probe ??
      ((filePath) =>
        probeMediaFile(remotionCliPath(workspaceRoot), filePath, workspaceRoot)),
  };
};

const requireJob = (args: string[]): string => {
  const job = flagValue(args, "--job") ?? args.find((arg) => arg.startsWith("gen-"));
  if (!job) {
    throw new Error("Pass --job=<localJobId>");
  }
  return job;
};

const requireFal = (workspaceRoot: string): FalHttp => {
  loadDotEnv(workspaceRoot);
  if (!falKeyPresent()) {
    throw new Error(
      "FAL_KEY is not set. Copy .env.example to .env. Dry-run with generate preview. No live call was made.",
    );
  }
  return createFalHttp({apiKey: process.env.FAL_KEY as string});
};

const printJob = (job: ReturnType<typeof readJob>): void => {
  console.log(`Job ${job.localJobId}`);
  console.log(`  status=${job.status} provider=${job.provider} model=${job.model}`);
  console.log(`  providerRequestId=${job.providerRequestId ?? "(none)"}`);
  console.log(`  project=${job.projectId} scene=${job.sceneId} source=${job.sourceAssetId}`);
  console.log(`  imported=${job.importedAssetId ?? "(not imported)"} assigned=${job.assignedToScene}`);
  if (job.error) {
    console.log(`  error=${job.error}`);
  }
};

export const runGenerateCli = async (input: {
  workspaceRoot: string;
  args: string[];
  io: ProjectIo;
  fal?: FalHttp;
}): Promise<void> => {
  const [action, ...rest] = input.args;
  if (!action || action === "--help" || action === "help") {
    console.log(usage());
    return;
  }

  const previewArgs = action === "preview" || action === "submit" ? rest : rest;
  if (action === "preview" || action === "submit") {
    assertTextFree(hasFlag(previewArgs, "--text-free"));
    const projectId = flagValue(previewArgs, "--project");
    const source = flagValue(previewArgs, "--source");
    const scene = flagValue(previewArgs, "--scene");
    if (!projectId || !source || !scene) {
      throw new Error("Need --project= --source= --scene=");
    }
    const presetRaw = flagValue(previewArgs, "--preset");
    const modelRaw = flagValue(previewArgs, "--model");
    const resolved = resolveGenerationModel({
      preset: presetRaw ? parseGenerationPreset(presetRaw) : null,
      modelId: modelRaw ? parseGenerationModelId(modelRaw) : null,
    });
    const seedRaw = flagValue(previewArgs, "--seed");
    if (seedRaw && !resolved.model.supportsSeed) {
      throw new Error(
        `Seed is only supported with --model=seedance (got ${resolved.model.id}).`,
      );
    }
    const seed =
      seedRaw == null ? null : Number(seedRaw);
    if (seedRaw != null && (!Number.isInteger(seed) || seed < 0)) {
      throw new Error(`--seed must be a non-negative integer. Got: ${seedRaw}`);
    }
    const durationRaw =
      flagValue(previewArgs, "--duration") ??
      String(resolved.model.defaultDurationSeconds);
    const plan = buildPreview({
      workspaceRoot: input.workspaceRoot,
      io: input.io,
      projectId,
      sceneId: scene,
      sourceAssetId: source,
      prompt: readPrompt(previewArgs),
      durationSeconds: parseDurationForModel(durationRaw, resolved.model),
      aspectRatio: parseAspectRatio(flagValue(previewArgs, "--aspect") ?? "9:16"),
      seed,
      model: resolved.model,
      preset: resolved.preset,
    });
    console.log(formatPreview(plan));
    if (action === "preview") {
      return;
    }
    if (!hasFlag(previewArgs, "--execute")) {
      throw new Error("Refusing paid submit without --execute. Re-run preview, then add --execute.");
    }
    const fal = input.fal ?? requireFal(input.workspaceRoot);
    const job = await submitJob({
      workspaceRoot: input.workspaceRoot,
      io: input.io,
      fal,
      plan,
      newTake: hasFlag(previewArgs, "--new-take"),
    });
    printJob(job);
    if (job.status === "submission-unknown") {
      throw new Error(job.error ?? "submission-unknown");
    }
    return;
  }

  if (action === "status") {
    const job = await refreshJobStatus({
      workspaceRoot: input.workspaceRoot,
      fal: input.fal ?? requireFal(input.workspaceRoot),
      localJobId: requireJob(rest),
    });
    printJob(job);
    return;
  }

  if (action === "poll") {
    const job = await pollJob({
      workspaceRoot: input.workspaceRoot,
      fal: input.fal ?? requireFal(input.workspaceRoot),
      localJobId: requireJob(rest),
    });
    printJob(job);
    return;
  }

  if (action === "download") {
    const job = await downloadJobOutput({
      workspaceRoot: input.workspaceRoot,
      fal: input.fal ?? requireFal(input.workspaceRoot),
      io: input.io,
      localJobId: requireJob(rest),
    });
    printJob(job);
    if (job.outputProbe) {
      console.log(
        `  probe ${job.outputProbe.width}x${job.outputProbe.height} ${job.outputProbe.durationInSeconds}s fps=${job.outputProbe.fps} audio=${job.outputProbe.hasAudio}`,
      );
    }
    return;
  }

  if (action === "import") {
    const job = await importJobOutput({
      workspaceRoot: input.workspaceRoot,
      io: input.io,
      localJobId: requireJob(rest),
    });
    printJob(job);
    return;
  }

  if (action === "assign") {
    const ifShortRaw = flagValue(rest, "--if-short");
    const ifShort =
      ifShortRaw === "loop" || ifShortRaw === "freeze" ? ifShortRaw : null;
    const result = assignTakeToScene({
      io: input.io,
      workspaceRoot: input.workspaceRoot,
      localJobId: requireJob(rest),
      ifShort,
      sceneId: flagValue(rest, "--scene"),
    });
    console.log(`Assigned take to scene. Warnings: ${result.warnings.length ? result.warnings.join(" | ") : "none"}`);
    return;
  }

  if (action === "reuse") {
    const projectId = flagValue(rest, "--project");
    const assetId = flagValue(rest, "--asset");
    const sceneId = flagValue(rest, "--scene");
    if (!projectId || !assetId || !sceneId) {
      throw new Error("Need --project= --asset= --scene=");
    }
    const ifShortRaw = flagValue(rest, "--if-short");
    const ifShort =
      ifShortRaw === "loop" || ifShortRaw === "freeze" ? ifShortRaw : null;
    const result = assignVideoAssetToScene({
      io: input.io,
      projectId,
      sceneId,
      assetId,
      ifShort,
    });
    console.log(
      `Reused ${assetId} on scene ${sceneId}. Headlines/CTAs/crops unchanged. Warnings: ${
        result.warnings.length ? result.warnings.join(" | ") : "none"
      }`,
    );
    return;
  }

  if (action === "cancel") {
    const job = await cancelJob({
      workspaceRoot: input.workspaceRoot,
      fal: input.fal ?? requireFal(input.workspaceRoot),
      localJobId: requireJob(rest),
    });
    printJob(job);
    return;
  }

  throw new Error(usage());
};
