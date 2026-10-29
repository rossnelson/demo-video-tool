---
target: temporal theme (lib/themes/temporal)
total_score: 19
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 2
target_identity: "file:/home/user/command-palette-video/lib/themes/temporal/card.js"
target_fingerprint: "sha256:3b8f97a4f2f76d17cfa476798d81b852bbd522ae6496a72277c9645eba4f5df9"
target_path: /home/user/command-palette-video/lib/themes/temporal/card.js
timestamp: 2026-10-29T15-14-39Z
slug: lib-themes-temporal-card-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Chip, key cap and title place the viewer; the fail wipe visualises status; the chip's lime dot reads as a live indicator with nothing live behind it. |
| 2 | Match system / real world | 3 | The timeline vocabulary is the UI's, but the pending row's dot never carries the UI's retry icon, and the light mode draws the column in dark-theme tokens. |
| 3 | User control and freedom | n/a | A title card accepts no input. |
| 4 | Consistency and standards | 3 | Dark mode is faithful; light mode is the dark card inverted; the out sweep draws the dark column over whatever product is underneath. |
| 5 | Error prevention | n/a | The viewer cannot err; the author gets a warning that names the fix. |
| 6 | Recognition rather than recall | 3 | Step, key and title are universal; the pink mast tile and the colour code are not. |
| 7 | Flexibility and efficiency | 4 | Wipes, cycle, rest, mode, caption, per-scene overrides, documented in three places that agree. |
| 8 | Aesthetic and minimalist design | 3 | The card is spare; the signal's trail across the product is the one loud object; the light glow still rings faintly in h264. |
| 9 | Error recovery | n/a | No user error state. |
| 10 | Help and documentation | n/a | Not viewer-facing. |
| **Total** | | **19/24** | **Good (79%)** |

n/a heuristics: 3, 5, 9, 10.

## Design Specificity Verdict

LLM assessment: specific in the right place, the motion idea. The wipe is the product's own timeline graph used as the transition object, down to the pseudo-element dash crawl, the two-dot rows, the failed-to-completed gradient and a seeded history per card; nobody else's demo tool could ship it. The static card underneath is tasteful but generic-modern, Temporal only through UV, violet and the key caps. Light mode is the weakest part of the brand argument.

Deterministic scan: one advisory on the splash axis. Rendered dumps deduplicate to the key cap glow (scene and splash only; the end card's outlined caps carry none), the rail glow, the Inter fallback, a dormant stars rule, the axis and dash gradients, and a contrast hit on the mock page, a false positive.

Visual overlays: no human-visible tab here; the detector cannot enter the shadow root.

## Overall Impression

The fail story is now the best-shaped of the three: stop, shake, creep, the retry running on, the UI's gradient, then the title rising through the tail. The signal's title birth is clean of bars at every frame with any opacity. The end card's ticks drift at a measured 1 px/s. Two things went backwards this round, both mine: the wide recovery ring added for celebration grows to about 330 px and crosses the rail onto the product, and gating the title's first 40% reopened a half beat where neither the pulse nor the title is visible.

## What's Working

- Authenticity of the wipe object, and the fail wipe's shape with peak and end in the right order.
- The signal as one spatial idea: double render to find the title row, the column settling with its leader exactly on the shrunk signal, the title growing from the same point, clean of bars.
- Measured hygiene: edge on the rail within 2 px live and recorded; no flash on the page; title 14.6:1 and subtitle 6.9:1 against the lit pixels; nothing clipped on a phone; end card still but for the ticks and the glow.

## Priority Issues

1. [P1] Recovery and pulse rings cross the rail onto the product. The retry lead's rings (2.6x and 11x of a 30 px dot) and the signal's pulse ring live in the unclipped layer, so at 2.8–3.0B of the fail wipe and 3.0–3.4B of the signal wipe a 220–330 px circle is drawn over the customer's UI, against the theme's own contract. Fix: draw the recovery rings and the pulse inside the clipped stage at the lead's position, and cap their size. (/impeccable polish)
2. [P1] The signal bridge reopened. The pulse fades by 3.31B and the title's first 40% is invisible, so from 3.35B to 3.80B neither is visible. Fix: fire the pulse at the title's birth with a longer life, inside the stage. (/impeccable animate)
3. [P2] Light mode loses figure and ground. An Off White card against a near-white product, with the column in dark-theme tokens, so at 1B the card behind the column is indistinguishable from the page and the column floats. Fix: a soft dark shade along the rail on the card side in light mode, light-theme dot tokens for the column, and a multiply-blended alarm so the wash is not pink. (/impeccable colorize)
4. [P2] Light glow still rings faintly in h264 (2.5 px runs, visible under a stretch and faintly at native levels). Fix: more stops with an eased falloff and a lower peak. (/impeccable polish)
5. [P2] The pending row's dot never carries the UI's retry icon. The UI draws the pending dot at the last event with the retry icon; here it keeps the activity icon. Fix: the retry icon on the pending row's dot until the row completes. (/impeccable harden)
6. [P3] Phone type scale (chip 11 px becomes about 14 px in the 1080p phone frame); the end-card separator wraps onto line two on phones; chip and key cap are solid 0.3 beat before the signal's title is visible; the rule's scale-in shows a 2–4 px speck. (/impeccable adapt)

## Persona Red Flags

Jordan (first-timer): the column is unexplained iconography; the fail moment can read as the video glitching, pink rather than red in light mode; the lime chip dot looks like a recording light.
Alex (expert): the missing retry icon; the gradient at 90° where the UI's is 255°; dark-theme dots on the light card; the dark column over light products on every out sweep.

## Minor Observations

- The signal's trail across the product is by design (a signal arriving at the app); the header should say so.
- The glow's breathe never completes a half cycle on a scene card.
- Long titles wrap cleanly to two lines at 1440 and three at 390; three key caps read on both cards.
- The engine cuts from the desktop page to the phone page before the phone scene's card can draw.

## Questions to Consider

- Should the signal touch the product at all, or should the card arrive first and the signal land on it?
- Is a stop, a shake and a 20% wash legible as a failure to someone not looking for it?
- Would a fixed "now" line with the axis moving under it earn the end card's motion better than a 1 px/s drift?
- Should the out sweep lead with the card's edge and a ghosted column, so the product is never under the bars?
