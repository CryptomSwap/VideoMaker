import assert from "node:assert/strict";
import {test} from "node:test";
import {encodeToneWav} from "../src/motion/cueWav";
import {pulseAt, pulseGoneAt, pulsesOverlap, sharpOut, smooth} from "../src/motion/pulse";
import {providerLayerAt} from "../src/pipeline/providerRotation";
import {parseProject} from "../src/pipeline/schema";
import {
  CTA_HOLD_FRAMES,
  PILL_READY,
  PULSE_ONE,
  PULSE_TWO,
  SEARCH_FRAMES,
  endCards,
  searchFomoDefaults,
  searchFomoDuration,
  searchFomoV2Template,
  searchProviderRotation,
} from "../src/templates/search-fomo-v2/template";
import {templateIssues} from "../src/templates/types";
import {frame} from "../src/templates/search-fomo-v2/layout";

test("search-fomo-v2 template contract", () => {
  assert.deepEqual(templateIssues(searchFomoV2Template), []);
  assert.equal(searchFomoDuration, 240);
  assert.equal(searchFomoV2Template.cta?.slotId, "cta");
  assert.equal(searchFomoV2Template.typography.font, "heebo");
  assert.equal(searchFomoDefaults.pulseOne.replace("\n", " "), "Find what's missing.");
  assert.equal(searchFomoDefaults.pulseTwo.replace("\n", " "), "Fix what matters.");
  assert.equal(endCards.a.statement, "Now, let's fix it.");
  assert.equal(endCards.a.descriptor, "SEO · GEO · Custom AI");
  assert.equal(endCards.b.statement, "See what you're missing.");
  assert.equal(endCards.b.descriptor, null);
  assert.ok(CTA_HOLD_FRAMES >= 30);
  assert.equal(PILL_READY + CTA_HOLD_FRAMES, 134);
});

test("provider rotation is unchanged and holds Claude into the expand", () => {
  const at = (frameIndex: number) =>
    providerLayerAt(searchProviderRotation, frameIndex)
      .filter((layer) => layer.opacity > 0.85)
      .map((layer) => layer.provider.id);

  assert.deepEqual(at(0), ["chatgpt"]);
  assert.deepEqual(at(20), ["chatgpt"]);
  assert.deepEqual(at(48), ["google"]);
  assert.deepEqual(at(90), ["claude"]);

  const transitionStart =
    searchFomoV2Template.scenes[0].durationInFrames -
    searchFomoV2Template.transitions[0].durationInFrames;
  assert.equal(searchFomoV2Template.scenes[0].durationInFrames, SEARCH_FRAMES);
  assert.equal(transitionStart, 106);
  assert.deepEqual(at(transitionStart - 1), ["claude"]);
  assert.deepEqual(at(SEARCH_FRAMES - 1), ["claude"]);
});

test("campaign pulses never overlap and match the requested holds", () => {
  assert.equal(PULSE_ONE.holdFrames, 21);
  assert.equal(PULSE_TWO.holdFrames, 30);
  assert.equal(PULSE_ONE.fromScale, 0.92);
  assert.equal(PULSE_TWO.fromScale, 0.88);
  assert.ok(PULSE_TWO.enterAt >= pulseGoneAt(PULSE_ONE));

  for (let frameIndex = 0; frameIndex < 134; frameIndex++) {
    assert.equal(pulsesOverlap(frameIndex, PULSE_ONE, PULSE_TWO), false);
  }

  const heldOne = pulseAt(PULSE_ONE.enterAt + PULSE_ONE.enterFrames + 2, PULSE_ONE, smooth);
  const heldTwo = pulseAt(PULSE_TWO.enterAt + PULSE_TWO.enterFrames + 2, PULSE_TWO, sharpOut);
  assert.equal(heldOne.opacity, 1);
  assert.equal(heldOne.scale, 1);
  assert.equal(heldTwo.opacity, 1);
  assert.equal(heldTwo.scale, 1);

  const afterOne = pulseAt(pulseGoneAt(PULSE_ONE), PULSE_ONE, smooth);
  const beforeTwo = pulseAt(PULSE_TWO.enterAt - 1, PULSE_TWO, sharpOut);
  assert.equal(afterOne.visible, false);
  assert.equal(beforeTwo.visible, false);
});

test("phone-safe column and cue files are real wavs", () => {
  assert.ok(frame.padX >= 72);
  assert.ok(frame.ruleY > 800 && frame.ruleY < 1400);

  const tick = encodeToneWav({
    seconds: 0.04,
    frequency: 1400,
    volume: 0.35,
  });
  const expand = encodeToneWav({
    seconds: 0.28,
    frequency: 140,
    endFrequency: 420,
    volume: 0.4,
    decay: 8,
  });
  assert.equal(tick.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(expand.subarray(8, 12).toString("ascii"), "WAVE");
  assert.ok(expand.length > tick.length);
});

test("adding Heebo does not break an existing project font pair", () => {
  const project = parseProject({
    schemaVersion: 1,
    id: "legacy-font",
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
    safeArea: {top: 80, bottom: 80, left: 80, right: 80},
    assets: [],
    scenes: [
      {
        id: "only",
        durationInFrames: 30,
        background: {
          type: "image",
          assetId: "plate",
          crop: {x: 0.5, y: 0.5, zoom: 1},
          stillPanZoom: null,
        },
        contrast: null,
        headline: {
          text: "Still here",
          placement: {
            x: 0.5,
            y: 0.2,
            width: 0.8,
            height: 0.2,
            anchor: "top-center",
            safeInset: true,
          },
          animation: "fade",
          delayFrames: 0,
          fontSize: 64,
          minFontSize: 32,
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

  assert.equal(project.brand.headlineFont, "instrument-serif");
});
