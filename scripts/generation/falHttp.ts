import {
  falQueueSubmitUrl,
  GENERATION_MODELS,
  KLING_V3_STANDARD_I2V_ENDPOINT,
  type FalI2vModel,
} from "../../src/pipeline/generation/spec";
import type {FalResultResponse, FalStatusResponse, FalSubmitResponse} from "./types";

export type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | Buffer;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}>;

export type FalHttp = {
  submit: (
    endpoint: string,
    input: Record<string, unknown>,
    timeoutMs: number,
  ) => Promise<FalSubmitResponse>;
  status: (statusUrl: string) => Promise<FalStatusResponse>;
  result: (resultUrl: string) => Promise<FalResultResponse>;
  cancel: (cancelUrl: string) => Promise<{httpStatus: number; body: string}>;
  download: (url: string, timeoutMs: number) => Promise<Buffer>;
};

const authHeader = (apiKey: string): string => {
  return `Key ${apiKey}`;
};

const withTimeout = (timeoutMs: number): AbortSignal => {
  return AbortSignal.timeout(timeoutMs);
};

const readJson = async <T>(
  response: {ok: boolean; status: number; text: () => Promise<string>},
  label: string,
): Promise<T> => {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${label} failed HTTP ${response.status}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${label} returned non-JSON: ${text.slice(0, 200)}`);
  }
};

export const createFalHttp = (options: {
  apiKey: string;
  fetchImpl?: FetchLike;
}): FalHttp => {
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const headers = {
    Authorization: authHeader(options.apiKey),
    "Content-Type": "application/json",
  };

  return {
    submit: async (endpoint, input, timeoutMs) => {
      const response = await fetchImpl(falQueueSubmitUrl(endpoint), {
        method: "POST",
        headers,
        body: JSON.stringify(input),
        signal: withTimeout(timeoutMs),
      });
      return readJson<FalSubmitResponse>(response, "fal queue submit");
    },
    status: async (statusUrl) => {
      const response = await fetchImpl(statusUrl, {
        method: "GET",
        headers: {Authorization: authHeader(options.apiKey)},
      });
      return readJson<FalStatusResponse>(response, "fal queue status");
    },
    result: async (resultUrl) => {
      const response = await fetchImpl(resultUrl, {
        method: "GET",
        headers: {Authorization: authHeader(options.apiKey)},
      });
      return readJson<FalResultResponse>(response, "fal queue result");
    },
    cancel: async (cancelUrl) => {
      const response = await fetchImpl(cancelUrl, {
        method: "PUT",
        headers: {Authorization: authHeader(options.apiKey)},
      });
      const body = await response.text();
      return {httpStatus: response.status, body};
    },
    download: async (url, timeoutMs) => {
      const response = await fetchImpl(url, {
        method: "GET",
        signal: withTimeout(timeoutMs),
      });
      if (!response.ok) {
        throw new Error(`Download failed HTTP ${response.status} for ${url.split("?")[0]}`);
      }
      return Buffer.from(await response.arrayBuffer());
    },
  };
};

export const buildI2vInput = (options: {
  model: FalI2vModel;
  imageDataUri: string;
  prompt: string;
  durationSeconds: number;
  aspectRatio?: `${number}:${number}`;
  seed?: number | null;
}): Record<string, unknown> => {
  const duration = options.model.durationAsString
    ? String(options.durationSeconds)
    : options.durationSeconds;
  const body: Record<string, unknown> = {
    [options.model.imageField]: options.imageDataUri,
    prompt: options.prompt,
    duration,
    ...options.model.extraInput,
  };
  if (options.model.passRequestedAspectRatio && options.aspectRatio) {
    body.aspect_ratio = options.aspectRatio;
  }
  if (options.model.supportsGenerateAudio) {
    body.generate_audio = false;
  }
  if (options.model.supportsSeed && options.seed != null) {
    body.seed = options.seed;
  }
  return body;
};

export const buildKlingI2vInput = (options: {
  startImageUrl: string;
  prompt: string;
  durationSeconds: number;
}): Record<string, unknown> => {
  return buildI2vInput({
    model: GENERATION_MODELS.kling,
    imageDataUri: options.startImageUrl,
    prompt: options.prompt,
    durationSeconds: options.durationSeconds,
  });
};

export const endpointId = KLING_V3_STANDARD_I2V_ENDPOINT;

export const imageDataUri = (bytes: Buffer, ext: string): string => {
  const mime =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${bytes.toString("base64")}`;
};
