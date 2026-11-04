---
target: temporal theme (lib/themes/temporal)
total_score: 19
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 2
target_identity: "file:/home/user/demo-video-tool/lib/themes/temporal/card.js"
target_fingerprint: "sha256:64954aa1f904975fd46b81b08a672633d25ee75c2d480e0c4251c29cfaf691a8"
target_path: /home/user/demo-video-tool/lib/themes/temporal/card.js
timestamp: 2026-10-29T15-46-36Z
slug: lib-themes-temporal-card-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The chip and the dashed running rows place the viewer; the failure's status is a colour cast over the card, not an object. |
| 2 | Match system / real world | 3 | Faithful to the UI down to the retry icon on pending rows and the tangerine timer; the child workflow row still uses the workflow icon. |
| 3 | User control and freedom | n/a | A title card accepts no input. |
| 4 | Consistency and standards | 3 | Dark and light modes draw different started dots (zaffre in dark, the UI's default dot in light); the UI uses zaffre in both themes. |
| 5 | Error prevention | n/a | The viewer cannot err; the author gets a warning that names the fix. |
| 6 | Recognition rather than recall | 4 | Every object is a UI object; key cap, chip and title are self-explanatory. |
| 7 | Flexibility and efficiency | 3 | Wipes, cycle, rest, mode, caption; the caption is theme-level, not per scene. |
| 8 | Aesthetic and minimalist design | 3 | Ten hues in four beats; the retried bar, at 32vw, is the loudest object in the film. |
| 9 | Error recovery | n/a | No user error state. |
| 10 | Help and documentation | n/a | Not viewer-facing. |
| **Total** | | **19/24** | **Good (79%)** |

n/a heuristics: 3, 5, 9, 10.

## Design Specificity Verdict

LLM assessment: specific, and specifically Temporal. The front is the UI's own timeline graph with the real icon paths and dot pairs, the retry icon on pending rows, persimmon only while retrying, the retried row as one gradient bar, and the UI's time axis at rest. Someone who lives in the Temporal UI recognises every object. The weak spot is dramaturgy: the fail and signal wipes set up more than they pay off.

Deterministic scan: one advisory on the splash axis; the card's CSS is in template strings the scanner cannot read. Rendered dumps deduplicate to the rail glow, the key cap glow (scene cards only), the signal dot glow, a dormant stars rule, the axis and dash gradients, and a contrast hit on the mock page, a false positive. Live on the splash: the brand gradient and the key cap read as an icon tile.

Visual overlays: no human-visible tab here; the detector cannot enter the shadow root.

## Overall Impression

Confinement is now measured clean against the final card: zero ring pixels right of the rail at every fail and signal frame, zero flash pixels on the page, and the light card is 10–15 luma darker than the page beside its rail, so the edge reads on a white app. The recovery rings were invisible in the version Assessment A shot (their container rule sat in signal-only CSS, a P0 it caught), fixed before Assessment B measured. What is left is in the stories: the retried bar grows to 32vw and its red end passes the title's birth, the signal's pickup-to-title stretch is empty for about half a beat with only the carried dot moving, and the failure moment is a cast rather than an object.

## What's Working

- The front is a real artefact: seeded histories, lagged completions, a running workflow row, dashes that freeze while the column is stopped.
- The signal pickup is the best beat in the theme: the signal lands where the title will sit, the column pauses with its leader under it, the title grows from the same point.
- Engineering that shows on screen: compositor-only motion, no tear, no banding, light mode tuned separately, every ring and wash inside the card.

## Priority Issues

1. [P1] The retried bar is the loudest object in the film and passes the title at its birth. Its width is the attempt plus the creep, about 32vw, twice the longest completed bar, and its red end enters the title's zone at 3.3B, 0–40 px from the blurred title one row up. Fix: a shorter creep (about 0.045 of the travel) so the bar stays near 20vw, and the fail title starting nearer the column's clear. (/impeccable animate)
2. [P1] The failure has no object, only a cast. A 20% wash over the whole card turns the dark card brown and the light card mauve, with a shake and a dash recolour under the same icon. Within the no-red-object rule: make the wash local, a radial centred on the failing row so the eye goes to it, and cut the recolour on one frame; in light mode a deeper red at lower opacity. (/impeccable quieter)
3. [P2] Dead air in the signal bridge. From the signal's pickup at 2.98B to 3.43B only the carried dot moves away; the pulse then expands alone before the title's first visible frame near 3.8B. Fix: the pulse earlier and longer, tinted violet so it belongs to the card, and a shorter invisible start to the title's growth. (/impeccable animate)
4. [P2] Started dots differ between modes. Light mode uses the UI's default dot for started events where the UI uses zaffre in both themes. Fix: the same started dot in both modes. (/impeccable harden)
5. [P3] The recovery rings are anchored where the lead was at completion, so they trail the dot by 17–66 px while it creeps; the end card's ticks drift one tick per 84 s, imperceptible; the caption is not per scene; the child workflow icon. (/impeccable polish)

## Persona Red Flags

Jordan (first-timer): the fail wipe is the one place the demo looks like the demo broke, a brown flash, a wobble, orange dashes, then a big red-green bar; the signal is "a pink radio icon hit the app".
Alex (expert): no Failed dot; a retried activity whose span is three times any other; the child workflow with the workflow icon; every demo workflow looks like it is retrying something.

## Minor Observations

- Measured contrast against the lit pixels: dark title 14.6:1, subtitle 6.9:1, chip border 5.3:1; light title 13.9:1, subtitle 5.6:1, chip border 7.5:1; URL text on the gradient 3.2:1 at the violet end, large text.
- Phone: chip 12.5 px, title 49 px, subtitle 19 px; the end-card lines stack with no separator glyph; nothing clips.
- The rail's own glow spills about 12 px onto the product, by design.
- Aeonik is absent on the render host; the sans renders in Inter and the mono in JetBrains Mono.

## Questions to Consider

- If the retried row is the story, why is it the one row the viewer is never allowed to look at? What if the column paused one more beat with the gradient bar centred, and the title rose from the completed dot?
- Could the fail wipe land its failure on the product, making the card's arrival the recovery?
- Do you need ten hues? One highlighted row per wipe would make each wipe's event the only coloured thing.
- Does every demo workflow need a retrying activity in its history?
