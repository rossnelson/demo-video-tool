// Records the project's scenes with Chromium's screencast, on the timing in
// build/plan.json, and writes build/frames/ and build/frames.json.
//   node lib/record.mjs <project-dir>
// Needs a display: run it under xvfb-run on a server (bin/demo does).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadProject } from './project.mjs';
import { playwright } from './playwright.mjs';

const project = await loadProject(process.argv[2] ?? '.');
const { chromium } = playwright();
const build = project.build;
const framesDir = join(build, 'frames');
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
const plan = JSON.parse(readFileSync(join(build, 'plan.json'), 'utf8'));
const cards = new Map();   // theme dir -> card.js source
const cardSource = (theme) => cards.get(theme.dir) ?? cards.set(theme.dir, readFileSync(join(theme.dir, 'card.js'), 'utf8')).get(theme.dir);
const card = cardSource(project.theme);
for (const s of project.scenes) {
  if (!plan.segments[s.name]) throw new Error(`plan.json has no segment ${s.name}; run plan again`);
}

// --- Browser.
const B = project.browser;
const options = {
  headless: B.headless,
  viewport: B.viewport,
  deviceScaleFactor: B.deviceScaleFactor,
  colorScheme: B.colorScheme,
  permissions: B.permissions,
  // Optional: a real Chrome (channel: 'chrome') and launch flags, for sites
  // that refuse a sign-in from an automated Chromium.
  ...(B.channel ? { channel: B.channel } : {}),
  ...(B.args ? { args: B.args } : {}),
  ...(B.ignoreDefaultArgs ? { ignoreDefaultArgs: B.ignoreDefaultArgs } : {}),
};
let browser = null;
const ctx = B.profile
  ? await chromium.launchPersistentContext(B.profile, options)
  : await (browser = await chromium.launch({ headless: B.headless, channel: B.channel, args: B.args, ignoreDefaultArgs: B.ignoreDefaultArgs })).newContext(options);
const { dir, ...theme } = project.theme;
await ctx.addInitScript(`window.__demoConfig = ${JSON.stringify({ beat: plan.beat * 1000, keys: project.keys, theme })};`);
await ctx.addInitScript(card);
const page = ctx.pages()[0] ?? (await ctx.newPage());
const cdp = await ctx.newCDPSession(page);
const log = (...a) => console.log('•', ...a);
const wait = (ms) => page.waitForTimeout(ms);

// --- Screencast, with pauses cut out of the video's time.
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const index = frames.length;
  frames.push({ file: `f${String(index).padStart(6, '0')}.jpg`, t: metadata.timestamp });
  writeFileSync(join(framesDir, frames[index].file), Buffer.from(data, 'base64'));
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
const pauses = [];
let recording = false;
let recStart = null;
async function resume() {
  if (recording) return;
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: project.video.quality,
    maxWidth: project.video.width,
    maxHeight: project.video.height,
    everyNthFrame: 1,
  });
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

// --- Helpers for the project's actions.
const api = {
  project, plan, page, ctx, cdp, log, wait, vnow, pause, resume,
  beat: plan.beat * 1000,
  bar: plan.bar * 1000,
  env: process.env,
  // Show a key hint at the bottom of the page.
  async keys(label) {
    await page.evaluate((l) => window.__demo.keys(l), label);
  },
  // Press a key, with its hint.
  async press(key, label = key, pauseMs = 500) {
    await api.keys(label);
    await page.keyboard.press(key);
    await wait(pauseMs);
  },
  async type(text, pauseMs = 400) {
    await page.keyboard.type(text, { delay: 70 });
    await wait(pauseMs);
  },
  // Open a page and let it settle.
  async settle(url) {
    await page.goto(url, { timeout: 120_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await wait(1800);
  },
  // Do something off camera: the recording pauses around it.
  async offCamera(fn) {
    await clear();
    const was = recording;
    await pause();
    await fn(api);
    if (was) await resume();
  },
  // Navigate off camera.
  async cut(url) {
    await api.offCamera(() => api.settle(url));
  },
  // Emulate a phone (or any device metrics) off camera; emulate(null) puts it back.
  async emulate(device) {
    await api.offCamera(async () => {
      if (device) {
        await cdp.send('Emulation.setDeviceMetricsOverride', { mobile: true, deviceScaleFactor: 2, ...device });
        await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      } else {
        await cdp.send('Emulation.clearDeviceMetricsOverride');
        await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
      }
      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => {});
      await wait(1500);
    });
  },
};
const clear = async () => project.clear?.(api);

// Binds a theme in the page: its tokens into __demoConfig and its card
// script run again, so window.__demo is that theme's. Every card script is
// a self-contained IIFE, so running it twice is fine. The project's theme
// is also the init script, so a navigation falls back to it.
async function useTheme(theme) {
  const { dir, ...tokens } = theme;
  await page.evaluate(([t, src]) => { window.__demoConfig.theme = t; new Function(src)(); }, [tokens, cardSource(theme)]);
}

// --- Scenes.
const timeline = [];
const late = [];
function keepsCard(i) {
  const scene = project.scenes[i], next = project.scenes[i + 1];
  return !!scene && !!next && !scene.run && scene.card !== false && scene.kind !== 'end'
    && next.card !== false && !next.before;
}
// Draws a scene's card, or the end card. atRest draws it with its entry
// already played: every CSS animation on the card is moved on to the moment
// the last entry animation finishes, and the hold is lengthened by the same
// amount, so the card still leaves when the plan says. Works for any theme
// whose motion is CSS (the theme contract), with nothing for a theme to add.
async function showCard(scene, holdMs, opts, { atRest = false } = {}) {
  const c = scene.kind === 'end'
    ? { end: true, title: scene.title, subtitle: scene.subtitle, url: scene.url, lines: scene.lines }
    : { step: scene.step, title: scene.title, subtitle: scene.subtitle };
  return page.evaluate(([c, ms, o, atRest, beat]) => {
    const draw = (hold) => (c.end ? window.__demo.end(c, hold, o) : window.__demo.transition(c.step, c.title, c.subtitle, hold, o));
    // Cards live in shadow roots, which document.getAnimations() does not reach.
    const animations = () => {
      const host = document.getElementById('demo-transition');
      if (!host) return [];
      const found = [...host.getAnimations()];
      const walk = (root) => {
        for (const el of root.querySelectorAll('*')) {
          found.push(...el.getAnimations());
          if (el.shadowRoot) walk(el.shadowRoot);
        }
      };
      if (host.shadowRoot) walk(host.shadowRoot);
      return found;
    };
    const total = draw(ms);
    if (!atRest) return 0;
    // Anything that starts once the card begins to leave is not entry.
    const leaves = c.end ? total : total - 2 * beat;
    let rest = 0;
    for (const a of animations()) {
      const t = a.effect?.getComputedTiming();
      if (!t || t.delay >= leaves || !Number.isFinite(t.endTime)) continue;
      rest = Math.max(rest, t.endTime);
    }
    rest = Math.min(rest, leaves);
    if (!rest) return 0;
    if (!c.end) draw(ms + rest);
    for (const a of animations()) a.currentTime = rest;
    return rest;
  }, [c, holdMs, opts, atRest, plan.beat * 1000]);
}
// Two animation frames and a little more, so a slow first paint is done.
async function painted() {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await wait(300);
}
let opening = null;      // the scene whose card the video opens on, if any

async function segment(scene) {
  const p = plan.segments[scene.name];
  await clear();
  if (vnow() > p.start + 0.05) late.push(`${scene.name} started ${(vnow() - p.start).toFixed(2)}s late`);
  await waitUntil(p.start);
  // Theme options for this card: the scene's index, plus whatever the scene
  // sets in `card: { … }` (card: false skips the card).
  const index = project.scenes.indexOf(scene);
  const opts = { index, ...(scene.card && typeof scene.card === 'object' ? scene.card : {}) };
  // A card with nothing to show after it (intro, outro) hands straight over
  // to the next card instead of fading out to the page and back. A scene
  // with a before() step navigates first, so it takes no handover.
  if (keepsCard(index)) opts.keep = true;
  if (index > 0 && keepsCard(index - 1)) opts.afterCard = true;
  if (scene.card !== false) await useTheme(scene.theme ?? project.theme);
  // The opening card is already on screen at rest, so it is drawn again at
  // rest rather than wiping in over itself.
  if (scene.card !== false) await showCard(scene, p.holdMs, opts, { atRest: scene === opening });
  await waitUntil(p.narration);
  if (scene.narration) timeline.push({ name: scene.name, start: Date.now() / 1000 });
  if (scene.run) await scene.run(api);
  await waitUntil(p.end - 0.7);
  if (scene.kind !== 'outro' && scene.kind !== 'end') await clear();
  await waitUntil(p.end);
  log(scene.name, 'ends at', vnow().toFixed(2), 'planned', p.end.toFixed(2));
}

try {
  if (project.setup) await project.setup(api);
  // How the video opens (project.open). 'card' puts the first scene's card
  // on screen at rest before filming starts, so the first frame is the
  // title, not the page the setup left or a wipe half drawn. The first
  // mount of a card is slow to paint, and a wipe filmed during that paint
  // stalls and then jumps, so 'page' still draws the card once off camera
  // to warm it. The first scene's before() runs here too, off camera.
  const first = project.scenes[0];
  if (first?.before) await first.before(api);
  if (first && first.card !== false) {
    const opts = { index: 0, ...(first.card && typeof first.card === 'object' ? first.card : {}) };
    await useTheme(first.theme ?? project.theme);
    await showCard(first, 60_000, opts, { atRest: true });
    await painted();
    if (project.open === 'card') opening = first;
    else await page.evaluate(() => document.getElementById('demo-transition')?.remove());
    await painted();
  }
  log('opens on:', opening ? `the ${first.name} card, at rest` : project.open === 'page' ? 'the page (open: \'page\')' : `the page, because ${first?.name ?? 'the first scene'} has no card`);
  await resume();
  for (const scene of project.scenes) {
    if (scene.before && scene !== first) await scene.before(api);
    await segment(scene);
    if (scene.after) await scene.after(api);
  }
} catch (err) {
  log('FAILED:', err.message.split('\n')[0]);
  process.exitCode = 1;
} finally {
  const end = Date.now() / 1000;
  await cdp.send('Page.stopScreencast').catch(() => {});
  await wait(300);
  writeFileSync(join(build, 'frames.json'), JSON.stringify({ frames, timeline, pauses, end, recStart }));
  log('late:', late.length ? late : 'none');
  log('frames', frames.length);
  if (project.teardown) await project.teardown(api).catch((e) => log('teardown failed:', e.message));
  await ctx.close();
  await browser?.close();
}
