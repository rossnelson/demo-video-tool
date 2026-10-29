---
target: temporal theme (lib/themes/temporal)
total_score: 15
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 2
target_identity: "file:/home/user/command-palette-video/lib/themes/temporal/card.js"
target_fingerprint: "sha256:bff649c7b5fa87338325c3fef032bb3c4030da4cffa653b0bd7485908ac4553b"
target_path: /home/user/command-palette-video/lib/themes/temporal/card.js
timestamp: 2026-10-29T00-39-20Z
slug: lib-themes-temporal-card-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The step chip is the only "where am I" cue; the front is a status metaphor but says nothing about progress through the video. |
| 2 | Match system / real world | 2 | The column is a visible 12-row tile, every event ends on the rail, no started/completed row, the running leader's black icon vanishes on its dark fill. |
| 3 | User control and freedom | n/a | A title card accepts no input. |
| 4 | Consistency and standards | 3 | Palette, type and voice hold. Breaks: red-to-green retry gradient is not a UI state; dead `colors.grid`; `cycle` can land the end card on a shake. |
| 5 | Error prevention | n/a | The viewer cannot err. |
| 6 | Recognition rather than recall | 2 | Non-Temporal viewers hold unexplained glyphs in memory while the story plays. |
| 7 | Flexibility and efficiency | 3 | Options are well designed, but the card reports a 2-beat entrance whatever the wipe, so slow wipes eat the hold on default timing. |
| 8 | Aesthetic and minimalist design | 2 | The card at rest is spare; the slow wipes are the loudest thing in the video. |
| 9 | Error recovery | n/a | No user error state. |
| 10 | Help and documentation | n/a | Not viewer-facing. |
| **Total** | | **15/24** | **Acceptable (63%)** |

n/a heuristics: 3, 5, 9, 10.

## Design Specificity Verdict

LLM assessment: authored for Temporal in motion (the wipe is the UI's own timeline geometry, colours and icons; the rail is a credible "now" line), generic at rest (stars, violet glow, gradient key cap, mono chip, thin light title: swap the wipe for a fade and the product is unidentifiable).

Deterministic scan: 3 CLI findings. `bounce-easing` in lib/themes/temporal/card.js:193 (retry dot pop, cubic-bezier(.3,1.6,.5,1)) is the theme's. `low-contrast` (#8a8aa3 on #fff) and `overused-font` (Inter) are on the sample page the card was mounted over; Inter is what renders because Aeonik is not installed. Browser overlay on the splash: `ai-color-palette` x2 (violet-to-UV gradients), `dark-glow` x1 (key cap glow). Text contrast measured clean (title 17.6:1, subtitle 8.0:1), no phone overflow, no pointer-events leaks, zero animations at the hold.

## Priority Issues

1. [P1] The signal pickup is invisible and leaves a ghost. The landed signal sits inert for over a second, the pickup lands at peak drag speed and is over in 2-4 frames, and the pick ring floats on the card afterwards. Fix: pause the front ~0.4 beat at the pickup, scale the signal into the leader during the pause, draw the ring inside the row. (/impeccable animate)
2. [P1] The flash and the shake paint the recorded product: the alarm layer is a sibling of the card, so the wash covers the demoed app, and the shake jolts the card against a static page. Fix: clip the alarm to the card; shake the front and card together or only the failing row. (/impeccable quieter)
3. [P2] The column does not read as a real timeline: 12 bar types tiled over ~25 rows, every special row twice per screen, no started/completed rows, black icon on the running dot. Fix: generate per viewport with workflow rows top and bottom, one timer, one signal, one running row, light icons on dark fills, lengths seeded by scene. (/impeccable polish)
4. [P2] The retry gradient goes red to green via brown. Fix: red failed segment with its own end dot, a gap, then a running-blue retry that snaps green at the front. (/impeccable colorize)
5. [P2] Default timing starves the slow wipes: the card returns a 2-beat entrance whatever the wipe. Fix: report the real entrance or fall back to the rail when the hold is short, documented in theme options. (/impeccable harden)

## Persona Red Flags

Jordan (first-timer): the pink square with a trail is a projectile, not a signal; the red flash on the app says the app crashed; dashed blue rows read as loading bars; the chip reads like a build number.
Alex (expert): spots the 12-row loop; running rows carry the retry icon as start dot; red-to-green is not a UI state; black icon on the running dot; the leftover ring looks like an artefact.

## Minor Observations

- Mid-shake slivers between the stepped bars and the straight clip edge show page fragments inside the card.
- Phone: bar lengths in vw vs row height in px makes the column a staircase of dot pairs.
- The dash crawl keeps moving while the front is stopped for the failure.
- End-card lines and splash chips at 14px tracked mono are illegible on a phone.
- Retry pop uses an overshooting curve (detector hit).
- Inter renders; Aeonik is not loaded in this environment.
- The out sweep always being the rail is correct restraint.

## Questions to Consider

- If the wipe is the Temporal story, why does the card behind it say nothing Temporal?
- Should a product video ever shake and flash red over the product?
- Does the signal need to fly, or should the pickup be the whole gesture?
