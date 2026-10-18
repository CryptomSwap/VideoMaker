import assert from "node:assert/strict";
import {test} from "node:test";
import {parseProject, type Project} from "../src/pipeline/schema";
import {
  providerLayerAt,
  visibleProvidersAt,
} from "../src/pipeline/providerRotation";
import {validateProject} from "../src/pipeline/validate";

const rotation = {
  transitionFrames: 5,
  placement: {
    x: 0.5,
    y: 0.22,
    width: 0.86,
    height: 0.14,
    anchor: "top-center" as const,
    safeInset: true,
  },
  fontSize: 92,
  color: "#FFFFFF",
  providers: [
    {
      id: "chatgpt",
      label: "ChatGPT",
      logoAssetId: "chatgpt-logo",
      startFrame: 0,
      endFrame: 22,
      logoDisplayHeight: 72,
    },
    {
      id: "google",
      label: "Google",
      logoAssetId: "google-logo",
      startFrame: 22,
      endFrame: 44,
      logoDisplayHeight: 62,
    },
    {
      id: "claude",
      label: "Claude",
      logoAssetId: "claude-logo",
      startFrame: 44,
      endFrame: 75,
      logoDisplayHeight: 70,
    },
  ],
};

const idsAt = (frame: number): string[] => {
  return visibleProvidersAt(rotation, frame).map((layer) => layer.provider.id);
};

const opacityOf = (frame: number, id: string): number => {
  const layer = providerLayerAt(rotation, frame).find((entry) => entry.provider.id === id);
  return layer?.opacity ?? 0;
};

test("first provider is fully visible at frame 0", () => {
  assert.deepEqual(idsAt(0), ["chatgpt"]);
  assert.equal(opacityOf(0, "chatgpt"), 1);
});

test("crossfade overlaps outgoing ChatGPT and incoming Google", () => {
  const ids = idsAt(19);
  assert.ok(ids.includes("chatgpt"));
  assert.ok(ids.includes("google"));
  assert.ok(opacityOf(19, "chatgpt") < 1);
  assert.ok(opacityOf(19, "google") > 0);
});

test("mid Google window is Google only", () => {
  assert.deepEqual(idsAt(33), ["google"]);
  assert.equal(opacityOf(33, "google"), 1);
});

test("Claude holds through the final question window", () => {
  assert.deepEqual(idsAt(55), ["claude"]);
  assert.deepEqual(idsAt(70), ["claude"]);
  assert.equal(opacityOf(70, "claude"), 1);
  assert.equal(opacityOf(74, "claude"), 1);
});

test("no provider is visible after the scene range", () => {
  assert.deepEqual(idsAt(75), []);
});

const projectWithRotation = (): Project => {
  return parseProject({
    schemaVersion: 1,
    id: "unit-test",
    title: "Unit test",
    width: 1080,
    height: 1920,
    fps: 30,
    brand: {
      paper: "#091322",
      ink: "#FFFFFF",
      accent: "#3B63FF",
      headlineFont: "ibm-plex-sans",
      bodyFont: "ibm-plex-sans",
      logoAssetId: "sailtru-logo",
    },
    safeArea: {top: 170, bottom: 280, left: 72, right: 96},
    assets: [
      {
        id: "hook-background",
        kind: "image",
        src: "assets/hook-background.png",
        originalName: "hook-background.png",
        width: 941,
        height: 1672,
        durationInSeconds: null,
        importedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "chatgpt-logo",
        kind: "logo",
        src: "assets/chatgpt-logo.png",
        originalName: "OpenAI-white-monoblossom.png",
        width: 721,
        height: 721,
        durationInSeconds: null,
        importedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "google-logo",
        kind: "logo",
        src: "assets/google-logo.png",
        originalName: "googleg_standard_color_128dp.png",
        width: 256,
        height: 256,
        durationInSeconds: null,
        importedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "claude-logo",
        kind: "logo",
        src: "assets/claude-logo.svg",
        originalName: "Claude_AI_symbol.svg",
        width: null,
        height: null,
        durationInSeconds: null,
        importedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "sailtru-logo",
        kind: "logo",
        src: "assets/sailtru-logo.png",
        originalName: "sailtru-logo-transparent.png",
        width: 961,
        height: 293,
        durationInSeconds: null,
        importedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    scenes: [
      {
        id: "hook",
        durationInFrames: 75,
        background: {
          type: "image",
          assetId: "hook-background",
          crop: {x: 0.5, y: 0.5, zoom: 1},
          stillPanZoom: null,
        },
        contrast: null,
        headline: {
          text: "What does",
          placement: {
            x: 0.5,
            y: 0.1,
            width: 0.82,
            height: 0.1,
            anchor: "top-center",
            safeInset: true,
          },
          animation: "none",
          delayFrames: 0,
          fontSize: 70,
          minFontSize: 48,
          lineHeight: 1,
          color: "#FFFFFF",
        },
        supporting: {
          text: "say about your business?",
          placement: {
            x: 0.5,
            y: 0.38,
            width: 0.82,
            height: 0.14,
            anchor: "top-center",
            safeInset: true,
          },
          animation: "none",
          delayFrames: 0,
          fontSize: 70,
          minFontSize: 40,
          lineHeight: 1.05,
          color: "#FFFFFF",
        },
        cta: null,
        showLogo: false,
        logoPlacement: null,
        providerRotation: rotation,
      },
    ],
    audio: null,
  });
};

test("existing projects still parse without providerRotation", () => {
  const project = parseProject({
    schemaVersion: 1,
    id: "legacy",
    title: "Legacy",
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
    ],
    audio: null,
  });
  assert.equal(project.scenes[0].providerRotation, undefined);
});

test("provider rotation config validates when ranges hold through the scene", async () => {
  const report = await validateProject(projectWithRotation(), () => true);
  assert.equal(report.ok, true, report.issues.map((issue) => issue.message).join("\n"));
});

test("blank slot after the last provider is an error", async () => {
  const project = projectWithRotation();
  const rotationConfig = project.scenes[0].providerRotation;
  if (!rotationConfig) {
    throw new Error("expected rotation");
  }
  rotationConfig.providers[2].endFrame = 66;
  const report = await validateProject(project, () => true);
  assert.equal(report.ok, false);
  assert.ok(report.issues.some((issue) => issue.message.includes("hold through the scene end")));
});
