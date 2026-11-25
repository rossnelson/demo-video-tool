# Plan: Transition checks for themes and videos

## Approach

Two new parts do the measuring, and two commands use them.

**`lib/transition-checks.mjs`** measures a card that the preview draws. The preview already scrubs CSS animations to a fixed time (`scrub` in `lib/theme-preview.mjs`). The new code scrubs through a window (the entry, `0` to `2 * beat`; the exit, `2 * beat + hold` to `+ 2 * beat`) in steps of 1000/12 ms. At each step it takes a screenshot to a numbered PNG, and it reads, inside the card's shadow root, each element's bounding box, computed `transform` and `clip-path`. The elements are the descendants of the shadow root's top-level elements; the top-level elements are the card's root, and only the root's own opacity is left out. Pure functions then judge the samples:
- `judgeExit(samples)`: an element "changes" when its box moves, its box changes size, or its `clip-path` changes, against the first frame of the exit. No changing element: "no exit". Otherwise the largest movement is the largest move of a box centre or change of a box side, in px; a clip change counts as at least 60 px (a wipe hides the element). Largest movement under 60 px, or the longest change (first to last frame in which the element differs from the frame before) under 0.3 s: "exit too small".
- `judgeWash(stats)`: see the next paragraph.

**`lib/luma.mjs`** measures luminance with ffmpeg, which the tool already needs. It runs one ffmpeg process over a list of frames (`-i dir/%03d.png`) or a window of a video (`-ss t -t d -i video -vf fps=12`), with `scale=192:108,format=gray -f rawvideo -`, and computes the mean and the standard deviation of each frame from the raw bytes. The "luminance spread" of a frame is that standard deviation. The spec's assumption named the 5th to 95th percentile; a light card with dark text is mostly one colour, so its percentile spread is near 0 and the rule would never fire. The standard deviation does not have that fault. `judgeWash` reports "grey wash" when a frame strictly between the first and the last has a spread under half of the smaller spread of the two ends, and the two ends differ in mean luminance by at least 64 of 255 (one end light, one end dark). That second condition keeps a light card that fades over a light page from a false finding; the grey wash of the spec is a light layer over a dark page. The same module makes a strip with ffmpeg's `tile` filter (`scale=320:-1,tile=<n>x1`), so the preview and the review make strips the same way.

**`bin/demo theme`** (`lib/theme-preview.mjs`) keeps its 13 shots and contact sheet, then runs the checks: the scene card's entry over the light page and over a new dark page, the exit over both pages, and, for a theme with `handover: true`, a handover (a card drawn with `opts.keep` played out, then the next card drawn with `opts.afterCard` played in, as `lib/record.mjs` does). A theme without `handover: true` gets "cut between two cards". The frames go to `transitions/<name>/` and the strips to `transitions/<name>.png` in the output folder; the findings go to `transitions.md` there and to the output, which ends with the count and the report's path. The exit status stays 0.

**`bin/demo review <project>`** (new `lib/review.mjs`) loads the project (`loadProject`), reads `build/plan.json`, `build/record.log` and `build/<name>.mp4`, and lists the card windows from the plan: each card's entry (`start` to `start + 2 * beat`), each exit (`start + 2 * beat + holdMs` for `2 * beat`) of a card that is not kept, and each handover (the last two beats of a kept card's scene and the first two of the next). Video time is plan time, because the recorder films on the plan's clock. For each window it makes a strip and luma stats with `lib/luma.mjs`, judges the grey wash, and writes `build/review/<scene>-<entry|exit|handover>.png` and `build/review/report.md`. Late scenes come from the `started <n>s late` lines of `record.log`. Short pages come from the rule that `warnShortPages` in `lib/record.mjs` uses today; that rule and `keepsCard` move to `lib/project.mjs`, so the recorder and the review share one rule. A window past the video's end is listed as not read.

Why this shape: the motion checks need the card's DOM, so they run only in the preview; the luma checks need only pixels, so both commands share them. No new npm package: ffmpeg decodes and tiles, Playwright draws.

## Repos
| Repo | Why it changes | Merge order |
|---|---|---|
| demo-video-tool | The checks, the review command, the skill and the README | 1 |

## Steps
1. demo-video-tool: move `keepsCard` and the short-page rule from `lib/record.mjs` to `lib/project.mjs` (`keepsCard(scenes, i)`, `shortPages(project, plan)`), and use them in `lib/record.mjs` with the same log line. Covers R5.
2. demo-video-tool: add `lib/luma.mjs` (frame stats, strip) and `lib/transition-checks.mjs` (sampling in the page, `judgeExit`, `judgeWash`). Covers R1, R2.
3. demo-video-tool: run the checks in `lib/theme-preview.mjs`: a dark underlay, entry, exit, handover or "cut between two cards", strips, `transitions.md`, the summary lines. Add fixture themes in `tests/fixtures/themes/` (`fade`, `small`, `wipe`, `slide`) and `tests/transition_test.sh`. Covers R1, R2, R3, R4.
4. demo-video-tool: add `lib/review.mjs` and the `review` command in `bin/demo`, with a synthetic built project in the test. Covers R5.
5. demo-video-tool: the rules in `.claude/skills/demo-theme/SKILL.md`, the README sections, the usage text in `bin/demo`, and the help check in `tests/cli_test.sh`. Covers R6.

## Tests
`tests/transition_test.sh` runs `bin/demo theme` on fixture themes and `bin/demo review` on a synthetic project (a video made with ffmpeg's `lavfi` colour sources, a hand-written `plan.json`, `record.log` and `project.mjs`), and greps the output and the files. It needs Playwright and ffmpeg, like the preview.
- R1.S1: fixture `fade` (a cream card, only a whole-card fade): the output and `transitions.md` say "no exit" and name the exit strip.
- R1.S2: fixture `small` (the title moves 30 px on exit): "exit too small" with "30 px" in the line.
- R1.S3: the critter theme at `../spec-studio-site/video/theme`: no "no exit" and no "exit too small". The test skips with a note when that folder is missing.
- R1.S4: fixture `wipe` (a `clip-path` wipe of the content): no "no exit".
- R2.S1: fixture `fade`: "grey wash" for the exit over the dark page, with the two spreads.
- R2.S2: fixture `slide` (the card slides off, no opacity change): no "grey wash".
- R3.S1: the bundled `minimal` theme: "cut between two cards".
- R3.S2: the critter theme: `transitions/handover.png` exists, and no "cut between two cards".
- R4.S1: fixture `fade`: the 13 shots, `sheet.png`, `transitions/entry-light.png`, `transitions/exit-light.png`, `transitions/exit-dark.png`, `transitions.md`, and a last line with the count and the path.
- R4.S2: fixture `slide`, which declares `handover: true`: "no problem" in the output.
- R5.S1: the synthetic project: `build/review/` holds one strip per entry, exit and handover named by scene, and `report.md` lists each with its start time.
- R5.S2: the synthetic `record.log` has a late line and the plan a page of 1.2 s: the report lists both.
- R5.S3: a project with no `build/`: the message names `bin/demo build`, and the exit status is not 0.
- R6.S1: `grep` in the test for the four rules in `SKILL.md`.
- R6.S2: `tests/cli_test.sh` checks that `--help` lists `review <project>`; the test greps the README for `bin/demo review` and `transitions.md`.

## Risks
- The thresholds may flag a good theme or miss a bad one. The critter theme and the fixtures pin them; the numbers live in one place at the top of `lib/transition-checks.mjs`.
- A theme can move an element with an animation that has not started at the exit's first frame (a delay). The judge compares each frame to the exit's first frame, so a late start still counts.
- `getBoundingClientRect` includes ancestor transforms, so a moving wrapper makes every child move. That is the wanted result: the card's content leaves.
- The critter theme lives in another repo. Its test skips when the folder is missing, so CI on demo-video-tool alone still passes.
- Twelve frames over four windows add a few seconds to the preview. One ffmpeg process per window keeps it short.
