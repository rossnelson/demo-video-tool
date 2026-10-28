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
const here = new URL('.', import.meta.url).pathname;
const build = project.build;
const framesDir = join(build, 'frames');
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
const plan = JSON.parse(readFileSync(join(build, 'plan.json'), 'utf8'));
const overlay = readFileSync(join(here, 'overlay.js'), 'utf8');
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
};
let browser = null;
const ctx = B.profile
  ? await chromium.launchPersistentContext(B.profile, options)
  : await (browser = await chromium.launch({ headless: B.headless })).newContext(options);
await ctx.addInitScript(
  `window.__demoConfig = ${JSON.stringify({ beat: plan.beat * 1000, keys: project.keys, theme: project.theme })};`,
);
await ctx.addInitScript(overlay);
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

// --- Scenes.
const timeline = [];
const late = [];
async function segment(scene) {
  const p = plan.segments[scene.name];
  await clear();
  if (vnow() > p.start + 0.05) late.push(`${scene.name} started ${(vnow() - p.start).toFixed(2)}s late`);
  await waitUntil(p.start);
  if (scene.card !== false) {
    await page.evaluate(
      ([step, title, subtitle, ms]) => window.__demo.transition(step, title, subtitle, ms),
      [scene.step, scene.title, scene.subtitle, p.holdMs],
    );
  }
  await waitUntil(p.narration);
  timeline.push({ name: scene.name, start: Date.now() / 1000 });
  if (scene.run) await scene.run(api);
  await waitUntil(p.end - 0.7);
  if (scene.kind !== 'outro') await clear();
  await waitUntil(p.end);
  log(scene.name, 'ends at', vnow().toFixed(2), 'planned', p.end.toFixed(2));
}

try {
  if (project.setup) await project.setup(api);
  await resume();
  for (const scene of project.scenes) {
    if (scene.before) await scene.before(api);
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
