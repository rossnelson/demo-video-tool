---
target: temporal theme (lib/themes/temporal)
total_score: 19
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 2
target_identity: "file:/home/user/command-palette-video/lib/themes/temporal/card.js"
target_fingerprint: "sha256:06a1994125066d85a3f2a19afda74e8a6bb1fb3fbcf4a70d4a80fcc307de13e6"
target_path: /home/user/command-palette-video/lib/themes/temporal/card.js
timestamp: 2026-10-29T17-57-16Z
slug: lib-themes-temporal-card-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Chip, dashes and ticks place the viewer; the failure moment is a 200 ms tint plus a dash recolour. |
| 2 | Match system / real world | 4 | Rows, dots, icons and the retried gradient are the UI's own; the caption matches UI copy. |
| 3 | User control and freedom | n/a | A title card accepts no input. |
| 4 | Consistency and standards | 3 | Started dots now match in both modes; the end card's outlined ✓ cap reads as a checkbox, and the signal's pulse is violet where every other signal mark is pink. |
| 5 | Error prevention | n/a | The viewer cannot err; the author gets a warning that names the fix. |
| 6 | Recognition rather than recall | 3 | A Temporal user recognises everything; a first-timer infers that persimmon dashes mean retrying. |
| 7 | Flexibility and efficiency | 3 | Wipes, cycle, rest, mode, caption; no knob for column density or the failing row's position. |
| 8 | Aesthetic and minimalist design | 3 | The hold frame is clean; the signal's 40vw trail is the one heavy object and lies across the product. |
| 9 | Error recovery | n/a | No user error state. |
| 10 | Help and documentation | n/a | Not viewer-facing. |
| **Total** | | **19/24** | **Good (79%)** |

n/a heuristics: 3, 5, 9, 10.

## Design Specificity Verdict

LLM assessment: specific, and specific to the right thing. The wipe is the Temporal UI timeline graph at the UI's own geometry and colour table, telling three real Temporal stories, and a workflow viewer recognises it in one frame. The weak spots are the light mode reading as pale periwinkle rather than Off White, and the end card's outlined ✓ cap reading as a checkbox.

Deterministic scan: one advisory on the splash axis; the card's CSS is in template strings the scanner cannot read. Rendered dumps deduplicate to the rail glow, the key cap glow, a dormant stars rule, the axis and dash gradients, and a contrast hit on the mock page, a false positive. Live on the splash: the brand gradient and the key cap read as an icon tile.

Visual overlays: no human-visible tab here; the detector cannot enter the shadow root.

## Overall Impression

The last round's fixes measure clean: the local alarm is a radial centred on the failing row (the card side of the rail gains red only at that row, zero red right of the rail, zero change 300 px above or below), the recovery rings sit inside the clip within 3 px of their anchor, the started dot is zaffre in both modes, and the signal bridge's longest empty stretch is 51 ms. Assessment A found the round's one P0, in the recordings rather than the live card: the end card alone animated background-position on a full-frame axis, which starved the main thread during its in sweep and left a bare Space Black wedge with no column or rail for three frames at 15 fps effective. Fixed before this report (a transform on an axis one tick wider than the frame, starting after the sweep); the re-recorded sweep has 32 frames at a 48 ms maximum gap and column pixels in every wedge frame. What remains is in the stories: the failure is still quieter than its recovery, and on a phone the signal title is born between bars.

## What's Working

- The timeline front is a genuine brand idea, built from the UI's own geometry and colour table, seeded per card so every history differs.
- The retry resolution, one bar with the failed→completed gradient, a green pop and two rings, is the clearest durable-execution image a four-beat transition could carry.
- Craft: compositor-only motion, grain that removes banding (maximum smoothed step 0.4 levels), consistent dark and light tokens, honest fallbacks, and the signal's title growing from the landing point.

## Priority Issues

1. [P0, fixed since] End card sweep tore in both recordings. The axis drift was a paint-property animation on a full-frame layer; it is now a delayed transform. Re-verified in raw frames. (/impeccable animate)
2. [P1] Phone, signal wipe: the title is born inside the column. The clear time assumes bars start at most 23vw behind their leader, but bars floor at 7 px per unit, up to 32vw at 390 px, so at 3.6B a lead dot overlaps the title's box and bars sit above and below it. Fix: compute the clear time with the same px floor the fail wipe already uses. (/impeccable adapt)
3. [P1] The failure is under-signalled. The wash is a dim maroon tint peaking at 0.38 for 41 ms and gone in 200 ms, plus a dash recolour on a row that already wore the retry glyph. Keep the no-red-object rule: hold the peak for 0.25B and fade over 1B, shrink the ellipse from 42×24vw to about 24×12vw so it reads as this row, and consider the UI's "Attempt 2" wording as the default caption. (/impeccable animate)
4. [P2] Light-mode dashes. Persimmon 2.0:1 and slate 2.4:1 on Off White; the carrier of the failure story is the least visible element. Use the UI's light-theme persimmon and slate-blue steps as mint and lime already do. (/impeccable harden)
5. [P2] The signal's trail and wait. A 40vw solid pink ribbon at 2.5× lies across the product's rows, and the landed signal sits still for 0.56 s with nothing happening. Shorten and taper the trail, give the waiting signal a breath, tint the first pulse signal-pink. (/impeccable animate)
6. [P3] Rail wipe pacing: a row crosses the visible frame in 7 frames, so the theme's identity is on screen for about 0.45 s in a rail wipe. (/impeccable animate)

## Persona Red Flags

Jordan (first-timer): sees green bars, a shake, an orange stripe, then a red-to-green bar; will not know a retry happened unless captioned, and may read the pink signal landing on the product as an error popup.
Alex (expert): the only pending row wears the retry glyph before any failure; child workflow rows use the workflow icon; light mode is the dark UI's colour table on a light card.

## Minor Observations

- The chip's right border sits 8 px from a weak axis tick.
- The signal dot's bottom edge peeks at the top-right at 0.5B before it flies in.
- At fail 3.5B and signal 4.0B the lowest rows' start dots are still at the right edge while the title is sharp; the block's blur sharpens over 1.1B so text is soft for about 0.5 s after the column has gone.
- Measured contrast against lit pixels: dark title 14.6:1, subtitle 6.9:1, chip border 5.3:1; light title 13.8:1, subtitle 5.6:1, chip border 7.4:1; URL text on the gradient 3.2:1 at the violet end; the end card's outlined cap border 2.5:1 on the dark card.
- Phone: chip 12.5 px, title 49 px single line, subtitle 19 px; the end-card lines stack; nothing clips or scrolls.
- Aeonik is absent on the render host; every frame is Inter.

## Questions to Consider

- Should the rail wipe be the default when it is the one wipe where the timeline is on screen too briefly to be read? What if it paused a beat mid-frame like the others?
- Is the signal arriving on the product the point, or is it the trail? The dot and rings make the argument; the ribbon makes a mess.
- If every history is seeded, could the position of the story beat vary too, so the viewer is never sure where to look?
- Would a true Temporal light-UI table be more honest than deepening three tokens?
- Nobody will ever see the end card's ticks move one pitch in 30 s. Is the drift worth keeping at all?
