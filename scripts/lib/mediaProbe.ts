import {spawn} from "node:child_process";
import path from "node:path";

export type MediaProbe = {
  width: number | null;
  height: number | null;
  durationInSeconds: number | null;
  fps: string | null;
  hasAudio: boolean;
};

export const probeMediaFile = async (
  remotionCli: string,
  filePath: string,
  cwd: string,
): Promise<MediaProbe> => {
  const raw = await new Promise<string>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        remotionCli,
        "ffprobe",
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        filePath,
      ],
      {cwd, windowsHide: true},
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(stderr || `ffprobe exited ${code}`));
    });
  });

  const parsed = JSON.parse(raw) as {
    format?: {duration?: string};
    streams?: Array<{
      codec_type?: string;
      width?: number;
      height?: number;
      duration?: string;
      r_frame_rate?: string;
    }>;
  };
  const video = (parsed.streams ?? []).find((stream) => stream.codec_type === "video");
  const audio = (parsed.streams ?? []).find((stream) => stream.codec_type === "audio");
  const durationRaw =
    video?.duration || audio?.duration || parsed.format?.duration || null;
  return {
    width: video?.width ?? null,
    height: video?.height ?? null,
    durationInSeconds: durationRaw ? Number(durationRaw) : null,
    fps: video?.r_frame_rate ?? null,
    hasAudio: Boolean(audio),
  };
};

export const remotionCliPath = (workspaceRoot: string): string => {
  return path.join(
    workspaceRoot,
    "node_modules",
    "@remotion",
    "cli",
    "remotion-cli.js",
  );
};
