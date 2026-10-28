// The command palette intro video: a screen recording of Cloud UI.
//
// Needs Cloud UI at $BASE_URL (default http://localhost:3000), a namespace in
// $NAMESPACE, and a Chrome profile signed in to it (.profile/ here, made on
// the first run: sign in to the window that opens).
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const NS = process.env.NAMESPACE ?? 'abcabc.temporal-dev';
const workflowId = `palette-demo-${Date.now()}`;
let workflowUrl = null;

// --- Palette helpers.
const palette = ({ page }) => page.locator('dialog[open]');
async function closePalette(api) {
  const dialog = palette(api);
  for (let i = 0; i < 5 && (await dialog.count()); i++) {
    await api.page.keyboard.press('Escape');
    await api.wait(180);
  }
}
async function hotkey(api) {
  await api.keys('⌘ K');
  await api.page.keyboard.press('Meta+k');
  await palette(api).waitFor({ timeout: 10_000 });
  await api.wait(500);
}
const workflows = `${BASE}/namespaces/${NS}/workflows`;

export default {
  name: 'command-palette-demo',
  title: 'Command palette',
  subtitle: 'Everything, one shortcut away',
  keys: ['⌘', 'K'],
  music: { path: '~/Downloads/above-the-next-wave.mp3' },
  browser: { permissions: ['clipboard-read', 'clipboard-write'] },
  splash: {
    chips: [
      { key: '↵', label: 'run' },
      { key: '⌘K', label: 'actions' },
      { key: 'g ␣', label: 'scope' },
      { key: 'esc', label: 'back' },
    ],
  },

  // Before each scene, before a cut, and 0.7 s before a scene ends.
  clear: closePalette,

  // Before recording: sign in and start a throwaway workflow.
  async setup(api) {
    const { page, settle, wait, log } = api;
    await settle(workflows);
    if (!page.url().includes('/namespaces/')) {
      console.log('Not signed in — sign in in the window (up to 30 min)…');
      await page.waitForURL(/\/namespaces\//, { timeout: 1_800_000 });
    }
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('palette-recent')) localStorage.removeItem(key);
      }
    });
    // Start in light theme, so the theme step visibly flips to dark.
    await page.evaluate(() => localStorage.setItem('dark mode', JSON.stringify('system')));
    await settle(`${workflows}/start-workflow?workflowId=${workflowId}&taskQueue=palette-demo&workflowType=PaletteDemo`);
    await page.getByRole('button', { name: /^start workflow$/i }).last().click();
    await wait(4000);
    await settle(workflows);
    workflowUrl = await page
      .locator(`a[href*="/workflows/${workflowId}/"]`)
      .first()
      .getAttribute('href')
      .then((href) => (href ? new URL(href, BASE).href : null))
      .catch(() => null);
    log('workflow', workflowId, workflowUrl);
    if (!workflowUrl) throw new Error('test workflow not found');
  },

  // Put the theme back. node terminate.mjs <workflow url> terminates the workflow.
  async teardown(api) {
    await closePalette(api).catch(() => {});
    await api.page.evaluate(() => localStorage.setItem('dark mode', JSON.stringify('system'))).catch(() => {});
    api.log('workflow', workflowId);
  },

  scenes: [
    {
      name: '00-intro', kind: 'intro',
      narration: "The command palette puts the actions for the page you're on into one searchable list.",
    },
    {
      name: '01-open', step: '01', title: 'Open it anywhere', subtitle: '⌘K, or the user menu',
      narration: 'Press Command K on any page to open it, or choose Command palette from the user menu.',
      async run(api) {
        const { page, wait, press } = api;
        await hotkey(api);
        await wait(1200);
        await press('Escape', 'esc', 400);
        await page.locator('button[aria-controls="user-menu"]').first().click();
        await wait(700);
        await page.getByText('Command palette').first().click();
        await palette(api).waitFor();
        await wait(900);
      },
    },
    {
      name: '02-search', step: '02', title: 'Type to filter', subtitle: 'Arrows move, Enter runs',
      narration: 'Type to filter the list. The arrow keys move the selection, and Enter runs it.',
      async run(api) {
        const { type, press } = api;
        await hotkey(api);
        await type('api keys', 300);
        await press('ArrowDown', '↓', 350);
        await press('ArrowUp', '↑', 350);
        await press('Enter', '↵', 1600);
      },
    },
    {
      name: '03-page', step: '03', title: 'On this page', subtitle: 'Actions for what you are looking at',
      narration: "On a workflow page, that workflow's actions come first: copy its ID, its run ID, or the CLI command.",
      before: ({ cut }) => cut(workflowUrl),
      async run(api) {
        const { wait, press } = api;
        await hotkey(api);
        await wait(1400);
        await press('ArrowDown', '↓', 450);
        await press('ArrowDown', '↓', 450);
        await press('Enter', '↵', 900);
      },
    },
    {
      name: '04-paste', step: '04', title: 'Paste an ID', subtitle: 'Straight to the workflow',
      narration: 'Paste a workflow ID and press Enter to go straight to that workflow.',
      before: ({ cut }) => cut(workflows),
      async run(api) {
        const { page, wait, press, keys } = api;
        await hotkey(api);
        await keys('⌘ V');
        await page.keyboard.insertText(workflowId);
        await wait(1300);
        await press('Enter', '↵', 300);
        await page.waitForURL((url) => url.pathname.includes(workflowId), { timeout: 20_000 }).catch(() => {});
        await wait(800);
      },
    },
    {
      name: '05-actions', step: '05', title: 'More actions', subtitle: '⌘K lists them, ⌘↵ runs the second',
      narration: 'Many rows have more than one action. Command K lists them all, and Command Enter runs the second.',
      before: ({ cut }) => cut(workflows),
      async run(api) {
        const { page, wait, press } = api;
        await hotkey(api);
        await page.keyboard.insertText(workflowId);
        await wait(800);
        await press('Meta+k', '⌘ K', 1300);
        await press('Escape', 'esc', 400);
        await press('Meta+Enter', '⌘ ↵', 1500);
      },
    },
    {
      name: '06-confirm', step: '06', title: 'Safe by default', subtitle: 'Confirm risky actions, see why others are blocked',
      narration: "Terminate asks you to press Enter a second time. When an action isn't available, the row says why.",
      before: ({ cut }) => cut(workflowUrl),
      async run(api) {
        const { page, type, press } = api;
        await hotkey(api);
        await type('terminate', 300);
        await press('Enter', '↵', 1200);
        await press('Enter', '↵ again', 1800);
        await page.keyboard.press('Meta+a');
        await type('cancel', 1400);
      },
    },
    {
      name: '07-scopes', step: '07', title: 'Scopes', subtitle: 'Narrow the list to one tool set',
      narration: "To narrow the list, type a set's letter and a space, like G for Go to. Tab moves between scopes, and the chip opens a picker.",
      before: ({ cut }) => cut(workflows),
      async run(api) {
        const { page, wait, press, keys } = api;
        const dialog = palette(api);
        await hotkey(api);
        await keys('g ␣');
        await page.keyboard.type('g', { delay: 70 });
        await page.keyboard.press('Space');
        await wait(1100);
        await press('Tab', 'Tab', 700);
        await press('Tab', 'Tab', 700);
        await dialog.locator('button[aria-haspopup="menu"]').click();
        await wait(1100);
        await dialog.locator('[role=menuitemradio]', { hasText: 'Preferences' }).click();
        await wait(1000);
      },
    },
    {
      name: '08-views', step: '08', title: 'Views', subtitle: 'Tools can open their own list',
      narration: 'Some tools open their own list. Switch namespace shows every namespace you can reach, and Escape takes you back.',
      async run(api) {
        const { wait, type, press } = api;
        await hotkey(api);
        await type('switch', 250);
        await press('Enter', '↵', 300);
        await palette(api).locator('[role=option]').first().waitFor({ timeout: 20_000 }).catch(() => {});
        await wait(900);
        await type('abc', 1000);
        await press('Escape', 'esc', 900);
      },
    },
    {
      name: '09-recent', step: '09', title: 'Recent', subtitle: 'What you use, at the top',
      narration: "Items you've used appear under Recent at the top, and the rest of the list keeps its order.",
      async run(api) {
        const { wait, press } = api;
        await hotkey(api);
        await wait(1200);
        await press('ArrowDown', '↓', 450);
        await press('ArrowDown', '↓', 450);
      },
    },
    {
      name: '10-prefs', step: '10', title: 'Preferences and help', subtitle: 'Without leaving the page',
      narration: 'You can change the theme or the timezone, or search the docs, from the same place.',
      async run(api) {
        const { type, press } = api;
        await hotkey(api);
        await type('theme', 250);
        await press('Enter', '↵', 500);
        await type('dark', 250);
        await press('Enter', '↵', 900);
        await closePalette(api);
        await hotkey(api);
        await type('retry policy', 900);
      },
    },
    {
      name: '11-dev', step: '11', title: 'Dev tools', subtitle: 'Local and staging only',
      narration: 'Dev tools appear only on local and staging builds, with a DEV tag so no one mistakes them for user features.',
      async run(api) {
        const { page, wait, type, press, keys } = api;
        await hotkey(api);
        await keys('d ␣');
        await page.keyboard.type('d', { delay: 70 });
        await page.keyboard.press('Space');
        await wait(1300);
        await type('feature', 250);
        await press('Enter', '↵', 1400);
      },
    },
    {
      name: '12-touch', step: '12', title: 'Touch', subtitle: 'Tap targets everywhere',
      narration: 'On a phone, every row and action has a tap target.',
      before: ({ emulate }) => emulate({ width: 390, height: 844 }),
      after: ({ emulate }) => emulate(null),
      async run(api) {
        const { page, wait } = api;
        await page.locator('[data-testid="nav-profile-button"]').click();
        await wait(600);
        await page.locator('[data-testid="command-palette"]').click();
        await palette(api).waitFor();
        await wait(900);
        await palette(api).locator('[role=option]').nth(1).click({ timeout: 3000 }).catch(() => {});
        await wait(900);
      },
    },
    {
      name: '13-outro', kind: 'outro', subtitle: 'Press ⌘K to try it',
      narration: "That's the command palette. Press Command K to try it.",
    },
  ],
};
