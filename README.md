# Demo video tool

Makes a narrated product video from a browser: a screen recording with ElevenLabs narration, SVG transition cards and a music bed. The cuts fall on the music's downbeats. A video is a *project*: one directory with a `project.mjs` that holds the narration, the cards and the on-screen actions, plus whatever page or app it records.

`projects/command-palette/` is the Temporal Cloud command palette intro. `projects/example/` records a small local page and is the template for new projects. `projects/meta/` is the tool's own demo: a video about the tool, made with it, that shows its own project file and the build's logs between the cards, each scene's card in a different theme.

## What you need

- `ffmpeg`, `ffprobe`, Node 20+ and Python 3.
- Playwright with Chromium. The cloud image has it; elsewhere `npm install -g playwright && npx playwright install chromium`, or set `PLAYWRIGHT_DIR` to a checkout that has it.
- The beat tracker: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`.
- An ElevenLabs API key in `ELEVENLABS_API_KEY`, or in `.el-key` (git ignores it). Not needed for `--dry` runs.
- A music track: `music.path` in the project, or `MUSIC`.
- On a server with no display, `xvfb` for recording (`bin/demo record` uses it when `DISPLAY` is unset).

`scripts/setup.sh` installs all of this in a Claude Code cloud environment.

## Make a video

```
bin/demo new projects/my-video        # copy of projects/example
$EDITOR projects/my-video/project.mjs

bin/demo narrate  projects/my-video   # ElevenLabs -> build/audio, build/durations.json
bin/demo beats    projects/my-video   # beats and downbeats -> build/beats.json
bin/demo plan     projects/my-video   # scenes on the downbeats -> build/plan.json
bin/demo record   projects/my-video   # -> build/frames, build/record.log
bin/demo assemble projects/my-video   # -> build/<name>.mp4
bin/demo check    projects/my-video   # loudness of each narration window
bin/demo splash   projects/my-video   # -> build/<name>-splash.png
```

`bin/demo build <project>` runs plan, record, assemble and check. `bin/demo all <project>` runs everything. Everything lands in the project's `build/` directory, which git ignores, and each command also leaves its output in `build/<command>.log` (the previous one in `build/<command>.prev.log`).

Useful while writing:

- `bin/demo narrate <project> --dry` makes silent clips of an estimated length, so you can plan and record without spending ElevenLabs credits.
- `bin/demo narrate <project> 03-page 04-paste` regenerates only those clips.
- `bin/demo show <project>` prints the project with every default filled in.
- `build/record.log` shows when each scene ended against the plan. `late: none` means every cut landed on its downbeat.
- Any scene can take its own theme with `theme: 'paper'` or `theme: { name: 'temporal', options: { mode: 'light' } }`; the intro, outro, end card and splash follow the project's theme unless they name one too.

## Themes

A theme owns the look: the scene cards, the end card, the key hint and the splash. The engine owns the timing. `bin/demo themes` lists the built-in ones:

- **slant**: diagonal colour bars wipe in, key caps pop. Dark and energetic; the original look.
- **minimal**: a white card, one accent rule. Quiet; fits anything.
- **paper**: cream, serif, hairlines, a slow fade. Documentation and tutorials.
- **terminal**: a dark terminal window types the title at a prompt. CLIs and developer tools.
- **poster**: huge uppercase type and flat colour blocks that snap in on the beats. Launches.
- **temporal**: the temporal.io brand system. A diagonal timeline front, drawn like the Temporal UI's timeline graph with its glowing time rail, sweeps across and reveals each card. Space Black, Off White, UV and mono labels.

Pick one in `project.mjs` with `theme: 'paper'`, override tokens with `theme: { name: 'paper', colors: { accent: '#0a7' } }`, or point at a theme directory of your own with `theme: './my-theme'`. A theme may offer options: the temporal theme has three wipes, chosen with `theme: { name: 'temporal', options: { wipe: 'fail' } }` (`rail` sweeps the timeline across; `fail` stops it on a failed activity, shakes, and runs the retry on to the rail until the row completes with the UI's failed-to-completed gradient; `signal` lands a signal on the title and the title grows out of the spot; or `cycle` to rotate), and any scene can pick its own with `card: { wipe: 'rail' }`. The `fail` wipe takes four beats and `signal` five, and either falls back to `rail` when the card's hold is shorter than the wipe minus one beat, so give such a project a longer card with `timing: { cardBeats: 12, holdBeats: 8 }`. The end card uses `rail` unless its scene names a wipe. The theme also has a light mode, `theme: { name: 'temporal', options: { mode: 'light' } }`, and two rest states behind the title, `rest: 'axis'` (the UI's time-axis ticks, the default) or `rest: 'stars'`; a scene can pick its own with `card: { rest: 'stars' }`. The splash always draws the axis. The fail wipe captions its retry `Attempt 2`, the UI's wording; change it with `options: { retryLabel: 'second try' }` or per scene with `card: { retryLabel: 'second try' }`, or drop it with `retryLabel: null`. On the end card the key caps are outlined and the axis ticks drift slowly.

`bin/demo theme <name>` renders a theme's cards, end card, key hint and splash to `build/themes/<name>/` with a contact sheet, in a few seconds and without a recording. `bin/demo theme <name> <project>` does the same with that project's words and keys. To build a new theme, see `.claude/skills/demo-theme/SKILL.md`: it holds the contract and a checklist, and an agent working in this repository picks it up on its own.

## A project

`project.mjs` exports one object. Everything but `scenes` is optional; `bin/demo show` prints the defaults.

```js
export default {
  name: 'notes-demo',                 // output file names
  title: 'Notes',                     // intro, outro and end cards, and the splash
  subtitle: 'A tiny to-do list',
  url: 'notes.example.com',           // on the end card
  keys: ['⌘', 'K'],                   // key caps on the cards and the splash; [] for none
  theme: 'slant',                     // or { name, colors, fonts, pad } or './my-theme'
  voice: { id, model, format, settings },                           // ElevenLabs
  music: { path, leadIn, firstDownbeatAt, fadeBars },
  mix: { voiceLufs: -16, musicLufs: -27 },
  timing: { cardBeats: 8, holdBeats: 4, gap: 0.6, introGap: 0.4, outroBars: 3, endBars: 4 },
  video: { width: 1920, height: 1080, fps: 30, background, quality },   // background defaults to the theme's pad
  browser: { viewport, deviceScaleFactor, colorScheme, permissions, profile, headless },
  splash: { width, height, scale, chips: [{ key: '↵', label: 'run' }], file },

  async setup(api) {},                // before recording: sign in, seed data, open the first page
  async teardown(api) {},             // after recording
  async clear(api) {},                // before each scene, before a cut, and 0.7 s before a scene ends

  scenes: [
    { name: '00-intro', kind: 'intro', narration: '…' },
    {
      name: '01-add', step: '01', title: 'Add a note', subtitle: 'Type it and press Enter',
      narration: 'Type what needs doing and press Enter.',
      before: ({ cut }) => cut('http://localhost:3000/notes'),   // off camera
      async run({ page, type, press }) {                          // while the narration plays
        await page.locator('#text').click();
        await type('Record the demo');
        await press('Enter', '↵');
      },
      after: (api) => {},                                         // off camera
    },
    { name: '02-outro', kind: 'outro', subtitle: 'Try it today', narration: '…' },
    { name: '03-end', kind: 'end', lines: ['Free for personal use'] },   // silent; stays to the end
  ],
};
```

Scenes play in order. A `scene` gets a card that plays for `cardBeats`, then its narration, and ends on the first downbeat after the narration plus `gap`. An `intro` or `outro` card holds through its narration and takes the project's title and subtitle unless the scene gives its own. An `end` card comes last, shows the title, the `url` and any `lines`, holds for at least `endBars`, and stays while the music fades; it may have narration or none. `card: false` skips a scene's card; `card: { … }` passes options to the theme for that card; `theme: 'paper'` (or a theme object like the project's) gives the scene its own theme.

Hooks and actions get one `api` object:

| Member | What it does |
| --- | --- |
| `page`, `ctx`, `cdp` | the Playwright page and context, and a CDP session |
| `wait(ms)` | pause |
| `keys(label)` | show a key hint at the bottom of the page |
| `press(key, label, pauseMs)` | show the hint, press the key, pause |
| `type(text, pauseMs)` | type with a human delay |
| `settle(url)` | open a page and wait for it to go quiet |
| `cut(url)` | navigate off camera |
| `offCamera(fn)` | run `fn` with the recording paused |
| `emulate({ width, height })`, `emulate(null)` | phone metrics and touch, off camera; `null` puts them back |
| `pause()`, `resume()`, `vnow()` | the recording, and the video time |
| `project`, `plan`, `beat`, `bar`, `env`, `log` | the project, the plan, beat and bar in ms, `process.env`, a logger |

Browser profile: `browser.profile` (default `.profile/` in the project, or `PROFILE_DIR`) is a persistent Chrome profile, so sign-ins survive between runs. Set it to `null` for a fresh context each run.

Splash: the theme's `splash.html` is the page. It takes `{{title}}`, `{{subtitle}}`, `{{url}}`, `{{keys}}`, `{{chips}}`, `{{width}}`, `{{height}}`, and the theme's tokens as `{{colors.bg}}` or `{{fonts.sans}}`. A project can point `splash.file` at its own page.

## The command palette project

Records Cloud UI. Set `BASE_URL` (default `http://localhost:3000`) and `NAMESPACE`, and sign in to the window on the first run. The recorder starts a demo workflow for the workflow scenes; if a run stops early, `node projects/command-palette/terminate.mjs <workflow url>` terminates it. Music: `~/Downloads/above-the-next-wave.mp3`, or `MUSIC`.

## Settings carried over

- Voice: ElevenLabs `cBTYF7NiJbR8Bvmdeuse`, model `eleven_multilingual_v2`, stability 0.45, similarity 0.8, style 0.35, speaker boost on. `VOICE_ID` overrides the voice.
- Mix: each narration clip at -16 LUFS, the music at -27 LUFS. The music ducks under the voice and fades over the last two bars.
- `el.sh <endpoint>` calls the ElevenLabs API with your key, for looking up voices or usage.
