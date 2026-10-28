---
name: demo-theme
description: Build or change a theme for the demo video tool in this repository (the transition cards, end card, key hint and splash under lib/themes or a project's theme directory). Use when asked for a new look, a brand's colours, a different card animation, or to fix how a card renders.
---

# Building a demo video theme

A theme owns everything the engine draws over the recording: the scene card
that plays between scenes, the end card, the key hint pill and the splash
image. The engine owns the timing. Keep that split: a theme never changes
when or how long a card shows, only what it looks like inside that window.

## Files

A theme is a directory with three files. Built-in themes live in
`lib/themes/<name>/`; a project can also keep one at any path and point to it
with `theme: './my-theme'` in its `project.mjs`.

| File | What it is |
| --- | --- |
| `theme.mjs` | Default export: `{ name, description, colors: {…}, fonts: {…}, pad }`. `colors` and `fonts` are free-form token maps the other two files read. `pad` is the colour behind the video frames when they do not fill 16:9. A project may override `colors`, `fonts` and `pad`; nothing else. |
| `card.js` | A plain script injected into every recorded page. It must define `window.__demo` with `transition`, `end` and `keys` (contract below). It reads `window.__demoConfig`: `{ beat, keys, theme }`, where `beat` is one beat in ms, `keys` the project's key cap glyphs (an array, possibly empty) and `theme` the tokens from `theme.mjs`. |
| `splash.html` | A static page for the splash image. Placeholders: `{{title}}`, `{{subtitle}}`, `{{url}}`, `{{keys}}` (rendered `<span class="key kN">` elements), `{{chips}}` (`<span class="chip"><b>key</b> label</span>` elements), `{{width}}`, `{{height}}`, and every token as `{{colors.name}}` or `{{fonts.name}}`. |

## The card.js contract

```js
window.__demo = {
  transition(step, title, subtitle, holdMs) { … return totalMs; },
  end({ title, subtitle, url, lines }, holdMs) { … return totalMs; },
  keys(label) { … },
};
```

- **`transition`** draws a scene card. The timing envelope is fixed by
  `lib/plan.py`: the card comes in over **2 beats**, holds for **`holdMs`**,
  and leaves over **2 beats**. Return `2 * beat + holdMs + 2 * beat`. The
  engine starts the narration when the card has left, so a card that
  lingers hides the demo and a card that leaves early shows the page
  before the voice. `step` may be empty (intro and outro cards), and so
  may `subtitle`. Intro and outro cards pass a much longer `holdMs`; they
  must still look right.
- **`end`** draws the end card. It comes in like a scene card and then
  **stays until the video ends**: no out animation, nothing that loops in a
  way that looks like a glitch. `url` and `lines` may be empty.
- **`keys`** shows a key hint (a label such as `⌘ K` or `↵`) at the bottom
  of the page for about a second, then removes itself. If a
  `dialog[open]` exists, append the hint to it, or the dialog's top layer
  will cover it.
- Mount everything in one element with `id="demo-transition"` (the hint in
  `id="demo-keys"`), remove any previous one first, and put the card's
  markup and `<style>` **inside a shadow root** on that element
  (`el.attachShadow({ mode: 'open' })`). The card shares the document with
  the recorded app, and the app's CSS for `.row`, `.key`, `.card` or `h1`
  will restyle anything in the light DOM. Style the host with
  `:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}`;
  the recording keeps clicking and typing while the card is up.
- **All motion is CSS animation** keyed to `beat`. No JavaScript timers for
  motion. The preview scrubs CSS animations to fixed moments; JS motion is
  invisible to it and drifts against the music.
- Escape every string you put into HTML. Titles come from project files
  and contain quotes and ampersands.
- Size type with `min(px, vw)` so the same card fits a 1440-wide desktop
  viewport and a 390-wide phone frame, and scale it down for long titles
  (the preview's shot 06 uses a 50-character one). Text that cannot wrap,
  such as a typed line, must shrink instead.
- Do not depend on web fonts being installed. Name a font stack and let
  it fall back.

## Workflow

1. **Start from the nearest theme.** Copy its directory. `bin/demo themes`
   lists them with one line each: `minimal` is the simplest reference,
   `slant` the most decorated, `terminal` shows CSS typing, `poster` shows
   stepped (no-easing) motion, `paper` shows a light palette with texture.
2. **Tokens first.** Change `theme.mjs` and look. Many briefs are done here.
3. **Then geometry, then motion.** Change layout with the animations in
   place, then adjust timings. Keep the 2-beat in and out.
4. **Look after every pass.** `bin/demo theme <name>` (or
   `bin/demo theme ./path/to/theme`, or `bin/demo theme <name> <project-dir>`
   to use a project's words, keys and overrides) renders 13 shots and a
   contact sheet in `build/themes/<name>/` in a few seconds. Read
   `sheet.png` first; open single shots to check detail. The shots are:
   five moments through the scene card, a long title with no keys, three
   keys with no step or subtitle, the intro card, the phone frame, the end
   card settled and again 40 beats later, the key hint, and the splash.
5. **Finish with a real run.** `MUSIC=<track> bin/demo all projects/example --dry`
   records the example project with silent narration in about two minutes
   (set `theme` in `projects/example/project.mjs` or pass a project that
   uses the theme), then pull frames with
   `ffmpeg -ss <t> -i projects/example/build/notes-demo.mp4 -frames:v 1 out.png`
   at a card's hero moment and at a cut.

## Checklist before you call it done

- Hero frame: the title is legible at a glance at 1920 × 1080; nothing
  important sits in the outer 5 percent of the frame.
- Long title (shot 06) wraps to two lines without overflowing or pushing
  the subtitle off the card.
- Zero, one, two and three key caps all look intentional (shots 06, 07
  and the default).
- Phone (shot 09): type still fits, nothing is clipped, the card still
  covers the page.
- Out shots (04, 05): the page underneath is revealed cleanly; no
  leftover element lingers after the card has gone.
- End card (10, 11): identical except for anything deliberately looping,
  such as a cursor. The URL is the most readable thing on it.
- Key hint (12): visible over a light page and a dark one.
- Splash matches the cards: same palette, same type, same voice.
- Contrast: body text at least 4.5:1 against its background; large
  titles at least 3:1.
- Nothing in the theme reads project-specific words; those come from the
  project.

## Where things are

- `lib/project.mjs` resolves the theme (`loadTheme`, `themeDir`) and merges
  overrides.
- `lib/record.mjs` injects `card.js` and calls `transition` and `end`.
- `lib/plan.py` sets the timing envelope: `cardBeats` (8 = 2 in, 4 hold,
  2 out), intro, outro and end card rules.
- `lib/splash-html.mjs` fills the splash template; `lib/splash.mjs` renders it.
- `lib/theme-preview.mjs` is the preview harness.
