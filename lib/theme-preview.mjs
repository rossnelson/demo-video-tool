// Renders a theme's card, end card, key hint and splash to PNGs, without a
// recording, so a theme can be looked at after every edit.
//   node lib/theme-preview.mjs <theme name or path> [project-dir]   -> build/themes/<name>/
//   node lib/theme-preview.mjs --list
// With a project, the project's title, keys, overrides and first scene are
// used; otherwise sample content. CSS animations are scrubbed to fixed
// moments, so a theme's motion must be CSS (not JavaScript timers).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defaults, listThemes, loadProject, loadTheme, themeDir } from './project.mjs';
import { playwright } from './playwright.mjs';
import { splashHtml } from './splash-html.mjs';

const args = process.argv.slice(2);
if (args[0] === '--list' || !args[0]) {
  for (const name of listThemes()) {
    const t = await loadTheme(name);
    console.log(`${name.padEnd(10)} ${t.description}`);
  }
  process.exit(0);
}

const project = args[1] ? await loadProject(args[1]) : null;
const theme = project ? project.theme : await loadTheme(args[0]);
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const out = join(ROOT, 'build', 'themes', project ? `${theme.name}-${project.name}` : basename(theme.dir));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const B = 500;                                   // ms per beat, about 118 bpm
const HOLD = 4 * B;
const { dir, ...tokens } = theme;
const config = { beat: B, keys: project?.keys ?? ['⌘', 'K'], theme: tokens };
const card = readFileSync(join(theme.dir, 'card.js'), 'utf8');
const firstScene = project?.scenes.find((s) => s.kind === 'scene');
const sample = {
  title: project?.title ?? 'Command palette',
  subtitle: project?.subtitle ?? 'Everything, one shortcut away',
  url: project?.url || 'docs.example.com/palette',
  scene: firstScene
    ? [firstScene.step, firstScene.title, firstScene.subtitle]
    : ['03', 'On this page', 'Actions for what you are looking at'],
  long: ['11', 'A longer title that has to wrap onto a second line', 'And a subtitle that runs on for a while, like a sentence of explanation would'],
  lines: ['Free for personal use', 'Works on macOS, Windows and Linux'],
};

// A plain page under the card, so transparency and stacking problems show.
const underlay = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font:15px/1.5 Inter,system-ui,sans-serif;background:#f6f6fb;color:#1a1a2e;min-height:100vh}
header{height:56px;background:#fff;border-bottom:1px solid #e3e3ee;display:flex;align-items:center;padding:0 24px;gap:16px;font-weight:600}
header i{width:28px;height:28px;border-radius:8px;background:#444ce7}
main{padding:32px 40px;display:grid;gap:12px;max-width:900px}
.row{height:52px;background:#fff;border:1px solid #e3e3ee;border-radius:10px}
</style></head><body><header><i></i>Product<span style="color:#8a8aa3;font-weight:400">Workflows · Settings · Help</span></header>
<main><div class="row"></div><div class="row"></div><div class="row"></div><div class="row"></div><div class="row"></div></main></body></html>`;

const { chromium } = playwright();
const browser = await chromium.launch();
const B_ = project?.browser ?? defaults.browser;
const desktop = await browser.newPage({ viewport: B_.viewport, deviceScaleFactor: B_.deviceScaleFactor });
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

async function fresh(page) {
  await page.setContent(underlay);
  await page.addScriptTag({ content: `window.__demoConfig = ${JSON.stringify(config)};` });
  await page.addScriptTag({ content: card });
}
// Freeze every CSS animation at t ms into the card. Cards live in shadow
// roots, which document.getAnimations() does not reach, so walk them.
async function scrub(page, t) {
  const n = await page.evaluate((t) => {
    const anims = new Set(document.getAnimations());
    const walk = (root) => {
      for (const el of root.querySelectorAll('*')) {
        for (const a of el.getAnimations()) anims.add(a);
        if (el.shadowRoot) walk(el.shadowRoot);
      }
    };
    walk(document);
    for (const a of anims) {
      a.pause();
      a.currentTime = t;
    }
    return anims.size;
  }, t);
  if (!n) console.warn(`no animations to scrub at ${t} ms: is the card's motion CSS?`);
  await page.waitForTimeout(50);
}
const shots = [];
async function shot(page, file, caption) {
  const path = join(out, `${file}.png`);
  await page.screenshot({ path });
  shots.push({ file: `${file}.png`, caption });
}
async function transition(page, [step, title, subtitle], keys = config.keys) {
  await page.evaluate((k) => (window.__demoConfig.keys = k), keys);
  await page.evaluate(([s, t, u, h]) => window.__demo.transition(s, t, u, h), [step, title, subtitle, HOLD]);
}

// 1. The scene card through its animation.
await fresh(desktop);
await transition(desktop, sample.scene);
for (const [n, beats, label] of [[1, 0.5, 'in, ½ beat'], [2, 1.5, 'in, 1½ beats'], [3, 2 + 2, 'hold (hero)'], [4, 2 + 4 + 0.5, 'out, ½ beat'], [5, 2 + 4 + 1.5, 'out, 1½ beats']]) {
  await scrub(desktop, beats * B);
  await shot(desktop, `0${n}-card`, `Scene card, ${label}`);
}
// 2. Edge cases on the hero frame.
await fresh(desktop);
await transition(desktop, sample.long, []);
await scrub(desktop, 4 * B);
await shot(desktop, '06-long-no-keys', 'Long title and subtitle, no key caps');
await fresh(desktop);
await transition(desktop, ['', sample.scene[1], ''], ['⌘', '⇧', 'P']);
await scrub(desktop, 4 * B);
await shot(desktop, '07-three-keys', 'Three key caps, no step, no subtitle');
// 3. Intro card (no step), as the first scene.
await fresh(desktop);
await transition(desktop, ['', sample.title, sample.subtitle]);
await scrub(desktop, 4 * B);
await shot(desktop, '08-intro', 'Intro card: title and subtitle, no step');
// 4. Phone.
await fresh(phone);
await transition(phone, sample.scene);
await scrub(phone, 4 * B);
await shot(phone, '09-phone', 'Scene card on a phone (390 × 844)');
// 5. End card, settled and much later (it must stay).
await fresh(desktop);
await desktop.evaluate(([c, h]) => window.__demo.end(c, h), [{ title: sample.title, subtitle: sample.subtitle, url: sample.url, lines: sample.lines }, HOLD]);
await scrub(desktop, 4 * B);
await shot(desktop, '10-end', 'End card, settled');
await scrub(desktop, 40 * B);
await shot(desktop, '11-end-late', 'End card 40 beats in (must look the same)');
// 6. The key hint, over the page and over a dialog.
await fresh(desktop);
await desktop.evaluate(() => window.__demo.keys('⌘ K'));
await desktop.waitForTimeout(200);
await shot(desktop, '12-key-hint', 'Key hint on the page');
// 7. The splash.
const splashProject = project ?? { ...structuredClone(defaults), theme, title: sample.title, subtitle: sample.subtitle, url: sample.url, keys: config.keys,
  splash: { ...defaults.splash, chips: [{ key: '↵', label: 'run' }, { key: 'esc', label: 'back' }] } };
const splashFile = join(out, 'splash.html');
writeFileSync(splashFile, splashHtml(splashProject));
const splashPage = await browser.newPage({ viewport: { width: splashProject.splash.width, height: splashProject.splash.height }, deviceScaleFactor: 1 });
await splashPage.goto(pathToFileURL(splashFile).href);
await splashPage.waitForTimeout(200);
await shot(splashPage, '13-splash', 'Splash image');

// A contact sheet with every shot, for one look.
const sheetFile = join(out, 'sheet.html');
writeFileSync(sheetFile, `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:20px;background:#222;color:#ddd;font:13px/1.4 Inter,system-ui,sans-serif}
h1{margin:0 0 14px;font-size:16px;font-weight:600}h1 span{color:#999;font-weight:400}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
figure{margin:0;display:flex;flex-direction:column;gap:6px}
figure img{width:100%;aspect-ratio:16/9;object-fit:contain;background:#000;border:1px solid #444}
figure.tall img{aspect-ratio:16/9;object-fit:contain}
figcaption{color:#bbb}
</style></head><body><h1>${theme.name} <span>${theme.description}</span></h1><div class="grid">
${shots.map((s) => `<figure><img src="${s.file}"><figcaption>${s.file.replace('.png', '')} — ${s.caption}</figcaption></figure>`).join('\n')}
</div></body></html>`);
const sheet = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await sheet.goto(pathToFileURL(sheetFile).href);
await sheet.waitForTimeout(300);
await sheet.screenshot({ path: join(out, 'sheet.png'), fullPage: true });
await browser.close();
console.log(`${shots.length} shots in ${out}\nlook at ${join(out, 'sheet.png')}`);
