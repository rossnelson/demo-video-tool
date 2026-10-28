// Playwright: the one on the module path, or the one in $PLAYWRIGHT_DIR.
import { createRequire } from 'node:module';
import { join } from 'node:path';

export function playwright() {
  const req = createRequire(process.env.PLAYWRIGHT_DIR ? join(process.env.PLAYWRIGHT_DIR, 'package.json') : import.meta.url);
  for (const name of ['playwright', '@playwright/test', 'playwright-core']) {
    try { return req(name); } catch {}
  }
  throw new Error('Playwright not found: npm install -g playwright, or set PLAYWRIGHT_DIR to a checkout that has it');
}
