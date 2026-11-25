import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// @ts-ignore: the tool's own module has no types
import { defaults } from '../../lib/project.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));

// R6.S3: every command in bin/demo's usage block, plus setup and doctor.
test('the commands page lists every command', async ({ page }) => {
	const usage = readFileSync(`${root}bin/demo`, 'utf8')
		.split('\n')
		.map((line) => /^#   ([a-z-]+)(?=\s|$)/.exec(line)?.[1])
		.filter((name): name is string => !!name && name !== 'demo-video');
	const names = new Set([...usage, 'setup', 'doctor']);
	expect(names.size).toBeGreaterThan(10);

	await page.goto('./reference/commands/');
	const listed = new Set(await page.locator('.cmd .name').allTextContents());
	for (const name of names) expect(listed, `command ${name}`).toContain(name);
});

test('the project page lists every field of the defaults', async ({ page }) => {
	await page.goto('./reference/project/');
	const listed = new Set(await page.locator('.field .key').allTextContents());
	for (const key of Object.keys(defaults)) expect(listed, `field ${key}`).toContain(key);
});

test('the themes page lists every built-in theme', async ({ page }) => {
	const dirs = readdirSync(`${root}lib/themes`, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);
	expect(dirs.length).toBeGreaterThan(0);
	await page.goto('./reference/themes/');
	for (const dir of dirs) {
		const theme = page.locator(`[data-theme="${dir}"]`);
		await expect(theme.getByRole('heading', { name: dir })).toBeVisible();
		expect(await theme.locator('.chip').count()).toBeGreaterThan(0);
	}
});
