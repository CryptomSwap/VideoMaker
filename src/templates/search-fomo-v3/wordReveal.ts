export type WordKind = "intro" | "index" | "brand" | "body";

export type WordToken = {
  text: string;
  /** Frames after the previous token becomes visible. */
  delay: number;
  /** Extra hold after this token, typically after punctuation. */
  pauseAfter: number;
  weight: 400 | 700;
  breakBefore: boolean;
  kind: WordKind;
};

const word = (
  text: string,
  kind: WordKind,
  extra: Partial<Omit<WordToken, "text" | "kind">> = {},
): WordToken => {
  const punct = /[.:]$/.test(text);
  return {
    text,
    delay: extra.delay ?? 1,
    pauseAfter: extra.pauseAfter ?? (punct ? 3 : 0),
    weight: extra.weight ?? (kind === "brand" ? 700 : 400),
    breakBefore: extra.breakBefore ?? false,
    kind,
  };
};

/**
 * Editable ChatGPT answer. Fictional brands, reconstructed from the
 * reference screenshot — never faded in as a bitmap.
 */
export const assistantTokens: WordToken[] = [
  word("Here", "intro", {delay: 0}),
  word("are", "intro"),
  word("a", "intro"),
  word("few", "intro"),
  word("brands", "intro"),
  word("worth", "intro"),
  word("considering:", "intro", {pauseAfter: 8}),

  word("1.", "index", {breakBefore: true, delay: 6, pauseAfter: 2, weight: 700}),
  word("LuminaSkin", "brand", {delay: 3, pauseAfter: 3}),
  word("–", "body", {delay: 2}),
  word("Gentle,", "body"),
  word("dermatologist-tested", "body"),
  word("formulas.", "body", {pauseAfter: 7}),

  word("2.", "index", {breakBefore: true, delay: 5, pauseAfter: 2, weight: 700}),
  word("PureBloom", "brand", {delay: 3, pauseAfter: 3}),
  word("–", "body", {delay: 2}),
  word("Fragrance-free", "body"),
  word("products,", "body"),
  word("simple", "body"),
  word("ingredients.", "body", {pauseAfter: 7}),

  word("3.", "index", {breakBefore: true, delay: 5, pauseAfter: 2, weight: 700}),
  word("CalmCove", "brand", {delay: 3, pauseAfter: 3}),
  word("–", "body", {delay: 2}),
  word("Soothing", "body"),
  word("care", "body"),
  word("for", "body"),
  word("reactive", "body"),
  word("skin.", "body", {pauseAfter: 10}),
];

const CHAT_SPEED = 2;

export const tokenStartFrames = (tokens: readonly WordToken[]): number[] => {
  const starts: number[] = [];
  let cursor = 0;
  for (const token of tokens) {
    cursor += token.delay / CHAT_SPEED;
    starts.push(cursor);
    cursor += token.pauseAfter / CHAT_SPEED;
  }
  return starts;
};

export const visibleWordCount = (
  localFrame: number,
  tokens: readonly WordToken[] = assistantTokens,
): number => {
  const starts = tokenStartFrames(tokens);
  let count = 0;
  for (const start of starts) {
    if (localFrame >= start) {
      count += 1;
    }
  }
  return count;
};

export const answerCompleteFrame = (
  tokens: readonly WordToken[] = assistantTokens,
): number => {
  const starts = tokenStartFrames(tokens);
  const last = starts[starts.length - 1] ?? 0;
  const lastToken = tokens[tokens.length - 1];
  return last + (lastToken?.pauseAfter ?? 0);
};

export const generatingCursorVisible = (
  localFrame: number,
  tokens: readonly WordToken[] = assistantTokens,
): boolean => {
  const count = visibleWordCount(localFrame, tokens);
  if (count <= 0) {
    return false;
  }
  return count < tokens.length || localFrame < answerCompleteFrame(tokens);
};
