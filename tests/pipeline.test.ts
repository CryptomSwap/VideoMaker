import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {test} from "node:test";
import {
  measureWavOnsetSeconds,
  writeWavOnsetClick,
} from "../scripts/media-write";
import {parseProject, type Project} from "../src/pipeline/schema";
import {layoutText} from "../src/pipeline/textLayout";
import {totalDurationInFrames, videoIsShorterThanScene} from "../src/pipeline/timing";
import {blockingIssues, validateProject} from "../src/pipeline/validate";

const base = (): Project => {
  return parseProject({
    schemaVersion: 1,
    id: "unit-test",
    title: "Unit test",
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
        id: "still-a",
        kind: "image",
        src: "assets/still-a.png",
        originalName: "still a.png",
        width: 1080,
        height: 1920,
        durationInSeconds: null,
        importedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "clip-a",
        kind: "video",
        src: "assets/clip-a.mp4",
        originalName: "clip a.mp4",
        width: 1080,
        height: 1920,
        durationInSeconds: 2,
        importedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    scenes: [
      {
        id: "one",
        durationInFrames: 90,
        background: {
          type: "image",
          assetId: "still-a",
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
          animation: "fade",
          delayFrames: 0,
          fontSize: 84,
          minFontSize: 48,
          lineHeight: 1,
          color: null,
        },
        supporting: null,
        cta: null,
        showLogo: false,
        logoPlacement: null,
      },
      {
        id: "two",
        durationInFrames: 90,
        background: {
          type: "video",
          assetId: "clip-a",
          crop: {x: 0.5, y: 0.5, zoom: 1},
          trimStartSeconds: 0,
          trimEndSeconds: 2,
          ifShort: "loop",
          mute: true,
        },
        contrast: null,
        headline: {
          text: "Next",
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
          fontSize: 84,
          minFontSize: 48,
          lineHeight: 1,
          color: null,
        },
        supporting: null,
        cta: null,
        showLogo: false,
        logoPlacement: null,
      },
    ],
    audio: null,
  });
};

test("derives total duration from scenes", () => {
  assert.equal(totalDurationInFrames(base()), 180);
});

test("rejects invalid hex", () => {
  assert.throws(() => parseProject({...base(), brand: {...base().brand, accent: "blue"}}));
});

test("layout wraps and reports overflow instead of clipping", () => {
  const result = layoutText({
    text: "This headline is intentionally far too long for a vertical frame and should wrap, shrink toward the minimum readable size, then report overflow instead of vanishing into a clip: inquiry details copied into a spreadsheet then a follow-up email then another inquiry details copied into a spreadsheet then a follow-up email again and again.",
    maxWidthPx: 800,
    maxHeightPx: 200,
    fontSize: 84,
    minFontSize: 48,
    lineHeight: 0.98,
  });
  assert.ok(result.lines.length > 1);
  assert.equal(result.fontSize, 48);
  assert.equal(result.overflow, true);
});

test("missing media is an error", async () => {
  const report = await validateProject(base(), () => false);
  assert.equal(report.ok, false);
  assert.ok(report.issues.some((issue) => issue.message.includes("Missing file")));
});

test("trim past source duration is an error", async () => {
  const project = base();
  const scene = project.scenes[1];
  if (scene.background.type !== "video") {
    throw new Error("expected video scene");
  }
  scene.background.trimEndSeconds = 9;
  const report = await validateProject(project, () => true);
  assert.equal(report.ok, false);
  assert.ok(
    report.issues.some((issue) => issue.message.includes("exceeds source duration")),
  );
});

test("short clip without freeze or loop is an error", async () => {
  const project = base();
  const scene = project.scenes[1];
  if (scene.background.type !== "video") {
    throw new Error("expected video scene");
  }
  scene.background.ifShort = null;
  assert.equal(videoIsShorterThanScene(project, scene), true);
  const report = await validateProject(project, () => true);
  assert.equal(report.ok, false);
  assert.ok(report.issues.some((issue) => issue.path.includes("ifShort")));
});

test("short clip is allowed when ifShort is set", async () => {
  const report = await validateProject(base(), () => true);
  assert.equal(report.ok, true, formatIssues(report));
});

test("long headline is an overflow error, not silent clipping", async () => {
  const project = base();
  project.scenes[0].headline.text =
    "This headline is intentionally far too long for a vertical frame and should wrap, shrink toward the minimum readable size, then report overflow instead of vanishing into a clip: inquiry details copied into a spreadsheet then a follow-up email then another inquiry details copied into a spreadsheet then a follow-up email again and again.";
  project.scenes[0].headline.placement.height = 0.2;
  const report = await validateProject(project, () => true);
  assert.equal(report.ok, false);
  assert.ok(
    report.issues.some(
      (issue) =>
        issue.code === "overflow" &&
        issue.level === "error" &&
        issue.path === "scenes[0].headline.text" &&
        issue.message.includes("cannot fit at minFontSize"),
    ),
    formatIssues(report),
  );
  assert.equal(blockingIssues(report, {allowOverflow: true}).length, 0);
  assert.equal(blockingIssues(report, {allowOverflow: false}).length, 1);
});

test("onset click is measurable at the configured source time", () => {
  const filePath = path.join(os.tmpdir(), "sailtru-onset-fixture.wav");
  writeWavOnsetClick(filePath, {
    durationSeconds: 1,
    onsetSeconds: 0.4,
    burstSeconds: 0.04,
    sampleRate: 48000,
  });
  const measured = measureWavOnsetSeconds(filePath);
  fs.unlinkSync(filePath);
  assert.ok(measured !== null);
  assert.ok(Math.abs(measured - 0.4) < 0.002, `onset ${measured}`);
});

const formatIssues = (report: {issues: Array<{message: string}>}): string => {
  return report.issues.map((issue) => issue.message).join("\n");
};
