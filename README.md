# SailTru video

Remotion 4.0.535 project for SailTru ads.

Two tracks:

- **Pipeline** (`AdProject`) — project JSON + imported backgrounds + independent text/logo/CTA layers.
- **Reference** (`SailTruManualWork`) — the original 5s motion sample. Kept as-is.

This is not the prompt-to-video template. No LLM writer, cloud render, or billing.

## Windows quick start

```bat
npm i
npm run ad:example
npm run dev
```

Studio: [http://localhost:3000/AdProject](http://localhost:3000/AdProject)

In Studio, `projectId` and `showSafeArea` are editable props. Copy, colors, crop, and timing live in the project JSON (Studio can tweak a loaded copy for the session; save changes back into `public/projects/<id>/project.json`).

```bat
npm run ad:validate -- example-manual-loop
npm run ad:stills -- example-manual-loop
npm run ad:render -- example-manual-loop
npm run ad:first
```

## Workflow

1. **Create a project** from an example config:

```bat
npm run ad -- create my-ad --from=examples/two-scene-vertical.json
```

2. **Import** a local still, video, audio, or logo. Paths with spaces are fine. Use `=` flags so npm does not eat them:

```bat
npm run ad -- import my-ad "C:\Users\User\Desktop\hero still.png" --id=hero --kind=image
npm run ad -- import my-ad "C:\Users\User\Desktop\clip.mp4" --id=clip --kind=video
```

Files are copied into `public/projects/my-ad/assets/`. The source file is not modified. References in `project.json` are portable (`assets/hero.png`), never absolute Windows paths.

3. **Edit** `public/projects/my-ad/project.json`:
   - `brand` — paper / ink / accent, fonts, optional `logoAssetId`
   - `scenes[]` — integer `durationInFrames`, overlay copy, placement, animation (`none` | `fade` | `rise` | `masked-reveal`)
   - still background: `stillPanZoom` is a Ken Burns camera move, **not** AI image-to-video
   - video background: `trimStartSeconds` / `trimEndSeconds`; if the trimmed clip is shorter than the scene, set `ifShort` to `"loop"` or `"freeze"`. Footage is never stretched.
   - `audio` — asset id, `startFrame`, trim, volume

4. **Preview** in Remotion Studio (`npm run dev`). Same `AdProject` composition as export.

5. **Validate, stills, MP4:**

```bat
npm run ad:validate -- my-ad
npm run ad:stills -- my-ad
npm run ad:render -- my-ad
```

Each render writes `out/<projectId>/`:

- `<projectId>.mp4` (H.264, no safe-area guides)
- `review-*.png` (guides on)
- `project.snapshot.json`
- `manifest.json` (assets, duration, Remotion 4.0.535)

## Backgrounds vs overlays

Layers, bottom to top: background image or video → optional scrim → headline → supporting copy → CTA → logo → optional audio.

Text and logos are React/SVG/image layers rendered by Remotion. They are never baked into a plate sent to a generative model.

If a designed still already has type on it, replace it with a text-free background before any future generation step. This pipeline will not reconstruct a flattened reference 1:1.

## Where files live

| Thing | Path |
| --- | --- |
| Project config | `public/projects/<id>/project.json` |
| Imported assets | `public/projects/<id>/assets/` |
| Templates | `examples/two-scene-vertical.json`, `examples/overflow-headline.json` |
| Technical fixtures | `fixtures/technical/` (generated, not creative) |
| Schema / validation | `src/pipeline/` |
| Layers | `src/compositions/` |
| CLI | `scripts/ad.ts`, `scripts/generation/` |
| Generation jobs | `var/generation-jobs/` (not public) |

## Image-to-video (fal.ai)

Same fal queue we already wired. Do **not** rebuild this as a “direct API” to save money — pick a cheaper model, then **reuse the take in Remotion**. Rented-GPU / Comfy is a later volume question, not a first-cost lever.

| Preset | Default model | Endpoint | List price (audio off) | Durations |
| --- | --- | --- | --- | --- |
| `draft` | MiniMax Hailuo 2.3 Fast (`hailuo-fast`, alias `minimax-turbo`) | `fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video` | **$0.19 / 6s**, $0.32 / 10s | 6, 10 |
| `draft` alt | LTX-2.3 Fast (`--model=ltx-fast`) | `fal-ai/ltx-2.3/image-to-video/fast` | **~$0.06/s** 1080p (fal table also lists $0.04/s) | 6, 8, 10 here (24fps) |
| `final` | Kling v3 Standard (`--model=kling`, default) | `fal-ai/kling-video/v3/standard/image-to-video` | **$0.084/s** | 3–15 |
| `final` | Seedance 2.5 (`--model=seedance`) | `bytedance/seedance-2.5/image-to-video` | **token-based** (preview estimates 720p) | 4–30 |

Auth: `FAL_KEY` in `.env` (`Authorization: Key $FAL_KEY`). Never in `public/`, `project.json`, or manifests. Queue: [submit / status / result / cancel](https://fal.ai/docs/documentation/model-apis/inference/queue). Jobs: `var/generation-jobs/` (gitignored).

Pay for **motion once**. Headlines, CTAs, crops, trims, and extra scenes are Remotion. `generate reuse --asset=<take> --scene=<other>` points another scene at the same MP4 without a second fal call.

Image ingest: jpg/png, max 50MB, ≥300px per side, aspect 1:2.5–2.5:1. `--aspect=9:16` is checked on the plate. `--text-free` is an attestation, not OCR.

Copy `.env.example` → `.env`. Key: [fal dashboard](https://fal.ai/dashboard/keys).

### Commands (dry-run first)

```bat
npx tsx scripts/ad.ts generate preview --preset=draft --project=sailtru-first-ad --source=plate-still --scene=connect --prompt-file=examples/motion-prompt.txt --aspect=9:16 --text-free
```

`--model=ltx-fast` to A/B LTX. Final plate motion: `--preset=final --model=kling` or `--model=seedance` (optional `--seed` on Seedance). Paid submit requires `--execute`. Duplicates of the same source hash + prompt + duration + **model** + scene need `--new-take`. `submission-unknown` means do **not** submit again — check the fal dashboard.

```bat
npx tsx scripts/ad.ts generate submit --preset=draft --project=sailtru-first-ad --source=plate-still --scene=connect --prompt-file=examples/motion-prompt.txt --aspect=9:16 --text-free --execute
npx tsx scripts/ad.ts generate poll --job=gen-<id>
npx tsx scripts/ad.ts generate download --job=gen-<id>
npx tsx scripts/ad.ts generate import --job=gen-<id>
npx tsx scripts/ad.ts generate assign --job=gen-<id>
npx tsx scripts/ad.ts generate reuse --project=sailtru-first-ad --asset=connect-take-01 --scene=problem --if-short=freeze
```

Shorter than the scene: `--if-short=freeze` or `loop`. Scene `mute: true`. Then `npm run ad:validate -- sailtru-first-ad` and `ad:render`.

Cancel is documented (`PUT …/cancel`) and may not stop an in-flight runner or prevent charges.

ComfyUI / rented GPU remains: write an MP4 locally, `ad import --kind=video`. Only worth the extra maintenance if volume makes fal per-second worse.

## Fonts and licenses

| Face | Use | License | Source |
| --- | --- | --- | --- |
| Instrument Serif | Headlines | SIL OFL 1.1 | Google Fonts via `@remotion/google-fonts` |
| IBM Plex Sans | Body / CTA | SIL OFL 1.1 | Google Fonts via `@remotion/google-fonts` |
| Remotion | Renderer | [Company license may apply](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) | `remotion@4.0.535` |

Recorded in `src/pipeline/fontCatalog.ts`.

## First ad: `sailtru-first-ad`

Working project for the first real creative. Same schema as `example-manual-loop`. It currently uses **TECHNICAL FIXTURES** — geometric plates, not finished art.

```bat
npm run ad:first
```

That writes `public/projects/sailtru-first-ad/` and `public/projects/timing-onset-probe/` (click fixture for audio-timing checks).

### Import real assets

Use `=` flags so npm does not swallow `--id` / `--kind`. Paths with spaces are fine as one argument. Import **replaces** the asset id in `project.json` and copies the file into `public/projects/sailtru-first-ad/assets/`. The source file is left intact.

```bat
npm run ad -- import sailtru-first-ad "C:\path\to\starting-image.png" --id=plate-still --kind=image
npm run ad -- import sailtru-first-ad "C:\path\to\generated-background.mp4" --id=plate-video --kind=video
npm run ad -- import sailtru-first-ad "C:\path\to\logo.png" --id=mark-logo --kind=logo
npm run ad -- import sailtru-first-ad "C:\path\to\music.wav" --id=bed-audio --kind=audio
```

| Role | `--id` | `--kind` | Assigned in `project.json` |
| --- | --- | --- | --- |
| Text-free starting image | `plate-still` | `image` | `scenes[0].background.assetId` (`problem`) |
| Generated background MP4 | `plate-video` | `video` | `scenes[1].background.assetId` (`connect`) |
| Optional transparent logo | `mark-logo` | `logo` | `brand.logoAssetId`; scene 2 has `showLogo: true` |
| Optional music / narration | `bed-audio` | `audio` | `audio.assetId`, `audio.startFrame` |

Logo: PNG with alpha. The technical fixture is an opaque RGB block — replace it. To hide the logo, set `scenes[1].showLogo` to `false`. To skip music, set `"audio": null`.

Copy lives only in `public/projects/sailtru-first-ad/project.json`. Edit `scenes[].headline.text`, `supporting.text`, `cta.text`, then:

```bat
npm run ad:validate -- sailtru-first-ad
```

Studio (`npm run dev`) can tweak a loaded copy for the session. Persist by saving those fields back into `project.json`. There is no separate editor write-back.

Keep fixture filenames that start with `TECHNICAL-FIXTURE-` until the real files replace them. `originalName` on each asset record is the imported filename.

### After the real image and clip land

```bat
npm run ad -- import sailtru-first-ad "C:\path\to\starting-image.png" --id=plate-still --kind=image
npm run ad -- import sailtru-first-ad "C:\path\to\generated-background.mp4" --id=plate-video --kind=video
npm run ad:validate -- sailtru-first-ad
npm run ad:stills -- sailtru-first-ad
npm run ad:render -- sailtru-first-ad
```

## Overflow

Review stills (`showSafeArea: true`) may show a red **OVERFLOW** badge so you can see the box.

Final MP4 (`ad:render`, `showSafeArea: false`) **fails** with `ERROR scenes[n].headline.text: Copy cannot fit at minFontSize …`. It will not export unreadable type or bake the badge into the movie.

`example-overflow` exists to prove that path. `ad:stills` on it is allowed; `ad:render` is not.

## Duration (ffprobe)

Expected timeline: **180 frames at 30 fps = 6.000s of video**.

On `out/example-manual-loop/example-manual-loop.mp4`:

| Stream | Measured |
| --- | --- |
| Video | 180 frames, 30/1, **6.000s** |
| Audio (AAC 48 kHz) | **6.016s** (282 AAC packets × 1024 / 48000) |
| Container | **6.016s** |

The old “6.02s” report is the container/audio duration, rounded. It is AAC frame padding, not a Remotion timeline error. Do not pad or trim the composition to chase container duration.

```bat
node node_modules/@remotion/cli/remotion-cli.js ffprobe -v error -count_frames -show_entries format=duration:stream=codec_type,duration,nb_frames,nb_read_frames,r_frame_rate -print_format json out\example-manual-loop\example-manual-loop.mp4
```

## Audio timing

Fixture: `fixtures/technical/TECHNICAL-FIXTURE-onset-click.wav` — digital silence, then a 2 kHz click at **t = 0** of the WAV.

`timing-onset-probe` uses that file as `bed-audio` with `audio.startFrame: 12` (0.400s at 30 fps), `trimStartSeconds: 0`, `volume: 1`.

```bat
npm run ad:render -- timing-onset-probe
npx tsx scripts/ad.ts measure-onset timing-onset-probe
```

`measure-onset` extracts PCM from the rendered MP4 and finds the first sample ≥ 12% of peak. Pass if `|measured - startFrame/fps|` is within one frame + 50ms.

Measured on `timing-onset-probe.mp4`: configured **0.4000s**, decoded onset **0.4000s**, delta **0.0ms**. AAC encoder delay is stripped on decode; the composition timeline is exact.

## Checks

```bat
npm run lint
npm test
```

## Reference sample

The first 5s piece is unchanged:

```bat
npm run stills
npm run render
```

`out/sailtru-manual-work.mp4` and `out/review-*.png`.

## Asset handoff checklist

1. Drop a **text-free** starting still and a generated 9:16 MP4 (30 fps) into a folder with no spaces-in-the-shell surprises — quoted paths are fine.
2. Optional: transparent PNG logo, music or narration WAV/MP3.
3. Import onto the existing ids (`plate-still`, `plate-video`, `mark-logo`, `bed-audio`).
4. Edit copy in `public/projects/sailtru-first-ad/project.json`. Do not bake type into the plate.
5. `npm run ad:validate -- sailtru-first-ad` — overflow is a hard error for export.
6. Review stills, then `npm run ad:render -- sailtru-first-ad`.
7. Leave `TECHNICAL-FIXTURE-*` files in `fixtures/technical/` alone; they are ingest/timing plates.
