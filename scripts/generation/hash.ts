import {createHash} from "node:crypto";
import fs from "node:fs";

export const hashFile = (filePath: string): string => {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
};

export const fingerprintRequest = (input: {
  projectId: string;
  sceneId: string;
  sourceAssetId: string;
  sourceHash: string;
  prompt: string;
  durationSeconds: number;
  aspectRatio: string;
  model: string;
}): string => {
  const canonical = [
    input.projectId,
    input.sceneId,
    input.sourceAssetId,
    input.sourceHash,
    input.prompt.trim(),
    String(input.durationSeconds),
    input.aspectRatio,
    input.model,
  ].join("\n");
  return createHash("sha256").update(canonical).digest("hex");
};

export const newLocalJobId = (): string => {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const rand = createHash("sha256")
    .update(`${stamp}-${Math.random()}`)
    .digest("hex")
    .slice(0, 8);
  return `gen-${stamp}-${rand}`.toLowerCase();
};
