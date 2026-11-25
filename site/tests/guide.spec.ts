import { expect, test } from '@playwright/test';

// R6.S2
test('the guide lists setup, new, a dry run and the narrated run, in that order', async ({ page }) => {
	await page.goto('./guide/');
	const codes = await page.locator('.steps pre code').allTextContents();
	const order = [
		'brew install spec-studio-app/tap/demo-video',
		'demo-video setup',
		'demo-video doctor',
		'demo-video new my-video',
		'demo-video all my-video --dry',
		'demo-video all my-video'
	];
	const at = order.map((cmd) => codes.findIndex((c) => c.trim() === cmd));
	expect(at.every((i) => i >= 0), `found ${JSON.stringify(at)} in ${JSON.stringify(codes)}`).toBe(true);
	expect([...at].sort((a, b) => a - b)).toEqual(at);
	await expect(page.locator('main')).toContainText('build/');
	await expect(page.locator('main')).toContainText('.log');
});
