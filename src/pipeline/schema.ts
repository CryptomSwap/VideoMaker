import {z} from "zod";

export const SCHEMA_VERSION = 1 as const;

export const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6})$/, "Use a 6-digit hex color like #3B63FF");

export const assetIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, "Asset IDs are lowercase kebab-case");

export const sceneIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, "Scene IDs are lowercase kebab-case");

export const projectIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, "Project IDs are lowercase kebab-case");

const relativeSrc = z
  .string()
  .min(1)
  .refine((value) => !value.includes("\\") && !value.startsWith("/") && !/^[a-zA-Z]:/.test(value), {
    message: "Asset src must be a portable relative path using forward slashes",
  });

export const cropSchema = z.object({
  /** Focal point X, 0–1 */
  x: z.number().min(0).max(1),
  /** Focal point Y, 0–1 */
  y: z.number().min(0).max(1),
  /** Extra cover zoom. 1 = cover. */
  zoom: z.number().min(1).max(3),
});

/**
 * Ken Burns-style move on a still image.
 * This is not AI image-to-video generation.
 */
export const stillPanZoomSchema = z.object({
  fromZoom: z.number().min(1).max(3),
  toZoom: z.number().min(1).max(3),
  fromX: z.number().min(0).max(1),
  fromY: z.number().min(0).max(1),
  toX: z.number().min(0).max(1),
  toY: z.number().min(0).max(1),
});

export const placementSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.2).max(1),
  /** Box height as a fraction of the composition height. Copy wraps inside this box. */
  height: z.number().min(0.05).max(1),
  anchor: z.enum([
    "top-left",
    "top-center",
    "center",
    "bottom-center",
    "bottom-left",
  ]),
  safeInset: z.boolean(),
});

export const animationPresetSchema = z.enum([
  "none",
  "fade",
  "rise",
  "masked-reveal",
]);

export const copyBlockSchema = z.object({
  text: z.string(),
  placement: placementSchema,
  animation: animationPresetSchema,
  delayFrames: z.number().int().min(0),
  fontSize: z.number().positive(),
  minFontSize: z.number().positive(),
  lineHeight: z.number().positive(),
  color: hexColor.nullable(),
});

export const ctaBlockSchema = copyBlockSchema.extend({
  variant: z.enum(["fill", "outline"]),
  /** Subtle glow/scale after the CTA is on screen. Omitted on existing projects. */
  pulse: z.boolean().optional(),
});

export const imageBackgroundSchema = z.object({
  type: z.literal("image"),
  assetId: assetIdSchema,
  crop: cropSchema,
  stillPanZoom: stillPanZoomSchema.nullable(),
});

export const videoBackgroundSchema = z.object({
  type: z.literal("video"),
  assetId: assetIdSchema,
  crop: cropSchema,
  trimStartSeconds: z.number().min(0),
  trimEndSeconds: z.number().positive().nullable(),
  /**
   * Required when the trimmed clip is shorter than the scene.
   * Footage is never silently stretched.
   */
  ifShort: z.enum(["loop", "freeze"]).nullable(),
  mute: z.boolean(),
});

export const backgroundSchema = z.discriminatedUnion("type", [
  imageBackgroundSchema,
  videoBackgroundSchema,
]);

export const contrastSchema = z.object({
  scrim: z.enum(["none", "full", "top", "bottom"]),
  color: hexColor,
  opacity: z.number().min(0).max(1),
});

export const assetKindSchema = z.enum(["image", "video", "audio", "logo"]);

export const assetSchema = z.object({
  id: assetIdSchema,
  kind: assetKindSchema,
  src: relativeSrc,
  originalName: z.string(),
  width: z.number().positive().nullable(),
  height: z.number().positive().nullable(),
  durationInSeconds: z.number().positive().nullable(),
  importedAt: z.string(),
});

export const providerItemSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/, "Provider IDs are lowercase kebab-case"),
  label: z.string().min(1),
  logoAssetId: assetIdSchema,
  /** Inclusive. */
  startFrame: z.number().int().min(0),
  /** Exclusive. */
  endFrame: z.number().int().positive(),
  /** Rendered logo height in px. Size by appearance, not intrinsic pixels. */
  logoDisplayHeight: z.number().positive().optional(),
});

export const providerRotationSchema = z.object({
  transitionFrames: z.number().int().min(1).max(12),
  placement: placementSchema,
  fontSize: z.number().positive(),
  color: hexColor.nullable(),
  providers: z.array(providerItemSchema).min(1),
});

export const sceneSchema = z.object({
  id: sceneIdSchema,
  durationInFrames: z.number().int().positive(),
  background: backgroundSchema,
  contrast: contrastSchema.nullable(),
  headline: copyBlockSchema,
  supporting: copyBlockSchema.nullable(),
  cta: ctaBlockSchema.nullable(),
  showLogo: z.boolean(),
  logoPlacement: placementSchema.nullable(),
  /** Optional; defaults to 56px in LogoLayer when omitted. */
  logoHeightPx: z.number().positive().optional(),
  /**
   * Within-scene provider name/logo rotation.
   * Omitted on existing projects.
   */
  providerRotation: providerRotationSchema.optional(),
});

export const audioTrackSchema = z.object({
  assetId: assetIdSchema,
  startFrame: z.number().int().min(0),
  trimStartSeconds: z.number().min(0),
  volume: z.number().min(0).max(1),
});

export const safeAreaSchema = z.object({
  top: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
  right: z.number().min(0),
});

export const brandSchema = z.object({
  paper: hexColor,
  ink: hexColor,
  accent: hexColor,
  headlineFont: z.enum(["instrument-serif", "ibm-plex-sans", "heebo"]),
  bodyFont: z.enum(["instrument-serif", "ibm-plex-sans", "heebo"]),
  logoAssetId: assetIdSchema.nullable(),
});

export const projectSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: projectIdSchema,
  title: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().positive(),
  brand: brandSchema,
  safeArea: safeAreaSchema,
  assets: z.array(assetSchema),
  scenes: z.array(sceneSchema).min(1),
  audio: audioTrackSchema.nullable(),
  /** Extra Studio/export stills, in addition to the default per-scene frames. */
  reviewFrames: z.array(z.number().int().min(0)).optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Background = z.infer<typeof backgroundSchema>;
export type CopyBlock = z.infer<typeof copyBlockSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type Crop = z.infer<typeof cropSchema>;
export type StillPanZoom = z.infer<typeof stillPanZoomSchema>;
export type AudioTrack = z.infer<typeof audioTrackSchema>;
export type ProviderItem = z.infer<typeof providerItemSchema>;
export type ProviderRotation = z.infer<typeof providerRotationSchema>;

export class ProjectValidationError extends Error {
  issues: string[];

  constructor(issues: string[]) {
    super(issues.join("\n"));
    this.name = "ProjectValidationError";
    this.issues = issues;
  }
}

export const parseProject = (input: unknown): Project => {
  const result = projectSchema.safeParse(input);
  if (!result.success) {
    throw new ProjectValidationError(
      result.error.issues.map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "project";
        return `${path}: ${issue.message}`;
      }),
    );
  }

  return result.data;
};

export const adCompositionSchema = z.object({
  projectId: projectIdSchema,
  showSafeArea: z.boolean(),
});

export type AdCompositionProps = z.infer<typeof adCompositionSchema> & {
  project?: Project;
};
