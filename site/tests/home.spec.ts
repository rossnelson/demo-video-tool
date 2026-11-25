import { expect, test } from '@playwright/test';
import { install } from '../src/lib/install.ts';

// R6.S1
test('the home page says what the tool makes and copies the install command', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('./');
	await expect(page.getByTestId('what')).toContainText('demo-video makes a narrated product video from a browser');

	const block = page.getByTestId('install');
	await expect(block.locator('code')).toHaveText(install);

	// The first click can come before the page hydrates; click until it answers.
	await expect(async () => {
		await block.getByRole('button', { name: 'Copy the command' }).click();
		await expect(block.getByRole('button')).toContainText('Copied', { timeout: 500 });
	}).toPass({ timeout: 10_000 });
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(install);
});

test('the home page links to the guide, the reference and GitHub', async ({ page }) => {
	await page.goto('./');
	const main = page.locator('main');
	await expect(main.getByRole('link', { name: 'Make your first video', exact: true })).toHaveAttribute('href', '/demo-video-tool/guide/');
	await expect(main.getByRole('link', { name: 'Reference', exact: true })).toHaveAttribute('href', '/demo-video-tool/reference/commands/');
	await expect(main.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/rossnelson/demo-video-tool');
});
