// Terminates the demo workflow through the palette, if a recording stopped early.
//   node terminate.mjs <workflow url>
import { loadProject } from '../../lib/project.mjs';
import { playwright } from '../../lib/playwright.mjs';

const project = await loadProject(new URL('.', import.meta.url).pathname);
const { chromium } = playwright();
const ctx = await chromium.launchPersistentContext(project.browser.profile, { headless: true });
const page = ctx.pages()[0] ?? (await ctx.newPage());
const dialog = page.locator('dialog[open]');
await page.goto(process.argv[2], { timeout: 120000 });
await page.waitForLoadState('networkidle').catch(() => {});
await page.waitForTimeout(3000);
await page.keyboard.press('Meta+k');
await dialog.waitFor({ timeout: 15000 });
await page.keyboard.insertText('terminate');
await page.waitForTimeout(400);
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
await page.keyboard.press('Enter');
await page.waitForTimeout(3000);
console.log('footer:', (await dialog.locator('[role=status]').allInnerTexts()).join(' | '));
await ctx.close();
