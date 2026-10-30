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
      narration: 'This video was made by the tool it is about. Between the cards: its own project file, and the output of the commands that built it.',
    },
    {
      name: '01-project', step: '01', title: 'One file', subtitle: 'A project is a directory with a project.mjs',
      theme: 'slant',
      narration: 'A video is one directory and one file: a title, a theme, the music, and the scenes. Each scene is a card, a narration, and what to do on screen. Any scene can name its own theme, and the next card shows it.',
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
      narration: 'Narrate sends each scene\'s text to ElevenLabs. Dry makes silent clips of an estimated length, so you can plan before spending credits.',
      async run(api) {
        await command(api, 'bin/demo narrate projects/meta --dry', logOf('narrate'));
        await api.wait(1800);
        await typeLine(api, /theme: 'paper',/);
      },
    },
    {
      name: '03-plan', step: '03', title: 'Beats and plan', subtitle: 'Every cut lands on a downbeat',
      theme: 'paper',
      narration: 'Beats finds the downbeats of the music, and plan lays the scenes along them. Every cut lands on a downbeat.',
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
      narration: 'Record drives Chromium through the plan: each card, each scene\'s actions, and a log of whether every cut landed. This is the log of the previous take of this video.',
      async run(api) {
        await command(api, 'bin/demo record projects/meta', logOf('record', true));
        await api.wait(1500);
        await typeLine(api, /theme: 'poster',/);
      },
    },
    {
      name: '05-assemble', step: '05', title: 'Assemble', subtitle: 'Voice, music, frames',
      theme: 'poster',
      narration: 'Assemble mixes the voice over the music, ducks the music under the voice, and encodes the frames on the plan\'s timing.',
      async run(api) {
        await command(api, 'bin/demo assemble projects/meta', logOf('assemble'));
        await api.wait(1500);
        await typeLine(api, /^      theme: 'temporal',$/);
      },
    },
    {
      name: '06-themes', step: '06', title: 'Six themes', subtitle: 'Or a directory of your own',
      theme: 'temporal',
      narration: 'Six themes ship. A theme owns the cards, the end card, the key hint and the splash; the engine owns the timing. Theme renders any of them in seconds, without a recording.',
      async run(api) {
        await command(api, 'bin/demo theme temporal projects/meta', themeLog);
        await api.wait(1500);
        await typeLine(api, /options: \{ wipe: 'fail' \}/);
      },
    },
    {
      name: '07-fail', step: '07', title: 'Options', subtitle: 'A theme can offer them',
      theme: { name: 'temporal', options: { wipe: 'fail' } },
      narration: 'A theme can offer options. Temporal has three wipes; this one stops on a failed activity and runs the retry until the row completes.',
      async run(api) {
        await api.wait(1500);
        await typeLine(api, /card: \{ wipe: 'signal' \}/);
      },
    },
    {
      name: '08-signal', step: '08', title: 'Per scene', subtitle: 'card: { … } passes options to one card',
      card: { wipe: 'signal' },
      narration: 'A scene can pass options to its own card. This one asked for the signal: it lands where the title will sit, and the title grows out of the spot.',
      async run(api) {
        await api.wait(1500);
        await typeLine(api, /mode: 'light'/);
      },
    },
    {
      name: '09-light', step: '09', title: 'Modes', subtitle: 'The same theme, a light table',
      theme: { name: 'temporal', options: { mode: 'light' } },
      narration: 'A theme can have modes. Temporal\'s light one is the same timeline on Off White.',
      async run(api) {
        await api.wait(1500);
        await typeLine(api, /rest: 'stars'/);
      },
    },
    {
      name: '10-stars', step: '10', title: 'Rest states', subtitle: 'What sits behind the title',
      card: { rest: 'stars' },
      narration: 'Behind the title, a theme can offer rest states: the UI\'s time axis, or this field of slow stars.',
      async run(api) {
        await api.wait(1500);
        await api.page.evaluate((n) => window.stage.reveal(n), lineOf(/^export default/));
      },
    },
    {
      name: '11-splash', step: '11', title: 'Splash', subtitle: 'A title image from the same theme',
      narration: 'Splash renders a title image from the same theme, for the thumbnail. And build runs plan, record, assemble and a loudness check in a row.',
      async run(api) {
        await command(api, 'bin/demo splash projects/meta', logOf('splash'));
        const splash = join(here, 'build', 'meta-splash.png');
        if (existsSync(splash)) await api.page.evaluate((src) => window.stage.image(src), pathToFileURL(splash).href);
      },
      after: ({ page }) => page.evaluate(() => window.stage.image(null)),
    },
    {
      name: '12-outro', kind: 'outro', subtitle: 'bin/demo new, then bin/demo all',
      narration: 'Copy the example project, write the scenes, point it at your page, and run it. The cards, the cuts and the mix come with it.',
    },
    {
      name: '13-end', kind: 'end',
      lines: ['bin/demo new projects/my-video', 'bin/demo all projects/my-video'],
    },
  ],
};
