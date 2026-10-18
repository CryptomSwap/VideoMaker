import {copyHeightBudget, layoutText} from "./textLayout";
import type {CopyBlock, Project} from "./schema";
import {findAsset, trimmedClipSeconds, videoIsShorterThanScene} from "./timing";

export type ValidationIssue = {
  level: "error" | "warning";
  path: string;
  message: string;
  code?: "overflow";
};

export type ValidationReport = {
  ok: boolean;
  issues: ValidationIssue[];
};

export type ExistsFn = (relativeSrc: string) => boolean | Promise<boolean>;

const SUPPORTED: Record<string, string[]> = {
  image: [".png", ".jpg", ".jpeg", ".webp"],
  logo: [".png", ".jpg", ".jpeg", ".webp", ".svg"],
  video: [".mp4", ".webm", ".mov"],
  audio: [".mp3", ".wav", ".m4a", ".aac"],
};

const extensionOf = (src: string): string => {
  const base = src.split("/").pop() ?? src;
  const dot = base.lastIndexOf(".");
  if (dot < 0) {
    return "";
  }
  return base.slice(dot).toLowerCase();
};

const push = (
  issues: ValidationIssue[],
  level: ValidationIssue["level"],
  path: string,
  message: string,
  code?: ValidationIssue["code"],
) => {
  issues.push({level, path, message, code});
};

const checkCopy = (
  issues: ValidationIssue[],
  project: Project,
  path: string,
  block: CopyBlock | null,
) => {
  if (!block) {
    return;
  }
  if (block.minFontSize > block.fontSize) {
    push(
      issues,
      "error",
      `${path}.minFontSize`,
      "minFontSize must be <= fontSize",
    );
  }

  const maxWidth = block.placement.width * project.width;
  const maxHeight = copyHeightBudget(
    block.placement.height,
    project.height,
    block.fontSize,
  );
  const layout = layoutText({
    text: block.text,
    maxWidthPx: maxWidth,
    maxHeightPx: maxHeight,
    fontSize: block.fontSize,
    minFontSize: block.minFontSize,
    lineHeight: block.lineHeight,
  });

  if (layout.overflow) {
    push(
      issues,
      "error",
      `${path}.text`,
      `Copy cannot fit at minFontSize ${layout.fontSize}px (${layout.lines.length} lines, ~${Math.round(layout.height)}px high in a ${Math.round(maxHeight)}px budget). Shorten the copy or increase the placement box.`,
      "overflow",
    );
  }
};

export const isOverflowIssue = (issue: ValidationIssue): boolean => {
  return issue.code === "overflow";
};

export const blockingIssues = (
  report: ValidationReport,
  options: {allowOverflow: boolean},
): ValidationIssue[] => {
  return report.issues.filter((issue) => {
    if (issue.level !== "error") {
      return false;
    }
    if (options.allowOverflow && isOverflowIssue(issue)) {
      return false;
    }
    return true;
  });
};

export const validateProject = async (
  project: Project,
  exists: ExistsFn,
): Promise<ValidationReport> => {
  const issues: ValidationIssue[] = [];
  const ids = new Map<string, number>();

  if (project.scenes.length < 1) {
    push(issues, "error", "scenes", "At least one scene is required");
  }

  const sceneIds = new Set<string>();
  for (const scene of project.scenes) {
    if (sceneIds.has(scene.id)) {
      push(issues, "error", `scenes.${scene.id}`, "Duplicate scene ID");
    }
    sceneIds.add(scene.id);
  }

  for (const asset of project.assets) {
    const count = (ids.get(asset.id) ?? 0) + 1;
    ids.set(asset.id, count);
    if (count > 1) {
      push(issues, "error", `assets.${asset.id}`, "Duplicate asset ID");
    }

    const ext = extensionOf(asset.src);
    const allowed = SUPPORTED[asset.kind];
    if (allowed && allowed.indexOf(ext) === -1) {
      push(
        issues,
        "error",
        `assets.${asset.id}.src`,
        `Unsupported ${asset.kind} extension "${ext}". Use ${allowed.join(", ")}`,
      );
    }

    const present = await exists(asset.src);
    if (!present) {
      push(
        issues,
        "error",
        `assets.${asset.id}.src`,
        `Missing file "${asset.src}"`,
      );
    }

    if (
      (asset.kind === "video" || asset.kind === "audio") &&
      (asset.durationInSeconds === null || asset.durationInSeconds <= 0)
    ) {
      push(
        issues,
        "error",
        `assets.${asset.id}.durationInSeconds`,
        "Media duration is required for video and audio assets",
      );
    }
  }

  if (project.brand.logoAssetId) {
    const logo = findAsset(project, project.brand.logoAssetId);
    if (!logo) {
      push(
        issues,
        "error",
        "brand.logoAssetId",
        `Logo asset "${project.brand.logoAssetId}" is not in the asset list`,
      );
    } else if (logo.kind !== "logo" && logo.kind !== "image") {
      push(
        issues,
        "error",
        "brand.logoAssetId",
        "Logo asset must be kind logo or image",
      );
    }
  }

  if (project.audio) {
    const asset = findAsset(project, project.audio.assetId);
    if (!asset) {
      push(
        issues,
        "error",
        "audio.assetId",
        `Audio asset "${project.audio.assetId}" is not in the asset list`,
      );
    } else if (asset.kind !== "audio") {
      push(issues, "error", "audio.assetId", "audio.assetId must reference an audio asset");
    } else if (asset.durationInSeconds !== null) {
      if (project.audio.trimStartSeconds >= asset.durationInSeconds) {
        push(
          issues,
          "error",
          "audio.trimStartSeconds",
          "Audio trim starts at or beyond the source duration",
        );
      }
    }
  }

  project.scenes.forEach((scene, index) => {
    const path = `scenes[${index}]`;
    const bgAsset = findAsset(project, scene.background.assetId);
    if (!bgAsset) {
      push(
        issues,
        "error",
        `${path}.background.assetId`,
        `Background asset "${scene.background.assetId}" is not in the asset list`,
      );
      return;
    }

    if (scene.background.type === "image") {
      if (bgAsset.kind !== "image") {
        push(
          issues,
          "error",
          `${path}.background.assetId`,
          "Image backgrounds must reference an image asset",
        );
      }
    }

    if (scene.background.type === "video") {
      if (bgAsset.kind !== "video") {
        push(
          issues,
          "error",
          `${path}.background.assetId`,
          "Video backgrounds must reference a video asset",
        );
      } else if (bgAsset.durationInSeconds !== null) {
        const background = scene.background;
        try {
          const trimmed = trimmedClipSeconds(
            bgAsset,
            background.trimStartSeconds,
            background.trimEndSeconds,
          );
          if (trimmed.end > bgAsset.durationInSeconds + 0.001) {
            push(
              issues,
              "error",
              `${path}.background.trimEndSeconds`,
              `Trim end ${trimmed.end.toFixed(3)}s exceeds source duration ${bgAsset.durationInSeconds.toFixed(3)}s`,
            );
          }
          if (trimmed.duration <= 0) {
            push(
              issues,
              "error",
              `${path}.background.trimStartSeconds`,
              "Trim duration must be greater than 0",
            );
          }
          if (
            videoIsShorterThanScene(project, scene) &&
            background.ifShort === null
          ) {
            push(
              issues,
              "error",
              `${path}.background.ifShort`,
              `Trimmed clip is shorter than the scene (${trimmed.duration.toFixed(2)}s clip, ${(scene.durationInFrames / project.fps).toFixed(2)}s scene). Set ifShort to "loop" or "freeze". Footage will not be stretched.`,
            );
          }
        } catch (error) {
          push(
            issues,
            "error",
            `${path}.background`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    }

    checkCopy(issues, project, `${path}.headline`, scene.headline);
    checkCopy(issues, project, `${path}.supporting`, scene.supporting);
    checkCopy(issues, project, `${path}.cta`, scene.cta);

    if (scene.providerRotation) {
      const rotation = scene.providerRotation;
      const rotPath = `${path}.providerRotation`;
      rotation.providers.forEach((provider, providerIndex) => {
        if (provider.endFrame <= provider.startFrame) {
          push(
            issues,
            "error",
            `${rotPath}.providers[${providerIndex}].endFrame`,
            "endFrame must be greater than startFrame",
          );
        }
        if (provider.endFrame > scene.durationInFrames) {
          push(
            issues,
            "error",
            `${rotPath}.providers[${providerIndex}].endFrame`,
            `endFrame ${provider.endFrame} exceeds scene duration ${scene.durationInFrames}`,
          );
        }
        const logo = findAsset(project, provider.logoAssetId);
        if (!logo) {
          push(
            issues,
            "error",
            `${rotPath}.providers[${providerIndex}].logoAssetId`,
            `Logo asset "${provider.logoAssetId}" is not in the asset list`,
          );
        } else if (logo.kind !== "logo" && logo.kind !== "image") {
          push(
            issues,
            "error",
            `${rotPath}.providers[${providerIndex}].logoAssetId`,
            "Provider logos must be kind logo or image",
          );
        }
      });

      if (rotation.providers[0]?.startFrame !== 0) {
        push(
          issues,
          "error",
          `${rotPath}.providers[0].startFrame`,
          "First provider must start at frame 0 so the hook is readable immediately",
        );
      }

      const last = rotation.providers[rotation.providers.length - 1];
      if (last && last.endFrame !== scene.durationInFrames) {
        push(
          issues,
          "error",
          `${rotPath}.providers[${rotation.providers.length - 1}].endFrame`,
          `Last provider must hold through the scene end (${scene.durationInFrames}), not leave a blank slot`,
        );
      }

      for (let i = 1; i < rotation.providers.length; i++) {
        const prev = rotation.providers[i - 1];
        const current = rotation.providers[i];
        if (current.startFrame !== prev.endFrame) {
          push(
            issues,
            "error",
            `${rotPath}.providers[${i}].startFrame`,
            `Provider ranges must be contiguous (expected ${prev.endFrame}, got ${current.startFrame})`,
          );
        }
      }

      if (rotation.transitionFrames >= scene.durationInFrames) {
        push(
          issues,
          "error",
          `${rotPath}.transitionFrames`,
          "transitionFrames must be shorter than the scene",
        );
      }
    }
  });

  if (project.reviewFrames) {
    const total = project.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
    project.reviewFrames.forEach((frame, index) => {
      if (frame >= total) {
        push(
          issues,
          "error",
          `reviewFrames[${index}]`,
          `Frame ${frame} is outside the ${total}-frame composition`,
        );
      }
    });
  }

  return {
    ok: issues.filter((issue) => issue.level === "error").length === 0,
    issues,
  };
};

export const formatReport = (report: ValidationReport): string => {
  if (report.issues.length === 0) {
    return "Project is valid.";
  }

  return report.issues
    .map((issue) => `${issue.level.toUpperCase()} ${issue.path}: ${issue.message}`)
    .join("\n");
};
