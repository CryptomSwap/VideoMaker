# SailTru — Creative Taste & Motion Design Standards

Status: v0.2 — living design standard. Do not treat “smooth,” “premium,” or “high-end feel” as acceptance criteria.

## What we're trying to make

Premium, approachable, performance-oriented ads for business owners. The work should feel like a well-directed product advertisement, not a slideshow, generic AI commercial, or agency presentation deck. The objective is qualified interest and consultations/diagnoses, not visual spectacle for its own sake.

## Known approvals

- The FOMO hook: “What does [ChatGPT / Google / Claude] say about your business?”
- Crisp, recognizable provider logos, rapidly crossfaded at stable positions, with the rest of the question fixed.
- Two consecutive headline pulses: “Find what's missing.” disappears entirely before “Fix what matters.” appears.
- The cream / paper opening background, strong ink typography, and SailTru electric blue as an emphatic scene change.
- Heebo as a candidate headline/system typeface; refine weight, optical size, spacing and layout before replacing it.
- Purposeful shape continuity between shots; source objects should transform into next scene rather than unrelated hard cuts.
- Type, logos, and CTA must be deterministic Remotion overlays, never baked into FAL image/video plates.

## Known rejections

- Generic glowing blue glass dashboards and abstract 3D as a substitute for a clear idea.
- Flat stills with tiny Ken Burns motion, labeled 'video'.
- Abrupt unmotivated cuts between full-bleed scene plates.
- Slides with a tiny wordmark near the top, a vertically stacked service list in the center, and a tiny CTA near the bottom.
- Excessive negative space that makes the content feel lost on a phone.
- Heavy visual glow, gratuitous particle effects, or effects that don't support comprehension.
- Small supporting type, generic fade-in on everything, and non-specific business-growth copy.

## Brand tokens (verify against production design files)

- Blue accent: #3B63FF
- Paper: #F3F1EB
- Ink: #141414
- White: #FFFFFF
- Typeface: Heebo, weights 400 / 500 / 700 / 800; avoid relying on default/fallback fonts.
- Use true transparent SailTru logo assets rather than JPEG-black knockout where possible.

## Motion rules

1. Motion must advance the story. A transition should reveal, connect, transform, or clarify something. Avoid movement whose only purpose is to make a static element look animated.
2. Favor one distinctive visual mechanism over many generic animation effects. Every ad should have a recognizable creative idea, not just an arrangement of headlines.
3. Hook must read from the first usable frame; no empty intro.
4. Provider identity rotates in place, with reserved width and readable holds.
5. Phrase A must fully exit before Phrase B enters. Separate sonic/visual beats.
6. Keep CTA elements stable long enough to recognize; no frantic outro movement.
7. Sound is secondary to silent comprehension; licensed assets and deterministic cue timing.

If a proposed change fails (1) or (2), reject it even if the easing is polished. Ken Burns on a still, fade-in on every line, bounce, glow, particles, and stacked presets are not mechanisms.

## Layout rules

- Start vertical-first 1080×1920, and review at ~390px screen width with platform UI overlays.
- One strong visual priority per beat: provider question, pulse message, action.
- Never use 'SEO / GEO / Custom AI Solutions' as the hero headline in this ad; if included, place compactly as a secondary descriptor.
- Logo must look deliberately placed and appropriately sized, not a tiny watermark lost in empty space.
- CTA should look inviting and unmistakably primary, with high contrast, comfortable dimensions, and adequate hold.
- Prefer large asymmetric or tightly centered purposeful composition, never unplanned center stacking.

## Reference library convention

Place approved visual references under `creative/references/<slug>/` or link them from `creative/references/INDEX.md`. Each reference entry MUST record:

- Source URL, creator, title, date captured; original creator is credited.
- Exact timecodes / screenshots and the specific technique approved (e.g. typography cadence, shape handoff, button reveal).
- What to recreate as a technique, and what must not be copied (logos, illustrations, art, proprietary templates).
- Usage/license review; no third-party source code/assets reused without verified rights.
- A 1–5 visual fit score and written user approval/rejection notes.
- An implemented Remotion demo and frame review once adopted.

Never confuse inspiration with permission to copy creative assets or redistribute template code.

## Initial reference directions to curate (not yet approved)

- Jitter animated ad templates: kinetic type and motion rhythm — https://jitter.video/templates/ads/
- Remotion transitions: compositional scene handoffs — https://www.remotion.dev/docs/transitioning
- Remotion template gallery: reusable native composition patterns — https://www.remotion.dev/templates
- Creatomate: data-driven template slots rather than ad artwork — https://creatomate.com/docs/api/quick-start/create-a-video-by-template

The agent should produce contact sheets of 3–5 concrete candidates and ask for the user's explicit selections before treating them as approved taste.

## Current ad: FOMO end-card direction

Keep the final blue field but redesign the hierarchy:

- Logo: use actual wordmark, sufficiently large to register.
- Main statement: “Now, let's fix it.” (candidate A) or “See what you're missing.” (candidate B). One at a time.
- Descriptor (optional and secondary): “SEO · GEO · Custom AI”.
- CTA: “Start your diagnosis” or “Start diagnosis”, white pill/rectangle with sufficient weight and ample tap-like padding.
- Connect from “Fix what matters.” with an intentional shared-object or shape-based transition, not another unrelated cut.
- Reserve a clearly readable final hold, ideally >= 1 second.
- Test actual phone and Reels overlays, particularly the bottom CTA area.
- Avoid claims of guaranteed rankings or invented performance improvements.

## Creative acceptance rubric

Score each from 1–5, with frame captures and motion review:

1. First-second comprehension and stopping power
2. Visual hierarchy / typography
3. Story-advancing motion (reveal / connect / transform / clarify — not decoration)
4. One distinctive mechanism; brand-consistent without generic effects
5. Phone readability and platform-safe CTA
6. Distinctiveness and persuasive clarity

Flag any score <= 2 for revision. Automated lint/render/tests do not count as creative approval. Human visual review is required before releasing as a paid ad.

## How Cursor should apply this file

- Read before writing templates or making visual design decisions.
- Cite the specific accepted/rejected rule when proposing a design change.
- Present 2–3 visual alternatives for new creative structures rather than inventing one unreviewed house style.
- Preserve already-approved details of the current template unless specifically instructed to change them.
- Update this file only when the user explicitly approves/rejects an element; keep a dated decision log in `creative/TASTE_DECISIONS.md`.
