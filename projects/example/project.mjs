// A small example project: it records page.html next to this file.
// Copy this directory to start a new video (bin/demo new <dir>).
import { pathToFileURL } from 'node:url';

const page = pathToFileURL(new URL('./page.html', import.meta.url).pathname).href;

export default {
  name: 'notes-demo',                       // build/notes-demo.mp4, build/notes-demo-splash.png
  title: 'Notes',
  subtitle: 'A tiny to-do list',
  url: 'notes.example.com',                 // on the end card
  keys: ['✓'],                              // key caps on the cards and the splash; [] for none
  theme: 'slant',                           // bin/demo themes lists them; or './my-theme'; or { name, colors: {…} }
  music: { path: null },                    // a path, or set $MUSIC
  browser: { profile: null, headless: true },
  splash: { chips: [{ key: '↵', label: 'add' }, { key: 'click', label: 'done' }] },

  // Hooks (all optional): setup(api) before recording, teardown(api) after,
  // clear(api) before every scene, before a cut and just before a scene ends.
  async setup({ settle }) {
    await settle(page);
  },

  // Each scene: a name, a card (step, title, subtitle), the narration, and
  // run(api) with what to do on screen while the narration plays.
  // api: page, wait, press, type, keys, settle, cut, offCamera, emulate, log …
  // kind 'intro' and 'outro' cards hold through their narration and take the
  // project's title and subtitle. A final kind 'end' card stays to the end
  // of the video; it may be silent.
  scenes: [
    {
      name: '00-intro', kind: 'intro',
      narration: 'Notes keeps the things you need to do today on one page.',
    },
    {
      name: '01-add', step: '01', title: 'Add a note', subtitle: 'Type it and press Enter',
      narration: 'Type what needs doing and press Enter. The new note goes to the top of the list.',
      async run({ page, type, press, wait }) {
        await page.locator('#text').click();
        await type('Record the demo', 300);
        await press('Enter', '↵', 1200);
      },
    },
    {
      name: '02-done', step: '02', title: 'Mark it done', subtitle: 'One click',
      narration: 'When a note is done, click Done. It stays on the page, crossed out.',
      async run({ page, wait }) {
        await page.locator('#list li button').first().click();
        await wait(1000);
        await page.locator('#list li button').nth(2).click();
        await wait(800);
      },
    },
    {
      name: '03-phone', step: '03', title: 'On a phone', subtitle: 'The same page, narrower',
      narration: 'On a phone the list fills the screen, and everything still works by touch.',
      before: ({ emulate }) => emulate({ width: 390, height: 844 }),
      after: ({ emulate }) => emulate(null),
      async run({ page, wait }) {
        await page.locator('#list li button').first().click();
        await wait(1200);
      },
    },
    {
      name: '04-outro', kind: 'outro', subtitle: 'Try it today',
      narration: "That's Notes. Add something and mark it done.",
    },
    {
      name: '05-end', kind: 'end',
      lines: ['Free for personal use', 'Works in any browser'],
    },
  ],
};
