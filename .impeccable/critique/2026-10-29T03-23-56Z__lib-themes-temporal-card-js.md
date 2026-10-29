---
target: temporal theme (lib/themes/temporal)
total_score: 19
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 2
target_identity: "file:/home/user/command-palette-video/lib/themes/temporal/card.js"
target_fingerprint: "sha256:b0d8c1f5d07aa084a3b0aeedb5bb5d0e5c150feca4d0265b5567e13983507942"
target_path: /home/user/command-palette-video/lib/themes/temporal/card.js
timestamp: 2026-10-29T03-23-56Z
slug: lib-themes-temporal-card-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | The fail story now reads red, retry, green, and ends on green; the signal pickup is legible. The chip is the smallest thing on screen. |
| 2 | Match system / real world | 3 | The column is the UI's own geometry, icons, colours and dash cadence, with a generated history. For a first-timer the bars are an unexplained Gantt chart. |
| 3 | User control and freedom | n/a | A title card accepts no input. |
| 4 | Consistency and standards | 3 | The retry line is solid where every running row is dashed; the retry lead's icon is white on green (3.05:1) where every other icon is black; the splash chip border is plain UV. |
| 5 | Error prevention | n/a | The viewer cannot err. |
| 6 | Recognition rather than recall | 3 | The fail story is self-contained; the signal story needs the signal icon recognised. |
| 7 | Flexibility and efficiency | 3 | Wipes, cycle, modes, per-scene override and the rail fallback. No shorter fail or signal; five beats before the title is a lot inside a 69 s demo. |
| 8 | Aesthetic and minimalist design | 3 | The settled card is five elements, well spaced. The light-mode glow bands visibly in the recording; the stars are a generic cosmos motif. |
| 9 | Error recovery | n/a | No user error state. |
| 10 | Help and documentation | n/a | Not viewer-facing. |
| **Total** | | **19/24** | **Good (79%)** |

n/a heuristics: 3, 5, 9, 10.

## Design Specificity Verdict

LLM assessment: in motion, authored for Temporal unmistakably. The wipe is the UI timeline graph itself and the fail and signal stories are Temporal semantics (a retry to green, a signal landing on a workflow) rather than generic glitch effects. At rest, moderately specific: the light heading, gradient square key caps, mono chip, mint-lime rule and the palette are temporal.io's hero language, but the violet glow with drifting stars is the generic dark-SaaS cosmos; the column does the brand work.

Deterministic scan: 0 findings on the source files (regex scan of template strings). On rendered dumps of six pages, 38 findings deduplicate to: `dark-glow` on the key cap (card.js, splash.html), the rail (one declaration counted twice per page) and the signal dot; `overused-font: inter` (Aeonik is the primary and is not installed here); `pulsing-dot` on the stars and `repeating-stripes-gradient` on the dashed running bar, both literal matches on decorative stars and a timeline data style; and `low-contrast` 3.4:1 on the mock product page under the card, a false positive for the theme.

Visual overlays: no human-visible browser tab exists in this headless environment. The in-page detector cannot reach the card's shadow root; on the splash it reported the key cap's violet gradient and its glow.

## Overall Impression

Both P1s from the last run are resolved: the recovery is visible for about 0.8 beat and the story ends on green, and the signal's title now grows out of the pulse with no empty stretch. The flash and shake are confined to the card, and the card shakes as one object with its edge. Two new things surfaced: a recording tear between the card's edge and the column (a regression from this round's `calc()` clip polygon, fixed and re-verified in raw frames since), and visible banding of the light-mode glow in the encoded video.

## What's Working

- The column is a real artefact: UI geometry, icons, colour pairs, a seeded history per scene, running rows that crawl except when time stops.
- The time-warp gives the fail story physicality: the retry grows to the rail while time creeps, then the whole timeline accelerates away.
- Discipline: transform, opacity and clip-path only; the flash never touches the product; the end card is static apart from drifting stars; dark and light tokens are both coherent; title 17.6:1, subtitle 8.0:1, chip border 6.5:1, key caps identical in size, nothing clips on a phone, no text through the column's gaps.

## Priority Issues

1. [P1] The recording tore: the card's dark edge lagged the column by several frames at peak speed, with page text visible between edge and rail. Cause: the clip polygon used `calc(vw + px)`, which keeps the clip animation off the compositor while the column's transform is composited. Fixed since the assessment: polygons in plain vw, verified aligned in the raw frames of a new recording. (/impeccable optimize)
2. [P1] The light-mode glow bands in the recording: concentric steps about every 11 px around the title, versus 1–4 px in dark mode. It is 8-bit quantisation of a shallow gradient plus video compression, not the stop count. Fix: a 2–3% grain layer over the glow, or a steeper, smaller glow so each step is under 3 px. (/impeccable polish)
3. [P2] Signal pacing and emergence. The first 0.58 beat shows only a faint pink glow top-right (the signal starts off frame); the front barely moves from 1.6 to 2.8 beats; the title emerges still blurred, so it reads as a soft ghost rather than a crisp thing growing from a point, and the chip and key cap fade up at the same moment. Fix: start the signal in frame, start the drag earlier or ease it out of the gate, sharpen the block before the title's birth, and delay chip and key by about 0.4 beat. (/impeccable animate)
4. [P2] Edge geometry. The clip edge ran from the overhanging stage's corners, so it sat about 11 px left of the rail at the top of the frame and 11 px right at the bottom, with a sliver of page near the top; row leaders also sat up to 27 px right of the rail because rows spanned more than the frame height. Fixed since the assessment: the edge is extended along the rail's slope and leaders are placed from their y. Still open: on a phone the failed piece's start dot is clipped at the left edge. (/impeccable adapt)
5. [P3] Fidelity and finish. The retry lead's icon is white on green (3.05:1); the UI draws a pending retry dashed and starting at the failed marker (the current solid blue with a gap was kept on purpose); the top row sits on the frame edge; Noto Sans Mono falls back to DejaVu here, which widens the chip; in light mode the card's edge against the page is marked only by the rail. (/impeccable polish)

## Persona Red Flags

Jordan (first-timer): does not know what the coloured bars are or why some are dashed; the signal icon reads as broadcast or Wi-Fi; the fail card reads as "something broke, a blue bar fixed it, a red thing stayed"; the five-beat signal card feels slow before the title lands; the stars suggest a space company.
Alex (expert): spots the solid blue retry where the UI draws a dashed pending line with an attempt label, the child workflow using the workflow icon, no time axis, flat bars where the UI dims a scheduled segment; approves of the icon paths, dot colours, rounded-square dots and the signal row having no bar.

## Minor Observations

- URL and key-cap text on the gradient is 3.21:1 at the violet end (passes only as large text).
- The 120×2 px rule is a hairline at 1080p.
- Chip letter-spacing in the DejaVu fallback reads as "0 2".
- Frame intervals in headless rendering: mean 18.3 ms, p95 33 ms, one hitch of 50–67 ms in the first 3 s for both slow wipes.
- The pre-change failed bar rendered as a maroon-to-red gradient because `.line.back` matched the old `.back` rule; with that rule gone the bar is solid #ce2c31.
- No slivers, ghosts or lingering elements after the out sweep; the end card at 8 and 48 beats differs only in the drifting stars; pointer events pass through.

## Questions to Consider

- Are the stars Temporal? Would a faint time axis with tick marks behind the title tie rest to motion?
- Should the fail story carry the red attempt away before the retry completes, so the frame ends on green only?
- The signal lands exactly on the title: should it deliver something, such as the step chip arriving with it?
- Should the slow wipes compress the type choreography so every card's text is settled before the narration starts?
