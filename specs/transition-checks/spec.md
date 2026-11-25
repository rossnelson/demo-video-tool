# Transition checks for themes and videos

Make demo-video-tool catch bad card transitions by itself, so a person does not find them by cutting frames out of a finished video.

Building the Spec Studio videos, the user found five problems by eye, and each one took a rebuild to fix:
1. The page flashed for about one second between two title cards. (Fixed in record.mjs: kept cards, and a warning for a page shown less than 2 seconds.)
2. Cards only animated in. The exit was a plain fade of the whole card, so nothing on the card moved when it left.
3. An exit that did not read: the critter moved 36 px with a slow ease-in, and the card fade covered it.
4. A muddy grey wash: a light cream card faded with opacity over a dark scene, and the middle frames went grey.
5. Title to title was a hard cut. (Fixed: a theme with handover: true animates from one card to the next.)

What the user sees when this is done:
- bin/demo theme <theme> [project] also plays each card's entry, exit and card-to-card handover at about 12 fps, and reports, with the frames, when:
  - no exit: no element of the card moves or changes on its own when the card leaves, only the whole card's opacity
  - exit too small: an element moves less than about 60 px, or its exit finishes in under 0.3 s
  - grey wash: a frame in the middle of an exit or entry has much less contrast than the frames at both ends (measure it, for example the luminance spread)
  - a cut between two cards: the theme does not declare handover
- bin/demo review <project> after a build: a strip of frames for each card entry, exit and handover in the real video, in build/review/, and a short report. It also lists each scene that started late and each page shown less than 2 seconds.
- The theme skill (.claude/skills/demo-theme) gets the rules: every card needs an exit that mirrors its entry; never fade a light layer over a dark page with opacity, slide it off or wipe it; declare handover; check with bin/demo theme before a build.
- The README documents both commands.

Use the critter theme of spec-studio-app/site (video/theme/) and the bundled themes as test cases: the critter theme should pass, and a theme with only a whole-card fade should get "no exit".

## Summary

Today a theme author finds a bad card transition only by watching a finished video frame by frame. After this change, `bin/demo theme` plays each card's entry, exit and handover, measures them, and names four kinds of problem with the frames that show it. `bin/demo review` does the same look over a built video, and lists late scenes and short pages.

## Scope

### In scope
- Transition checks in `bin/demo theme <theme> [project]`: no exit, exit too small, grey wash, and a cut between two cards.
- A frame strip (one PNG) for each checked transition, next to the existing shots, and a report file with the findings.
- A new command `bin/demo review <project>`: frame strips of each card entry, exit and handover in the built video, a short report, late scenes and short pages.
- The rules in `.claude/skills/demo-theme/SKILL.md`.
- The README and the `bin/demo` usage text for both commands.
- Tests with a fade-only fixture theme, a bundled theme and the critter theme.

### Out of scope
- Changes to the bundled themes so they pass the checks. The checks report; a later change can fix the themes.
- A failing exit status for the theme checks. The preview stays a tool to look with.
- Motion checks (no exit, exit too small) on the built video. The review shows the frames and measures the grey wash; motion needs the card's elements, which only the preview has.
- Checks on the end card's entry and the key hint.

## Requirements

### R1 Exit checks in the theme preview
`bin/demo theme` plays the scene card's exit at about 12 frames per second and reports "no exit" when no element inside the card moves, changes size, or changes its clip while the card leaves, and only the whole card's opacity changes. It reports "exit too small" when the element that moves most travels less than 60 px, or when every element's exit change ends less than 0.3 s after it starts.

#### R1.S1 A fade-only theme gets "no exit"
- Given a theme whose card leaves with only a fade of the whole card
- When the user runs `bin/demo theme <that theme>`
- Then the output and the report name "no exit" for the scene card's exit
- And the report points at the frame strip of that exit

#### R1.S2 A small, short exit gets "exit too small"
- Given a theme whose card moves its title 30 px when the card leaves
- When the user runs `bin/demo theme <that theme>`
- Then the output and the report name "exit too small", with the distance of the largest movement in px

#### R1.S3 The critter theme passes the exit checks
- Given the critter theme in `spec-studio-site/video/theme/`
- When the user runs `bin/demo theme <path to that theme>`
- Then the output names no "no exit" and no "exit too small" finding

#### R1.S4 A wipe counts as an exit
- Given a theme whose card leaves with a clip-path wipe of its content and no translation
- When the user runs `bin/demo theme <that theme>`
- Then the output names no "no exit" finding

### R2 Grey wash check on entry and exit
For the scene card's entry and exit, the preview plays the frames over a light page and over a dark page. It reports "grey wash" when a frame in the middle of the transition has a luminance spread less than half of the smaller spread of the first and the last frame.

#### R2.S1 A light card faded over a dark page gets "grey wash"
- Given a theme with a light card that leaves with only an opacity fade
- When the user runs `bin/demo theme <that theme>`
- Then the output and the report name "grey wash" for the exit over the dark page, with the measured spreads

#### R2.S2 A card that slides off gets no grey wash
- Given a theme whose card slides off the frame with no opacity change
- When the user runs `bin/demo theme <that theme>`
- Then the output names no "grey wash" finding

### R3 Handover check and handover frames
The preview reports "cut between two cards" when the theme does not declare `handover: true`. When the theme declares it, the preview plays a kept card's exit into the next card's entry and writes the frame strip of that handover.

#### R3.S1 A theme with no handover gets "cut between two cards"
- Given a bundled theme with no `handover: true`
- When the user runs `bin/demo theme <that theme>`
- Then the output and the report name "cut between two cards"

#### R3.S2 A handover theme gets a handover strip
- Given the critter theme, which declares `handover: true`
- When the user runs `bin/demo theme <path to that theme>`
- Then the output folder holds a frame strip of the handover
- And the output names no "cut between two cards" finding

### R4 Frame strips and report of the theme preview
Each checked transition gets one PNG strip of its frames in the preview's output folder, and the findings go to a report file there. The output ends with the number of findings and the path of the report. The command still writes the 13 shots and the contact sheet, and it exits with status 0 when it finds problems.

#### R4.S1 Strips and report next to the shots
- Given any theme
- When the user runs `bin/demo theme <theme>`
- Then the output folder holds the 13 shots, `sheet.png`, one strip for the entry, one for each exit over each page, and the report file
- And the last lines of the output give the number of findings and the report's path

#### R4.S2 A clean theme says so
- Given a theme with no finding
- When the user runs `bin/demo theme <theme>`
- Then the output says that the transition checks found no problem

### R5 Review of a built video
`bin/demo review <project>` reads the built video and its plan, and writes to `build/review/` a frame strip at about 12 frames per second for each card entry, each card exit and each card-to-card handover, and a report. The report names each strip with its scene and time, names a grey wash in any strip by the rule of R2, lists each scene that started late, and lists each page shown less than 2 seconds between two cards. It prints the report.

#### R5.S1 Strips and a report after a build
- Given a project built with `bin/demo build`
- When the user runs `bin/demo review <project>`
- Then `build/review/` holds one strip for each card entry, exit and handover, named by scene
- And `build/review/report.md` lists each strip with its scene and its start time in the video

#### R5.S2 Late scenes and short pages in the report
- Given a build whose record log names a late scene, and a plan where a page shows for less than 2 seconds between two cards
- When the user runs `bin/demo review <project>`
- Then the report lists that scene with how late it started
- And the report lists that page with its scene and how long it showed

#### R5.S3 Nothing built yet
- Given a project with no built video
- When the user runs `bin/demo review <project>`
- Then the command says that there is no video and to run `bin/demo build` first
- And it exits with a status that is not 0

### R6 Theme rules in the skill and the README
The demo-theme skill states the transition rules and tells the author to run the checks. The README and the usage text document `bin/demo theme`'s checks and `bin/demo review`.

#### R6.S1 The skill has the rules
- Given `.claude/skills/demo-theme/SKILL.md`
- When an author reads it
- Then it says that every card needs an exit that mirrors its entry, that a light layer must not fade with opacity over a dark page but slide off or wipe, that a theme declares `handover: true`, and that the author runs `bin/demo theme` before a build and reads its findings

#### R6.S2 The README and the usage text name both commands
- Given the README and `bin/demo --help`
- When a user reads them
- Then both describe the transition checks of `bin/demo theme` and the `review` command with its output folder

## Edge cases
- A theme whose card has no animated element at all (no CSS animation): the preview already warns; the checks report "no exit" and do not crash.
- An intro or outro card with a very long hold: the checks use the scene card with the preview's fixed hold, so the hold length does not change the result.
- A video with no card (every scene `card: false`): review writes a report that says there is no card transition, and exits 0.
- A video whose plan has no handover (no kept card): review writes no handover strip and says nothing about handover.
- The end card has no exit: review and the preview do not check an exit for it.
- A theme given as a path outside the repository (the critter theme): the checks work as for a bundled theme.
- A built video that is shorter than the plan (a stopped recording): review strips only the transitions inside the video and names the ones it could not read.

## Assumptions
- The critter theme lives at `spec-studio-site/video/theme/` in the user's code folder; the description's `spec-studio-app/site` names it loosely.
- The thresholds: 60 px for the largest movement, 0.3 s for the exit length, and half of the end frames' luminance spread for a grey wash. The luminance spread of a frame is the difference between its 95th and 5th percentile luminance.
- "Moves or changes on its own" means a change in an element's box position, size, transform or clip, measured on elements inside the card, not on the card's root.
- The preview checks the scene card only, as the representative card; intro and outro cards use the same `transition` code.
- The dark page for the grey wash check is a plain dark page like the existing light underlay.
- The checks report and do not fail the command, so a theme in progress still renders its shots.
- `bin/demo review` takes motion only from the frames: it measures the grey wash and shows the strips; it does not judge "no exit" on the real video.
- Short pages and late scenes come from the build's plan and record log, the same data that `record` uses for its warnings.
