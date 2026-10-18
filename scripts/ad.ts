import {spawn} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {parseProject, type Asset, type Project} from "../src/pipeline/schema";
import {createProjectIo, runGenerateCli} from "./generation/cli";
import {loadDotEnv} from "./lib/env";
import {totalDurationInFrames} from "../src/pipeline/timing";
import {
  blockingIssues,
  formatReport,
  isOverflowIssue,
  validateProject,
} from "../src/pipeline/validate";
import {
  hexRgb,
  measureWavOnsetSeconds,
  writePng,
  writeWavOnsetClick,
  writeWavSine,
} from "./media-write";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_PROJECTS = path.join(ROOT, "public", "projects");
const EXAMPLES = path.join(ROOT, "examples");
const FIXTURES = path.join(ROOT, "fixtures", "technical");
const REMOTION_CLI = path.join(
  ROOT,
  "node_modules",
  "@remotion",
  "cli",
  "remotion-cli.js",
);

const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp"];
const VIDEO_EXT = [".mp4", ".webm", ".mov"];
const AUDIO_EXT = [".mp3", ".wav", ".m4a", ".aac"];
const LOGO_EXT = [...IMAGE_EXT, ".svg"];

const usage = (): string => {
  return `SailTru ad pipeline

  npm run ad -- create <projectId> --from=examples/two-scene-vertical.json
  npm run ad -- import <projectId> <file> --id=hero --kind=image
  node scripts/ad.ts validate <projectId>
  node scripts/ad.ts stills <projectId>
  node scripts/ad.ts render <projectId>
  node scripts/ad.ts generate preview --project=<id> --source=<image> --scene=<id> --prompt-file=<txt> --duration=5 --aspect=9:16 --text-free
  node scripts/ad.ts generate submit ... --execute
  node scripts/ad.ts setup-example
  node scripts/ad.ts setup-first-ad
  node scripts/ad.ts measure-onset timing-onset-probe

Paths with spaces are fine. Do not paste filenames into a shell one-liner; pass them as arguments.
`;
};

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const projectDir = (projectId: string): string => {
  return path.join(PUBLIC_PROJECTS, projectId);
};

const projectJsonPath = (projectId: string): string => {
  return path.join(projectDir(projectId), "project.json");
};

const readProject = (projectId: string): Project => {
  const filePath = projectJsonPath(projectId);
  if (!fs.existsSync(filePath)) {
    fail(`Project not found: ${filePath}`);
  }
  return parseProject(JSON.parse(fs.readFileSync(filePath, "utf8")));
};

const writeProject = (project: Project): void => {
  const dir = projectDir(project.id);
  fs.mkdirSync(path.join(dir, "assets"), {recursive: true});
  fs.writeFileSync(
    projectJsonPath(project.id),
    `${JSON.stringify(project, null, 2)}\n`,
  );
};

const runNode = (args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command exited ${code}`));
    });
  });
};

const runNodeCapture = (args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      windowsHide: true,
    });
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
      reject(new Error(stderr || `Command exited ${code}`));
    });
  });
};

const toPosix = (value: string): string => value.replace(/\\/g, "/");

const kindFromExt = (
  ext: string,
  forced: string | null,
): Asset["kind"] => {
  if (forced === "image" || forced === "video" || forced === "audio" || forced === "logo") {
    return forced;
  }
  if (IMAGE_EXT.indexOf(ext) !== -1) {
    return "image";
  }
  if (VIDEO_EXT.indexOf(ext) !== -1) {
    return "video";
  }
  if (AUDIO_EXT.indexOf(ext) !== -1) {
    return "audio";
  }
  fail(`Unsupported file extension "${ext}"`);
};

const slugFromName = (name: string): string => {
  const stem = name.replace(/\.[^.]+$/, "");
  const slug = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "asset";
};

type Probe = {
  width: number | null;
  height: number | null;
  durationInSeconds: number | null;
};

const probeMedia = async (filePath: string): Promise<Probe> => {
  const raw = await runNodeCapture([
    REMOTION_CLI,
    "ffprobe",
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);
  const parsed = JSON.parse(raw) as {
    format?: {duration?: string};
    streams?: Array<{
      codec_type?: string;
      width?: number;
      height?: number;
      duration?: string;
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
  };
};

const flagValue = (args: string[], name: string): string | null => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return null;
  }
  return args[index + 1];
};

const cmdCreate = (args: string[]): void => {
  const projectId = args[0];
  if (!projectId) {
    fail(usage());
  }
  const from =
    flagValue(args, "--from") ?? path.join(EXAMPLES, "two-scene-vertical.json");
  if (!fs.existsSync(from)) {
    fail(`Template not found: ${from}`);
  }
  const template = parseProject(JSON.parse(fs.readFileSync(from, "utf8")));
  template.id = projectId;
  if (fs.existsSync(projectJsonPath(projectId))) {
    fail(`Project already exists: ${projectJsonPath(projectId)}`);
  }
  writeProject(template);
  console.log(`Created ${projectJsonPath(projectId)}`);
};

const cmdImport = async (args: string[]): Promise<void> => {
  const projectId = args[0];
  const sourceArg = args[1];
  if (!projectId || !sourceArg) {
    fail(usage());
  }
  const sourcePath = path.resolve(sourceArg);
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    fail(`File not found: ${sourcePath}`);
  }

  const project = readProject(projectId);
  const ext = path.extname(sourcePath).toLowerCase();
  const kind = kindFromExt(ext, flagValue(args, "--kind"));
  const allowed =
    kind === "video" ? VIDEO_EXT : kind === "audio" ? AUDIO_EXT : kind === "logo" ? LOGO_EXT : IMAGE_EXT;
  if (allowed.indexOf(ext) === -1) {
    fail(`Kind ${kind} does not accept ${ext}`);
  }

  const assetId = flagValue(args, "--id") ?? slugFromName(path.basename(sourcePath));
  const destRel = `assets/${assetId}${ext}`;
  const destAbs = path.join(projectDir(projectId), destRel.split("/").join(path.sep));
  fs.mkdirSync(path.dirname(destAbs), {recursive: true});
  fs.copyFileSync(sourcePath, destAbs);

  let probe: Probe = {width: null, height: null, durationInSeconds: null};
  if (ext !== ".svg") {
    probe = await probeMedia(destAbs);
  }

  const record: Asset = {
    id: assetId,
    kind,
    src: destRel,
    originalName: path.basename(sourcePath),
    width: probe.width,
    height: probe.height,
    durationInSeconds: probe.durationInSeconds,
    importedAt: new Date().toISOString(),
  };

  project.assets = project.assets.filter((asset) => asset.id !== assetId);
  project.assets.push(record);
  writeProject(project);
  console.log(`Imported ${sourcePath}`);
  console.log(`  -> ${toPosix(path.relative(ROOT, destAbs))}`);
  console.log(`  id=${assetId} kind=${kind} duration=${record.durationInSeconds ?? "n/a"}`);
  console.log("  Source file left intact.");
};

const cmdValidate = async (projectId: string): Promise<ValidationExit> => {
  const project = readProject(projectId);
  const dir = projectDir(projectId);
  const report = await validateProject(project, (relativeSrc) => {
    return fs.existsSync(path.join(dir, ...relativeSrc.split("/")));
  });
  console.log(formatReport(report));
  console.log(
    `Duration ${totalDurationInFrames(project)} frames (${(totalDurationInFrames(project) / project.fps).toFixed(2)}s) at ${project.width}x${project.height} ${project.fps}fps`,
  );
  return report.ok ? 0 : 1;
};

type ValidationExit = 0 | 1;

const reviewFrames = (project: Project): Array<{name: string; frame: number}> => {
  const frames: Array<{name: string; frame: number}> = [];
  const seen = new Set<number>();
  const pushFrame = (name: string, frame: number) => {
    const clamped = Math.max(0, Math.min(frame, totalDurationInFrames(project) - 1));
    if (seen.has(clamped) && name.startsWith("review-f")) {
      return;
    }
    seen.add(clamped);
    frames.push({name, frame: clamped});
  };

  let cursor = 0;
  project.scenes.forEach((scene, index) => {
    const local = Math.min(20, Math.max(1, scene.durationInFrames - 1));
    pushFrame(
      `review-${String(index + 1).padStart(2, "0")}-scene-${scene.id}.png`,
      cursor + local,
    );
    cursor += scene.durationInFrames;
  });
  pushFrame("review-end.png", Math.max(0, totalDurationInFrames(project) - 1));

  for (const frame of project.reviewFrames ?? []) {
    pushFrame(`review-f${String(frame).padStart(3, "0")}.png`, frame);
  }

  return frames;
};

const writePropsFile = (
  outDir: string,
  projectId: string,
  showSafeArea: boolean,
): string => {
  const propsPath = path.join(outDir, "composition-props.json");
  fs.writeFileSync(
    propsPath,
    `${JSON.stringify({projectId, showSafeArea}, null, 2)}\n`,
  );
  return propsPath;
};

const writeManifest = (
  outDir: string,
  project: Project,
  files: {mp4: string | null; stills: string[]},
  showSafeArea: boolean,
): void => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
  ) as {dependencies: Record<string, string>};
  const snapshotPath = path.join(outDir, "project.snapshot.json");
  fs.writeFileSync(snapshotPath, `${JSON.stringify(project, null, 2)}\n`);
  const manifest = {
    projectId: project.id,
    schemaVersion: project.schemaVersion,
    compositionId: "AdProject",
    renderedAt: new Date().toISOString(),
    output: {
      directory: toPosix(path.relative(ROOT, outDir)),
      mp4: files.mp4,
      stills: files.stills,
      snapshot: "project.snapshot.json",
    },
    settings: {
      width: project.width,
      height: project.height,
      fps: project.fps,
      durationInFrames: totalDurationInFrames(project),
      codec: files.mp4 ? "h264" : null,
      showSafeArea,
    },
    assets: project.assets.map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      src: asset.src,
      originalName: asset.originalName,
    })),
    packages: {
      remotion: pkg.dependencies.remotion,
      "@remotion/cli": pkg.dependencies["@remotion/cli"],
      "@remotion/google-fonts": pkg.dependencies["@remotion/google-fonts"],
      zod: pkg.dependencies.zod,
    },
  };
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
};

const cmdStills = async (projectId: string): Promise<void> => {
  const project = readProject(projectId);
  const dir = projectDir(projectId);
  const report = await validateProject(project, (src) =>
    fs.existsSync(path.join(dir, ...src.split("/"))),
  );
  const blocking = blockingIssues(report, {allowOverflow: true});
  if (blocking.length > 0) {
    fail(formatReport({ok: false, issues: blocking}));
  }
  if (report.issues.some(isOverflowIssue)) {
    console.log(formatReport(report));
    console.log(
      "Review stills will include an OVERFLOW badge. Final MP4 export will fail until copy fits.",
    );
  }

  const outDir = path.join(ROOT, "out", projectId);
  fs.mkdirSync(outDir, {recursive: true});
  const propsPath = writePropsFile(outDir, projectId, true);
  const stills: string[] = [];
  for (const still of reviewFrames(project)) {
    const output = path.join(outDir, still.name);
    await runNode([
      REMOTION_CLI,
      "still",
      "AdProject",
      output,
      `--frame=${still.frame}`,
      `--props=${propsPath}`,
    ]);
    stills.push(still.name);
  }
  writeManifest(outDir, project, {mp4: null, stills}, true);
  console.log(`Wrote stills to ${outDir}`);
};

const cmdRender = async (projectId: string): Promise<void> => {
  const project = readProject(projectId);
  const dir = projectDir(projectId);
  const report = await validateProject(project, (src) =>
    fs.existsSync(path.join(dir, ...src.split("/"))),
  );
  const blocking = blockingIssues(report, {allowOverflow: false});
  if (blocking.length > 0) {
    fail(formatReport({ok: false, issues: blocking}));
  }

  const outDir = path.join(ROOT, "out", projectId);
  fs.mkdirSync(outDir, {recursive: true});
  const propsPath = writePropsFile(outDir, projectId, false);
  const mp4Name = `${projectId}.mp4`;
  const mp4Path = path.join(outDir, mp4Name);
  await runNode([
    REMOTION_CLI,
    "render",
    "AdProject",
    mp4Path,
    `--props=${propsPath}`,
  ]);

  const reviewProps = writePropsFile(outDir, projectId, true);
  const stills: string[] = [];
  for (const still of reviewFrames(project)) {
    const output = path.join(outDir, still.name);
    await runNode([
      REMOTION_CLI,
      "still",
      "AdProject",
      output,
      `--frame=${still.frame}`,
      `--props=${reviewProps}`,
    ]);
    stills.push(still.name);
  }

  writeManifest(outDir, project, {mp4: mp4Name, stills}, false);
  console.log(`Wrote ${toPosix(path.relative(ROOT, mp4Path))}`);
};

type FixtureSet = {
  still: string;
  video: string;
  logo: string;
  audio: string;
  onset: string;
  labeledStill: string;
  labeledVideo: string;
  labeledLogo: string;
  labeledAudio: string;
};

const copyLabeled = (source: string, name: string): string => {
  const dest = path.join(FIXTURES, name);
  fs.copyFileSync(source, dest);
  return dest;
};

const makeFixtures = async (): Promise<FixtureSet> => {
  fs.mkdirSync(FIXTURES, {recursive: true});
  const paper = hexRgb("#F3F1EB");
  const ink = hexRgb("#141414");
  const blue = hexRgb("#3B63FF");
  const still = path.join(FIXTURES, "plate-still.png");
  const logo = path.join(FIXTURES, "mark-logo.png");
  const audio = path.join(FIXTURES, "bed-audio.wav");
  const framesDir = path.join(FIXTURES, "video-frames");
  fs.mkdirSync(framesDir, {recursive: true});

  writePng(still, 1080, 1920, (x, y) => {
    if (y > 720 && y < 980) {
      return blue;
    }
    if (x < 48 || x > 1032 || y < 48 || y > 1872) {
      return ink;
    }
    return paper;
  });

  writePng(logo, 256, 256, (x, y) => {
    const inset = x > 48 && x < 208 && y > 48 && y < 208;
    return inset ? blue : paper;
  });

  writeWavSine(audio, 6, 220);
  const onset = path.join(FIXTURES, "TECHNICAL-FIXTURE-onset-click.wav");
  writeWavOnsetClick(onset, {
    durationSeconds: 6,
    onsetSeconds: 0,
    burstSeconds: 0.05,
    frequency: 2000,
    sampleRate: 48000,
  });

  const videoStill = path.join(framesDir, "frame-1.png");
  writePng(videoStill, 1080, 1920, (x, y) => {
    if (y > 820 && y < 1040) {
      return blue;
    }
    if (x < 48 || x > 1032 || y < 48 || y > 1872) {
      return ink;
    }
    return paper;
  });

  const video = path.join(FIXTURES, "plate-video.mp4");
  await runNode([
    REMOTION_CLI,
    "ffmpeg",
    "-y",
    "-loop",
    "1",
    "-framerate",
    "30",
    "-i",
    videoStill,
    "-t",
    "4",
    "-r",
    "30",
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    "-g",
    "30",
    video,
  ]);

  const note = path.join(FIXTURES, "README.txt");
  fs.writeFileSync(
    note,
    [
      "TECHNICAL FIXTURES — not finished creative.",
      "Geometric plates, sine bed, and a click used for ingest/timing checks.",
      "Replace these with real assets in public/projects/sailtru-first-ad/ before a client export.",
      "",
      "TECHNICAL-FIXTURE-starting-image.png",
      "TECHNICAL-FIXTURE-generated-background.mp4",
      "TECHNICAL-FIXTURE-logo.png  (RGB block; real logo should be a transparent PNG)",
      "TECHNICAL-FIXTURE-music.wav",
      "TECHNICAL-FIXTURE-onset-click.wav  (attack at t=0 of the WAV)",
      "",
    ].join("\n"),
  );

  return {
    still,
    video,
    logo,
    audio,
    onset,
    labeledStill: copyLabeled(still, "TECHNICAL-FIXTURE-starting-image.png"),
    labeledVideo: copyLabeled(video, "TECHNICAL-FIXTURE-generated-background.mp4"),
    labeledLogo: copyLabeled(logo, "TECHNICAL-FIXTURE-logo.png"),
    labeledAudio: copyLabeled(audio, "TECHNICAL-FIXTURE-music.wav"),
  };
};

const cmdSetupExample = async (): Promise<void> => {
  const fixtures = await makeFixtures();
  for (const id of ["example-manual-loop", "example-overflow"]) {
    const dir = projectDir(id);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  }

  cmdCreate([
    "example-manual-loop",
    "--from",
    path.join(EXAMPLES, "two-scene-vertical.json"),
  ]);
  cmdCreate([
    "example-overflow",
    "--from",
    path.join(EXAMPLES, "overflow-headline.json"),
  ]);

  await cmdImport(["example-manual-loop", fixtures.still, "--id", "plate-still", "--kind", "image"]);
  await cmdImport(["example-manual-loop", fixtures.video, "--id", "plate-video", "--kind", "video"]);
  await cmdImport(["example-manual-loop", fixtures.logo, "--id", "mark-logo", "--kind", "logo"]);
  await cmdImport(["example-manual-loop", fixtures.audio, "--id", "bed-audio", "--kind", "audio"]);
  await cmdImport(["example-overflow", fixtures.still, "--id", "plate-still", "--kind", "image"]);

  const loopStatus = await cmdValidate("example-manual-loop");
  const overflowStatus = await cmdValidate("example-overflow");
  if (loopStatus !== 0) {
    fail("example-manual-loop failed validation");
  }
  if (overflowStatus === 0) {
    fail("example-overflow should fail validation: copy cannot fit at minFontSize");
  }
};

const recreateProject = (projectId: string, templateName: string): void => {
  const dir = projectDir(projectId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, {recursive: true, force: true});
  }
  cmdCreate([projectId, "--from", path.join(EXAMPLES, templateName)]);
};

const cmdSetupFirstAd = async (): Promise<void> => {
  const fixtures = await makeFixtures();
  recreateProject("sailtru-first-ad", "two-scene-vertical.json");
  recreateProject("timing-onset-probe", "two-scene-vertical.json");

  const first = readProject("sailtru-first-ad");
  first.title =
    "SailTru first ad — TECHNICAL FIXTURES, replace before export";
  writeProject(first);

  await cmdImport([
    "sailtru-first-ad",
    fixtures.labeledStill,
    "--id",
    "plate-still",
    "--kind",
    "image",
  ]);
  await cmdImport([
    "sailtru-first-ad",
    fixtures.labeledVideo,
    "--id",
    "plate-video",
    "--kind",
    "video",
  ]);
  await cmdImport([
    "sailtru-first-ad",
    fixtures.labeledLogo,
    "--id",
    "mark-logo",
    "--kind",
    "logo",
  ]);
  await cmdImport([
    "sailtru-first-ad",
    fixtures.labeledAudio,
    "--id",
    "bed-audio",
    "--kind",
    "audio",
  ]);

  fs.writeFileSync(
    path.join(projectDir("sailtru-first-ad"), "REPLACE-THESE-FIXTURES.txt"),
    [
      "This project is wired to TECHNICAL FIXTURES, not finished creative.",
      "Keep the scene ids (problem, connect) and asset ids (plate-still, plate-video, mark-logo, bed-audio).",
      "Import real files onto those ids, then edit copy in project.json.",
      "",
    ].join("\n"),
  );

  const probe = readProject("timing-onset-probe");
  probe.title =
    "TECHNICAL timing probe — click at WAV t=0, audio.startFrame=12";
  if (probe.audio) {
    probe.audio.volume = 1;
  }
  writeProject(probe);
  await cmdImport([
    "timing-onset-probe",
    fixtures.labeledStill,
    "--id",
    "plate-still",
    "--kind",
    "image",
  ]);
  await cmdImport([
    "timing-onset-probe",
    fixtures.labeledVideo,
    "--id",
    "plate-video",
    "--kind",
    "video",
  ]);
  await cmdImport([
    "timing-onset-probe",
    fixtures.labeledLogo,
    "--id",
    "mark-logo",
    "--kind",
    "logo",
  ]);
  await cmdImport([
    "timing-onset-probe",
    fixtures.onset,
    "--id",
    "bed-audio",
    "--kind",
    "audio",
  ]);

  const firstStatus = await cmdValidate("sailtru-first-ad");
  const probeStatus = await cmdValidate("timing-onset-probe");
  if (firstStatus !== 0) {
    fail("sailtru-first-ad failed validation");
  }
  if (probeStatus !== 0) {
    fail("timing-onset-probe failed validation");
  }
};

const cmdMeasureOnset = async (projectId: string): Promise<void> => {
  const project = readProject(projectId);
  if (!project.audio) {
    fail(`Project ${projectId} has no audio`);
  }
  const mp4Path = path.join(ROOT, "out", projectId, `${projectId}.mp4`);
  if (!fs.existsSync(mp4Path)) {
    fail(`Rendered MP4 not found: ${mp4Path}. Run: npm run ad:render -- ${projectId}`);
  }

  const wavPath = path.join(ROOT, "out", projectId, `${projectId}.extracted-audio.wav`);
  await runNode([
    REMOTION_CLI,
    "ffmpeg",
    "-y",
    "-i",
    mp4Path,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "48000",
    "-c:a",
    "pcm_s16le",
    wavPath,
  ]);

  const expected =
    project.audio.startFrame / project.fps - project.audio.trimStartSeconds;
  const measured = measureWavOnsetSeconds(wavPath);
  if (measured === null) {
    fail(`No onset found in ${wavPath}`);
  }

  const deltaMs = (measured - expected) * 1000;
  const toleranceMs = 1000 / project.fps + 50;
  console.log(`Audio onset check (${projectId})`);
  console.log(`  configured startFrame=${project.audio.startFrame} (${expected.toFixed(4)}s)`);
  console.log(`  trimStartSeconds=${project.audio.trimStartSeconds}`);
  console.log(`  measured onset=${measured.toFixed(4)}s`);
  console.log(`  delta=${deltaMs.toFixed(1)}ms (codec tolerance ±${toleranceMs.toFixed(0)}ms)`);
  if (Math.abs(deltaMs) > toleranceMs) {
    fail(`Onset delta ${deltaMs.toFixed(1)}ms exceeds tolerance`);
  }
  console.log("  PASS");
};

const cmdGenerate = async (args: string[]): Promise<void> => {
  loadDotEnv(ROOT);
  await runGenerateCli({
    workspaceRoot: ROOT,
    args,
    io: createProjectIo(ROOT, {
      readProject,
      writeProject,
      projectDir,
      importAsset: cmdImport,
    }),
  });
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const rest = argv.slice(1);

  if (!command || command === "--help" || command === "-h") {
    console.log(usage());
    return;
  }

  if (command === "create") {
    cmdCreate(rest);
    return;
  }
  if (command === "import") {
    await cmdImport(rest);
    return;
  }
  if (command === "validate") {
    const code = await cmdValidate(rest[0] || "example-manual-loop");
    process.exit(code);
  }
  if (command === "stills") {
    await cmdStills(rest[0] || "example-manual-loop");
    return;
  }
  if (command === "render") {
    await cmdRender(rest[0] || "example-manual-loop");
    return;
  }
  if (command === "generate") {
    await cmdGenerate(rest);
    return;
  }
  if (command === "setup-example") {
    await cmdSetupExample();
    return;
  }
  if (command === "setup-first-ad") {
    await cmdSetupFirstAd();
    return;
  }
  if (command === "measure-onset") {
    await cmdMeasureOnset(rest[0] || "timing-onset-probe");
    return;
  }

  fail(usage());
};

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
