import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {test} from "node:test";
import {runGenerateCli, createProjectIo} from "../scripts/generation/cli";
import type {FalHttp} from "../scripts/generation/falHttp";
import {buildI2vInput, buildKlingI2vInput} from "../scripts/generation/falHttp";
import {readJob, writeJob} from "../scripts/generation/jobStore";
import {
  assignTakeToScene,
  assignVideoAssetToScene,
  buildPreview,
  downloadJobOutput,
  importJobOutput,
  pollJob,
  submitJob,
  type ProjectIo,
} from "../scripts/generation/workflow";
import {writePng} from "../scripts/media-write";
import {parseProject, type Project} from "../src/pipeline/schema";
import {
  COST_USD_PER_SECOND_AUDIO_OFF,
  estimateHailuoFastCostUsd,
  estimateKlingStandardCostUsd,
  estimateLtxFast1080pCostUsd,
  GENERATION_MODELS,
  HAILUO_FAST_I2V_ENDPOINT,
  KLING_V3_STANDARD_I2V_ENDPOINT,
  LTX_FAST_I2V_ENDPOINT,
  PRESET_DEFAULT_MODEL,
} from "../src/pipeline/generation/spec";

const tmpWorkspace = (): string => {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sailtru-gen-"));
};

const seedProject = (root: string): void => {
  const dir = path.join(root, "public", "projects", "look-test");
  fs.mkdirSync(path.join(dir, "assets"), {recursive: true});
  const still = path.join(dir, "assets", "plate-still.png");
  writePng(still, 540, 960, () => [240, 230, 210] as const);
  const project: Project = parseProject({
    schemaVersion: 1,
    id: "look-test",
    title: "Look test",
    width: 1080,
    height: 1920,
    fps: 30,
    brand: {
      paper: "#F3F1EB",
      ink: "#141414",
      accent: "#3B63FF",
      headlineFont: "instrument-serif",
      bodyFont: "ibm-plex-sans",
      logoAssetId: null,
    },
    safeArea: {top: 160, bottom: 220, left: 80, right: 80},
    assets: [
      {
        id: "plate-still",
        kind: "image",
        src: "assets/plate-still.png",
        originalName: "MOCK-plate-still.png",
        width: 540,
        height: 960,
        durationInSeconds: 0.04,
        importedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    scenes: [
      {
        id: "problem",
        durationInFrames: 90,
        background: {
          type: "image",
          assetId: "plate-still",
          crop: {x: 0.5, y: 0.5, zoom: 1},
          stillPanZoom: null,
        },
        contrast: null,
        headline: {
          text: "Hello",
          placement: {
            x: 0.5,
            y: 0.2,
            width: 0.8,
            height: 0.28,
            anchor: "top-center",
            safeInset: true,
          },
          animation: "none",
          delayFrames: 0,
          fontSize: 72,
          minFontSize: 48,
          lineHeight: 1,
          color: "#141414",
        },
        supporting: null,
        cta: null,
        showLogo: false,
        logoPlacement: null,
      },
      {
        id: "connect",
        durationInFrames: 90,
        background: {
          type: "image",
          assetId: "plate-still",
          crop: {x: 0.5, y: 0.5, zoom: 1},
          stillPanZoom: null,
        },
        contrast: null,
        headline: {
          text: "Connect",
          placement: {
            x: 0.5,
            y: 0.2,
            width: 0.8,
            height: 0.28,
            anchor: "top-center",
            safeInset: true,
          },
          animation: "none",
          delayFrames: 0,
          fontSize: 72,
          minFontSize: 48,
          lineHeight: 1,
          color: "#141414",
        },
        supporting: null,
        cta: {
          text: "See SailTru",
          placement: {
            x: 0.5,
            y: 0.82,
            width: 0.6,
            height: 0.08,
            anchor: "top-center",
            safeInset: true,
          },
          animation: "none",
          delayFrames: 0,
          fontSize: 26,
          minFontSize: 22,
          lineHeight: 1,
          color: "#FFFCFA",
          variant: "fill",
        },
        showLogo: false,
        logoPlacement: null,
      },
    ],
    audio: null,
  });
  fs.writeFileSync(path.join(dir, "project.json"), `${JSON.stringify(project, null, 2)}\n`);
};

const ioFor = (root: string): ProjectIo => {
  const projectPath = (id: string) =>
    path.join(root, "public", "projects", id, "project.json");
  return {
    readProject: (id) => parseProject(JSON.parse(fs.readFileSync(projectPath(id), "utf8"))),
    writeProject: (project) => {
      fs.writeFileSync(projectPath(project.id), `${JSON.stringify(project, null, 2)}\n`);
    },
    assetAbsPath: (projectId, relativeSrc) => {
      return path.join(root, "public", "projects", projectId, ...relativeSrc.split("/"));
    },
    importVideo: async ({projectId, sourcePath, assetId, originalName}) => {
      const project = parseProject(JSON.parse(fs.readFileSync(projectPath(projectId), "utf8")));
      const destRel = `assets/${assetId}.mp4`;
      const destAbs = path.join(root, "public", "projects", projectId, destRel);
      fs.copyFileSync(sourcePath, destAbs);
      const asset = {
        id: assetId,
        kind: "video" as const,
        src: destRel,
        originalName,
        width: 540,
        height: 960,
        durationInSeconds: 5,
        importedAt: new Date().toISOString(),
      };
      project.assets.push(asset);
      fs.writeFileSync(projectPath(projectId), `${JSON.stringify(project, null, 2)}\n`);
      return asset;
    },
    probe: async () => ({
      width: 540,
      height: 960,
      durationInSeconds: 5,
      fps: "24/1",
      hasAudio: false,
    }),
  };
};

const mockFal = (options: {
  statuses?: string[];
  submit?: FalHttp["submit"];
  failDownload?: boolean;
}): FalHttp => {
  const statuses = options.statuses ?? ["IN_QUEUE", "IN_PROGRESS", "COMPLETED"];
  let i = 0;
  return {
    submit:
      options.submit ??
      (async (_endpoint) => ({
        request_id: "req-mock-1",
        status_url: "https://queue.fal.run/mock/status",
        response_url: "https://queue.fal.run/mock/result",
        cancel_url: "https://queue.fal.run/mock/cancel",
      })),
    status: async () => {
      const status = statuses[Math.min(i, statuses.length - 1)];
      i += 1;
      return {status, request_id: "req-mock-1"};
    },
    result: async () => ({
      video: {
        url: "https://v3.fal.media/files/mock/out.mp4",
        content_type: "video/mp4",
        file_name: "out.mp4",
      },
    }),
    cancel: async () => ({httpStatus: 202, body: '{"status":"CANCELLATION_REQUESTED"}'}),
    download: async () => {
      if (options.failDownload) {
        throw new Error("Download failed HTTP 500");
      }
      return Buffer.alloc(64, 1);
    },
  };
};

test("kling i2v request body is the documented fields only", () => {
  const body = buildKlingI2vInput({
    startImageUrl: "data:image/png;base64,aaa",
    prompt: "slow push-in",
    durationSeconds: 5,
  });
  assert.deepEqual(body, {
    start_image_url: "data:image/png;base64,aaa",
    prompt: "slow push-in",
    duration: "5",
    generate_audio: false,
  });
  assert.equal("seed" in body, false);
  assert.equal("aspect_ratio" in body, false);
  assert.equal(KLING_V3_STANDARD_I2V_ENDPOINT, "fal-ai/kling-video/v3/standard/image-to-video");
  assert.equal(estimateKlingStandardCostUsd(5, false), 0.42);
  assert.equal(COST_USD_PER_SECOND_AUDIO_OFF, 0.084);
});

test("draft/final presets and cheaper model request bodies", () => {
  assert.equal(PRESET_DEFAULT_MODEL.draft, "hailuo-fast");
  assert.equal(PRESET_DEFAULT_MODEL.final, "kling");
  assert.equal(estimateHailuoFastCostUsd(6), 0.19);
  assert.equal(estimateLtxFast1080pCostUsd(6), 0.36);
  const hailuo = buildI2vInput({
    model: GENERATION_MODELS["hailuo-fast"],
    imageDataUri: "data:image/jpeg;base64,aaa",
    prompt: "mug steam, locked camera",
    durationSeconds: 6,
  });
  assert.deepEqual(hailuo, {
    image_url: "data:image/jpeg;base64,aaa",
    prompt: "mug steam, locked camera",
    duration: "6",
    prompt_optimizer: false,
  });
  assert.equal("start_image_url" in hailuo, false);
  const ltx = buildI2vInput({
    model: GENERATION_MODELS["ltx-fast"],
    imageDataUri: "data:image/jpeg;base64,aaa",
    prompt: "mug steam, locked camera",
    durationSeconds: 6,
  });
  assert.equal(ltx.image_url, "data:image/jpeg;base64,aaa");
  assert.equal(ltx.duration, 6);
  assert.equal(ltx.generate_audio, false);
  assert.equal(ltx.resolution, "1080p");
  assert.equal(ltx.aspect_ratio, "auto");
  assert.equal(ltx.fps, 24);
  assert.equal(HAILUO_FAST_I2V_ENDPOINT, "fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video");
  assert.equal(LTX_FAST_I2V_ENDPOINT, "fal-ai/ltx-2.3/image-to-video/fast");
});

test("preview rejects missing text-free attestation via CLI", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  await assert.rejects(
    () =>
      runGenerateCli({
        workspaceRoot: root,
        args: [
          "preview",
          "--project=look-test",
          "--source=plate-still",
          "--scene=connect",
          "--prompt=slow drift",
          "--duration=5",
          "--aspect=9:16",
        ],
        io: ioFor(root),
      }),
    /attestation/,
  );
});

test("preview describes provider, source, cost basis; submit without --execute is refused", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const plan = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "slow camera drift, no new objects",
    durationSeconds: 5,
    aspectRatio: "9:16",
  });
  assert.equal(plan.model, KLING_V3_STANDARD_I2V_ENDPOINT);
  assert.equal(plan.estimatedCostUsd, 0.42);
  assert.match(plan.costBasis, /0\.084/);
  await assert.rejects(
    () =>
      runGenerateCli({
        workspaceRoot: root,
        args: [
          "submit",
          "--project=look-test",
          "--source=plate-still",
          "--scene=connect",
          "--prompt=slow camera drift, no new objects",
          "--duration=5",
          "--aspect=9:16",
          "--text-free",
        ],
        io,
        fal: mockFal({}),
      }),
    /--execute/,
  );
});

test("invalid source kind and missing credentials", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const project = io.readProject("look-test");
  project.assets[0].kind = "video";
  io.writeProject(project);
  assert.throws(
    () =>
      buildPreview({
        workspaceRoot: root,
        io,
        projectId: "look-test",
        sceneId: "connect",
        sourceAssetId: "plate-still",
        prompt: "x",
        durationSeconds: 5,
        aspectRatio: "9:16",
      }),
    /kind=video/,
  );

  const root2 = tmpWorkspace();
  seedProject(root2);
  delete process.env.FAL_KEY;
  await assert.rejects(
    () =>
      runGenerateCli({
        workspaceRoot: root2,
        args: [
          "submit",
          "--project=look-test",
          "--source=plate-still",
          "--scene=connect",
          "--prompt=slow",
          "--duration=5",
          "--aspect=9:16",
          "--text-free",
          "--execute",
        ],
        io: ioFor(root2),
      }),
    /FAL_KEY is not set/,
  );
});

test("mocked pending to running to succeeded, then download import assign", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const plan = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "MOCK slow push-in",
    durationSeconds: 5,
    aspectRatio: "9:16",
  });
  const fal = mockFal({});
  const submitted = await submitJob({
    workspaceRoot: root,
    io,
    fal,
    plan,
    newTake: false,
  });
  assert.equal(submitted.providerRequestId, "req-mock-1");
  assert.equal(submitted.status, "queued");

  const finished = await pollJob({
    workspaceRoot: root,
    fal,
    localJobId: submitted.localJobId,
    timeoutMs: 20_000,
    sleeper: async () => undefined,
  });
  assert.equal(finished.status, "succeeded");

  const downloaded = await downloadJobOutput({
    workspaceRoot: root,
    fal,
    io,
    localJobId: submitted.localJobId,
  });
  assert.ok(downloaded.downloadedPath);
  assert.equal(downloaded.outputProbe?.fps, "24/1");

  const imported = await importJobOutput({
    workspaceRoot: root,
    io,
    localJobId: submitted.localJobId,
  });
  assert.equal(imported.importedAssetId, "connect-take-01");
  const afterImport = io.readProject("look-test");
  assert.equal(afterImport.assets.some((asset) => asset.id === "plate-still"), true);
  assert.equal(afterImport.scenes[1].headline.text, "Connect");

  const assigned = assignTakeToScene({
    io,
    workspaceRoot: root,
    localJobId: submitted.localJobId,
    ifShort: null,
  });
  assert.equal(assigned.project.scenes[1].background.type, "video");
  if (assigned.project.scenes[1].background.type !== "video") {
    throw new Error("expected video");
  }
  assert.equal(assigned.project.scenes[1].background.mute, true);
  assert.equal(assigned.project.scenes[1].background.assetId, "connect-take-01");
  assert.equal(assigned.project.scenes[1].headline.text, "Connect");
  assert.equal(assigned.project.scenes[1].cta?.text, "See SailTru");
  assert.match(assigned.warnings.join(" "), /24\/1/);
});

test("provider failure is recorded", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const plan = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "MOCK fail",
    durationSeconds: 5,
    aspectRatio: "9:16",
  });
  const fal = mockFal({
    statuses: ["COMPLETED"],
  });
  fal.status = async () => ({
    status: "COMPLETED",
    error: "safety filter",
  });
  const submitted = await submitJob({workspaceRoot: root, io, fal, plan, newTake: false});
  const polled = await pollJob({
    workspaceRoot: root,
    fal,
    localJobId: submitted.localJobId,
    sleeper: async () => undefined,
  });
  assert.equal(polled.status, "failed");
  assert.match(polled.error ?? "", /safety filter/);
});

test("local poll timeout then successful resume", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const plan = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "MOCK timeout resume",
    durationSeconds: 5,
    aspectRatio: "9:16",
  });
  const fal = mockFal({statuses: ["IN_PROGRESS", "IN_PROGRESS", "COMPLETED"]});
  const submitted = await submitJob({workspaceRoot: root, io, fal, plan, newTake: false});
  const timed = await pollJob({
    workspaceRoot: root,
    fal,
    localJobId: submitted.localJobId,
    timeoutMs: 0,
    sleeper: async () => undefined,
  });
  assert.equal(timed.status, "poll-timed-out");
  assert.equal(timed.providerRequestId, "req-mock-1");
  const resumed = await pollJob({
    workspaceRoot: root,
    fal,
    localJobId: submitted.localJobId,
    timeoutMs: 20_000,
    sleeper: async () => undefined,
  });
  assert.equal(resumed.status, "succeeded");
});

test("duplicate submit is blocked without --new-take", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const plan = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "MOCK dup",
    durationSeconds: 5,
    aspectRatio: "9:16",
  });
  const fal = mockFal({});
  await submitJob({workspaceRoot: root, io, fal, plan, newTake: false});
  const again = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "MOCK dup",
    durationSeconds: 5,
    aspectRatio: "9:16",
  });
  await assert.rejects(
    () => submitJob({workspaceRoot: root, io, fal, plan: again, newTake: false}),
    /Duplicate request/,
  );
  const second = await submitJob({
    workspaceRoot: root,
    io,
    fal,
    plan: again,
    newTake: true,
  });
  assert.notEqual(second.localJobId, again.blockingJobs[0]);
});

test("ambiguous submission timeout does not retry", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const plan = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "MOCK unknown",
    durationSeconds: 5,
    aspectRatio: "9:16",
  });
  const fal = mockFal({
    submit: async () => {
      throw new Error("timeout");
    },
  });
  const job = await submitJob({workspaceRoot: root, io, fal, plan, newTake: false});
  assert.equal(job.status, "submission-unknown");
  assert.equal(job.providerRequestId, null);
  const stored = readJob(root, job.localJobId);
  assert.equal(stored.status, "submission-unknown");
});

test("download failure can retry without regeneration", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const plan = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "MOCK download",
    durationSeconds: 5,
    aspectRatio: "9:16",
  });
  let submits = 0;
  const fal = mockFal({
    statuses: ["COMPLETED"],
    failDownload: true,
    submit: async () => {
      submits += 1;
      return {
        request_id: "req-dl",
        status_url: "https://queue.fal.run/mock/status",
        response_url: "https://queue.fal.run/mock/result",
        cancel_url: "https://queue.fal.run/mock/cancel",
      };
    },
  });
  const submitted = await submitJob({workspaceRoot: root, io, fal, plan, newTake: false});
  await pollJob({
    workspaceRoot: root,
    fal,
    localJobId: submitted.localJobId,
    sleeper: async () => undefined,
  });
  await assert.rejects(
    () =>
      downloadJobOutput({
        workspaceRoot: root,
        fal,
        io,
        localJobId: submitted.localJobId,
      }),
    /Download failed/,
  );
  fal.download = async () => Buffer.alloc(64, 2);
  const downloaded = await downloadJobOutput({
    workspaceRoot: root,
    fal,
    io,
    localJobId: submitted.localJobId,
  });
  assert.ok(downloaded.downloadedPath);
  assert.equal(submits, 1);
});

test("seed flag is rejected", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  await assert.rejects(
    () =>
      runGenerateCli({
        workspaceRoot: root,
        args: [
          "preview",
          "--project=look-test",
          "--source=plate-still",
          "--scene=connect",
          "--prompt=x",
          "--duration=5",
          "--aspect=9:16",
          "--text-free",
          "--seed=1",
        ],
        io: ioFor(root),
      }),
    /Seed is not/,
  );
});

test("assign refuses to silently freeze a short clip", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const project = io.readProject("look-test");
  project.assets.push({
    id: "connect-take-01",
    kind: "video",
    src: "assets/connect-take-01.mp4",
    originalName: "MOCK-take.mp4",
    width: 540,
    height: 960,
    durationInSeconds: 2,
    importedAt: "2026-01-01T00:00:00.000Z",
  });
  io.writeProject(project);
  fs.writeFileSync(
    path.join(root, "public", "projects", "look-test", "assets", "connect-take-01.mp4"),
    Buffer.alloc(8),
  );
  writeJob(root, {
    localJobId: "gen-short",
    fingerprint: "x",
    provider: "fal",
    model: KLING_V3_STANDARD_I2V_ENDPOINT,
    providerRequestId: "req",
    statusUrl: "s",
    resultUrl: "r",
    cancelUrl: "c",
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    sourceHash: "h",
    sourceRelPath: "public/projects/look-test/assets/plate-still.png",
    settings: {
      durationSeconds: 5,
      aspectRatio: "9:16",
      generateAudio: false,
      prompt: "MOCK",
      preset: null,
      modelId: "kling",
    },
    textFreeAttestation: true,
    status: "succeeded",
    error: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    estimatedCostUsd: 0.42,
    actualCostUsd: 0.42,
    costBasis: "mock",
    downloadedPath: path.join(root, "public", "projects", "look-test", "assets", "connect-take-01.mp4"),
    importedAssetId: "connect-take-01",
    outputProbe: {
      width: 540,
      height: 960,
      durationInSeconds: 2,
      fps: "24/1",
      hasAudio: false,
    },
    assignedToScene: false,
  });
  assert.throws(
    () =>
      assignTakeToScene({
        io,
        workspaceRoot: root,
        localJobId: "gen-short",
        ifShort: null,
      }),
    /if-short/,
  );
  const assigned = assignTakeToScene({
    io,
    workspaceRoot: root,
    localJobId: "gen-short",
    ifShort: "freeze",
  });
  assert.equal(assigned.project.scenes[1].headline.text, "Connect");
});

test("draft preset uses hailuo-fast; fingerprints differ by model; ltx duration 5 is refused", () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const hailuo = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "mug steam, locked camera",
    durationSeconds: 6,
    aspectRatio: "9:16",
    model: GENERATION_MODELS["hailuo-fast"],
    preset: "draft",
  });
  assert.equal(hailuo.model, HAILUO_FAST_I2V_ENDPOINT);
  assert.equal(hailuo.estimatedCostUsd, 0.19);
  assert.equal(hailuo.preset, "draft");
  const kling = buildPreview({
    workspaceRoot: root,
    io,
    projectId: "look-test",
    sceneId: "connect",
    sourceAssetId: "plate-still",
    prompt: "mug steam, locked camera",
    durationSeconds: 6,
    aspectRatio: "9:16",
    model: GENERATION_MODELS.kling,
    preset: "final",
  });
  assert.notEqual(hailuo.fingerprint, kling.fingerprint);
  assert.throws(
    () =>
      buildPreview({
        workspaceRoot: root,
        io,
        projectId: "look-test",
        sceneId: "connect",
        sourceAssetId: "plate-still",
        prompt: "x",
        durationSeconds: 5,
        aspectRatio: "9:16",
        model: GENERATION_MODELS["hailuo-fast"],
        preset: "draft",
      }),
    /6, 10/,
  );
});

test("CLI --preset=draft submits to hailuo-fast, not kling", async () => {
  const root = tmpWorkspace();
  seedProject(root);
  let endpoint = "";
  let body: Record<string, unknown> = {};
  const fal = mockFal({
    submit: async (submittedEndpoint, input) => {
      endpoint = submittedEndpoint;
      body = input;
      return {
        request_id: "req-draft",
        status_url: "https://queue.fal.run/mock/status",
        response_url: "https://queue.fal.run/mock/result",
        cancel_url: "https://queue.fal.run/mock/cancel",
      };
    },
  });
  await runGenerateCli({
    workspaceRoot: root,
    args: [
      "submit",
      "--preset=draft",
      "--project=look-test",
      "--source=plate-still",
      "--scene=connect",
      "--prompt=mug steam, locked camera",
      "--aspect=9:16",
      "--text-free",
      "--execute",
    ],
    io: ioFor(root),
    fal,
  });
  assert.equal(endpoint, HAILUO_FAST_I2V_ENDPOINT);
  assert.equal(body.duration, "6");
  assert.equal(body.prompt_optimizer, false);
  assert.equal("start_image_url" in body, false);
  assert.ok(typeof body.image_url === "string");
});

test("reuse existing video on another scene without a new job", () => {
  const root = tmpWorkspace();
  seedProject(root);
  const io = ioFor(root);
  const project = io.readProject("look-test");
  project.assets.push({
    id: "connect-take-01",
    kind: "video",
    src: "assets/connect-take-01.mp4",
    originalName: "MOCK-take.mp4",
    width: 540,
    height: 960,
    durationInSeconds: 5,
    importedAt: "2026-01-01T00:00:00.000Z",
  });
  io.writeProject(project);
  const reused = assignVideoAssetToScene({
    io,
    projectId: "look-test",
    sceneId: "problem",
    assetId: "connect-take-01",
    ifShort: null,
  });
  assert.equal(reused.project.scenes[0].background.type, "video");
  if (reused.project.scenes[0].background.type !== "video") {
    throw new Error("expected video");
  }
  assert.equal(reused.project.scenes[0].background.assetId, "connect-take-01");
  assert.equal(reused.project.scenes[0].headline.text, "Hello");
  assert.equal(reused.project.scenes[1].background.type, "image");
});
