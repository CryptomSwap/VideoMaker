export const USER_QUESTION =
  "Can you recommend the best skincare brands for sensitive skin?";

/**
 * Variable-cadence typing. Frames from the start of the type beat
 * until each character is committed. Faster than 1:1 so the question
 * can actually be read before submit.
 */
export const charCommitFrames = (text: string = USER_QUESTION): number[] => {
  const commits: number[] = [];
  let frame = 0;
  for (let index = 0; index < text.length; index++) {
    const ch = text[index];
    // ~1.6 chars/frame with a hitch on spaces and the question mark.
    if (ch === "?") {
      frame += 3;
    } else if (ch === " ") {
      frame += 1;
    } else if (index % 3 === 0) {
      frame += 1;
    }
    commits.push(Math.max(1, Math.ceil(frame / 2)));
  }
  return commits;
};

export const typedPrefix = (
  localFrame: number,
  text: string = USER_QUESTION,
): string => {
  if (localFrame <= 0) {
    return "";
  }
  const commits = charCommitFrames(text);
  let count = 0;
  for (const commit of commits) {
    if (localFrame >= commit) {
      count += 1;
    }
  }
  return text.slice(0, count);
};

export const typingCompleteFrame = (text: string = USER_QUESTION): number => {
  const commits = charCommitFrames(text);
  return commits[commits.length - 1] ?? 0;
};
