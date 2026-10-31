// The tool's own demo: a video, made by the tool, about the tool. Between
// the cards it shows this very file in an editor, and the output of the
// commands that built the video (from build/*.log). Each scene names the
// theme of its card, so the cards are the themes.
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const stage = pathToFileURL(join(here, 'stage.html')).href;
const source = () => readFileSync(join(here, 'project.mjs'), 'utf8');
const lineOf = (re) => source().split('\n').findIndex((l) => re.test(l)) + 1;
const logOf = (name, previous = false) => {
  const file = join(here, 'build', `${name}${previous ? '.prev' : ''}.log`);
  return existsSync(file) ? readFileSync(file, 'utf8') : `(no ${file.slice(root.length + 1)} yet)\n`;
};
let themeLog = '';

// Scroll to a line of the file and type it in.
async function typeLine({ page }, re) {
  const n = lineOf(re);
  await page.evaluate((n) => window.stage.reveal(n), n);
  await page.evaluate((n) => window.stage.type(n), n);
}
// Run a command at the prompt: the key hint, the command, its real output.
async function command(api, cmd, output) {
  await api.page.evaluate((c) => window.stage.cmd(c), cmd);
  await api.keys('↵');
  await api.page.evaluate((o) => window.stage.out(o), output);
}

export default {
  name: 'meta',
  title: 'Demo video tool',
  subtitle: 'Narrated product videos from a browser',
  url: 'github.com/rossnelson/command-palette-video',
  keys: ['↵'],
  theme: 'temporal',
  timing: { cardBeats: 12, holdBeats: 8 },
  music: { path: null },
  browser: { profile: null, headless: true },
  splash: { chips: [{ key: '↵', label: 'bin/demo all' }] },

  async setup({ settle, page }) {
    await settle(stage);
    const lines = source().split('\n');
    const hide = lines.map((l, i) => (/^\s+(theme|card): /.test(l) ? i + 1 : 0)).filter(Boolean);
    await page.evaluate(([t, h]) => window.stage.load(t, h), [source(), hide]);
    themeLog = execFileSync(join(root, 'bin/demo'), ['theme', 'temporal', here], { encoding: 'utf8' });
  },

  scenes: [
    {
      name: '00-intro', kind: 'intro',
      narration: 'This video was made by the tool it\'s about. Which means that between the cards, what you\'re looking at is its own project file, and the real output of the commands that built it.',
    },
    {
      name: '01-project', step: '01', title: 'One file', subtitle: 'A project is a directory with a project.mjs',
      theme: 'slant',
      narration: 'The whole video is one directory with a project file in it. Title, theme, where the music is, then the scenes. A scene is just a card, something to say, and what to do on screen while you say it. If a scene wants a different theme it says so, and the next card comes out that way.',
      async run(api) {
        await api.page.evaluate((n) => window.stage.reveal(n), lineOf(/^export default/));
        await api.wait(600);
        await typeLine(api, /^  theme: 'temporal',$/);
        await api.wait(2500);
        await typeLine(api, /theme: 'minimal',/);
      },
    },
    {
      name: '02-narrate', step: '02', title: 'Narrate', subtitle: 'ElevenLabs reads the script',
      theme: 'minimal',
      narration: 'Narrate hands each scene\'s text to ElevenLabs and gets a voice back. There\'s a dry mode too. It makes silent clips about the right length, so you can lay the whole thing out before you spend a credit.',
      async run(api) {
        await command(api, 'bin/demo narrate projects/meta --dry', logOf('narrate'));
        await api.wait(1800);
        await typeLine(api, /theme: 'paper',/);
      },
    },
    {
      name: '03-plan', step: '03', title: 'Beats and plan', subtitle: 'Every cut lands on a downbeat',
      theme: 'paper',
      narration: 'Then the music. Beats listens to the track and finds the downbeats. Plan takes those and lays the scenes along them, so every cut in the video falls on one. You don\'t time anything by hand.',
      async run(api) {
        await command(api, 'bin/demo beats projects/meta', logOf('beats'));
        await api.wait(800);
        await command(api, 'bin/demo plan projects/meta', logOf('plan'));
        await api.wait(1200);
        await typeLine(api, /theme: 'terminal',/);
      },
    },
    {
      name: '04-record', step: '04', title: 'Record', subtitle: 'Chromium, on the plan',
      theme: 'terminal',
      narration: 'Record opens Chromium and drives it through the plan. Every card, every scene\'s actions, and it keeps a log of whether each cut landed where it was meant to. What\'s on screen now is the log from the last take of this video.',
      async run(api) {
        await command(api, 'bin/demo record projects/meta', logOf('record', true));
        await api.wait(1500);
        await typeLine(api, /theme: 'poster',/);
      },
    },
    {
      name: '05-assemble', step: '05', title: 'Assemble', subtitle: 'Voice, music, frames',
      theme: 'poster',
      narration: 'Assemble puts it together. The voice goes over the music, the music dips whenever the voice comes in, and the frames get encoded on the plan\'s timing.',
      async run(api) {
        await command(api, 'bin/demo assemble projects/meta', logOf('assemble'));
        await api.wait(1500);
        await typeLine(api, /^      theme: 'temporal',$/);
      },
    },
    {
      name: '06-themes', step: '06', title: 'Six themes', subtitle: 'Or a directory of your own',
      theme: 'temporal',
      narration: 'There are six themes in the box. A theme decides what the cards look like, the end card, the little key hint, the splash image. It doesn\'t touch timing. That stays with the engine. And you can preview a theme in a few seconds without recording anything.',
      async run(api) {
        await command(api, 'bin/demo theme temporal projects/meta', themeLog);
        await api.wait(1500);
        await typeLine(api, /options: \{ wipe: 'fail' \}/);
      },
    },
    {
      name: '07-fail', step: '07', title: 'Options', subtitle: 'A theme can offer them',
      theme: { name: 'temporal', options: { wipe: 'fail' } },
      narration: 'Themes can have options. Temporal, for instance, has three different wipes. This is the one where an activity fails, and you watch the retry run until the row completes.',
      async run(api) {
        await api.wait(1500);
        await typeLine(api, /card: \{ wipe: 'signal' \}/);
      },
    },
    {
      name: '08-signal', step: '08', title: 'Per scene', subtitle: 'card: { … } passes options to one card',
      card: { wipe: 'signal' },
      narration: 'And a single scene can hand options to its own card. This one asked for the signal. It lands right where the title is about to sit, and the title grows out of that spot.',
      async run(api) {
        await api.wait(1500);
        await typeLine(api, /mode: 'light'/);
      },
    },
    {
      name: '09-light', step: '09', title: 'Modes', subtitle: 'The same theme, a light table',
      theme: { name: 'temporal', options: { mode: 'light' } },
      narration: 'Modes, too. This is Temporal again. Same timeline, light version, on Off White.',
      async run(api) {
        await api.wait(1500);
        await typeLine(api, /rest: 'stars'/);
      },
    },
    {
      name: '10-stars', step: '10', title: 'Rest states', subtitle: 'What sits behind the title',
      card: { rest: 'stars' },
      narration: 'What sits behind the title is up to the theme as well. Temporal gives you the time axis from the UI, or, if you\'d rather, this. A slow field of stars.',
      async run(api) {
        await api.wait(1500);
        await api.page.evaluate((n) => window.stage.reveal(n), lineOf(/^export default/));
      },
    },
    {
      name: '11-splash', step: '11', title: 'Splash', subtitle: 'A title image from the same theme',
      narration: 'Splash makes a title image in the same theme, which is what you\'d use for the thumbnail. And if you don\'t want to run the steps one at a time, build does plan, record, assemble and a loudness check, back to back.',
      async run(api) {
        await command(api, 'bin/demo splash projects/meta', logOf('splash'));
        const splash = join(here, 'build', 'meta-splash.png');
        if (existsSync(splash)) await api.page.evaluate((src) => window.stage.image(src), pathToFileURL(splash).href);
      },
      after: ({ page }) => page.evaluate(() => window.stage.image(null)),
    },
    {
      name: '12-outro', kind: 'outro', subtitle: 'bin/demo new, then bin/demo all',
      narration: 'So. Copy the example project, write your scenes, point it at your page, run it. The cards and the cuts and the mix, you get for free.',
    },
    {
      name: '13-end', kind: 'end',
      lines: ['bin/demo new projects/my-video', 'bin/demo all projects/my-video'],
    },
  ],
};
