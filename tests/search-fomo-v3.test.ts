import assert from "node:assert/strict";
import {test} from "node:test";
import {pulseAt, pulseGoneAt, pulsesOverlap, sharpOut, smooth} from "../src/motion/pulse";
import {providerLayerAt} from "../src/pipeline/providerRotation";
import {searchProviderRotation} from "../src/templates/search-fomo-v2/template";
import {
  consecutiveLineHold,
  FOMO_LINE_ONE_COPY,
  FOMO_LINE_TWO_COPY,
  pulsesExclusive,
} from "../src/templates/search-fomo-v3/fomo";
import {
  ANSWER_FROM,
  ANSWER_DONE,
  BLUE_FRAMES,
  CHAT_FRAMES,
  CHAT_TO_BLUE,
  CTA_HOLD_FRAMES,
  FOMO_FROM,
  FOMO_HOLD_END,
  FOMO_LINE_ONE,
  FOMO_LINE_TWO,
  OPENING_FRAMES,
  PILL_READY,
  PULSE_ONE,
  PULSE_TWO,
  SUBMIT_AT,
  TYPE_DONE,
  fomoGlobal,
  searchFomoV3Duration,
  searchFomoV3EndCard,
  searchFomoV3Template,
} from "../src/templates/search-fomo-v3/template";
import {templateIssues} from "../src/templates/types";
import {typedPrefix, typingCompleteFrame, USER_QUESTION} from "../src/templates/search-fomo-v3/typeQuestion";
import {
  assistantTokens,
  generatingCursorVisible,
  visibleWordCount,
} from "../src/templates/search-fomo-v3/wordReveal";

test("search-fomo-v3 template contract", () => {
  assert.deepEqual(templateIssues(searchFomoV3Template), []);
  const seconds = searchFomoV3Duration / 30;
  assert.ok(seconds >= 11 && seconds <= 16, `duration ${seconds}s`);
  assert.equal(CHAT_TO_BLUE >= 8 && CHAT_TO_BLUE <= 10, true);
  assert.equal(searchFomoV3EndCard.statement.replace("\n", " "), "See where your business stands.");
  assert.equal(searchFomoV3EndCard.cta, "Start diagnosis");
  assert.ok(CTA_HOLD_FRAMES >= 30);
  assert.equal(PILL_READY + CTA_HOLD_FRAMES, BLUE_FRAMES);
});

test("v2 provider windows are reused", () => {
  const at = (frameIndex: number) =>
    providerLayerAt(searchProviderRotation, frameIndex)
      .filter((layer) => layer.opacity > 0.85)
      .map((layer) => layer.provider.id);

  assert.deepEqual(at(0), ["chatgpt"]);
  assert.deepEqual(at(48), ["google"]);
  assert.deepEqual(at(90), ["claude"]);
  assert.ok(OPENING_FRAMES > 72);
});

test("campaign pulses never overlap", () => {
  assert.ok(PULSE_TWO.enterAt >= pulseGoneAt(PULSE_ONE));
  for (let frameIndex = 0; frameIndex < BLUE_FRAMES; frameIndex++) {
    assert.equal(pulsesOverlap(frameIndex, PULSE_ONE, PULSE_TWO), false);
  }
  const heldTwo = pulseAt(PULSE_TWO.enterAt + PULSE_TWO.enterFrames + 2, PULSE_TWO, sharpOut);
  assert.equal(heldTwo.opacity, 1);
  const afterOne = pulseAt(pulseGoneAt(PULSE_ONE), PULSE_ONE, smooth);
  assert.equal(afterOne.visible, false);
});

test("question types progressively and is spelled correctly", () => {
  assert.equal(typedPrefix(0), "");
  const mid = typedPrefix(Math.floor(typingCompleteFrame() / 2));
  assert.ok(mid.length > 0 && mid.length < USER_QUESTION.length);
  assert.equal(USER_QUESTION.startsWith(mid), true);
  assert.equal(typedPrefix(typingCompleteFrame()), USER_QUESTION);
  assert.ok(TYPE_DONE < SUBMIT_AT);
});

test("assistant response is word-by-word, not a screenshot dump", () => {
  assert.equal(visibleWordCount(-1), 0);
  assert.equal(visibleWordCount(0), 1);
  const mid = visibleWordCount(20);
  assert.ok(mid > 1 && mid < assistantTokens.length);
  assert.equal(visibleWordCount(10_000), assistantTokens.length);
  assert.equal(generatingCursorVisible(8), true);
  assert.equal(generatingCursorVisible(10_000), false);
  assert.ok(ANSWER_DONE <= FOMO_FROM);
  assert.ok(FOMO_FROM < CHAT_FRAMES);
  assert.ok(ANSWER_FROM < ANSWER_DONE);
  const brands = assistantTokens.filter((token) => token.kind === "brand").map((token) => token.text);
  assert.deepEqual(brands, ["LuminaSkin", "PureBloom", "CalmCove"]);
});

test("FOMO lines pulse on the ChatGPT scene, exclusive, second is the hit", () => {
  assert.equal(FOMO_LINE_ONE_COPY, "Not showing up?");
  assert.equal(FOMO_LINE_TWO_COPY, "Your competitors are.");
  assert.equal(pulsesExclusive(FOMO_LINE_ONE, FOMO_LINE_TWO), true);
  assert.ok(FOMO_FROM >= ANSWER_DONE);

  for (let frame = FOMO_FROM; frame < CHAT_FRAMES; frame++) {
    assert.equal(pulsesOverlap(frame, FOMO_LINE_ONE, FOMO_LINE_TWO), false);
  }

  const oneHold = consecutiveLineHold(CHAT_FRAMES, FOMO_LINE_ONE);
  const twoHold = consecutiveLineHold(CHAT_FRAMES, FOMO_LINE_TWO);
  assert.ok(oneHold >= FOMO_LINE_ONE.holdFrames, `line one hold ${oneHold}`);
  assert.ok(twoHold >= FOMO_LINE_TWO.holdFrames, `line two hold ${twoHold}`);

  const midOne = pulseAt(
    FOMO_LINE_ONE.enterAt + FOMO_LINE_ONE.enterFrames + 2,
    FOMO_LINE_ONE,
    smooth,
  );
  const midTwo = pulseAt(
    FOMO_LINE_TWO.enterAt + FOMO_LINE_TWO.enterFrames + 2,
    FOMO_LINE_TWO,
    sharpOut,
  );
  assert.equal(midOne.opacity, 1);
  assert.equal(midTwo.opacity, 1);
  assert.ok(FOMO_LINE_TWO.fromScale < FOMO_LINE_ONE.fromScale);

  assert.ok(FOMO_HOLD_END <= CHAT_FRAMES - CHAT_TO_BLUE);
  assert.equal(fomoGlobal.lineTwoHoldEnd, fomoGlobal.blueStart);
  assert.ok(pulseGoneAt(FOMO_LINE_ONE) <= FOMO_LINE_TWO.enterAt);
});
