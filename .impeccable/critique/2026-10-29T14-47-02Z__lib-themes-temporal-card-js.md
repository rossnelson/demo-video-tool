---
target: temporal theme (lib/themes/temporal)
total_score: 20
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 1
target_identity: "file:/home/user/demo-video-tool/lib/themes/temporal/card.js"
target_fingerprint: "sha256:8a7387215175c7fb0dc4ba9d9e78ed76dedda0fc079216783d784a8be2a7696a"
target_path: /home/user/demo-video-tool/lib/themes/temporal/card.js
timestamp: 2026-10-29T14-47-02Z
slug: lib-themes-temporal-card-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The chip and the row states are legible, but the failure moment itself now has no red object: a 0.2-alpha flash, a shake, and dashes that turn persimmon. |
| 2 | Match system / real world | 4 | UI vocabulary verbatim, now including the retried row's failed-to-completed gradient and the pending line with no lead dot. |
| 3 | User control and freedom | n/a | A title card accepts no input. |
| 4 | Consistency and standards | 3 | Child workflow rows use the workflow icon; on the end card the key cap and the URL are two equal gradient blocks; the splash chip border is plain UV. |
| 5 | Error prevention | n/a | The viewer cannot err; the author gets a warning that names the fix. |
| 6 | Recognition rather than recall | 3 | Reading order is universal; the fail story is the one part that leans on the UI's colour code. |
| 7 | Flexibility and efficiency | 4 | Wipes, cycle, per-scene wipe and rest, modes, an opt-in retry caption, a fallback that explains itself. |
| 8 | Aesthetic and minimalist design | 3 | The hold state is clean; the signal ending stacks five arrivals in 0.8 beat; the end card is static for its whole hold. |
| 9 | Error recovery | n/a | No user error state. |
| 10 | Help and documentation | n/a | Not viewer-facing. |
| **Total** | | **20/24** | **Good (83%)** |

n/a heuristics: 3, 5, 9, 10.

## Design Specificity Verdict

LLM assessment: strongly specific. The column is the Temporal UI timeline graph, now down to the retried row's gradient and the pending row drawn out to "now" with no lead dot; the wipes are Temporal concepts an expert recognises in one frame. The hold state is temporal.io's idiom but the least distinctive layer; the axis rest state earns its place as the UI's own time axis.

Deterministic scan: one advisory on source (the splash axis). Rendered dumps deduplicate to the key cap glow, the rail glow (one element, two layers), the Inter fallback, a dormant stars rule (no star elements with the default axis), the axis and dash gradients, and a contrast hit on the mock page, a false positive. In-page on the splash: the brand gradient and the key cap above the title flagged as an icon tile; it is a key hint.

Visual overlays: no human-visible tab here; the detector cannot enter the shadow root.

## Overall Impression

Measured and closed: the card's edge sits on the rail within 1–2 px in live and recorded frames; the light glow holds 2.2 px runs with 27 levels; the signal bridge's longest stretch with neither pulse nor title is 0.11 beat; the pending row keeps 20 px clear of the enlarged signal; the failed piece is fully in frame on a phone; no flash reaches the page. The new retried row is the UI's. What the change cost is the failure moment's anchor: nothing turns red when the activity fails, and the first solid red appears at the success, in the gradient.

## What's Working

- Fidelity: the column is the real UI down to the retried row's gradient and the pending row; the signal hits the product where the title will sit and the title grows from the same point.
- Confinement and alignment: flash inside the clip, card and column shaking as one object, no tear, no seam, no banding.
- A restrained hold state that does not fight narration; title 14.6:1 and subtitle 6.9:1 against the lit pixels; key caps identical squares; chip 11 px on a phone; nothing clipped.

## Priority Issues

1. [P1] The failure moment has no anchor. At the stop the row's dashes turn persimmon, a hue-sibling of the amber timer bar five rows above, which dominates the frame; the only universal failure cue is the flash. Fix, UI-legal: the UI draws the pending retry dot at the last event in that event's classification colours, so at the failure the start dot becomes the failed-coloured dot with the retry icon, returning to the started style when the row completes; and move the timer row further from the failing row. (/impeccable animate)
2. [P2] The title's birth touches neighbouring rows. On desktop four small pieces overlap the title's box at 3.4B while it is at 4% opacity; on a phone the 41 px title emerges between bars with about 4 px of clearance. Fix: keep the first 40% of the emergence at zero opacity, so growth begins invisible. (/impeccable polish)
3. [P2] Signal pre-roll. For about half a beat a 126 px pink square sits half-cropped at the top edge almost still, then dives. Fix: start it further out and ease it with a gentler power so it is either out of frame or moving. (/impeccable animate)
4. [P2] End card. Static for its whole hold apart from the glow's breathe, with the key cap and the URL as two identical gradient blocks competing. Fix: draw the end card's key cap in the outlined style, and let the axis ticks drift or the rule breathe. (/impeccable polish)
5. [P3] Finish. The recovery is quieter than the failure (a 3 px ring against a full-card flash): add a wide second ring at completion. The signal's ending stacks chip, keys, rule and subtitle in 0.8 beat with the subtitle still fading after the wipe. The alarm rule is emitted for every wipe. Child workflow rows need the UI's `relationship` icon. (/impeccable harden)

## Persona Red Flags

Jordan (first-timer): "why did the orange bar go stripy?" then "why is it red now that it worked?"; the fail flash over a product page can read as the product failing, so `fail` may suit an outro better than a mid-demo scene.
Alex (expert): the retried row and the pending line are correct; the child icon is wrong; without the caption the row lacks the UI's attempt label; a whole card shaking is not something the UI does.

## Minor Observations

- Aeonik is not installed on the render host; the title renders in Inter.
- The out sweep paints bars over the uncovered product page for its whole two beats, by design.
- The key cap above the title on the end card and the splash reads as a logo or a button.
- In the pillarboxed phone recording the rows are about 6 px tall; the column could scale with the frame's short side.
- The recorder cuts from the desktop page to the phone page before the phone scene's card can draw (engine).

## Questions to Consider

- Should the three wipes share one arrival grammar so a cycled video keeps a stable rhythm?
- Is a failure flash the right default inside a product demo, or an outro-only move?
- Could the signal land on the narration's actual target, such as the button, instead of the title's spot?
- Does the end card want a parked, completed column at its right edge rather than nothing?
