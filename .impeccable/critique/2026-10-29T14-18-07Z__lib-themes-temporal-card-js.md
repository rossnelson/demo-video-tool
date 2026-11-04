---
target: temporal theme (lib/themes/temporal)
total_score: 20
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 1
target_identity: "file:/home/user/demo-video-tool/lib/themes/temporal/card.js"
target_fingerprint: "sha256:489658ce94123d59a5c50384061641fa122d45c59c85137c78386a3fdf049c3c"
target_path: /home/user/demo-video-tool/lib/themes/temporal/card.js
timestamp: 2026-10-29T14-18-07Z
slug: lib-themes-temporal-card-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Crawling dashes that freeze during the stop, a retry that catches up with the rail and turns green with a ring; the stories carry no label, so state is read from colour. |
| 2 | Match system / real world | 3 | Exact timeline vocabulary; the child workflow row uses the workflow icon where the UI uses `relationship`, and the failed row keeps a pending-styled start dot. |
| 3 | User control and freedom | n/a | A title card accepts no input. |
| 4 | Consistency and standards | 3 | Colours and geometry match the UI; the retry is solid running blue by the owner's choice; the light-mode axis at 0.24 reads as ruled paper. |
| 5 | Error prevention | n/a | The viewer cannot err; the author now gets a warning when a wipe falls back to rail. |
| 6 | Recognition rather than recall | 3 | The pink tower, the 17 px retry arrow and the red/green semantics assume Temporal knowledge; nothing names the event. |
| 7 | Flexibility and efficiency | 4 | Three wipes, cycle, per-scene overrides for wipe and rest, two modes, a phone-safe stop, a fallback that explains itself. |
| 8 | Aesthetic and minimalist design | 3 | The card is restrained and the column purposeful; in light mode the 2 px centre tick runs through the chip, key cap and title. |
| 9 | Error recovery | n/a | No user error state. |
| 10 | Help and documentation | n/a | Not viewer-facing. |
| **Total** | | **20/24** | **Good (83%)** |

n/a heuristics: 3, 5, 9, 10.

## Design Specificity Verdict

LLM assessment: genuinely specific, not a templated wipe. The column is a transcription of the Temporal UI timeline graph, seeded per card, and the glowing rail doubles as the card's edge; each wipe tells a Temporal story; the card itself reads as temporal.io, and the axis now keeps the held card inside the timeline's world. The flip side: the meaning is only available to Temporal insiders; to anyone else it is an attractive bar chart.

Deterministic scan: 1 advisory on source (the splash axis's repeating gradient); the card's CSS lives in template strings the scanner cannot read. Rendered dumps deduplicate to the key cap glow, the rail glow (one declaration counted twice), the Inter fallback, a dormant stars rule (no star elements exist with the default axis), the axis and dash repeating gradients, and a contrast hit on the mock page under the card, a false positive.

Visual overlays: no human-visible tab in this headless environment; the in-page detector cannot enter the shadow root. On the splash it flagged the brand gradient and the 76 px key cap above the title as an icon tile.

## Overall Impression

The three measured defects of earlier rounds are closed: no tear (rail 1–3 px right of the edge, its own line, in live and recorded frames), no banding (2.2 px mean runs in the light recording, 36 levels where there were 8), and the signal approach reads as motion then a pause (leader at 175 px, 579 px, 719 px over 0.8 beat, then still). What remains is choreography at the margins: the pulse meant to bridge the signal's wait is gone before the title arrives, the running activity sits one row from the signal and hides behind it, and the light-mode axis is louder than its purpose.

## What's Working

- Fidelity that survives the pipeline: the column is an honest Temporal artefact down to icon paths and dot strokes, and clip and transform stay in step in every sampled sweep frame.
- The fail choreography: stop dead, red wash, decaying shake, retry dot popping in on the beat, green ring, all confined to the card so the product never appears to break; on a phone the stop moves right so the piece is fully in frame.
- Typography and card: title 14.6:1 and subtitle 6.9:1 against the actual glow-lit pixels, key caps identical 64 px squares, nothing clipped on a phone, only the glow's breathe running at the hold.

## Priority Issues

1. [P1] The signal's bridge is empty. The pulse fires at the pickup (2.85B) and is at 5% by 3.6B; the title starts at about 3.7B, so for about 0.85 beat the centre holds nothing while the column exits at the right. Fix: fire the pulse at clearMs minus 0.7B (or add a slower second pulse) and start the title's growth at clearMs minus 0.35B, since it begins at half scale well inside the already-clear centre. (/impeccable animate)
2. [P2] The fail story's last pixels are red. The row leaves rightwards in its natural order, so the failed bar and marker exit after the green retry (3.3B to 3.45B), while the title is already at 55–83% opacity. This is the owner's decision (the row stays as drawn); if revisited, dim the failed segment to about 35% when the retry completes, or keep the recover ring alive on the lead until the row exits. (/impeccable animate)
3. [P2] The running activity collides with the enlarged signal. The pending row is placed at 0.4n (row 11) and the measured signal row is 12; the guard only prevents equality, so the pending leader sits half hidden behind the 2.5x signal from 2.2B to 2.7B. Fix: keep the pending row at least two rows from the signal row in the signal wipe. (/impeccable polish)
4. [P2] The light-mode axis is too loud and bisects the content. UV at 0.24 on Off White reads as ruled paper, and the 2 px strong tick at centre runs through the chip, the key cap and the title in both modes. Fix: a light-mode axis token near 0.1, strong ticks offset half a step so none sits on centre, and the same in the splash. (/impeccable quieter)
5. [P3] Fidelity and engine. Child workflow rows should use the UI's `relationship` icon (no path in this checkout) and the failed row's start dot the started style; a tiny attempt caption would name the retry for a first-timer; the recorder cuts from the desktop page to the phone page before the phone scene's card can draw, because the device switch reloads the page; the chip is 10 px on a phone. (/impeccable harden)

## Persona Red Flags

Jordan (first-timer): the fail wipe can read as "the demo app crashed", a red flash and a shake over the product with no word; the pink comet is pleasing but means nothing without context.
Alex (expert): the retry colour and the start-dot-less retry are owner's choices; the child icon and the failed start dot are plain errors; everything else passes, including the signal as a single dot, the timer fired orange and the 60 px ticks.

## Minor Observations

- Aeonik and Noto Sans Mono are not installed on this render host; the title renders in Inter and the chip in a fallback mono with a dotted zero. Document the dependency.
- The key cap above the title on the end card and splash reads as a button or logo.
- Key-cap and URL text is 3.2:1 at the violet end of the gradient (large text only).
- Headless frame intervals: mean 19–20 ms, p95 33 ms, against a 16.8 ms bare-page baseline.
- The 240 px grain tile repeats without visible seams; the dash crawl freezing during the stop is a detail nobody will consciously notice.
- Every rail sweep shows the bare page for about 0.3 beat before the column enters and 0.65 beat after it leaves, since the column parks off frame.

## Questions to Consider

- Could the retry's green ring be the thing that reveals the title, so the fail story's peak and the card's arrival are one event?
- Is the title the signal's payload? Should the step chip be what the signal delivers?
- Should the phone scene's card run inside the 390 px frame, as now, or over the full frame with the page padded beneath?
- In light mode, is the axis the brand, or the dark mode's texture transplanted?
