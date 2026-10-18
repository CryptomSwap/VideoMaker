/**
 * Image-to-video provider contract.
 *
 * Live implementation: fal.ai queue from Node CLI (`scripts/generation`).
 * Models: hailuo-fast / ltx-fast (draft), kling | seedance (final-quality i2v on fal).
 * Keep credentials out of public/, project JSON, browser code, and manifests.
 *
 * Contract:
 * - Submit a text-free background plate + motion prompt + duration.
 * - Framing follows the start image.
 * - Never send headline, CTA, or logo. Reuse one take across scenes in Remotion.
 */

export type GenerationRequest = {
  projectId: string;
  sourceAssetId: string;
  motionPrompt: string;
  durationSeconds: number;
  aspectRatio: `${number}:${number}`;
};

export type GenerationJob = {
  id: string;
  provider: string;
  status: "queued" | "running" | "succeeded" | "failed";
  error: string | null;
  outputPath: string | null;
  metadata: Record<string, string>;
};

export type GenerationProvider = {
  readonly id: string;
  submit: (request: GenerationRequest) => Promise<{jobId: string}>;
  status: (jobId: string) => Promise<GenerationJob>;
  importResult: (
    jobId: string,
    projectId: string,
  ) => Promise<{assetId: string}>;
};

export class NotConfiguredProvider implements GenerationProvider {
  readonly id = "unconfigured";

  submit(): Promise<{jobId: string}> {
    return Promise.reject(new Error(notConfiguredMessage()));
  }

  status(): Promise<GenerationJob> {
    return Promise.reject(new Error(notConfiguredMessage()));
  }

  importResult(): Promise<{assetId: string}> {
    return Promise.reject(new Error(notConfiguredMessage()));
  }
}

export const defaultGenerationProvider = new NotConfiguredProvider();

export const notConfiguredMessage = (): string => {
  return [
    "No image-to-video provider is configured.",
    "Set FAL_KEY in .env (never commit it), then:",
    "npx tsx scripts/ad.ts generate preview --preset=draft --project=sailtru-first-ad --source=plate-still --scene=connect --prompt-file=prompts/motion.txt --aspect=9:16 --text-free",
    "Paid submit requires --execute. Import a local clip with: npm run ad -- import <projectId> <file> --kind=video",
  ].join(" ");
};
