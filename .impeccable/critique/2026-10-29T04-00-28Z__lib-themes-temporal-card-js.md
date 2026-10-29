---
target: temporal theme (lib/themes/temporal)
total_score: 19
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 2
target_identity: "file:/home/user/command-palette-video/lib/themes/temporal/card.js"
target_fingerprint: "sha256:e705afce9d65d3dc313ddf72a61f5d7a3e6ded5c9318ef142f72d38a8341dcea"
target_path: /home/user/command-palette-video/lib/themes/temporal/card.js
timestamp: 2026-10-29T04-00-28Z
slug: lib-themes-temporal-card-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | The fail story shows status better than most product UIs: stop, red, retry, green with a ring, visible for 0.8 beat. The chip says "02", never "of 05". |
| 2 | Match system / real world | 3 | The column is the UI's own history view; for anyone else it is an abstract bar chart, and the pink square is unexplained. |
| 3 | User control and freedom | n/a | A title card accepts no input. |
| 4 | Consistency and standards | 3 | Light mode keeps the dark-theme dot pairs and loses the rail's glow; the splash key cap is a 112×76 rectangle where the cards draw a square; the retry is solid blue by choice. |
| 5 | Error prevention | n/a | The viewer cannot err. (Author side: a wipe that falls back to rail does so silently.) |
| 6 | Recognition rather than recall | 3 | Clean reading order; on the intro card a lone key cap above the product name reads as a logo. |
| 7 | Flexibility and efficiency | 3 | `rest` and `mode` are theme-level only; a scene cannot switch them. |
| 8 | Aesthetic and minimalist design | 3 | The title block is restrained; the enlarged signal with its trail and halo over the live app is not, and the light-mode glow still bands in the recording. |
| 9 | Error recovery | n/a | No user error state. |
| 10 | Help and documentation | n/a | Not viewer-facing. |
| **Total** | | **19/24** | **Good (79%)** |

n/a heuristics: 3, 5, 9, 10.

## Design Specificity Verdict

LLM assessment: specific, and specific in the right place. The column is the Temporal UI timeline graph re-drawn, the rail sits exactly on the leaders, and the three wipes tell Temporal stories. The other half is weaker: for 8 of the card's 12 beats the only Temporal-ness is the palette; the held card is a light title, a thin rule, a mono chip and a glow with stars. The `axis` rest state is the right instinct and is too faint to do the job at 0.16.

Deterministic scan: 0 findings on the source files (template strings). Rendered dumps deduplicate to the key cap glow, the rail glow (one declaration counted twice), the Inter fallback (Aeonik not installed), the stars and the dashed running bar (literal matches on decoration and a data style), and a contrast hit on the mock page under the card, a false positive.

Visual overlays: no human-visible browser tab exists here; the in-page detector cannot reach the shadow root.

## Overall Impression

The tear is gone: in both the live page and the recording the card's edge and the rail coincide within the rail's own 3 px glow, in every sampled frame. The grain dithers the dark card (about ±1.8 levels) but the light recording still shows rings around the title at 1x. The fail story's peak is right, its ending is not: the failed piece is pinned 24vw behind the rail, so it leaves the frame last, 0.15 beat after the green lead, and the title follows a 0.2-beat hole.

## What's Working

- The column is a faithful, living timeline: real geometry, colours and icons, a seeded history, dashes that crawl and stop when time stops, and a retry that visibly catches up with "now".
- The warp functions give the wipes musical phrasing, and everything is transform, opacity and clip-path, so recordings match the live page frame for frame.
- The signal's title emergence is measured on a second render pass, so the pulse and the growth are concentric; chip and key following the title is a nice hierarchy. Pointer events pass through; nothing but glow and stars runs at the hold; phones show the failed piece in full and no column at the edge.

## Priority Issues

1. [P1] Light-mode glow still bands in the shipped recording. The light glow falls from 0x30 to transparent over about 900 px of radius, so each 8-bit step spans about 20 px; mid-grey grain at 7% is nearly invisible on Off White and h264 crushes it. Fix: light mode gets stronger grain with multiply blending (or a darker noise matrix), a smaller glow with a higher peak so steps are narrower, and a higher bitrate or grain tuning for the light render. (/impeccable polish)
2. [P1] The fail story ends on red, then on nothing. The green lead exits at about 3.3B, the red marker at 3.45B, then 0.2B of empty glow before the title de-blurs. Fix: bring the title in earlier (t0 around clearMs minus 0.4B) so its rise overlaps the column's exit, and make the failed piece recede at completion (dim it, or let the UI's retried state take it) so the green is the last thing out. (/impeccable animate)
3. [P2] Signal dead air and footprint. The front starts at 1.3B but with the ease-in it barely enters before 2.3B and reaches the signal at 3.0B; meanwhile a 100 px pink square with a 30 px halo and a 40vw trail sits on the live app, which the card's own comment promises never happens. At 0.3B the dot is still 76% above the frame. Fix: an ease that moves early into the pause (or start at impact), a smaller flight (about 3.2x) with a shorter, thinner trail, and start the flight lower. (/impeccable quieter)
4. [P2] The completion ring is a ghost box. The retry lead's ring is a rounded square scaled to 3.5x; in the light recording it reads as a faint 110 px translucent box beside the retry. Fix: a circular ring, scale 1 to 2.6, 0.5 beat. (/impeccable polish)
5. [P3] Light-mode column and finish. Dark-theme dot fills on the Off White card and a glow-less rail that reads as a hairline; axis at 0.16 too faint (0.24 with a 2 px strong tick); `rest` and `mode` not overridable per scene; the splash key cap proportion; stars still animate in light mode though invisible; a `console.warn` when a wipe falls back to rail; the title can drift up to 15 px from the pulse when the second measuring pass misses. (/impeccable harden)

## Persona Red Flags

Jordan (first-timer): the fail wipe's red flash, shake and red bar on a product demo read as "the app crashed" for the 0.4 beat before the retry starts, and because the red bar leaves last the lasting impression is red. The pink square on the page reads as a notification or a bug. The key cap above the product name on the intro card looks like a logo.
Alex (expert): likes the geometry, colours and dashed running lines; notices the solid blue retry, the child workflow with the workflow icon, dark-theme dots on the light card, a whole card shaking (the UI never does), a signal that flies rather than arrives, and UV axis ticks rather than content-primary.

## Minor Observations

- Measured contrast against the glow-lit pixels under each element: title 14.3:1, subtitle 6.9:1, chip border 5.4:1, end-card lines 7.1:1; retry lead icon now black on green at 6.65:1.
- The rail's 40 px UV glow is the one element that crosses the card's edge onto the page.
- The recorder samples the sweep unevenly (implied animation-clock steps of 11 to 35 ms, one duplicated frame), a container limitation, not a theme defect.
- Out sweep clean; end card identical at 8 and 48 beats apart from star drift.
- Reviewer's preference for the rest state: the axis, raised to about 0.24 with a 2 px strong tick, because it keeps the held card inside the timeline's world and survives light mode.

## Questions to Consider

- In the UI a retried-then-completed activity carries its retry into one row; why does the failed piece stay red after the retry succeeds?
- Is the title the signal's payload? Should the step chip, the thing that changes between scenes, be what the signal delivers?
- Does the shake earn its place when a column that stops dead with frozen dashes is already the Temporal idea?
- Would a UI-sized signal with a long thin fast tail land harder than a big square with a wide band?
- Light mode: would flat Off White with the axis and no glow remove the banding problem entirely?
