export type TextLayoutInput = {
  text: string;
  maxWidthPx: number;
  maxHeightPx: number;
  fontSize: number;
  minFontSize: number;
  lineHeight: number;
  avgCharRatio?: number;
};

export type TextLayoutResult = {
  fontSize: number;
  lines: string[];
  height: number;
  overflow: boolean;
};

const wrapLines = (
  text: string,
  charsPerLine: number,
): string[] => {
  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/g);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= charsPerLine) {
        current = next;
      } else {
        if (current) {
          lines.push(current);
        }
        if (word.length <= charsPerLine) {
          current = word;
        } else {
          let rest = word;
          while (rest.length > charsPerLine) {
            lines.push(rest.slice(0, charsPerLine));
            rest = rest.slice(charsPerLine);
          }
          current = rest;
        }
      }
    }
    if (current) {
      lines.push(current);
    }
  }

  return lines.length ? lines : [""];
};

export const layoutText = (input: TextLayoutInput): TextLayoutResult => {
  const ratio = input.avgCharRatio ?? 0.55;
  const minSize = Math.min(input.minFontSize, input.fontSize);
  let size = input.fontSize;
  let lines = wrapLines(
    input.text,
    Math.max(1, Math.floor(input.maxWidthPx / (size * ratio))),
  );
  let height = lines.length * size * input.lineHeight;

  while (size > minSize && height > input.maxHeightPx) {
    size -= 1;
    lines = wrapLines(
      input.text,
      Math.max(1, Math.floor(input.maxWidthPx / (size * ratio))),
    );
    height = lines.length * size * input.lineHeight;
  }

  return {
    fontSize: size,
    lines,
    height,
    overflow: height > input.maxHeightPx + 0.5,
  };
};

export const copyHeightBudget = (
  placementHeight: number,
  compositionHeight: number,
  fontSize: number,
): number => {
  return Math.max(fontSize * 1.2, placementHeight * compositionHeight);
};
