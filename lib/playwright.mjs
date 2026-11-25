// Playwright: the one in $PLAYWRIGHT_DIR, the one on the module path, or the
// one demo-video setup installed in $DEMO_VIDEO_HOME.
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

const NAMES = ['playwright', '@playwright/test', 'playwright-core'];

export function dataHome() {
  return process.env.DEMO_VIDEO_HOME
    || join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), 'demo-video');
}

export function playwright() {
  const from = process.env.PLAYWRIGHT_DIR
    ? [join(process.env.PLAYWRIGHT_DIR, 'package.json')]
    : [import.meta.url, join(dataHome(), 'package.json')];
  for (const base of from) {
    const req = createRequire(base);
    for (const name of NAMES) {
      try { return req(name); } catch {}
    }
  }
  throw new Error('Playwright not found: run demo-video setup, or set PLAYWRIGHT_DIR to a checkout that has it');
}
