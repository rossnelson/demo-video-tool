---
target: temporal theme (lib/themes/temporal)
total_score: 18
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 2
target_identity: "file:/home/user/command-palette-video/lib/themes/temporal/card.js"
target_fingerprint: "sha256:cefb663989ed8ed252440544cee467f2a9bcb5bf0c6d00bc00b211dc6b991317"
target_path: /home/user/command-palette-video/lib/themes/temporal/card.js
timestamp: 2026-10-29T02-31-01Z
slug: lib-themes-temporal-card-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The chip places the scene and the front is a real status graphic, but the one status change the fail story is about (red to green) is on screen for about two frames. |
| 2 | Match system / real world | 3 | The generated column now reads as a history (one timer, one signal, one running row, workflow rows top and bottom, jittered ends). Left: the pending row's start dot carries the retry icon at attempt 1, and the forward lean has no single "now" axis. |
| 3 | User control and freedom | n/a | A title card accepts no input. |
| 4 | Consistency and standards | 3 | Palette, type, icons and dash cadence match the UI. Breaks: outlined key caps render 2px larger than the gradient cap; the card chip uses full text while the splash chip uses muted. |
| 5 | Error prevention | n/a | The viewer cannot err. |
| 6 | Recognition rather than recall | 3 | UI-native glyphs, unlabeled: instant for a Temporal user, opaque for a first-timer. |
| 7 | Flexibility and efficiency | 3 | Wipes per scene, cycle, modes, and the slow wipes now fall back to rail when the hold is short; the fallback is silent, nothing tells the author it happened. |
| 8 | Aesthetic and minimalist design | 3 | The loud moments are confined to the card and the column reads as one object; the rest state is still the generic dark-SaaS kit (glow, stars, light title, outlined chip). |
| 9 | Error recovery | n/a | No user error state. |
| 10 | Help and documentation | n/a | Not viewer-facing. |
| **Total** | | **18/24** | **Good (75%)** |

n/a heuristics: 3, 5, 9, 10.

## Design Specificity Verdict

LLM assessment: authored for Temporal in motion, category-interchangeable at rest. The front quotes the product itself: ROW_HEIGHT 24, RADIUS 9, the 2px dot stroke scaled 1.4x, the UI's dark-theme status palette, its icon paths, the dash crawl at the UI's cadence; and the column is now a plausible history rather than a visible tile. At rest the card is a violet glow, twelve stars, a 300-weight title and an outlined mono chip; only the violet-to-UV block and the palette tie it to temporal.io, and the timeline language vanishes the moment the front leaves.

Deterministic scan: 0 findings on the source files (the CSS lives in template strings). On rendered dumps of the five pages, 31 findings deduplicate to: `dark-glow` on the key cap (card.js:233, splash.html:9), the rail glow (card.js:198, one declaration counted twice) and the signal dot (card.js:220); `overused-font: inter` (Aeonik is the primary and is not installed here); `pulsing-dot` on the stars (card.js:227) and `repeating-stripes-gradient` on the dashed running bar (card.js:202), both literal matches on decorative stars and a timeline data style; and `low-contrast` 3.4:1 on the mock product page under the card (lib/theme-preview.mjs:55), a false positive for the theme. Not flagged by the CLI: the violet-to-UV gradient fills.

Visual overlays: no human-visible browser tab exists in this headless environment. The in-page detector ran on the splash (2 findings: the key cap's violet gradient and its glow) and on the card pages, where it cannot reach the shadow root, so it reported only the mock page's header contrast.

## Overall Impression

The two loud moments landed. The signal pickup is now a legible step (pause, shrink, carry) and the fail wipe's flash and shake stay inside the card: pixel checks found no tint over the product in any frame. The biggest remaining opportunity is the ending of the fail story: the retry completes at 88vw while the front is accelerating out, so the green lives for two frames and the last thing the viewer sees is the red piece leaving.

## What's Working

- The column is the product's graphic, measured not approximated, and now generated per card so no two scenes show the same history.
- Motion is authored like film: the pause warp stops the whole block dead, the 50-stop keyframe tables keep every element agreeing on "now", and all of it scrubs.
- The settled card is disciplined: title 17.6:1, subtitle 8.0:1, end-card lines 8.0:1, nothing clips on a phone, the end card is identical at 8 and 48 beats, the host passes pointer events through, and at the hold nothing runs besides the glow and the stars.

## Priority Issues

1. [P1] The retry's recovery is still barely visible. It completes at DONE_X = 88vw while the front is in its exit acceleration; the green lead and its ring are in frame for about 0.1 beat, and the red failed piece is dragged to 170vw and still visible at 3.7B as the title sharpens. Fix: complete the retry around 60–65vw as the front resumes, hold the green lead at least 0.4 beat before the drag, let the ring finish on screen, and fade the failed piece by about 3.4B instead of dragging it off. Consider the failing row at mid-height instead of 0.8n. (/impeccable animate)
2. [P1] Dead air at the end of the signal wipe. The front clears at about 4.35B but the title's rise starts at 4.4B and takes 1.3 beats, so 4.0–4.5B is an empty violet field and the title is readable only at about 4.9B. Fix: key the text entrance to the front clearing for signal (start the sharpen and h1 at about inMs minus 1.2B, as rail already overlaps them), or shorten PICK_TO. (/impeccable animate)
3. [P2] The signal impact has no flash, and the front peeks on phones. The alarm now lives inside the stage, which is clipped to zero area until 1.6B, so the signal's pink flash is never painted; the shake moves only the off-frame front. On 390 wide the parked front's leading dots show 1–6px at the left edge during the whole wait and jiggle in the shake, because the park margin (D+2vw, about 8px) is less than half a dot. Fix: make the ring the deliberate cue (a second larger ring and a scale pop), or give the signal its own flash outside the stage; park the front at calc(-Dvw - 60px). (/impeccable polish)
4. [P2] The shake detaches the rail from the clip edge. The shake moves the column and the content but the stage's clip stays put, so at the first peak (1.36B) the rail sits 9px right of the edge with an 8px strip of page between card and rail, and on the opposite half-cycle 6px inside it; the shake's 0% keyframe is also translate(0, 5px), a one-frame jump. Fix: shake the stage's clip polygon with the front (offset the clip keyframes by the shake), or shake only the failing row and the content; start demoShake at 0,0. (/impeccable polish)
5. [P3] Small consistency defects. Outlined key caps are 98x66 against the gradient cap's 96x64 (border outside the box); the chip border on the card measures 2.6:1; end-card lines have no separator and read as one sentence; the pending row's start dot shows the retry icon at attempt 1, which the UI only shows after a retry. (/impeccable polish)

## Persona Red Flags

Jordan (first-timer): reads the front as a Gantt chart of green pills; catches the fail story only if looking at the bottom row; the signal story is "a pink badge lands and is absorbed", pleasant but meaningless; the enlarged pink glyph sitting on the product UI for 0.6 beat can read as a product notification.
Alex (expert): delighted by the fidelity, then notices the retry icon at attempt 1, the pending row drawn in running blue rather than slate-blue, child-workflow rows using the workflow icon rather than relationship, and the forward lean with no single time axis. All forgivable stylisations except the retry icon, which states something false.

## Minor Observations

- At 1920x1080 the recording is a 1440x810 viewport scaled up, so the px caps scale with it (title 10.4% of frame height); the chip and the end-card lines are still the smallest text and go small on a phone playing the video.
- The in-flight signal is off frame for about 60% of its flight; what the viewer sees is the trail.
- The signal lands at a fixed, content-blind point (about 55vw, mid-height); in the sample it crosses the Add button.
- The card chip uses full text while the splash chip uses muted text.
- Aeonik is not installed here; Inter 300 renders. The shift glyph in the mono fallback is lighter and smaller than the K in a three-key row.
- Frame rate (headless, software compositing): rail 17.7ms mean interval, signal 18.2ms, fail 19.4ms with the most dropped frames.
- Timeline icon contrast is fine on every fill (5.4:1 to 17:1).
- The dark mode and the new light mode render from the same files; the light mode was not part of this critique's target pages.

## Questions to Consider

- Why does the rest state abandon the timeline entirely? Could the mint-lime rule be a completed activity bar with its two dots, so the card at rest is still Temporal?
- Should the failure happen at eye level and the signal lower, instead of the failure in the bottom 11% of the frame?
- Could the title emerge from the signal row's position, so the signal is the thing that opens the card?
- Is the key cap above the title the right first fixation, or should chip and keys sit below the rule where temporal.io puts secondary UI?
- Would 10 rows with more varied lengths and one or two more event types read as a richer history at 1080p than 26 near-identical ones?
