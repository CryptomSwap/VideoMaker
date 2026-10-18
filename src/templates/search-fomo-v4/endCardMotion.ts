import {sharpOut, smooth} from "../../motion/pulse";

export type EndCardCopy = {
  headlineLead: string;
  headlineTail: string;
  headlineBrand: string;
  descriptor: string;
  cta: string;
};

export type EndCardWordToken = {
  text: string;
  line: 0 | 1;
  emphasis?: "brand";
  /** Frames after the previous token begins. */
  delay: number;
};

const clamp01 = (t: number): number => {
  if (t <= 0) {
    return 0;
  }
  if (t >= 1) {
    return 1;
  }
  return t;
};

export const END_LOGO_FROM = 8;
export const END_LOGO_SPAN = 14;

export const END_HEADLINE_FROM = 12;
export const END_WORD_ENTER_SPAN = 7;
export const END_LINE_BREAK_PAUSE = 5;

export const END_SERVICES_SPAN = 9;
export const END_SERVICE_GAP = 3;

export const END_CTA_SPAN = 16;
export const END_CTA_TEXT_LAG = 5;

export const buildHeadlineTokens = (
  copy: Pick<EndCardCopy, "headlineLead" | "headlineTail" | "headlineBrand">,
): EndCardWordToken[] => {
  const tokens: EndCardWordToken[] = [];
  const pushLine = (line: 0 | 1, sentence: string, firstDelay: number) => {
    const words = sentence.trim().split(/\s+/);
    words.forEach((text, index) => {
      tokens.push({
        text,
        line,
        delay: index === 0 ? firstDelay : 2,
      });
    });
  };

  pushLine(0, copy.headlineLead, 0);
  pushLine(1, copy.headlineTail, END_LINE_BREAK_PAUSE);
  tokens.push({
    text: copy.headlineBrand,
    line: 1,
    emphasis: "brand",
    delay: 2,
  });

  return tokens;
};

export const servicePartsFromDescriptor = (descriptor: string): string[] => {
  return descriptor.split("·").map((part) => part.trim());
};

export const wordStartFrames = (
  tokens: readonly EndCardWordToken[],
  firstAt: number,
): number[] => {
  const starts: number[] = [];
  let cursor = firstAt;
  for (const token of tokens) {
    cursor += token.delay;
    starts.push(cursor);
  }
  return starts;
};

export const headlineRevealDoneAt = (
  copy: Pick<EndCardCopy, "headlineLead" | "headlineTail" | "headlineBrand">,
): number => {
  const tokens = buildHeadlineTokens(copy);
  const starts = wordStartFrames(tokens, END_HEADLINE_FROM);
  const last = starts[starts.length - 1] ?? END_HEADLINE_FROM;
  return last + END_WORD_ENTER_SPAN + 2;
};

export const deriveEndCardTiming = (copy: EndCardCopy) => {
  const servicesFrom = headlineRevealDoneAt(copy);
  const serviceParts = servicePartsFromDescriptor(copy.descriptor);
  const ctaFrom =
    servicesFrom +
    serviceParts.length * END_SERVICE_GAP +
    END_SERVICES_SPAN +
    2;
  const animDone = ctaFrom + END_CTA_SPAN;

  return {
    servicesFrom,
    ctaFrom,
    animDone,
    serviceParts,
    headlineTokens: buildHeadlineTokens(copy),
    headlineStarts: wordStartFrames(
      buildHeadlineTokens(copy),
      END_HEADLINE_FROM,
    ),
  };
};

export const wordEnter = (
  local: number,
  start: number,
  span = END_WORD_ENTER_SPAN,
): number => {
  return sharpOut(clamp01((local - start) / Math.max(1, span)));
};

export const logoEnter = (local: number): number => {
  return sharpOut(clamp01((local - END_LOGO_FROM) / END_LOGO_SPAN));
};

export const serviceEnter = (local: number, index: number, servicesFrom: number): number => {
  const start = servicesFrom + index * END_SERVICE_GAP;
  return sharpOut(clamp01((local - start) / END_SERVICES_SPAN));
};

export const servicesSeparatorOpacity = (
  local: number,
  afterIndex: number,
  servicesFrom: number,
): number => {
  const start =
    servicesFrom + afterIndex * END_SERVICE_GAP + Math.floor(END_SERVICES_SPAN * 0.45);
  return smooth(clamp01((local - start) / 5));
};

export const ctaShellEnter = (local: number, ctaFrom: number): number => {
  return sharpOut(clamp01((local - ctaFrom) / END_CTA_SPAN));
};

export const ctaLabelEnter = (local: number, ctaFrom: number): number => {
  return sharpOut(
    clamp01((local - ctaFrom - END_CTA_TEXT_LAG) / (END_CTA_SPAN - END_CTA_TEXT_LAG)),
  );
};
