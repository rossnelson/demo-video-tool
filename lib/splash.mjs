// Renders the splash image to build/<name>-splash.png.
//   node lib/splash.mjs <project-dir>
// The page is the theme's splash.html, or the project's splash.file, with
// {{title}}, {{subtitle}}, {{url}}, {{keys}}, {{chips}}, {{width}}, {{height}},
// the theme colours as {{colors.bg}} etc. and fonts as {{fonts.sans}} filled in.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProject } from './project.mjs';
import { playwright } from './playwright.mjs';
import { splashHtml } from './splash-html.mjs';

const project = await loadProject(process.argv[2] ?? '.');
const { chromium } = playwright();
const S = project.splash;

mkdirSync(project.build, { recursive: true });
const pageFile = join(project.build, 'splash.html');
writeFileSync(pageFile, splashHtml(project));
const out = join(project.build, `${project.name}-splash.png`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: S.width, height: S.height }, deviceScaleFactor: S.scale });
await page.goto(pathToFileURL(pageFile).href);
await page.waitForTimeout(300);
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
