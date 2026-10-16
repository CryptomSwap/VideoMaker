import type {Asset, Project, Scene} from "./schema";

export const totalDurationInFrames = (project: Project): number => {
  return project.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
};

export const sceneStartFrames = (project: Project): number[] => {
  const starts: number[] = [];
  let cursor = 0;
  for (const scene of project.scenes) {
    starts.push(cursor);
    cursor += scene.durationInFrames;
  }
  return starts;
};

export const findAsset = (project: Project, assetId: string): Asset | null => {
  for (const asset of project.assets) {
    if (asset.id === assetId) {
      return asset;
    }
  }
  return null;
};

export const trimmedClipSeconds = (
  asset: Asset,
  trimStartSeconds: number,
  trimEndSeconds: number | null,
): {start: number; end: number; duration: number} => {
  const sourceDuration = asset.durationInSeconds;
  if (sourceDuration === null) {
    throw new Error(`Asset "${asset.id}" is missing durationInSeconds`);
  }

  const end = trimEndSeconds === null ? sourceDuration : trimEndSeconds;
  return {
    start: trimStartSeconds,
    end,
    duration: end - trimStartSeconds,
  };
};

export const usableVideoFrames = (
  project: Project,
  scene: Scene,
): {frames: number; seconds: number} | null => {
  if (scene.background.type !== "video") {
    return null;
  }

  const asset = findAsset(project, scene.background.assetId);
  if (!asset || asset.durationInSeconds === null) {
    return null;
  }

  const trimmed = trimmedClipSeconds(
    asset,
    scene.background.trimStartSeconds,
    scene.background.trimEndSeconds,
  );

  return {
    seconds: trimmed.duration,
    frames: Math.max(1, Math.floor(trimmed.duration * project.fps)),
  };
};

export const videoIsShorterThanScene = (
  project: Project,
  scene: Scene,
): boolean => {
  const usable = usableVideoFrames(project, scene);
  if (!usable) {
    return false;
  }
  return usable.frames < scene.durationInFrames;
};
