// Renders the splash image to build/<name>-splash.png.
//   node lib/splash.mjs <project-dir>
// The page is lib/splash.html, or the project's splash.file, with {{title}},
// {{subtitle}}, {{keys}}, {{chips}}, {{width}}, {{height}} and the theme
// colours as {{theme.bg}} etc. filled in.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProject } from './project.mjs';
import { playwright } from './playwright.mjs';

const project = await loadProject(process.argv[2] ?? '.');
const { chromium } = playwright();
const here = new URL('.', import.meta.url).pathname;
const S = project.splash;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const keys = project.keys.map((k, i) => `<span class="key k${i + 1}">${esc(k)}</span>`).join('');
const chips = S.chips
  .map((c) => (typeof c === 'string' ? `<span class="chip">${esc(c)}</span>` : `<span class="chip"><b>${esc(c.key)}</b> ${esc(c.label)}</span>`))
  .join('\n    ');
const values = {
  title: esc(project.title), subtitle: esc(project.subtitle), keys, chips, width: S.width, height: S.height,
  ...Object.fromEntries(Object.entries(project.theme).map(([k, v]) => [`theme.${k}`, v])),
};
const html = readFileSync(S.file ?? join(here, 'splash.html'), 'utf8').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => values[k] ?? m);

mkdirSync(project.build, { recursive: true });
const pageFile = join(project.build, 'splash.html');
writeFileSync(pageFile, html);
const out = join(project.build, `${project.name}-splash.png`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: S.width, height: S.height }, deviceScaleFactor: S.scale });
await page.goto(pathToFileURL(pageFile).href);
await page.waitForTimeout(300);
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
