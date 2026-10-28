import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
const require = createRequire(`${process.env.CLOUD_UI_DIR ?? `${process.env.HOME}/code/cloud-ui/dev-palette`}/package.json`);
const { chromium } = require('@playwright/test');

const here = new URL('.', import.meta.url).pathname;
const framesDir = `${here}frames/`;
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
const durations = Object.fromEntries(
  JSON.parse(readFileSync(`${here}durations.json`, 'utf8')),
);
const overlay = readFileSync(`${here}overlay.js`, 'utf8');
const plan = JSON.parse(readFileSync(`${here}plan.json`, 'utf8'));
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const NS = process.env.NAMESPACE ?? 'abcabc.temporal-dev';
const workflowId = `palette-demo-${Date.now()}`;

const ctx = await chromium.launchPersistentContext(
  process.env.PROFILE_DIR ?? `${here}../.profile`,
  {
    headless: false,
    viewport: { width: 1440, height: 810 },
    deviceScaleFactor: 4 / 3,
    colorScheme: 'light',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
);
await ctx.addInitScript(`window.__demoBeat = ${plan.beat * 1000};`);
await ctx.addInitScript(overlay);
const page = ctx.pages()[0] ?? (await ctx.newPage());
const wait = (ms) => page.waitForTimeout(ms);
const dialog = page.locator('dialog[open]');
const log = (...a) => console.log('•', ...a);

async function settle(url) {
  await page.goto(url, { timeout: 120_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await wait(1800);
}
async function closePalette() {
  for (let i = 0; i < 5 && (await dialog.count()); i++) {
    await page.keyboard.press('Escape');
    await wait(180);
  }
}
async function keys(label) {
  await page.evaluate((l) => window.__demo.keys(l), label);
}
async function hotkey() {
  await keys('⌘ K');
  await page.keyboard.press('Meta+k');
  await dialog.waitFor({ timeout: 10_000 });
  await wait(500);
}
async function press(key, label = key, pause = 500) {
  await keys(label);
  await page.keyboard.press(key);
  await wait(pause);
}
async function type(text, pause = 400) {
  await page.keyboard.type(text, { delay: 70 });
  await wait(pause);
}

// --- Setup, before recording: sign in and start a throwaway workflow.
await settle(`${BASE}/namespaces/${NS}/workflows`);
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
await settle(
  `${BASE}/namespaces/${NS}/workflows/start-workflow?workflowId=${workflowId}&taskQueue=palette-demo&workflowType=PaletteDemo`,
);
await page.getByRole('button', { name: /^start workflow$/i }).last().click();
await wait(4000);
await settle(`${BASE}/namespaces/${NS}/workflows`);
const workflowUrl = await page
  .locator(`a[href*="/workflows/${workflowId}/"]`)
  .first()
  .getAttribute('href')
  .then((href) => (href ? new URL(href, BASE).href : null))
  .catch(() => null);
log('workflow', workflowId, workflowUrl);
if (!workflowUrl) throw new Error('test workflow not found');

// --- Recording.
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const index = frames.length;
  frames.push({ file: `f${String(index).padStart(6, '0')}.jpg`, t: metadata.timestamp });
  writeFileSync(`${framesDir}${frames[index].file}`, Buffer.from(data, 'base64'));
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
async function startScreencast() {
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 1,
  });
}
const pauses = [];
let recording = false;
let recStart = null;
async function resume() {
  if (recording) return;
  await startScreencast();
  recording = true;
  const now = Date.now() / 1000;
  recStart ??= now;
  if (pauses.length) pauses.at(-1).end = now;
}
async function pause() {
  if (!recording) return;
  await cdp.send('Page.stopScreencast');
  recording = false;
  pauses.push({ start: Date.now() / 1000 });
}
// Video time: recording time with the paused stretches cut out.
function vnow() {
  const paused = pauses.reduce((sum, p) => sum + ((p.end ?? Date.now() / 1000) - p.start), 0);
  return Date.now() / 1000 - recStart - paused;
}
async function waitUntil(v) {
  const ms = (v - vnow()) * 1000;
  if (ms > 0) await wait(ms);
}
// Navigation happens off camera.
async function cut(url) {
  await closePalette();
  await pause();
  await settle(url);
  await resume();
}
await resume();

const timeline = [];
const late = [];
async function segment(name, card, actions) {
  const p = plan.segments[name];
  await closePalette();
  if (vnow() > p.start + 0.05) late.push(`${name} started ${(vnow() - p.start).toFixed(2)}s late`);
  await waitUntil(p.start);
  if (card) {
    await page.evaluate(
      ([step, title, subtitle, ms]) => window.__demo.transition(step, title, subtitle, ms),
      [...card, p.holdMs],
    );
  }
  await waitUntil(p.narration);
  timeline.push({ name, start: Date.now() / 1000 });
  await actions();
  await waitUntil(p.end - 0.7);
  if (name !== '13-outro') await closePalette();
  await waitUntil(p.end);
  log(name, 'ends at', vnow().toFixed(2), 'planned', p.end.toFixed(2));
}

try {
  await segment('00-intro', ['', 'Command palette', 'Everything, one shortcut away'], async () => {});

  await segment('01-open', ['01', 'Open it anywhere', '⌘K, or the user menu'], async () => {
    await hotkey();
    await wait(1200);
    await press('Escape', 'esc', 400);
    await page.locator('button[aria-controls="user-menu"]').first().click();
    await wait(700);
    await page.getByText('Command palette').first().click();
    await dialog.waitFor();
    await wait(900);
  });

  await segment('02-search', ['02', 'Type to filter', 'Arrows move, Enter runs'], async () => {
    await hotkey();
    await type('api keys', 300);
    await press('ArrowDown', '↓', 350);
    await press('ArrowUp', '↑', 350);
    await press('Enter', '↵', 1600);
  });

  await cut(workflowUrl);
  await segment('03-page', ['03', 'On this page', 'Actions for what you are looking at'], async () => {
    await hotkey();
    await wait(1400);
    await press('ArrowDown', '↓', 450);
    await press('ArrowDown', '↓', 450);
    await press('Enter', '↵', 900);
  });

  await cut(`${BASE}/namespaces/${NS}/workflows`);
  await segment('04-paste', ['04', 'Paste an ID', 'Straight to the workflow'], async () => {
    await hotkey();
    await keys('⌘ V');
    await page.keyboard.insertText(workflowId);
    await wait(1300);
    await press('Enter', '↵', 300);
    await page.waitForURL((url) => url.pathname.includes(workflowId), { timeout: 20_000 }).catch(() => {});
    await wait(800);
  });

  await cut(`${BASE}/namespaces/${NS}/workflows`);
  await segment('05-actions', ['05', 'More actions', '⌘K lists them, ⌘↵ runs the second'], async () => {
    await hotkey();
    await page.keyboard.insertText(workflowId);
    await wait(800);
    await press('Meta+k', '⌘ K', 1300);
    await press('Escape', 'esc', 400);
    await press('Meta+Enter', '⌘ ↵', 1500);
  });

  await cut(workflowUrl);
  await segment('06-confirm', ['06', 'Safe by default', 'Confirm risky actions, see why others are blocked'], async () => {
    await hotkey();
    await type('terminate', 300);
    await press('Enter', '↵', 1200);
    await press('Enter', '↵ again', 1800);
    await page.keyboard.press('Meta+a');
    await type('cancel', 1400);
  });

  await cut(`${BASE}/namespaces/${NS}/workflows`);
  await segment('07-scopes', ['07', 'Scopes', 'Narrow the list to one tool set'], async () => {
    await hotkey();
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
  });

  await segment('08-views', ['08', 'Views', 'Tools can open their own list'], async () => {
    await hotkey();
    await type('switch', 250);
    await press('Enter', '↵', 300);
    await dialog.locator('[role=option]').first().waitFor({ timeout: 20_000 }).catch(() => {});
    await wait(900);
    await type('abc', 1000);
    await press('Escape', 'esc', 900);
  });

  await segment('09-recent', ['09', 'Recent', 'What you use, at the top'], async () => {
    await hotkey();
    await wait(1200);
    await press('ArrowDown', '↓', 450);
    await press('ArrowDown', '↓', 450);
  });

  await segment('10-prefs', ['10', 'Preferences and help', 'Without leaving the page'], async () => {
    await hotkey();
    await type('theme', 250);
    await press('Enter', '↵', 500);
    await type('dark', 250);
    await press('Enter', '↵', 900);
    await closePalette();
    await hotkey();
    await type('retry policy', 900);
  });

  await segment('11-dev', ['11', 'Dev tools', 'Local and staging only'], async () => {
    await hotkey();
    await keys('d ␣');
    await page.keyboard.type('d', { delay: 70 });
    await page.keyboard.press('Space');
    await wait(1300);
    await type('feature', 250);
    await press('Enter', '↵', 1400);
  });

  // Touch: phone size with touch input.
  await closePalette();
  await pause();
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.reload();
  await page.waitForLoadState('networkidle').catch(() => {});
  await wait(1500);
  await resume();
  await segment('12-touch', ['12', 'Touch', 'Tap targets everywhere'], async () => {
    await page.locator('[data-testid="nav-profile-button"]').click();
    await wait(600);
    await page.locator('[data-testid="command-palette"]').click();
    await dialog.waitFor();
    await wait(900);
    await dialog.locator('[role=option]').nth(1).click({ timeout: 3000 }).catch(() => {});
    await wait(900);
  });
  await closePalette();
  await pause();
  await cdp.send('Emulation.clearDeviceMetricsOverride');
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await page.reload();
  await page.waitForLoadState('networkidle').catch(() => {});
  await wait(1200);
  await resume();

  await segment('13-outro', ['', 'Command palette', 'Press ⌘K to try it'], async () => {});
} catch (err) {
  log('FAILED:', err.message.split('\n')[0]);
} finally {
  const end = Date.now() / 1000;
  await cdp.send('Page.stopScreencast').catch(() => {});
  await wait(300);
  writeFileSync(`${here}frames.json`, JSON.stringify({ frames, timeline, pauses, end, recStart }));
  log('late:', late.length ? late : 'none');
  // Put the theme back and make sure the test workflow is gone.
  await closePalette().catch(() => {});
  await page.evaluate(() => {
    localStorage.setItem('dark mode', JSON.stringify('system'));
  }).catch(() => {});
  log('frames', frames.length, 'workflow', workflowId);
  await ctx.close();
}
