import assert from "node:assert/strict";
import {test} from "node:test";
import {pulseAt, pulseGoneAt, pulsesOverlap, sharpOut, smooth} from "../src/motion/pulse";
import {providerLayerAt} from "../src/pipeline/providerRotation";
import {searchProviderRotation} from "../src/templates/search-fomo-v2/template";
import {
  FOMO_LINE_ONE_COPY,
  FOMO_LINE_TWO_COPY,
  FOMO_MIN_HOLD_FRAMES,
} from "../src/templates/search-fomo-v4/fomo";
import {
  ANSWER_DONE,
  ANSWER_FROM,
  BLUE_FRAMES,
  BLUE_BEAT_AFTER_PULSE_TWO,
  PULSE_TWO_HOLD_END,
  BLUE_TO_END,
  HOOK_CHAT_FRAMES,
  CHAT_TO_BLUE,
  END_ANIM_DONE,
  END_CTA_FROM,
  END_FRAMES,
  END_HOLD_FRAMES,
  END_SERVICES_FROM,
  FOMO_FROM,
  FOMO_HOLD_FRAMES,
  FOMO_LINE_ONE_ENTER,
  FOMO_LINE_TWO_DELAY,
  FOMO_LINE_TWO_ENTER,
  FOMO_READY_FOR_BLUE,
  PULSE_ONE,
  PULSE_TWO,
  SUBMIT_AT,
  TYPE_DONE,
  fomoGlobal,
  searchFomoV4Duration,
  searchFomoV4EndCard,
  searchFomoV4Template,
} from "../src/templates/search-fomo-v4/template";
import {deriveEndCardTiming} from "../src/templates/search-fomo-v4/endCardMotion";
import {templateIssues} from "../src/templates/types";
import {typedPrefix, typingCompleteFrame, USER_QUESTION} from "../src/templates/search-fomo-v3/typeQuestion";
import {
  assistantTokens,
  generatingCursorVisible,
  visibleWordCount,
} from "../src/templates/search-fomo-v3/wordReveal";

test("search-fomo-v4 template contract", () => {
  assert.deepEqual(templateIssues(searchFomoV4Template), []);
  const seconds = searchFomoV4Duration / 30;
  assert.ok(seconds >= 10.5 && seconds <= 18, `duration ${seconds}s`);
  assert.equal(FOMO_HOLD_FRAMES, FOMO_MIN_HOLD_FRAMES);
  assert.equal(searchFomoV4EndCard.cta, "Start diagnosis →");
  assert.ok(END_HOLD_FRAMES >= 36);
  assert.equal(END_ANIM_DONE + END_HOLD_FRAMES, END_FRAMES);
  const endMotion = deriveEndCardTiming(searchFomoV4EndCard);
  for (let i = 1; i < endMotion.headlineStarts.length; i++) {
    assert.ok(endMotion.headlineStarts[i] > endMotion.headlineStarts[i - 1]);
  }
  assert.equal(endMotion.servicesFrom, END_SERVICES_FROM);
  assert.equal(endMotion.ctaFrom, END_CTA_FROM);
});

test("v2 provider windows are reused", () => {
  const at = (frameIndex: number) =>
    providerLayerAt(searchProviderRotation, frameIndex)
      .filter((layer) => layer.opacity > 0.85)
      .map((layer) => layer.provider.id);

  assert.deepEqual(at(0), ["chatgpt"]);
  assert.deepEqual(at(48), ["google"]);
  assert.deepEqual(at(90), ["claude"]);
  assert.ok(HOOK_CHAT_FRAMES > 72);
});

test("campaign pulses never overlap", () => {
  assert.ok(PULSE_TWO.enterAt >= pulseGoneAt(PULSE_ONE));
  for (let frameIndex = 0; frameIndex < BLUE_FRAMES; frameIndex++) {
    assert.equal(pulsesOverlap(frameIndex, PULSE_ONE, PULSE_TWO), false);
  }
});

test("question and answer choreography unchanged from v3", () => {
  assert.equal(typedPrefix(typingCompleteFrame()), USER_QUESTION);
  assert.ok(TYPE_DONE < SUBMIT_AT);
  assert.equal(visibleWordCount(10_000), assistantTokens.length);
  assert.equal(generatingCursorVisible(8), true);
  assert.ok(ANSWER_DONE <= FOMO_FROM);
  assert.ok(FOMO_FROM < HOOK_CHAT_FRAMES);
  const brands = assistantTokens
    .filter((token) => token.kind === "brand")
    .map((token) => token.text);
  assert.deepEqual(brands, ["LuminaSkin", "PureBloom", "CalmCove"]);
});

test("FOMO warning holds before blue transition", () => {
  assert.equal(FOMO_LINE_ONE_COPY, "Not showing up?");
  assert.equal(FOMO_LINE_TWO_COPY, "Your competitors are.");
  assert.equal(
    FOMO_READY_FOR_BLUE,
    FOMO_FROM + FOMO_LINE_TWO_DELAY + FOMO_LINE_TWO_ENTER + FOMO_HOLD_FRAMES,
  );
  assert.ok(FOMO_READY_FOR_BLUE <= HOOK_CHAT_FRAMES - CHAT_TO_BLUE);
  assert.equal(fomoGlobal.warningHoldEnd, fomoGlobal.blueStart);

  const lineTwoFull =
    fomoGlobal.lineTwoEnter + FOMO_LINE_TWO_ENTER;
  const holdEnd = fomoGlobal.warningHoldEnd;
  assert.ok(holdEnd - lineTwoFull >= FOMO_MIN_HOLD_FRAMES);
});

test("wave transition starts right after pulse two hold", () => {
  const transitionOverlapStart = BLUE_FRAMES - BLUE_TO_END;
  assert.equal(
    transitionOverlapStart,
    PULSE_TWO_HOLD_END + BLUE_BEAT_AFTER_PULSE_TWO,
  );
  assert.ok(
    transitionOverlapStart < pulseGoneAt(PULSE_TWO),
    "hand off during pulse two exit, not after empty blue",
  );
  assert.ok(PULSE_ONE.enterAt <= CHAT_TO_BLUE);
  const held = pulseAt(
    PULSE_TWO.enterAt + PULSE_TWO.enterFrames + 4,
    PULSE_TWO,
    sharpOut,
  );
  assert.equal(held.opacity, 1);
});
